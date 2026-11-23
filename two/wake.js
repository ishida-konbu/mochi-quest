import * as THREE from './vendor/three.module.min.js';
import { BOUND, waterDepth, waterSurfaceAt, WATER_Y, wrapDelta } from './terrain.js';
import { waterWaveGLSL } from './shoreline.js';
import { createMochiRunoff } from './mochi-runoff.js';
import { createJetContact } from './falling-water-contact.js';
import { createSplashPigment } from './splash-pigment.js';

// Each brushstroke has a dense outer belly and a pale crest on its inner edge.
// Building the two colours into a single ribbon keeps each impression one draw.
function ripplePlate(moving) {
  const points = [], colours = [], indices = [];
  const ink = new THREE.Color('#62736b'), crest = new THREE.Color('#ece6d5');
  function arc(start, end, rx, rz, z, width, phase) {
    const offset = points.length / 3;
    const count = 34;
    for (let i = 0; i <= count; i++) {
      const u = i / count, angle = start + (end - start) * u;
      const sx = Math.sin(angle), sz = Math.cos(angle);
      const bend = 1 + .018 * Math.sin(3 * angle + phase);
      const pressure = width * Math.sin(Math.PI * u) ** .68 * (.86 + .14 * Math.cos(4 * angle + phase));
      for (const edge of [-1, -.15, 1]) {
        points.push(sx * (rx * bend + edge * pressure), 0, z + sz * (rz * bend + edge * pressure));
        const colour = edge > 0 ? ink : crest;
        colours.push(colour.r, colour.g, colour.b);
      }
      if (i < count) {
        const k = offset + 3 * i;
        indices.push(k,k+1,k+3,k+1,k+4,k+3, k+1,k+2,k+4,k+2,k+5,k+4);
      }
    }
  }
  if (moving) {
    // The halves peel off the two flanks. The short, broken strokes behind
    // them describe the return of a paw or paddle through the surface.
    arc(.45,2.83,.91,1.12,-.10,.050,.4);
    arc(-2.75,-.39,.87,1.08,-.08,.047,2);
    arc(1.37,2.50,1.03,1.30,-.16,.023,.2);
    arc(-2.37,-1.58,.99,1.21,-.11,.024,1.8);
  } else {
    arc(-2.93,.43,.86,.79,0,.042,.6);
    arc(.78,2.95,.88,.80,.02,.034,1.6);
    arc(-.53,.77,1.01,.92,0,.020,.8);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(points, 3));
  geometry.setAttribute('color', new THREE.Float32BufferAttribute(colours, 3));
  geometry.setIndex(indices);
  return geometry;
}

