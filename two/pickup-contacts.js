// Bodies of usable furniture follow the live inventory. The hot spring's pool
// and the space in front of each counter remain available for interaction.
import { wrapCoord, wrapDelta } from './terrain.js';

const table=[[0,0,.48,.32,0,.49]];
const moonTable=[[0,0,.66,.52,0,.78]];
const bath=[[-1.98,-1.1,.041,.041,0,2.13],[-.93,-1.1,.041,.041,0,2.13],
  [-1.455,-1.1,.66,.05,2.00,2.11],[1.64,-.60,.08,.08,0,.74]];
const port=[[-.82,-.25,.19,.16,0,1.67],[-.16,-.47,.10,.03,0,.44],[.47,-.47,.10,.03,0,.44]];
const bike=[[-.15,0,.14,.91,0,1.05],[.47,0,.14,.91,0,1.05]];

export function createPickupContacts(objects) {
  const cells=new Map(),key=(x,z)=>Math.floor(x/16)+','+Math.floor(z/16);
  for(const o of objects) {
    if(o.grand || o.retreat || o.goemon || o.type==='kyoTea' || o.type==='mitarashi')continue;
    const shapes=o.type==='port'?port:o.type==='onsen'?bath:o.type==='tsukimi'?moonTable:table;
    const fixture={o,shapes,c:Math.cos(o.heading),s:Math.sin(o.heading)};
    for(let i=-1;i<=1;i++)for(let j=-1;j<=1;j++){
      const k=key(wrapCoord(o.x+i*16),wrapCoord(o.z+j*16));
      if(!cells.has(k))cells.set(k,[]);
      cells.get(k).push(fixture);
    }
  }
  return (x,z,feet,height,radius)=>{
    let penetration=0;
    for(const {o,shapes,c,s} of cells.get(key(x,z))||[]){
      if(!o.active || feet>o.y+2.13 || feet+height<o.y)continue;
      const dx=wrapDelta(x-o.x), dz=wrapDelta(z-o.z);
      if(Math.abs(dx)>3+radius || Math.abs(dz)>3+radius)continue;
      const u=c*dx-s*dz,v=s*dx+c*dz;
      function touch([cx,cz,w,d,bottom,top],turn=0) {
        if(feet>=o.y+top || feet+height<=o.y+bottom)return;
        const a=u-cx,b=v-cz,cs=Math.cos(turn),sn=Math.sin(turn);
        const p=Math.abs(a*cs-b*sn)-w,q=Math.abs(a*sn+b*cs)-d;
        const signed=Math.hypot(Math.max(0,p),Math.max(0,q))+Math.min(Math.max(p,q),0);
        penetration=Math.max(penetration,radius-signed);
      }
      for(const shape of shapes)touch(shape);
      if(o.type==='port')for(let i=0;i<2 && i<o.bikes;i++)touch(bike[i],-.21);
    }
    return penetration;
  };
}
