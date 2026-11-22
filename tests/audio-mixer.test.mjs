import test from 'node:test';
import assert from 'node:assert/strict';
import { createAudio, normalizeVolumes } from '../sound.js';

function replaceGlobal(t, name, value) {
  const previous = Object.getOwnPropertyDescriptor(globalThis, name);
  Object.defineProperty(globalThis, name, { configurable: true, value });
  t.after(() => {
    if (previous) Object.defineProperty(globalThis, name, previous);
    else delete globalThis[name];
  });
}

test('volume settings preserve silence and recover defaults for old or invalid saves', () => {
  const defaults = { effects: 1, ambient: 1, music: 1 };
  assert.deepEqual(normalizeVolumes(null), defaults);
  assert.deepEqual(normalizeVolumes({ effects: null, ambient: NaN, music: '0' }), defaults);
  assert.deepEqual(normalizeVolumes({ effects: -2, ambient: .5, music: 8, enabled: true }),
    { effects: 0, ambient: .5, music: 1 });
});

test('channel gains apply before unlock, adjust independently and survive global mute and pause', t => {
  const param = () => ({
    value: 1, cancelScheduledValues() {}, setValueAtTime(value) { this.value = value; },
    linearRampToValueAtTime(value) { this.value = value; },
  });
  class AudioContext {
    currentTime = 0;
    state = 'running';
    sampleRate = 8000;
    createGain() { return { gain: param(), connect(output) { this.output = output; return output; } }; }
    createDynamicsCompressor() {
      return { threshold: {}, knee: {}, ratio: {}, attack: {}, release: {}, connect() {} };
    }
    createBuffer() { return { getChannelData: () => new Float32Array(0) }; }
  }
  replaceGlobal(t, 'AudioContext', AudioContext);
  t.mock.method(globalThis, 'fetch', async () => ({ ok: false }));
  let master, channels;
  const audio = createAudio((ctx, out, split) => {
    master = out;
    channels = split;
    return { stop() {} };
  });
  const levels = () => Object.fromEntries(Object.entries(channels).map(([key, node]) => [key, node.gain.value]));
  audio.setVolumes({ effects: .25, music: 0 });
  assert.equal(channels, undefined);
  audio.unlock();
  assert.deepEqual(levels(), { effects: .25, ambient: 1, music: 0 });
  for (const node of Object.values(channels)) assert.equal(node.output, master);
  audio.setPaused(true);
  assert.equal(master.gain.value, 0);
  audio.setVolumes({ music: .70, ambient: 0 });
  audio.setEnabled(false);
  audio.setPaused(false);
  assert.equal(master.gain.value, 0);
  audio.setEnabled(true);
  assert.equal(master.gain.value, .72);
  assert.deepEqual(levels(), { effects: .25, ambient: 0, music: .70 });
});

test('system speech respects effects volume when recorded speech is unavailable', t => {
  replaceGlobal(t, 'AudioContext', undefined);
  replaceGlobal(t, 'webkitAudioContext', undefined);
  let line;
  replaceGlobal(t, 'SpeechSynthesisUtterance', class { constructor(text) { this.text = text; } });
  replaceGlobal(t, 'speechSynthesis', {
    getVoices: () => [], speak(value) { line = value; }, cancel() { line = undefined; },
  });
  const audio = createAudio();
  audio.unlock();
  audio.setVolumes({ effects: .25 });
  audio.handle({ type: 'say', text: '三条通知！' });
  assert.equal(line.volume, .2);
  audio.setVolumes({ effects: 0 });
  assert.equal(line, undefined);
  audio.handle({ type: 'say', text: 'モチコラショッ' });
  assert.equal(line, undefined);
});
