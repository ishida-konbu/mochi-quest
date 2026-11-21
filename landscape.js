// Each painting occupies a stretch of the same circular road. Neighbouring
// paintings overlap along a narrow, feathered strip, like a joined handscroll.
const PLATES = ['river', 'shrine', 'market', 'spring', 'terraces', 'coast'];
const WORLD = 24000;
const HEIGHT = 720;
const FEATHER = 0.07;
const TAU = Math.PI * 2;
const wrap = (v, n) => ((v % n) + n) % n;

// Landmarks are pinned to the centre of their painting. Interpolated slopes
// let the camera travel smoothly through the shorter opening stretch.
const anchors = [
  [-2300, -1], [-500, -.5], [600, 0], [4000, .5], [6000, 1],
  [8000, 1.5], [10000, 2], [12000, 2.5], [14000, 3], [16000, 3.5],
  [18000, 4], [20000, 4.5], [21700, 5], [23500, 5.5], [24600, 6], [28000, 6.5]
];

function scrollCoordinate(x) {
  const px = wrap(x, WORLD);
  let index = 1;
  while (px > anchors[index + 1][0]) index++;
  const [x1, p1] = anchors[index], [x2, p2] = anchors[index + 1];
  const [x0, p0] = anchors[index - 1], [x3, p3] = anchors[index + 2];
  const t = (px - x1) / (x2 - x1), s = 1 - t;
  const slope1 = (p2 - p0) * (x2 - x1) / (x2 - x0);
  const slope2 = (p3 - p1) * (x2 - x1) / (x3 - x1);
  return (1 + 2 * t) * s * s * p1 + t * s * s * slope1
    + t * t * (3 - 2 * t) * p2 - t * t * s * slope2;
}

function feather(image) {
  const edge = document.createElement('canvas');
  edge.width = Math.ceil(image.naturalWidth * FEATHER);
  edge.height = image.naturalHeight;
  const ctx = edge.getContext('2d');
  ctx.drawImage(image, 0, 0);
  ctx.globalCompositeOperation = 'destination-in';
  const fade = ctx.createLinearGradient(0, 0, edge.width, 0);
  fade.addColorStop(0, 'transparent');
  fade.addColorStop(.48, 'rgba(0,0,0,.47)');
  fade.addColorStop(1, '#000');
  ctx.fillStyle = fade;
  ctx.fillRect(0, 0, edge.width, edge.height);
  return edge;
}

// On the coast and the mountain road the illustrator painted the path lower
// in the frame. Register its banks to the shared, traversable strip.
const ROAD_BANKS = {3: [.82, .90], 4: [.78, .89], 5: [.78, .875]};
function showPainting(ctx, plate, x, width) {
  const {image, edge, banks} = plate;
  const edgeWidth = edge.width;
  const screenEdge = width * edgeWidth / image.naturalWidth;
  function band(top, bottom, y, height) {
    const srcY = top * image.naturalHeight;
    const srcH = (bottom - top) * image.naturalHeight;
    ctx.drawImage(edge, 0, srcY, edgeWidth, srcH, x, y, screenEdge, height);
    ctx.drawImage(image, edgeWidth, srcY, image.naturalWidth - edgeWidth, srcH,
      x + screenEdge - .35, y, width - screenEdge + .35, height);
  }
  if (!banks) {
    band(0, 1, 0, HEIGHT);
    return;
  }
  band(0, banks[0], 0, 501);
  band(banks[0], banks[1], 500.5, 110);
  band(banks[1], 1, 610, HEIGHT - 610);
}

function birds(ctx, left, width, t, moon) {
  const groupX = left + width * (.47 + .09 * Math.sin(t * .032));
  const groupY = 128 + 6 * Math.sin(t * .07);
  ctx.strokeStyle = moon ? 'rgba(211,210,180,.67)' : 'rgba(50,54,47,.74)';
  ctx.lineCap = 'round';
  for (let i = 0; i < 7; i++) {
    const wing = Math.sin(t * (3.1 + i * .085) + i * 2.7) * 2;
    const flank = i % 2 ? 1 : -1;
    const x = groupX + flank * (4 + i * 8.5);
    const y = groupY + i * 3 + flank * 2;
    const size = 3.8 - i * .18;
    ctx.lineWidth = 1.3 - i * .087;
    ctx.beginPath();
    ctx.moveTo(x - size, y - wing);
    ctx.quadraticCurveTo(x - size * .4, y - wing * .55, x, y + .75);
    ctx.quadraticCurveTo(x + size * .45, y - wing - .5, x + size * 1.13, y - wing + .2);
    ctx.stroke();
  }
}

