import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { SaveScheduler, type SaveStatus } from './save-scheduler';

/** Ein Schreibvorgang, dessen Ende der Test selbst bestimmt. */
function deferred(): {
  promise: Promise<void>;
  resolve: () => void;
  reject: (error: Error) => void;
} {
  let resolve: () => void = () => undefined;
  let reject: (error: Error) => void = () => undefined;
  const promise = new Promise<void>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

function setup(options: { canSave?: () => boolean } = {}) {
  let value = 0;
  const written: number[] = [];
  const statuses: SaveStatus[] = [];
  const gates: ReturnType<typeof deferred>[] = [];
  const scheduler = new SaveScheduler<number>(
    {
      canSave: options.canSave ?? (() => true),
      snapshot: () => value,
      write: async (next) => {
        const gate = deferred();
        gates.push(gate);
        await gate.promise;
        written.push(next);
      },
      status: (status) => statuses.push(status),
    },
    10_000,
  );
  return {
    scheduler,
    written,
    statuses,
    gates,
    set: (next: number) => {
      value = next;
      scheduler.schedule();
    },
  };
}

/** Lässt ausstehende Microtasks laufen. */
const tick = () => new Promise<void>((resolve) => setImmediate(resolve));

describe('SaveScheduler', () => {
  it('schreibt beim flush auch Änderungen, die während eines laufenden Schreibvorgangs eingegangen sind', async () => {
    const { scheduler, written, gates, set } = setup();
    set(1);
    const first = scheduler.flush();
    await tick();
    // Während das Schreiben von 1 läuft, kommt eine neue Eingabe – und das Fenster soll schließen.
    set(2);
    const closing = scheduler.flush();
    gates[0]?.resolve();
    await first;
    await tick();
    gates[1]?.resolve();
    await closing;
    assert.deepEqual(written, [1, 2]);
    assert.equal(scheduler.pending, false);
    scheduler.cancel();
  });

  it('meldet „gespeichert“ erst, wenn keine neue Änderung mehr aussteht', async () => {
    const { scheduler, statuses, gates, set } = setup();
    set(1);
    const run = scheduler.flush();
    await tick();
    set(2);
    gates[0]?.resolve();
    await run;
    assert.equal(statuses.at(-1), 'pending');
    const second = scheduler.flush();
    await tick();
    gates[1]?.resolve();
    await second;
    assert.equal(statuses.at(-1), 'saved');
  });

  it('versucht es nach einem Fehler erneut und behält die Änderung', async () => {
    const { scheduler, statuses, gates, written, set } = setup();
    set(1);
    const run = scheduler.flush();
    await tick();
    gates[0]?.reject(new Error('Platte voll'));
    await run;
    assert.equal(statuses.at(-1), 'error');
    assert.equal(scheduler.pending, true);
    const retry = scheduler.flush();
    await tick();
    gates[1]?.resolve();
    await retry;
    assert.deepEqual(written, [1]);
    assert.equal(scheduler.pending, false);
  });

  it('speichert nichts, solange Speichern nicht erlaubt ist', async () => {
    let allowed = false;
    const { scheduler, written, set } = setup({ canSave: () => allowed });
    set(1);
    await scheduler.flush();
    assert.deepEqual(written, []);
    assert.equal(scheduler.pending, false);
    allowed = true;
    scheduler.cancel();
  });

  it('verwirft mit cancel eine vorgemerkte Speicherung', async () => {
    const { scheduler, written, set } = setup();
    set(1);
    scheduler.cancel();
    await scheduler.flush();
    assert.deepEqual(written, []);
  });
});
