import test from 'node:test';
import assert from 'node:assert/strict';
import { createJourneyPlayer } from '../two/journey-player.js';

const tick = () => new Promise(resolve => setImmediate(resolve));

async function playerFixture(t, { legacy = false, saveData = false } = {}) {
  const decks = [];
  class Media {
    constructor() { this.currentTime = 0; this.duration = 100; this.plays = 0; decks.push(this); }
    set src(url) { this.url = url; this.currentTime = 0; }
    pause() { this.paused = true; }
    async play() {
      this.paused = false;
      this.plays++;
      if (this.wait) await this.wait;
    }
  }
  const node = () => ({
    connect(target) { return target; },
    gain: { value: 0, setTargetAtTime(n) { this.value = n; },
      cancelScheduledValues() {}, setValueAtTime(n) { this.value = n; } },
  });
  const ctx = { currentTime: 0, createGain: node, createMediaElementSource(media) {
    return { connect(target) { media.level = target.gain; return target; } };
  } };
  const index = ['inuyama-gardens.mp3', 'state-of-zen.mp3', 'onsen-ritual.mp3', 'hong-kong-calling.mp3'];
  const hash = '1234567890abcdef';
  t.mock.method(globalThis, 'fetch', async () => ({ ok: true, async json() {
    return legacy ? index : Object.fromEntries(index.map(name => [name, { sha256: hash, bytes: 2048 }]));
  } }));
  const audio = Object.getOwnPropertyDescriptor(globalThis, 'Audio');
  Object.defineProperty(globalThis, 'Audio', { configurable: true, value: Media });
  const connection = Object.getOwnPropertyDescriptor(navigator, 'connection');
  Object.defineProperty(navigator, 'connection', { configurable: true, value: { saveData } });
  t.after(() => {
    if (audio) Object.defineProperty(globalThis, 'Audio', audio); else delete globalThis.Audio;
    if (connection) Object.defineProperty(navigator, 'connection', connection); else delete navigator.connection;
  });
  const player = createJourneyPlayer(ctx, node());
  player.unlock();
  await tick();
  async function update(now, cue, forecast) {
    ctx.currentTime = now;
    const result = player.update(cue, false, forecast);
    await tick();
    return result;
  }
  await update(.01, 'river');
  decks[0].currentTime = .18;
  await update(.18, 'river');
  return { player, update, decks };
}

test('a steady forecast warms one versioned file; a slow change and reversal keep the old music', async t => {
  const { decks: [river, spare], update } = await playerFixture(t);
  await update(.20, 'river', 'market');
  await update(.50, 'river', 'spring');
  await update(.80, 'river', 'market');
  assert.match(spare.url, /^data:/);
  river.currentTime = 1.7;
  await update(1.7, 'river', 'market');
  assert.match(spare.url, /state-of-zen\.mp3\?v=1234567890ab$/);
  assert.equal(spare.preload, 'metadata');
  assert.equal(spare.plays, 1); // only gesture priming
  let release;
  spare.wait = new Promise(resolve => { release = resolve; });
  await update(1.8, 'market');
  river.currentTime = 3.8;
  assert.equal(await update(3.8, 'market'), true);
  assert.equal(river.level.value, .28);
  await update(3.9, 'river');
  release();
  await tick();
  await update(4, 'river');
  assert.equal(spare.paused, true);
  assert.equal(spare.level.value, 0);
  assert.equal(river.level.value, .28);
});

test('a long stay overlaps the same song, resumes the new pass and frees the deck for an area change', async t => {
  const { decks: [ending, beginning], player, update } = await playerFixture(t, { legacy: true });
  ending.currentTime = 91;
  await update(91, 'river', 'market');
  assert.equal(beginning.url, ending.url);
  assert.match(beginning.url, /inuyama-gardens\.mp3$/);
  assert.equal(beginning.preload, 'auto');
  assert.equal(beginning.paused, true);
  ending.currentTime = 96;
  await update(96, 'river');
  beginning.currentTime = .2;
  ending.currentTime = 96.2;
  await update(96.2, 'river');
  assert.equal(beginning.level.value, .28);
  assert.equal(ending.level.value, 0);
  player.stop();
  await update(96.3, 'river');
  await update(96.4, 'river');
  assert.equal(beginning.paused, false);
  assert.equal(ending.paused, true);
  await update(96.5, 'market');
  ending.currentTime = .3;
  await update(96.8, 'market');
  assert.match(ending.url, /state-of-zen\.mp3$/);
  assert.equal(ending.level.value, .28);
});

test('Save-Data skips speculative music and a stalled active stream yields to the local score', async t => {
  const { decks: [river, spare], update } = await playerFixture(t, { saveData: true });
  await update(.3, 'river', 'spring');
  await update(1.2, 'river', 'spring');
  assert.match(spare.url, /^data:/);
  assert.equal(await update(2.6, 'river', 'spring'), false);
  river.currentTime = 1.5;
  assert.equal(await update(2.7, 'river'), true);
});

test('the palace recording reaches its first audible phrase before the approach fades out', async t => {
  const { decks: [outgoing, palace], update } = await playerFixture(t);
  await update(1, 'palace');
  palace.currentTime = .5;
  outgoing.currentTime = 1.5;
  await update(1.5, 'palace');
  assert.equal(outgoing.level.value, .28);
  assert.equal(palace.level.value, 0);
  palace.currentTime = 3.2;
  await update(4.2, 'palace');
  assert.equal(palace.level.value, .28);
  assert.equal(outgoing.level.value, 0);
});