function riverGlints(ctx, left, width, t) {
  ctx.lineWidth = 1.05;
  for (let i = 0; i < 14; i++) {
    const phase = t * .42 + i * 2.24;
    const x = left + width * (.43 + (i * .0317) % .21) + Math.sin(phase) * 3.8;
    const y = 459 + (i * 9) % 27;
    ctx.strokeStyle = 'rgba(255,248,217,' + (.22 + .19 * Math.cos(phase)) + ')';
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.quadraticCurveTo(x + 6, y - 1.3, x + 11 + Math.sin(phase) * 3, y);
    ctx.stroke();
  }
}

function wind(ctx, width, worldX, t, region) {
  const night = region === 4;
  const n = Math.ceil(width / (night ? 90 : 155));
  const drift = night ? 3.5 : 13;
  for (let i = 0; i < n; i++) {
    // A periodic wind field also continues across the seam of the world.
    const span = night ? 800 : 960;
    const x = wrap(i * 149.53 - worldX * .36 + t * drift, span) + Math.floor(i / 6) * span - 36;
    const angle = t * .78 + i * 5.31;
    const y = night ? 465 + Math.sin(angle * .63) * 52 + (i % 3) * 14
      : 265 + wrap(i * 77.13 + t * 5.6, 321) + Math.cos(angle) * 8;
    if (x > width + 12) continue;
    ctx.save();
    ctx.translate(x + Math.cos(angle * .72) * 8, y);
    if (night) {
      const glimmer = .18 + (1 + Math.sin(t * 1.55 + i * .81)) * .19;
      ctx.fillStyle = 'rgba(239,212,119,' + (glimmer * .23) + ')';
      ctx.beginPath(); ctx.arc(0, 0, 3.8, 0, TAU); ctx.fill();
      ctx.fillStyle = 'rgba(255,235,154,' + (glimmer + .15) + ')';
      ctx.beginPath(); ctx.arc(0, 0, 1.4, 0, TAU); ctx.fill();
    } else {
      ctx.rotate(angle * .74);
      ctx.scale(.42 + Math.abs(Math.cos(angle)) * .65, .78);
      ctx.fillStyle = region === 0 ? 'rgba(191,118,100,.62)' : 'rgba(126,116,70,.55)';
      ctx.beginPath();
      ctx.moveTo(-3.8, 0);
      ctx.quadraticCurveTo(-.9, -2.9, 3.6, -.7);
      ctx.quadraticCurveTo(2.7, 1.2, -.1, 1.8);
      ctx.closePath(); ctx.fill();
    }
    ctx.restore();
  }
}

// Fine road marks give nearby ground a separate movement speed from the hills.
function groundMarks(ctx, w, cameraX) {
  const spacing = 72;
  const first = Math.floor((cameraX - w / 2) / spacing);
  const end = Math.ceil((cameraX + w / 2) / spacing);
  ctx.lineWidth = .75;
  ctx.lineCap = 'round';
  for (let i = first; i <= end; i++) {
    const id = wrap(i, 333);
    const x = w / 2 + i * spacing - cameraX + (id * 13) % 39;
    const y = 526 + (id * 31) % 73;
    ctx.strokeStyle = 'rgba(87,77,51,.28)';
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.quadraticCurveTo(x + 3.5, y - .85, x + 7 + id % 7, y - .6);
    if (id % 3 === 1) { ctx.moveTo(x + 9, y + 1.6); ctx.lineTo(x + 13, y + 1.2); }
    ctx.stroke();
  }
}

const WATER = [
  [.493,.645,.182,.052], [.53,.635,.138,.045], [.71,.648,.173,.04],
  [.49,.655,.33,.084], [.56,.514,.35,.115], [.54,.464,.46,.17]
];

