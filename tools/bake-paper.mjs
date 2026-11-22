// Export these canvases as lossless WebP after changing the terrain or scroll artwork.
export { paintMapPaper } from '../two/map.js';

// These samples come from unoutlined areas of the original scroll animals.
// Mirroring each quadrant gives the brush wash a seamless repeat in three dimensions.
const swatches = {
  rabbit: [811, 258, 28, 40],
  frog: [743, 250, 36, 36],
};

export async function paintResidentWash(kind) {
  const paper = document.createElement('canvas');
  paper.width = paper.height = 128;
  const paint = paper.getContext('2d');
  paint.fillStyle = '#888';
  paint.fillRect(0, 0, 128, 128);
  const [x, y, w, h] = swatches[kind];
  const image = new Image();
  image.src = new URL('../two/assets/residents/scroll-pigments.webp', import.meta.url).href;
  await image.decode();
  for (let q = 0; q < 4; q++) {
    const right = q % 2 === 1,
      lower = q >= 2;
    paint.save();
    paint.translate(right ? 128 : 0, lower ? 128 : 0);
    paint.scale(right ? -1 : 1, lower ? -1 : 1);
    paint.drawImage(image, x, y, w, h, 0, 0, 64, 64);
    paint.restore();
  }
  const pixels = paint.getImageData(0, 0, 128, 128);
  const bytes = pixels.data;
  let mean = 0;
  for (let i = 0; i < bytes.length; i += 4)
    mean += 0.26 * bytes[i] + 0.62 * bytes[i + 1] + 0.12 * bytes[i + 2];
  mean /= bytes.length / 4;
  for (let i = 0; i < bytes.length; i += 4) {
    const shade = 0.26 * bytes[i] + 0.62 * bytes[i + 1] + 0.12 * bytes[i + 2];
    const normalized = Math.round(136 + (shade - mean) * (kind === 'frog' ? 2.6 : 3.3));
    bytes[i] = bytes[i + 1] = bytes[i + 2] = normalized;
    bytes[i + 3] = 255;
  }
  paint.putImageData(pixels, 0, 0);
  return paper;
}
