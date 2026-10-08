import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, it } from 'node:test';
import { IpcChannels } from './ipc-channels';

const root = path.resolve(__dirname, '..', '..', '..');

describe('IPC-Vertrag', () => {
  it('nennt jeden Kanal im Preload und in den Handlern', () => {
    const preload = readFileSync(path.join(root, 'electron', 'preload.ts'), 'utf8');
    const handlers = readFileSync(path.join(root, 'electron', 'ipc', 'handlers.ts'), 'utf8');
    for (const [key, channel] of Object.entries(IpcChannels)) {
      assert.ok(preload.includes(channel), `Preload ohne ${channel}`);
      assert.ok(handlers.includes(`IpcChannels.${key}`), `Handler ohne ${key}`);
    }
    assert.equal(preload.includes('ipcRenderer.invoke('), true);
    assert.equal(preload.includes('invoke(channel'), false);
  });
});
