import { spawnSync } from 'node:child_process';
import { createHash, randomUUID } from 'node:crypto';
import { existsSync, mkdirSync, readdirSync, readFileSync, renameSync, rmSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { JOURNEY_MUSIC } from '../two/journey-music.js';

const outputDirectory = fileURLToPath(new URL('../audio/music/', import.meta.url));
const tracks = Object.values(JOURNEY_MUSIC);
const usage = '使い方: node tools/import-journey-music.mjs <音源フォルダ>\n' +
  'サブフォルダも含めて、選曲済みの公式MP3・WAVを音量調整し、audio/music/ に取り込みます。';

function normalizedName(name) {
  return name.normalize('NFKC').toLowerCase().replace(/[^a-z0-9]/g, '');
}

// A stem or preview may share the entire title and artist with the full mix.
// Strip only known full-mix suffixes and require an exact match afterwards.
export function matchJourneyTrack(filename) {
  let name = path.basename(filename);
  try { name = decodeURIComponent(name); } catch { /* A literal '%' is valid in a filename. */ }
  const { ext, name: stem } = path.parse(name);
  if (!/^\.(mp3|wav)$/i.test(ext)) return;
  const base = stem.replace(/^ES[\s_-]+/i, '').replace(/\s*\(\d+\)$/, '')
    .replace(/[\s_-]+\(?full[\s_-]*mix(?:[\s_-]+high[\s_-]*quality)?\)?$/i, '');
  const key = normalizedName(base);
  return tracks.find(({ title, artist, file }) => {
    const titleKey = normalizedName(title);
    if (key === titleKey || base.toLowerCase() === path.parse(file).name) return true;
    const artistKeys = new Set([normalizedName(artist), normalizedName(artist.split(',')[0])]);
    for (const artistKey of artistKeys) {
      if (key === titleKey + artistKey || key === artistKey + titleKey) return true;
    }
    return false;
  });
}

function findSources(directory, destination, sources) {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    if (entry.name.startsWith('.')) continue;
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      if (fullPath !== destination && !/^(?:stems?|bass|drums|instruments?|melody|vocals?|previews?)$/i.test(entry.name)) {
        findSources(fullPath, destination, sources);
      }
      continue;
    }
    if (!entry.isFile()) continue;
    const track = matchJourneyTrack(entry.name);
    if (track) sources.get(track.file).push(fullPath);
  }
}

function run(command, args) {
  const result = spawnSync(command, args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
  if (result.error) throw result.error;
  return result;
}

function playableMp3(file) {
  if (!existsSync(file)) return false;
  const probe = run('ffprobe', ['-v', 'error', '-select_streams', 'a:0',
    '-show_entries', 'stream=codec_name:format=duration', '-of', 'json', file]);
  if (probe.status !== 0) return false;
  const data = JSON.parse(probe.stdout);
  return data.streams?.[0]?.codec_name === 'mp3' && Number(data.format?.duration) > 0;
}

function convert(source, target) {
  const temp = path.join(path.dirname(target), '.' + randomUUID() + '.mp3');
  try {
    const result = run('ffmpeg', ['-nostdin', '-hide_banner', '-loglevel', 'error', '-xerror', '-i', source,
      '-map', '0:a:0', '-map_metadata', '-1', '-af', 'loudnorm=I=-16:TP=-2:LRA=11',
      '-ar', '44100', '-ac', '2', '-c:a', 'libmp3lame', '-b:a', '160k', temp]);
    if (result.status !== 0 || !playableMp3(temp)) return false;
    renameSync(temp, target);
    return true;
  } finally {
    rmSync(temp, { force: true });
  }
}

function writeManifest(destination) {
  const collect = () => tracks.map(track => track.file).filter(file => playableMp3(path.join(destination, file))).sort();
  // Other imports can finish while ffprobe verifies a file. Repeat the snapshot
  // if another process publishes a new track before this manifest is committed.
  const temp = path.join(destination, '.' + randomUUID() + '.json');
  try {
    let available = collect();
    while (true) {
      const manifest = Object.fromEntries(available.map(file => {
        const audio = readFileSync(path.join(destination, file));
        return [file, { sha256: createHash('sha256').update(audio).digest('hex'), bytes: audio.length }];
      }));
      writeFileSync(temp, JSON.stringify(manifest, null, 2) + '\n');
      renameSync(temp, path.join(destination, 'available.json'));
      const latest = collect();
      if (available.join() === latest.join()) return latest;
      available = latest;
    }
  } finally {
    rmSync(temp, { force: true });
  }
}

export function importJourneyMusic(source, destination = outputDirectory) {
  const sources = new Map(tracks.map(track => [track.file, []]));
  destination = path.resolve(destination);
  findSources(path.resolve(source), destination, sources);
  mkdirSync(destination, { recursive: true });
  const imported = [];
  const failed = [];
  for (const [file, candidates] of sources) {
    const target = path.join(destination, file);
    if (!candidates.length || playableMp3(target)) continue;
    // Prefer lossless downloads when MP3 and WAV copies are both available.
    candidates.sort((a, b) => Number(/\.wav$/i.test(b)) - Number(/\.wav$/i.test(a)) || a.localeCompare(b));
    if (candidates.some(candidate => convert(candidate, target))) imported.push(file);
    else failed.push(file);
  }
  return { imported, failed, available: writeManifest(destination) };
}

if (process.argv[1] && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url) {
  const args = process.argv.slice(2);
  if (args.length === 1 && args[0] === '--help') {
    console.log(usage);
  } else if (args.length !== 1 || args[0].startsWith('-')) {
    console.error(usage);
    process.exitCode = 1;
  } else {
    try {
      const { imported, failed, available } = importJourneyMusic(args[0]);
      console.log(`新規取り込み ${imported.length} 曲。使用可能 ${available.length} / ${tracks.length} 曲。`);
      if (failed.length) {
        console.error('変換できなかった曲: ' + failed.join(', '));
        process.exitCode = 1;
      }
    } catch (error) {
      console.error(error.message);
      process.exitCode = 1;
    }
  }
}
