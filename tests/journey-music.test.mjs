import test from 'node:test';
import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { JOURNEY_MUSIC, journeyMusicCue } from '../two/journey-music.js';
import { GATE_V, PALACE_BED, PALACE_LEVELS, palacePoint } from '../two/ryugu-layout.js';
import { REGIONS } from '../two/terrain.js';

test('each destination, the palace interior, the boat and the bicycle have a named local track', () => {
  const cues = [...REGIONS.map(region => region.id), 'palace', 'boat', 'bike'];
  assert.deepEqual(Object.keys(JOURNEY_MUSIC).sort(), cues.sort());
  const tracks = Object.values(JOURNEY_MUSIC);
  assert.equal(new Set(tracks.map(track => track.file)).size, tracks.length);
  for (const { title, artist, file } of tracks) {
    assert.ok(title && artist);
    assert.match(file, /^[a-z0-9]+(?:-[a-z0-9]+)*\.mp3$/);
  }
});

test('the revised regional selections use the requested recordings', () => {
  const expected = {
    kyo: ['Rise of the Red Sun', 'Mandala Dreams', 'rise-of-the-red-sun.mp3'],
    snow: ['Sand Mandala', 'Joseph Beg', 'sand-mandala.mp3'],
    ryugu: ['Across the Sea of Japan', 'Mandala Dreams', 'across-the-sea-of-japan.mp3'],
    palace: ['Hong Kong Calling', 'Philip Ayers', 'hong-kong-calling.mp3'],
    inari: ['Hokkaido Solitude', 'Mandala Dreams', 'hokkaido-solitude.mp3'],
    tsuruga: ['Kyoto by Dawn', 'Ooyy, Smartface', 'kyoto-by-dawn.mp3'],
    market: ['State of Zen', 'Mandala Dreams', 'state-of-zen.mp3'],
  };
  for (const [cue, recording] of Object.entries(expected)) {
    const { title, artist, file } = JOURNEY_MUSIC[cue];
    assert.deepEqual([title, artist, file], recording, cue);
  }
});

test('the release index lists approved cues and verifies local copies', async () => {
  const folder = new URL('../audio/music/', import.meta.url);
  const index = JSON.parse(await readFile(new URL('available.json', folder), 'utf8'));
  const selected = new Set(Object.values(JOURNEY_MUSIC).map(track => track.file));
  for (const file of Object.keys(index)) assert.ok(selected.has(file), file);
  for (const { sha256, bytes } of Object.values(index)) {
    assert.match(sha256, /^[a-f0-9]{64}$/);
    assert.ok(Number.isSafeInteger(bytes) && bytes > 0);
  }
  for (const file of (await readdir(folder)).filter(file => selected.has(file))) {
    assert.ok(Object.hasOwn(index, file), file);
    const audio = await readFile(new URL(file, folder));
    assert.equal(audio.length, index[file].bytes, file);
    assert.equal(createHash('sha256').update(audio).digest('hex'), index[file].sha256, file);
  }
});

test('mounting a bicycle keeps its music across regions and dismounting restores the current area', () => {
  const state = { regionId: 'river', player: { x: 0, z: 59, y: 1, mount: null } };
  assert.equal(journeyMusicCue(state), 'river');
  state.player.mount = 'bike';
  assert.equal(journeyMusicCue(state), 'bike');
  state.regionId = 'market';
  assert.equal(journeyMusicCue(state), 'bike');
  state.player.mount = null;
  assert.equal(journeyMusicCue(state), 'market');
  state.player.mount = 'turtle';
  assert.equal(journeyMusicCue(state), 'market');
});

test('a sailing passenger keeps Water Mirror across regions and returns to the local cue on leaving', () => {
  const player = { x: 0, z: 59, y: 1, diveDepth: 0, vessel: { id: 'tsuruga-voyager' } };
  const state = { player, regionId: 'tsuruga' };
  assert.equal(journeyMusicCue(state), 'boat');
  assert.deepEqual(JOURNEY_MUSIC.boat, { title: 'Water Mirror', artist: 'Akibakid', file: 'water-mirror.mp3', repeatLead: 3 });
  state.regionId = 'ryugu';
  assert.equal(journeyMusicCue(state), 'boat');
  player.mount = 'bike';
  assert.equal(journeyMusicCue(state), 'bike');
  player.mount = player.vessel = null;
  assert.equal(journeyMusicCue(state), 'coast');
  player.skiff = 'river-skiff';
  assert.equal(journeyMusicCue(state), 'boat');
  player.skiff = null;
  assert.equal(journeyMusicCue(state), 'coast');
});

test('the sea surface, submerged approach and palace interior have separate cues', () => {
  const approach = palacePoint(0, GATE_V);
  const hall = palacePoint(0, PALACE_LEVELS[0].v);
  const player = { ...approach, y: 0, diveDepth: 0 };
  const state = { regionId: 'ryugu', player };
  assert.equal(journeyMusicCue(state), 'coast');
  Object.assign(player, { y: PALACE_BED + 1, diveDepth: 38 });
  assert.equal(journeyMusicCue(state), 'ryugu');
  Object.assign(player, hall);
  assert.equal(journeyMusicCue(state), 'palace');
  player.diveDepth = 0;
  for (const level of PALACE_LEVELS) {
    player.y = PALACE_BED + level.h;
    assert.equal(journeyMusicCue(state), 'palace');
  }
  player.y = 0;
  assert.equal(journeyMusicCue(state), 'coast');
  state.regionId = 'river';
  Object.assign(player, { x: 0, z: 59, y: -1, diveDepth: 1 });
  assert.equal(journeyMusicCue(state), 'river');
});
