import { tablePlan } from './story-table-plan.js';
import { wrapWorld } from './geography.js';

// Width of the torso, fore-aft reach of its body, bottom and top. Leave space
// around ears, sleeves, tails, the crane's bill and hand-held work implements.
const bodies = {
  '兎':[.32,.38,.03,1.62], '蛙':[.38,.35,.03,1.35], '老蛙':[.39,.40,.02,1.23],
  '亀':[.66,.90,.04,.90], '猪':[.42,.91,.03,1.29], '猿':[.32,.39,.03,1.46],
  '鹿':[.31,.76,.03,1.82], '牛':[.44,1.06,.03,1.89], '象':[.56,1.12,.03,2.03],
  '老婆餅':[.49,.36,.01,1.02], '僧侶餅':[.49,.36,.01,1.02],
  '鶏':[.20,.37,.02,.91], '丹頂':[.18,.32,.02,1.59], '狐':[.30,.60,.02,1.17],
  '蛸':[.59,.55,.20,1.65], '鯛':[.39,.67,.48,1.83], '海亀':[.52,.55,.16,1.55],
  '魚人':[.34,.31,.05,2.13],
};

function rectangle(u, v, w, d) {
  const a = Math.abs(u) - w, b = Math.abs(v) - d;
  return Math.hypot(Math.max(0,a), Math.max(0,b)) + Math.min(0,Math.max(a,b));
}

function structuralDistance(parts,u,v,bottom,top,radius) {
  let best=Infinity;
  for(const q of parts) {
    if(q.minRadius && radius<q.minRadius)continue;
    if(q.type==='slab'){
      if(bottom>=q.y+q.h*.5 || top<=q.y-q.h*.5)continue;
      let inside=false,distance=Infinity;
      for(let i=0,j=q.outline.length-1;i<q.outline.length;j=i++){
        const [ax,az]=q.outline[i],[bx,bz]=q.outline[j],dx=bx-ax,dz=bz-az;
        if((az>v)!==(bz>v) && u<ax+dx*(v-az)/dz)inside=!inside;
        const t=Math.min(1,Math.max(0,((u-ax)*dx+(v-az)*dz)/(dx*dx+dz*dz)));
        distance=Math.min(distance,Math.hypot(u-ax-t*dx,v-az-t*dz));
      }
      best=Math.min(best,inside?-distance:distance);continue;
    }
    if(q.type==='box') {
      if(bottom<q.y+q.h*.5 && top>q.y-q.h*.5)
        best=Math.min(best,rectangle(u-q.x,v-q.z,q.w*.5,q.d*.5));
      continue;
    }
    const [ax,ay,az]=q.a, [bx,by,bz]=q.b, dy=by-ay;
    if(bottom>=Math.max(ay,by)+q.r || top<=Math.min(ay,by)-q.r)continue;
    let lo=0,hi=1;
    if(Math.abs(dy)>.00001){
      const e=(bottom-q.r-ay)/dy, f=(top+q.r-ay)/dy;
      lo=Math.max(0,Math.min(e,f));hi=Math.min(1,Math.max(e,f));
    }
    const dx=bx-ax,dz=bz-az,lengthSq=dx*dx+dz*dz;
    const t=lengthSq?Math.min(hi,Math.max(lo,((u-ax)*dx+(v-az)*dz)/lengthSq)):lo;
    best=Math.min(best,Math.hypot(u-ax-dx*t,v-az-dz*t)-q.r);
  }
  return best;
}

export function createStoryCollisions() {
  let nearby = [], pose = 0;
  return {
    posed() { pose++; },
    update(fixtures) {
      pose++;
      nearby = fixtures.map(f => ({...f, co:Math.cos(f.yaw || 0), si:Math.sin(f.yaw || 0),
        parts:f.kind==='table' ? tablePlan(f.number,f.place).contacts : null, body:bodies[f.species] || bodies['兎']}));
    },
    penetration(x, z, feet, height, radius, contact) {
      let depth = 0;
      if (contact) contact.person = null;
      for (const f of nearby) {
        const origin=f.model?.position || f;
        const bottom = feet-origin.y, top = bottom+height;

        const dx=wrapWorld(x-origin.x), dz=wrapWorld(z-origin.z);
        if (f.modelContact && Math.abs(dx)<5+radius && Math.abs(dz)<5+radius && top>-.5 && bottom<5) {
          const modelDepth=f.modelContact(origin.x+dx,origin.z+dz,feet,height,radius,pose);
          if (modelDepth>depth) {
            depth=modelDepth;
            if (contact) contact.person=f.kind==='person' ? f.name : null;
          }
          if (f.kind==='person') continue;
        }
        if (f.kind==='stand')continue;
        if (top<=0 || bottom>=2.25 || Math.abs(dx)>1.65+radius || Math.abs(dz)>1.65+radius) continue;
        const u=dx*f.co-dz*f.si, v=dz*f.co+dx*f.si;
        let signed;
        if (f.kind==='table') {
          signed=structuralDistance(f.parts,u,v,bottom,top,radius);
        } else {
          const [w,d,lo,hi]=f.body;
          if (bottom>=hi || top<=lo) continue;
          // A capsule has a rounded end where an approaching walker should
          // slide past, and a continuous escape gradient for restored saves.
          const r=Math.min(w,d);
          signed=Math.hypot(Math.max(0,Math.abs(u)-(w-r)),Math.max(0,Math.abs(v)-(d-r)))-r;
        }
        if (contact && radius-signed>depth) contact.person=f.kind==='person' ? f.name : null;
        depth=Math.max(depth,radius-signed);
      }
      return depth;
    },
  };
}
