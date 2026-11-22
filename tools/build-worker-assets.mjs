import { copyFile, mkdir, mkdtemp, readdir, rename, rm } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const output = join(root, 'dist');
const stage = await mkdtemp(join(root, '.worker-build-'));
const files = [
  'index.html', 'library.css', 'kagami-preview.html',
  'one/index.html', 'style.css', 'main.js', 'actors.js', 'atlas.js', 'game.js', 'landscape.js', 'sound.js', 'ui.js',
  'two/index.html', 'two/game.css', 'two/vendor/THREE-LICENSE.txt', 'audio/CREDITS.txt',
];

// Only game assets and browser modules belong on the public origin.
async function collect(directory, suffixes, nested) {
  for (const entry of await readdir(join(root, directory), { withFileTypes: true })) {
    if (entry.name.startsWith('.')) continue;
    const path = join(directory, entry.name);
    if (nested && entry.isDirectory()) await collect(path, suffixes, true);
    if (entry.isFile() && suffixes.some(suffix => entry.name.endsWith(suffix))) files.push(path);
  }
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