export function createWake(scene) {
  const splash=createSplashPigment(scene), trace=createJetContact(), clock={value:0};
  const runoff=createMochiRunoff(scene);
  const lastJet=[-Infinity,-Infinity,-Infinity];
  let lastFrame=-Infinity,lastStep=-Infinity,previousWet=false,previousDepth=0;
  let previousVy=0,previousX=0,previousZ=0,side=-1;
  const still = ripplePlate(false), travelling = ripplePlate(true);
  const rings = Array.from({length: 7}, () => {
    const material = new THREE.MeshBasicMaterial({
      vertexColors: true, transparent: true, depthWrite: false, side: THREE.DoubleSide,
    });
    // The drawing is flat; front and back use the same translucent impression.
    material.forceSinglePass = true;
    const waveAmount={value:0};
    material.onBeforeCompile=shader=>{
      Object.assign(shader.uniforms,{wakeTime:clock,waveAmount});
      shader.vertexShader='uniform float wakeTime,waveAmount;\n'+waterWaveGLSL+'\n'+shader.vertexShader.replace(
        '#include <project_vertex>',`vec4 wp=modelMatrix*vec4(transformed,1.);
          vec2 q=mod(wp.xz+${BOUND.toFixed(1)},${(BOUND*2).toFixed(1)})-${BOUND.toFixed(1)};
          wp.y+=waveAmount*waveHeight(q,wakeTime);
          vec4 mvPosition=viewMatrix*wp;gl_Position=projectionMatrix*mvPosition;`);
    };
    const mesh = new THREE.Mesh(still, material);
    mesh.visible = false;
    mesh.renderOrder = 3;
    scene.add(mesh);
    return { mesh, waveAmount, born: -Infinity, strength: 0, span: 1, level: 0 };
  });
  let next = 0, last = -Infinity;
  return (p, t, body) => {
    clock.value=t;
    const dx=wrapDelta(p.x-previousX), dz=wrapDelta(p.z-previousZ);
    const discontinuity=t<lastFrame || t-lastFrame>1 || Math.hypot(dx,dz)>12;
    const bathing=p.activity==='bath', bath=bathing?p.bathPose:null;
    const movingFeet=p.speed>.3 && !p.skiff && Math.hypot(dx,dz)>.001;

    if(discontinuity){
      splash.clear();lastStep=-Infinity;lastJet.fill(-Infinity);
    }
    if(bathing || discontinuity){
      for(const ring of rings){ring.born=-Infinity;ring.mesh.visible=false;}
      last=-Infinity;
    }
    const x=bath?.x??p.x,z=bath?.z??p.z;
    const level=waterSurfaceAt(x,z,t,p.y),waves=level===WATER_Y;
    // Airborne feet cross the water before locomotion settles on the
    // swimming floor. This also keeps a fast dive to one displaced crown.
    const touching=p.inWater || !p.grounded && !p.skiff && p.y<level-.025 &&
      p.y>level-.80 && waterDepth(x,z,t,p.y)>.14;
    const wet=!p.skiff && (bath ? bath.wet && (touching || bath.settle>.48) : touching);
    const resurfaced=previousDepth>.05 && (p.diveDepth||0)<=.05;
    const giant=p.buffs?.full>0?1.25:1;
    if(!discontinuity && wet && (!previousWet || resurfaced)){
      const plunge=Math.max(0,-previousVy,-(p.vy||0));
      const depth=waterDepth(x,z,t,p.y),volume=.66+.34*Math.min(1,depth/.82);
      const energy=volume*Math.min(1.55,.12+plunge*.075+(p.speed||0)*.040+(resurfaced?.30:0));
      splash.hit(t,x,z,level,waves,p.vx||0,p.vz||0,energy,giant);
      lastStep=t;
    } else if(!discontinuity && wet && movingFeet && !bathing && !(p.diveDepth>.12) &&
          t-lastStep>Math.max(.17,.46-.030*p.speed)){
      side=-side;
      const heading=Math.atan2(p.vx,p.vz),immersion=Math.max(0,level-p.y);
      const energy=Math.min(.97,.06+p.speed*.089);
      const lateral=giant*(immersion>.35?.66:.41)*side;
      splash.hit(t,x+Math.cos(heading)*lateral,z-Math.sin(heading)*lateral,level,waves,
        p.vx,p.vz,energy,giant*(p.mount==='turtle'?1.20:p.mount==='bike'?.51:1),side);
      lastStep=t;
    }
    runoff.begin(t);
    trace(p,body,(point,normal,ray,width,floor,slot,surfaceY)=>{
      runoff.paint(point,normal,width,surfaceY);
      if(t-lastJet[slot]<.055)return;
      splash.deflect(t,point,normal,ray,width,floor);lastJet[slot]=t;
    });
    runoff.end();
    splash.update(p,t);
    lastFrame=t;previousWet=wet;previousDepth=p.diveDepth||0;previousVy=p.vy||0;
    previousX=p.x;previousZ=p.z;
    if(bathing)return;
    const moving = movingFeet;
    const interval = moving ? Math.max(.18, .33 - p.speed * .012) : 1.12;
    if (p.inWater && !p.diveDepth && t - last > interval) {
      const ring = rings[next];
      next = (next + 1) % rings.length;
      ring.born = last = t;
      ring.strength = Math.min(1, .4 + p.speed * .13);
      ring.span = p.mount === 'turtle' ? 1.35 : p.mount === 'bike' ? .63 : 1;
      ring.level = level;
      ring.waveAmount.value = Number(ring.level === WATER_Y);
      const heading = moving ? Math.atan2(p.vx, p.vz) : next * 2.4;
      const tail = moving ? ring.span * .36 : 0;
      ring.mesh.position.set(p.x - tail * Math.sin(heading), ring.level, p.z - tail * Math.cos(heading));
      ring.mesh.rotation.y = heading;
      ring.mesh.geometry = moving ? travelling : still;
    }
    for (const ring of rings) {
      const { mesh, born, strength, span } = ring;
      const age = (t - born) / 1.30;
      mesh.visible = age >= 0 && age < 1;
      if (!mesh.visible) continue;
      const at = mesh.position;
      at.x = p.x + wrapDelta(at.x - p.x);
      at.z = p.z + wrapDelta(at.z - p.z);
      at.y = ring.level + .032;
      mesh.scale.setScalar(span * (.68 + age * (1.05 + strength * .59)));
      mesh.material.opacity = (.35 + .42 * strength) * (1 - age) ** 1.45;
    }
  };
}
