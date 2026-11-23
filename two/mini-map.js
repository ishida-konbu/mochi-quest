const zoomLevels = [.25, .5, 1, 2, 4];
const sizes = ['small', 'medium', 'large'];

export function normalizeMiniMap(saved) {
  return {
    size: sizes.includes(saved?.size) ? saved.size : 'medium',
    zoom: zoomLevels.includes(saved?.zoom) ? saved.zoom : 1,
  };
}

export function createMiniMap(panel, saved, onChange) {
  const settings = normalizeMiniMap(saved);
  const stage = panel.closest('#stage');
  const canvas = panel.querySelector('canvas');
  const size = panel.querySelector('select');
  const smaller = panel.querySelector('[data-mini-zoom="out"]');
  const larger = panel.querySelector('[data-mini-zoom="in"]');
  const scale = panel.querySelector('output');
  let displayWidth = 120;

  new ResizeObserver(([entry]) => {
    if (entry.contentRect.width > 0) displayWidth = entry.contentRect.width;
  }).observe(canvas);

  function updateControls() {
    stage.dataset.miniSize = settings.size;
    size.value = settings.size;
    smaller.disabled = settings.zoom === zoomLevels[0];
    larger.disabled = settings.zoom === zoomLevels.at(-1);
    scale.value = settings.zoom + '×';
  }

  function zoomBy(step) {
    const next = zoomLevels[zoomLevels.indexOf(settings.zoom) + step];
    if (!next) return;
    settings.zoom = next;
    updateControls();
    onChange();
  }

  size.addEventListener('keydown', event => {
    // Native select navigation shares the game's walking and jump keys.
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' ', 'Escape'].includes(event.key)) event.stopPropagation();
  });
  size.addEventListener('change', () => {
    settings.size = size.value;
    updateControls();
    onChange();
  });
  smaller.addEventListener('click', () => zoomBy(-1));
  larger.addEventListener('click', () => zoomBy(1));
  updateControls();

  return {
    canvas,
    settings,
    projection() {
      const pixels = Math.round(displayWidth * Math.min(window.devicePixelRatio || 1, 2));
      if (canvas.width !== pixels) canvas.width = canvas.height = pixels;
      // A small disc reduces its ink marks along with the available paper.
      return { zoom: settings.zoom, pixelRatio: pixels / Math.max(132, displayWidth) };
    },
  };
}
