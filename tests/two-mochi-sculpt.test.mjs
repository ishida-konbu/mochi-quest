import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { AnimationMixer, Vector3 } from '../two/vendor/three.module.min.js';
import { GLTFLoader } from '../two/vendor/GLTFLoader.min.js';

const bytes = await readFile(new URL('../two/assets/actors/nikkori/nikkori.glb', import.meta.url));
const gltf = await new GLTFLoader().parseAsync(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.length), '');
const body = gltf.scene.getObjectByName('Nikkori');
const { geometry } = body;
const position = geometry.getAttribute('position');
const indices = geometry.index.array;
const point = (attribute, i) => new Vector3().fromBufferAttribute(attribute, i);

test('the projected lip bed has a continuous outward normal on the neutral and smiling faces', () => {
  const normal = geometry.getAttribute('normal');
  const [smile, pull] = geometry.morphAttributes.normal;
  let vertices = 0;
  for (let i = 0; i < position.count; i++) {
    const p = point(position, i);
    if (p.z < .85 || Math.hypot((p.x-.006)/.245,(p.y-1.18)/.18) >= .73) continue;
    vertices++;
    for (const [joy, stretch] of [[0,0],[1,0],[1,.46],[1,1]]) {
      const n = point(normal,i).addScaledVector(point(smile,i),joy).addScaledVector(point(pull,i),stretch).normalize();
      assert.ok(n.z > .90, `lip normal turned away from the viewer at vertex ${i}`);
    }
  }
  assert.ok(vertices > 30, 'the test sampled the mouth interior');
});

test('the exported skinned hands stay rounded through every pull of a long jump', () => {
  const mixer = new AnimationMixer(gltf.scene);
  mixer.clipAction(gltf.animations.find(a => a.name === 'Normal')).play();
  mixer.setTime(.72);
  gltf.scene.updateMatrixWorld(true);
  body.morphTargetInfluences[0] = 1;
  const sample = () => Array.from({length:position.count}, (_,i) => body.getVertexPosition(i,new Vector3()));
  const original = sample();
  const crown = Array.from({length:position.count},(_,i) => i).reduce((a,b) => position.getY(a)>position.getY(b)?a:b);
  const palms = [];
  for (let i = 0; i < indices.length; i += 3) {
    const [a,b,c] = indices.subarray(i,i+3);
    const centre = point(position,a).add(point(position,b)).add(point(position,c)).divideScalar(3);
    if (Math.abs(centre.x)<.80 || centre.z<.32 || centre.y<.45 || centre.y>1) continue;
    for (const [u,v] of [[a,b],[b,c],[c,a]]) {
      const length = original[u].distanceTo(original[v]);
      if (length>.003) palms.push([u,v,length]);
    }
  }
  assert.ok(palms.length>1000, 'both hands and their attachment seams were sampled');
  for (const stretch of [.23,.46,.69,.92,1]) {
    body.morphTargetInfluences[1] = stretch;
    const posed = sample();
    assert.ok(posed[crown].y-original[crown].y>stretch*1.12, 'the crown still rises on each pull');
    const strain = palms.map(([a,b,length]) => posed[a].distanceTo(posed[b])/length).sort((a,b)=>a-b);
    assert.ok(strain[Math.floor(strain.length*.95)]<1.5, 'the palms keep their volume');
    assert.ok(strain.at(-1)<3.65, 'no isolated hand edge can form a long fin');
  }
});
