import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { History } from './history';

describe('History', () => {
  it('macht Schritte rückgängig und wiederholt sie', () => {
    const history = new History<string>(10, 0);
    history.record('a', 0);
    history.record('ab', 10);
    assert.equal(history.undo('abc'), 'ab');
    assert.equal(history.undo('ab'), 'a');
    assert.equal(history.undo('a'), null);
    assert.equal(history.redo('a'), 'ab');
    assert.equal(history.redo('ab'), 'abc');
    assert.equal(history.canRedo, false);
  });

  it('fasst schnelles Tippen zu einem Schritt zusammen', () => {
    const history = new History<string>(10, 1000);
    history.record('', 0);
    history.record('H', 100);
    history.record('Ha', 200);
    history.record('Hal', 1500);
    assert.equal(history.undo('Hall'), 'Hal');
    assert.equal(history.undo('Hal'), '');
    assert.equal(history.canUndo, false);
  });

  it('verwirft „Wiederholen“ nach einer neuen Änderung', () => {
    const history = new History<number>(10, 0);
    history.record(1, 0);
    history.undo(2);
    assert.equal(history.canRedo, true);
    history.record(1, 10);
    assert.equal(history.canRedo, false);
  });

  it('beginnt nach Rückgängig einen neuen Schritt, auch innerhalb des Zeitfensters', () => {
    const history = new History<number>(10, 1000);
    history.record(1, 0);
    assert.equal(history.undo(2), 1);
    history.record(1, 10);
    assert.equal(history.undo(3), 1);
  });

  it('begrenzt die Anzahl der Schritte', () => {
    const history = new History<number>(2, 0);
    history.record(1, 0);
    history.record(2, 10);
    history.record(3, 20);
    assert.equal(history.undo(4), 3);
    assert.equal(history.undo(3), 2);
    assert.equal(history.undo(2), null);
  });
});
