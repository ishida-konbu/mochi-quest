// Share long startup jobs with input, asset decoding and the loading screen.
export async function finishInSlices(steps) {
  let deadline = performance.now() + 7;
  for (;;) {
    const step = steps.next();
    if (step.done) return step.value;
    if (performance.now() < deadline) continue;
    if (globalThis.scheduler?.yield) await globalThis.scheduler.yield();
    else await new Promise(resolve => setTimeout(resolve, 0));
    deadline = performance.now() + 7;
  }
}

export function* uploadSceneTextures(renderer, scene, extraTextures) {
  const textures = new Set(extraTextures);
  const materials = new Set();
  scene.traverse(object => {
    if (!object.material) return;
    if (Array.isArray(object.material)) object.material.forEach(m => materials.add(m));
    else materials.add(object.material);
  });
  for (const material of materials) {
    for (const value of Object.values(material)) if (value?.isTexture) textures.add(value);
    for (const entry of Object.values(material.uniforms || {})) {
      if (entry.value?.isTexture) textures.add(entry.value);
    }
  }
  for (const texture of textures) {
    if (!texture?.image || texture.isRenderTargetTexture || texture.isDepthTexture) continue;
    renderer.initTexture(texture);
    yield;
  }
}
