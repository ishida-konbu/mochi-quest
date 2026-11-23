// Share long startup jobs with input, asset decoding and the loading screen.
export async function finishInSlices(steps, signal) {
  let deadline = performance.now() + 7;
  for (;;) {
    if (signal?.aborted) {
      steps.return?.();
      throw signal.reason;
    }
    const step = steps.next();
    if (step.done) return step.value;
    if (performance.now() < deadline) continue;
    if (globalThis.scheduler?.yield) await globalThis.scheduler.yield();
    else await new Promise(resolve => setTimeout(resolve, 0));
    deadline = performance.now() + 7;
  }
}

// The first draw identifies the materials actually submitted for this camera.
// Use the linked uniforms so maps added by onBeforeCompile (ground ink, bark,
// and costume dyes) are covered alongside the ordinary material maps.
export function watchArrivalPaint(manager) {
  const { onStart, onProgress } = manager;
  let loading = false, check, idleCheck;
  manager.onStart = (...args) => {
    loading = true;
    onStart?.(...args);
  };
  manager.onProgress = (url, done, total) => {
    loading = done < total;
    onProgress?.(url, done, total);
    check?.();
  };
  return {
    waitFor(renderer, scene, paper) {
      const lists = renderer.renderLists.get(scene, 0);
      const materials = new Set();
      for (const list of [lists.opaque, lists.transmissive, lists.transparent]) {
        for (const { material, object, geometry } of list) {
          if (object.count !== 0 && geometry.instanceCount !== 0) materials.add(material);
        }
      }
      const sources = new Set();
      function include(texture) {
        if (texture?.isTexture && !texture.isRenderTargetTexture && !texture.isDepthTexture && !texture.image) {
          sources.add(texture.source);
        }
      }
      include(paper);
      for (const material of materials) {
        for (const entry of Object.values(renderer.properties.get(material).uniforms || {})) include(entry.value);
      }
      const complete = () => scene.environment && [...sources].every(source => source.data);
      if (complete()) return null;
      return new Promise((resolve, reject) => {
        check = () => {
          if (complete()) {
            clearTimeout(idleCheck);
            idleCheck = undefined;
            resolve();
          }
          else if (!loading && idleCheck === undefined) {
            // ImageLoader reports its last item before loadAsync consumers
            // have copied the decoded image into their shared material.
            idleCheck = setTimeout(() => {
              idleCheck = undefined;
              if (complete()) resolve();
              else if (!loading) reject(new Error('An image required for the opening view did not load'));
            }, 0);
          }
        };
        check();
      });
    },
    close() {
      clearTimeout(idleCheck);
      check = null;
      manager.onStart = onStart;
      manager.onProgress = onProgress;
    },
  };
}
