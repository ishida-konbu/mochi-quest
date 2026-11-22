import * as THREE from './vendor/three.module.min.js';

// Feather the paper ground into the older roads as the traveller approaches.
import { SEAPORTS } from './seaport-layout.js';
import { DISTRICTS } from './geography.js';
import { KIYOMIZU } from './kiyomizu-layout.js';
const districts = [
  ...SEAPORTS.map(p=>[p.x,p.z,94,81]),
  [DISTRICTS.kyo.x,DISTRICTS.kyo.z-6,157,156],
  [KIYOMIZU.x-5,KIYOMIZU.z-12,59,65],
  [DISTRICTS.peach.x+24,DISTRICTS.peach.z-23,312,212],
  [DISTRICTS.ryugu.x+12,DISTRICTS.ryugu.z,94,66],
  [DISTRICTS.todaiji.x,DISTRICTS.todaiji.z,88,77],
  [DISTRICTS.inari.x-63,DISTRICTS.inari.z+113,304,210],
];
export function scrollCoverage(x,z) {
  const beyond=Math.max(Math.abs(x)/407,Math.abs(z)/420);
  let weight=.61*Math.min(1,Math.max(0,(beyond-.86)/.46));
  for(const [cx,cz,rx,rz] of districts) {
    const r=((x-cx)/rx)**2+((z-cz)/rz)**2;
    const t=Math.min(1,Math.max(0,(1.44-r)/.67));
    weight=Math.max(weight,t*t*(3-2*t));
  }
  return weight;
}

// A repeating ink plate with a separate impression for grass, rock and sand.
// Each blade swells under the brush and draws down to a hairline in one motion.
export function groundImpressions() {
  const canvas=document.createElement('canvas'), size=768;
  canvas.width=canvas.height=size;
  const ctx=canvas.getContext('2d');
  ctx.fillStyle='#000';ctx.fillRect(0,0,size,size);
  ctx.globalCompositeOperation='lighter';
  let seed=1300407;
  const rand=()=>(seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296;
  function stroke(x,y,dx,dy,bend,width) {
    const len=Math.hypot(dx,dy),nx=-dy/len,ny=dx/len;
    const mx=x+dx*.48+nx*bend,my=y+dy*.48+ny*bend;
    ctx.beginPath();ctx.moveTo(x,y);
    ctx.quadraticCurveTo(mx+nx*width,my+ny*width,x+dx,y+dy);
    ctx.quadraticCurveTo(mx-nx*width*.4,my-ny*width*.4,x,y);ctx.fill();
  }
  // Dry brush: the blades share a root and lean in a different wind per clump.
  for(let i=0;i<118;i++) {
    const x=18+rand()*(size-36),y=23+rand()*(size-46), lean=rand()*9-4;
    const density=90+Math.floor(rand()*125);
    ctx.fillStyle='rgb('+density+',0,0)';
    for(let j=0, count=3+Math.floor(rand()*5);j<count;j++) {
      const s=(j/(count-1)-.5);
      stroke(x+s*2,y+rand()*1.7,s*(10+rand()*13)+lean,-4-rand()*16,-s*8,1+rand());
    }
    stroke(x-6,y+2,13,rand()*2-1,1.7,.9);
  }
  // Cun brushwork: broken, branching strokes collect on the crags.
  for(let i=0;i<93;i++) {
    const x=28+rand()*(size-56),y=38+rand()*(size-76);
    ctx.fillStyle='rgb(0,'+(94+Math.floor(rand()*130))+',0)';
    for(let j=0, count=2+Math.floor(rand()*4);j<count;j++)
      stroke(x+3*j,y+rand()*7,8+rand()*13,-9-rand()*25,2+rand()*4,1.4+rand()*2.4);
  }
  // Small crescent ripples and pebbles for the submerged sand flats.
  for(let i=0;i<82;i++){
    const x=25+rand()*(size-50),y=16+rand()*(size-32),w=11+rand()*32;
    ctx.fillStyle='rgb(0,0,'+(80+Math.floor(rand()*125))+')';
    stroke(x-w/2,y,w,rand()*2-1,-2-rand()*3,1);
    stroke(x-w*.30,y+3,w*.52,.1,-1.5,.7);
  }
  const atlas=new THREE.CanvasTexture(canvas);
  atlas.wrapS=atlas.wrapT=THREE.RepeatWrapping;
  atlas.anisotropy=4;
  return atlas;
}