// Displace brush marks on a fine mesh. The fragment shader only samples the
// original painting once per pixel, even on a high-density display.
const vertexSource = `
  attribute vec2 aGrid;
  uniform vec4 uClip;
  uniform vec2 uTile;
  uniform vec2 uBanks;
  uniform vec4 uWater;
  uniform float uTime;
  varying mediump vec2 vPaint;
  varying mediump float vBlend;
  void main() {
    float x = aGrid.x, y = aGrid.y;
    float upperBank = 501.0/720.0, lowerBank = 610.0/720.0;
    float sourceY = min(y/upperBank,1.0)*uBanks.x
      + clamp((y-upperBank)/(lowerBank-upperBank),0.0,1.0)*(uBanks.y-uBanks.x)
      + max(0.0,(y-lowerBank)/(1.0-lowerBank))*(1.0-uBanks.y);
    vec2 uv = vec2(x,sourceY);
    vec2 delta = (aGrid-uWater.xy)/uWater.zw;
    float water = 1.0-smoothstep(.35,1.0,dot(delta,delta));
    float current = sin(y*145.0+x*8.0+uTime*1.8);
    float eddy = sin(x*43.0-y*16.0-uTime*1.4);
    uv += vec2(.0014*current+.0005*eddy,.00085*eddy)*water;
    float edges = 1.0-smoothstep(.04,.31,min(x,1.0-x));
    float foliage = edges*(1.0-smoothstep(.14,.60,y));
    float reeds = smoothstep(.858,.944,y)*(1.0-smoothstep(.955,1.0,y));
    float gust = sin(x*20.0+y*5.0-uTime*1.03) + .37*sin(x*59.0+uTime*1.54);
    uv.x += (.00065*foliage+.00115*reeds)*gust;
    uv.y += .00036*foliage*sin(x*29.0+uTime*.89);
    vPaint = uv;
    vBlend = clamp(x/${FEATHER.toFixed(3)},0.0,1.0);
    vec2 pos = vec2(uTile.x+x*uTile.y,y*720.0);
    gl_Position = vec4(pos*uClip.xy+uClip.zw,0.0,1.0);
  }`;

const fragmentSource = `
  precision mediump float;
  uniform sampler2D uPainting;
  varying mediump vec2 vPaint;
  varying mediump float vBlend;
  void main() {
    gl_FragColor = vec4(texture2D(uPainting,vPaint).rgb,vBlend);
  }`;

function buildShader(gl, kind, source) {
  const shader = gl.createShader(kind);
  if (!shader) throw new Error('Shader allocation failed');
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    gl.deleteShader(shader);
    throw new Error('Landscape shader unavailable');
  }
  return shader;
}

function watercolorMesh(gl) {
  const program = gl.createProgram();
  if (!program) throw new Error('Program allocation failed');
  const shaders = [];
  try {
    shaders.push(buildShader(gl, gl.VERTEX_SHADER, vertexSource));
    shaders.push(buildShader(gl, gl.FRAGMENT_SHADER, fragmentSource));
    for (const shader of shaders) gl.attachShader(program, shader);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error('Program linking failed');
  } catch (error) {
    gl.deleteProgram(program);
    throw error;
  } finally {
    for (const shader of shaders) gl.deleteShader(shader);
  }

  const cols = 92, rows = 55;
  const vertices = [], triangles = [];
  for (let row = 0; row <= rows; row++) {
    for (let col = 0; col <= cols; col++) {
      vertices.push(col / cols, row / rows);
      if (row === rows || col === cols) continue;
      const i = row * (cols + 1) + col, below = i + cols + 1;
      triangles.push(i, i + 1, below, below, i + 1, below + 1);
    }
  }
  gl.useProgram(program);
  const positions = gl.createBuffer(), indices = gl.createBuffer();
  if (!positions || !indices) throw new Error('Mesh allocation failed');
  gl.bindBuffer(gl.ARRAY_BUFFER, positions);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indices);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(triangles), gl.STATIC_DRAW);
  const attr = gl.getAttribLocation(program, 'aGrid');
  gl.enableVertexAttribArray(attr);
  gl.vertexAttribPointer(attr, 2, gl.FLOAT, false, 0, 0);
  const uniform = name => gl.getUniformLocation(program, name);
  const uniforms = Object.fromEntries(['uClip','uTile','uTime','uBanks','uWater'].map(name=>[name,uniform(name)]));
  gl.uniform1i(uniform('uPainting'), 0);
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
  gl.clearColor(239/255,226/255,195/255,1);
  return {count: triangles.length, uniforms, textures: new WeakMap()};
}

function artworkTexture(gl, image, textures) {
  let texture = textures.get(image);
  if (texture) return texture;
  texture = gl.createTexture();
  if (!texture) throw new Error('Texture allocation failed');
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
  if (gl.getError() !== gl.NO_ERROR) {
    gl.deleteTexture(texture);
    throw new Error('Texture upload unavailable');
  }
  textures.set(image,texture);
  return texture;
}

