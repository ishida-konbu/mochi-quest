import { wrapWorld } from './geography.js';

export const miniMapWorldWidth = 118;
const zoomLevels = [.25, .5, 1, 2, 4];
const sizes = ['small', 'medium', 'large', 'mochi'];

export function normalizeMiniMap(saved) {
  return {
    size: sizes.includes(saved?.size) ? saved.size : 'medium',
    zoom: zoomLevels.includes(saved?.zoom) ? saved.zoom : 1,
    goalUp: saved?.goalUp === true,
  };
}

export function waypointRotation(player, target, previous = 0) {
  if (!target) return 0;
  const east = wrapWorld(target.x - player.x);
  const south = wrapWorld(target.z - player.z);
  // Directly above or below a destination there is no horizontal bearing.
  if (Math.hypot(east, south) < .01) return previous;
  return -Math.atan2(east, -south);
}

export function createMiniMap(panel, saved, onChange, player, redraw) {
  const settings = normalizeMiniMap(saved);
  const stage = panel.closest('#stage');
  const canvas = panel.querySelector('canvas');
  const open = panel.querySelector('#mini-button');
  const recenter = panel.querySelector('#mini-recenter');
  const size = panel.querySelector('select');
  const smaller = panel.querySelector('[data-mini-zoom="out"]');
  const larger = panel.querySelector('[data-mini-zoom="in"]');
  const scale = panel.querySelector('output');
  let displayWidth = 120, displayHeight = 120;
  let center = null, gesture = null, suppressPointerClick = false, frame = null;
  let rotation = 0;

  function requestDraw() {
    if (frame !== null) return;
    frame = requestAnimationFrame(() => {
      frame = null;
      redraw();
    });
  }
  new ResizeObserver(([entry]) => {
    const { width, height } = entry.contentRect;
    if (width > 0 && height > 0 && (width !== displayWidth || height !== displayHeight)) {
      displayWidth = width;
      displayHeight = height;
      requestDraw();
    }
  }).observe(canvas);

  function showCenter() {
    panel.toggleAttribute('data-panned', center !== null);
    recenter.hidden = center === null;
    requestDraw();
  }

  open.addEventListener('pointerdown', event => {
    if (event.button !== 0 || !event.isPrimary || gesture) return;
    suppressPointerClick = false;
    gesture = {
      id: event.pointerId, startX: event.clientX, startY: event.clientY,
      x: center?.x ?? player.x, z: center?.z ?? player.z,
      metresPerPixel: miniMapWorldWidth / (settings.zoom * displayWidth),
      rotation,
      threshold: event.pointerType === 'touch' ? 8 : 5, dragged: false,
    };
    open.setPointerCapture(event.pointerId);
  });
  function move(event) {
    if (gesture?.id !== event.pointerId) return;
    const dx = event.clientX - gesture.startX, dy = event.clientY - gesture.startY;
    if (!gesture.dragged && Math.hypot(dx, dy) < gesture.threshold) return;
    gesture.dragged = true;
    panel.setAttribute('data-dragging', '');
    const cos = Math.cos(gesture.rotation), sin = Math.sin(gesture.rotation);
    center = {
      x: wrapWorld(gesture.x - (cos * dx + sin * dy) * gesture.metresPerPixel),
      z: wrapWorld(gesture.z - (cos * dy - sin * dx) * gesture.metresPerPixel),
    };
    showCenter();
  }
  function finish(event) {
    if (gesture?.id !== event.pointerId) return;
    if (event.type === 'pointerup') move(event);
    suppressPointerClick = gesture.dragged || event.type !== 'pointerup';
    panel.removeAttribute('data-dragging');
    gesture = null;
  }
  open.addEventListener('pointermove', move);
  open.addEventListener('pointerup', finish);
  open.addEventListener('pointercancel', finish);
  open.addEventListener('lostpointercapture', finish);
  open.addEventListener('click', event => {
    // Suppress the browser's click following a pan, while preserving native
    // keyboard and assistive activation, including immediately after dragging.
    if (!suppressPointerClick || (!event.detail && !event.pointerType)) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    suppressPointerClick = false;
  }, true);
  recenter.addEventListener('click', () => {
    if (gesture && open.hasPointerCapture(gesture.id)) open.releasePointerCapture(gesture.id);
    center = null;
    showCenter();
    open.focus({ preventScroll: true });
  });

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
    requestDraw();
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
  recenter.hidden = true;

  return {
    canvas,
    settings,
    setGoalUp(enabled) {
      settings.goalUp = enabled;
      onChange();
      requestDraw();
    },
    projection(destination) {
      const navigationTarget = settings.goalUp ? destination : null;
      // Keep the paper under the pointer until the drag is released.
      rotation = navigationTarget ? (gesture?.rotation ?? waypointRotation(player, navigationTarget, rotation)) : 0;
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      const width = Math.round(displayWidth * ratio), height = Math.round(displayHeight * ratio);
      if (canvas.width !== width) canvas.width = width;
      if (canvas.height !== height) canvas.height = height;
      // A small disc reduces its ink marks along with the available paper.
      return { zoom: settings.zoom, pixelRatio: width / Math.max(132, displayWidth), rotation, navigationTarget,
        ...(center && { centerX: center.x, centerZ: center.z }) };
    },
  };
}
