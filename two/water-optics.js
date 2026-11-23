import * as THREE from './vendor/three.module.min.js';
import { WATER_Y, terrainHeight, wrapDelta } from './terrain.js';

// Pick up the same 2.5 m survey vertices as the visible near-ground mesh.
// Sixteen metres of water absorb almost all of the light from the bottom.
const spacing = 2.5, size = 41, depthRange = 16, half = (size - 1) / 2;
export function createDepthSurvey() {
  const data = new Uint8Array(size * size);
  const plate = new THREE.DataTexture(data, size, size, THREE.RedFormat);
  plate.minFilter = plate.magFilter = THREE.LinearFilter;
  const centre = new THREE.Vector2(Infinity, Infinity);
  return {
    plate, centre,
    update(x, z) {
      if (Math.max(Math.abs(x - centre.x), Math.abs(z - centre.y)) <= 15) return;
      centre.set(Math.round(x / spacing) * spacing, Math.round(z / spacing) * spacing);
      for (let j = 0; j < size; j++) {
        const sz = wrapDelta(centre.y + (j - half) * spacing);
        for (let i = 0; i < size; i++) {
          const sx = wrapDelta(centre.x + (i - half) * spacing);
          const depth = (WATER_Y - terrainHeight(sx, sz)) / depthRange;
          data[j * size + i] = Math.round(255 * Math.max(0, Math.min(1, depth)));
        }
      }
      plate.needsUpdate = true;
    },
  };
}

export const waterColumnGLSL = /* glsl */ `
  uniform sampler2D depthSurvey;
  uniform vec2 surveyCentre;
  float filmOpacity(vec2 point, float viewCosine, float column, float foamCoverage) {
    vec2 offset = point-surveyCentre;
    float range = max(abs(offset.x),abs(offset.y));
    float nearWeight = 1.-smoothstep(32.,${half * spacing}.,range);
    if(nearWeight>0.)column=mix(column,texture2D(depthSurvey,.5+offset/${(size * spacing).toFixed(1)}).r*${depthRange}.,nearWeight);
    // Snell's law bounds the transmitted path even at a low viewing angle.
    // The reflection, however, takes over completely at grazing incidence.
    float cosT = sqrt(1.-.5625*(1.-viewCosine*viewCosine));
    float surface = .025+.975*pow(1.-viewCosine,5.);
    float transmission = (1.-surface)*exp(-.186*column/cosT);
    return 1.-transmission*(1.-foamCoverage);
  }
`;
