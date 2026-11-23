import test from 'node:test';
import assert from 'node:assert/strict';
import { LoadingManager, Texture } from '../two/vendor/three.module.min.js';
import { watchArrivalPaint } from '../two/preparation.js';

function openingView(ground, distant) {
  const object = {}, geometry = {};
  const lists = { opaque: [{ material: ground, object, geometry }], transparent: [], transmissive: [] };
  // An empty instance batch can appear in the renderer's opaque list.
  lists.opaque.push({ material: distant, object: { count: 0 }, geometry });
  return { renderLists: { get: () => lists }, properties: { get: material => material } };
}

test('opening the view waits for a custom ground wash while an unseen district is still loading', async () => {
  const manager = new LoadingManager(), watch = watchArrivalPaint(manager);
  const fieldInk = new Texture(), distant = new Texture();
  const renderer = openingView({ uniforms: { fieldInk: { value: fieldInk } } },
    { uniforms: { map: { value: distant } } });
  const scene = { environment: null };
  manager.itemStart('distant.webp');
  manager.itemStart('field-ink.webp');
  manager.itemStart('light.hdr');
  const pending = watch.waitFor(renderer, scene);
  let opened = false;
  pending.then(() => { opened = true; });
  fieldInk.image = {};
  manager.itemEnd('field-ink.webp');
  await Promise.resolve();
  assert.equal(opened, false);
  scene.environment = {};
  manager.itemEnd('light.hdr');
  await pending;
  assert.equal(watch.waitFor(renderer, scene), null);
  watch.close();
  manager.itemEnd('distant.webp');
});

test('a failed sheet of paper releases the loading screen to the error handler', async () => {
  const manager = new LoadingManager(), watch = watchArrivalPaint(manager);
  manager.itemStart('paper.png');
  const pending = watch.waitFor(openingView({}, {}), { environment: {} }, new Texture());
  manager.itemError('paper.png');
  manager.itemEnd('paper.png');
  await assert.rejects(pending, /opening view/);
  watch.close();
});

test('a cached image can reach the opening material in the promise callback after the final load event', async () => {
  const manager = new LoadingManager(), watch = watchArrivalPaint(manager);
  const paint = new Texture();
  manager.itemStart('ink.webp');
  const pending = watch.waitFor(openingView({uniforms:{map:{value:paint}}}, {}), {environment:{}});
  manager.itemEnd('ink.webp');
  await Promise.resolve();
  paint.image = {};
  await pending;
  watch.close();
});
