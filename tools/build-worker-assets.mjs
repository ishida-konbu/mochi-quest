import { copyFile, mkdir, mkdtemp, readdir, readFile, rename, rm, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { basename, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';
import { WORKER_ORIGIN } from '../two/journey-transfer.js';

const root = fileURLToPath(new URL('../', import.meta.url));
const output = join(root, 'dist');
const stage = await mkdtemp(join(root, '.worker-build-'));
const files = [
  'index.html', 'library.css', 'kagami-preview.html',
  'one/index.html', 'style.css', 'main.js', 'actors.js', 'atlas.js', 'game.js', 'landscape.js', 'sound.js', 'ui.js',
  'two/index.html', 'two/game.css', 'two/vendor/THREE-LICENSE.txt', 'audio/CREDITS.txt', 'audio/music/available.json',
];

// Only game assets and browser modules belong on the public origin.
async function collect(directory, suffixes, nested) {
  for (const entry of await readdir(join(root, directory), { withFileTypes: true })) {
    if (entry.name.startsWith('.')) continue;
    const path = join(directory, entry.name);
    if (path === join('audio', 'music')) continue;
    if (nested && entry.isDirectory()) await collect(path, suffixes, true);
    if (entry.isFile() && suffixes.some(suffix => entry.name.endsWith(suffix))) files.push(path);
  }
}

// Keep the bundle beside the source modules: their paintings, models and
// music are located relative to import.meta.url. Shared audio belongs at
// the site root, and the separately cached Three.js serves the model viewer too.
async function bundleJourney() {
  const result = await build({
    entryPoints: [join(root, 'two/main.js')],
    outdir: join(stage, 'two'),
    entryNames: 'journey-[hash]',
    bundle: true,
    format: 'esm',
    target: 'es2022',
    minify: true,
    external: ['./vendor/*', '../sound.js'],
    write: false,
  });
  const [bundle] = result.outputFiles;
  const filename = basename(bundle.path);
  await writeFile(bundle.path, bundle.contents);
  files.push(join('two', filename));

  const page = join(stage, 'two/index.html');
  const html = await readFile(page, 'utf8');
  const entry = html.match(/<link rel="modulepreload" href="(\.\/main\.js[^"]*)"\s*\/>/)?.[1];
  if (!entry || !html.includes(`import('${entry}')`)) throw new Error('Missing Mochi Quest 2 entry point');
  await writeFile(page, html.replace(/\s*<script type="importmap">[\s\S]*?<\/script>/, '')
    .replaceAll(entry, './' + filename));
}

// Keep licensed recordings on the game origin. A clean Workers Builds checkout
// recovers the approved game encodes from the previous release and verifies them.
async function stageMusic([file, { sha256, bytes }]) {
  if (!/^[a-z0-9-]+\.mp3$/.test(file) || !/^[a-f0-9]{64}$/.test(sha256) || !Number.isSafeInteger(bytes) || bytes <= 0) {
    throw new Error('Invalid audio/music/available.json entry: ' + file);
  }
  const path = join('audio', 'music', file);
  let data;
  try {
    data = await readFile(join(root, path));
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
    const url = new URL('/audio/music/' + file, WORKER_ORIGIN);
    url.searchParams.set('v', sha256.slice(0, 12));
    const response = await fetch(url, { signal: AbortSignal.timeout(90000) });
    if (!response.ok) throw new Error('Could not recover ' + file + ' from the live game: HTTP ' + response.status);
    data = Buffer.from(await response.arrayBuffer());
  }
  if (data.length !== bytes || createHash('sha256').update(data).digest('hex') !== sha256) {
    throw new Error('Game music does not match its release digest: ' + file);
  }
  await writeFile(join(stage, path), data);
  files.push(path);
}

try {
  await collect('assets', ['.webp', '.png', '.svg'], true);
  await collect('audio', ['.mp3'], true);
  await collect('two', ['.js'], false);
  await collect('two/vendor', ['.js'], false);
  await collect('two/assets', ['.webp', '.glb', '.hdr'], true);
  for (const file of files) {
    const target = join(stage, file);
    await mkdir(dirname(target), { recursive: true });
    await copyFile(join(root, file), target);
  }
  await bundleJourney();
  const music = Object.entries(JSON.parse(await readFile(join(stage, 'audio/music/available.json'), 'utf8')));
  for (let i = 0; i < music.length; i += 3) {
    const results = await Promise.allSettled(music.slice(i, i + 3).map(stageMusic));
    const failure = results.find(result => result.status === 'rejected');
    if (failure) throw failure.reason;
  }
  // Rename individual files into place so a preview or concurrent build can
  // keep using the same asset directory without an empty-directory window.
  for (const file of files) {
    const destination = join(output, file);
    await mkdir(dirname(destination), { recursive: true });
    await rename(join(stage, file), destination);
  }
  const allowed = new Set(files);
  async function prune(directory) {
    for (const entry of await readdir(join(output, directory), { withFileTypes: true })) {
      const relative = join(directory, entry.name);
      if (entry.isDirectory()) await prune(relative);
      else if (!allowed.has(relative)) await rm(join(output, relative), { force: true });
    }
  }
  await prune('');
  console.log(`Built ${files.length} public files in dist/`);
} finally {
  await rm(stage, { recursive: true, force: true });
}