function createInkRenderer(canvas) {
  if (!canvas) return null;
  let gl;
  try {
    gl = canvas.getContext('webgl', {
      alpha: false, antialias: false, depth: false, stencil: false, powerPreference: 'low-power'
    });
  } catch { return null; }
  if (!gl) return null;
  let mesh;
  function initialize() {
    try { mesh = watercolorMesh(gl); } catch { mesh = null; }
  }
  initialize();
  canvas.addEventListener('webglcontextlost', event => {
    event.preventDefault();
    mesh = null;
  });
  canvas.addEventListener('webglcontextrestored', initialize);
  const normalBanks = [501/720,610/720];
  return (tiles, ctx, time) => {
    if (!mesh || !tiles.length || gl.isContextLost()) return false;
    const source = ctx.canvas;
    try {
      if (canvas.width !== source.width || canvas.height !== source.height) {
        canvas.width = source.width;
        canvas.height = source.height;
      }
      const w = gl.drawingBufferWidth, h = gl.drawingBufferHeight;
      if (!w || !h) return false;
      const { uniforms, textures, count } = mesh;
      const m = ctx.getTransform();
      gl.viewport(0,0,w,h);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.uniform4f(uniforms.uClip,2*m.a/source.width,-2*m.d/source.height,
        2*m.e/source.width-1,1-2*m.f/source.height);
      gl.uniform1f(uniforms.uTime,time % 65536);
      for (const tile of tiles) {
        const texture = artworkTexture(gl,tile.plate.image,textures);
        gl.bindTexture(gl.TEXTURE_2D,texture);
        gl.uniform2f(uniforms.uTile,tile.left,tile.width);
        gl.uniform2fv(uniforms.uBanks,tile.plate.banks || normalBanks);
        gl.uniform4fv(uniforms.uWater,WATER[tile.plate.index]);
        gl.drawElements(gl.TRIANGLES,count,gl.UNSIGNED_SHORT,0);
      }
      return !gl.isContextLost();
    } catch {
      // A device can refuse a large texture after context creation. The
      // foreground can paint the same frame from the decoded source images.
      mesh = null;
      return false;
    }
  };
}

export function createLandscape(backdropCanvas) {
  const paintInk = createInkRenderer(backdropCanvas);
  const plates = new Array(PLATES.length), pending = new Array(PLATES.length);
  function load(index) {
    if (pending[index]) return pending[index];
    pending[index] = new Promise(resolve => {
      const image = new Image();
      image.decoding = 'async';
      image.onload = () => {
        plates[index] = { index, image, edge: feather(image), banks: ROAD_BANKS[index] };
        resolve(true);
      };
      image.onerror = () => resolve(false);
      image.src = new URL('./assets/landscape/' + PLATES[index] + '.webp', import.meta.url).href;
    });
    return pending[index];
  }
  const ready = load(0);
  return {
    ready,
    draw(ctx, view, state) {
      const w = view.w ?? view.width, cx = view.cameraX;
      const t = state.time ?? 0, region = state.region ?? 0;
      const width = Math.max(1460, Math.min(2240, w * 1.17));
      const stride = width * (1 - FEATHER);
      const center = scrollCoordinate(cx);
      const first = Math.ceil(center - (w + width) / (2 * stride));
      const last = Math.floor(center + (w + width) / (2 * stride));
      const tiles = [];
      for (let i = first; i <= last; i++) {
        const index = wrap(i, PLATES.length);
        if (!pending[index]) load(index);
        const plate = plates[index] || plates[0];
        if (!plate) continue;
        const left = w / 2 + (i - center) * stride - width / 2;
        tiles.push({index, plate, left, width});
      }
      ctx.save();
      if (!paintInk?.(tiles, ctx, t)) {
        ctx.fillStyle = '#efe2c3';
        ctx.fillRect(0, 0, w, HEIGHT);
        for (const tile of tiles) showPainting(ctx, tile.plate, tile.left, width);
      }
      for (const {index, left} of tiles) {
        if (index === 0 || index === 4 || index === 5) {
          birds(ctx, left, width, t + index * 1.1, index === 4);
        }
        if (index === 0) riverGlints(ctx, left, width, t);
      }
      groundMarks(ctx, w, cx);
      wind(ctx, w, cx, t, region);
      ctx.restore();
      // Decode adjacent vistas before they enter the viewport, including the
      // scene just west of spawn when the player heads left first.
      if (plates[region]) {
        load(wrap(region + 1, PLATES.length));
        load(wrap(region - 1, PLATES.length));
      }
    }
  };
}
