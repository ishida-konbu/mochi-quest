import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { importJourneyMusic, matchJourneyTrack } from '../tools/import-journey-music.mjs';

test('matches delivered titles, artists and instrumental versions exactly', () => {
  const match = name => matchJourneyTrack(name)?.file;
  assert.equal(match('ES_Water Mirror - Akibakid.mp3'), 'water-mirror.mp3');
  assert.equal(match('Akibakid - Water Mirror.wav'), 'water-mirror.mp3');
  assert.equal(match('ES_Kyoto by Dawn - Ooyy & Smartface - Full Mix (1).WAV'), 'kyoto-by-dawn.mp3');
  assert.equal(match('ES_State%20of%20Zen%20-%20Mandala%20Dreams.mp3'), 'state-of-zen.mp3');
  assert.equal(match('ES_Strange Tales (Instrumental Version) - Isaku Kageyama.wav'),
    'strange-tales-instrumental-version.mp3');
  assert.equal(match('sanctity-instrumental-version.wav'), 'sanctity-instrumental-version.mp3');
  assert.equal(match('Waking Dream.mp3'), 'waking-dream.mp3');
  for (const wrong of ['ES_Sanctity - Isaku Kageyama.wav', 'ES_Water Mirror - Other Artist.mp3',
    'ES_Water Mirror - Akibakid - Melody.mp3', 'ES_Water Mirror - Akibakid - fullmix_preview.mp3',
    'ES_Water Mirror Remix - Akibakid.wav', 'ES_Water Mirror - Akibakid.zip']) {
    assert.equal(match(wrong), undefined, wrong);
  }
});

const hasEncoder = ['ffmpeg', 'ffprobe'].every(command => spawnSync(command, ['-version']).status === 0);

test('partial imports preserve good tracks and sources, rebuild the manifest and skip failed conversions',
  { skip: !hasEncoder && 'ffmpeg and ffprobe are needed for the import integration test' }, t => {
    const work = mkdtempSync(path.join(tmpdir(), 'mochi-journey-'));
    t.after(() => rmSync(work, { force: true, recursive: true }));
    const source = path.join(work, 'downloads');
    const output = path.join(work, 'game');
    const disc = path.join(source, 'playlist');
    const stems = path.join(disc, 'Drums');
    mkdirSync(stems, { recursive: true });
    const input = path.join(disc, 'ES_Water Mirror - Akibakid.wav');
    const encoded = spawnSync('ffmpeg', ['-nostdin', '-loglevel', 'error', '-f', 'lavfi',
      '-i', 'sine=frequency=410:duration=4', input]);
    assert.equal(encoded.status, 0);
    const original = readFileSync(input);
    writeFileSync(path.join(stems, 'ES_Waking Dream - Mandala Dreams.wav'), original);
    writeFileSync(path.join(source, 'ES_Sanctity - Isaku Kageyama.wav'), original);
    assert.deepEqual(importJourneyMusic(source, output), {
      imported: ['water-mirror.mp3'], failed: [], available: ['water-mirror.mp3'],
    });
    assert.deepEqual(readFileSync(input), original);
    const target = path.join(output, 'water-mirror.mp3');
    const lastWrite = statSync(target).mtimeMs;
    writeFileSync(input, 'damaged copy');
    writeFileSync(path.join(disc, 'ES_Inuyama Gardens - Mandala Dreams.wav'), original);
    writeFileSync(path.join(disc, 'ES_Onsen Ritual - Joseph Beg.wav'), 'unreadable audio');
    writeFileSync(path.join(output, 'pacific-shores.mp3'), 'unreadable previous file');
    writeFileSync(path.join(output, 'available.json'), 'damaged previous manifest');
    const { imported, failed, available } = importJourneyMusic(source, output);
    assert.deepEqual(imported, ['inuyama-gardens.mp3']);
    assert.deepEqual(failed, ['onsen-ritual.mp3']);
    assert.deepEqual(available, ['inuyama-gardens.mp3', 'water-mirror.mp3']);
    const manifest = JSON.parse(readFileSync(path.join(output, 'available.json')));
    assert.deepEqual(Object.keys(manifest), available);
    assert.equal(manifest['water-mirror.mp3'].bytes, statSync(target).size);
    assert.match(manifest['water-mirror.mp3'].sha256, /^[a-f0-9]{64}$/);
    assert.equal(statSync(target).mtimeMs, lastWrite);
  });
