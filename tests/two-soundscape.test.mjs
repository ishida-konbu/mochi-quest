import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { MOUNTAIN_STREAMS } from '../two/mountain-streams.js';
import { landscapeMix, footSurface } from '../two/soundscape.js';
import { BOUND, BRIDGES, REGIONS, groundHeight, riverZ, seasonAt } from '../two/terrain.js';

const here = (x, z) => ({ x, z, y: groundHeight(x, z), h: 0, inWater: false });
const region = id => {
  const { x, z } = REGIONS.find(r => r.id === id);
  return here(x, z);
};

test('nearby landscapes blend continuously and weight distinct field recordings', () => {
  assert.ok(landscapeMix(region('snow')).wind > landscapeMix(region('snow')).bamboo);
  assert.ok(landscapeMix(region('moon')).crickets > landscapeMix(region('moon')).bamboo);
  assert.ok(landscapeMix(region('shrine')).bamboo > .3);
  assert.ok(landscapeMix(region('terraces')).paddy > .2);
  assert.ok(landscapeMix(region('dawn')).shore > .2);
  assert.ok(landscapeMix(here(68, riverZ(68))).river > .3);
  for (const z of [-290, 18, 288]) {
    const west = landscapeMix(here(-BOUND + .01, z)), east = landscapeMix(here(BOUND - .01, z));
    for (const key of Object.keys(west)) assert.ok(Math.abs(west[key] - east[key]) < .002, key);
  }
});

test('the sound of falling water fades between the plunge pool and the sky above it', () => {
  for(const {fall:{toe}} of MOUNTAIN_STREAMS){
    const pool={...toe,h:0},overhead={...pool,y:pool.y+70,h:70};
    assert.ok(landscapeMix(pool).river>.70);
    assert.ok(landscapeMix(overhead).river<.01);
  }
});

test('footfall surfaces follow water, bridge decks and snow', () => {
  const b = BRIDGES[1], deck = here(b.x, riverZ(b.x));
  assert.equal(footSurface(deck), 'wood');
  assert.equal(footSurface({ ...deck, inWater: true }), 'water');
  const snow = region('snow');
  assert.equal(seasonAt(snow.x, snow.z).snow, 1);
  assert.equal(footSurface(snow), 'snow');
});

test('all outdoor beds and footsteps are packaged locally and credited', async () => {
  const credits = await readFile(new URL('../audio/CREDITS.txt', import.meta.url), 'utf8');
  for (const name of [...Object.keys(landscapeMix(here(0, 62))), 'footfalls']) {
    const data = await readFile(new URL('../audio/journey/' + name + '.mp3', import.meta.url));
    assert.ok(data.length > 4000 && data.length < 350000, name);
    assert.ok(credits.includes(name + '.mp3'), name);
  }
});

test('all destinations have distinct, locally playable musical recordings', async () => {
  const tracks = await Promise.all(REGIONS.map(r =>
    readFile(new URL('../audio/journey/score-' + r.id + '.mp3', import.meta.url))));
  assert.equal(new Set(tracks.map(b => b.toString('base64', 2048, 15360))).size, REGIONS.length);
  for (const recording of tracks) {
    assert.equal(recording.subarray(0,3).toString(),'ID3');
    assert.ok(recording.length > 100000);
  }
});
