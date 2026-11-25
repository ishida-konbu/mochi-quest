import { foundationMembers, addFoundationContacts } from './homestead-foundation.js';

export function buildContacts(structures) {
  const parts=[];
  for(const s of structures) {
    const add=(u,v,w,d,bottom,top,kind='wall',support=false,rise=0)=>{
      const c=Math.cos(s.yaw),sn=Math.sin(s.yaw);
      parts.push({x:s.x+u*c+v*sn,z:s.z-u*sn+v*c,yaw:s.yaw,w,d,
        bottom:s.y+bottom,top:s.y+top,kind,support,rise});
    };
    for(const member of foundationMembers(s.kind,s))addFoundationContacts(add,member);
    switch(s.kind) {
      case 'camp':
        if(!s.parentId)add(-.78,-.72,.11,.11,-.2,1.79,'oval');
        add(0,.11,1.13,1.72,.018,.13,'floor',true);
        add(0,-.54,1.0,.26,.12,.396);
        break;
      case 'floor':
        add(0,0,3.2,2.8,-.02,.18,'floor',true);
        break;
      case 'posts':
        for(const u of [-1.44,1.44])for(const v of [-1.23,1.23])add(u,v,.13,.13,.18,2.30);
        for(const v of [-1.23,1.23])add(0,v,3.13,.14,2.1475,2.2525,'slab',true);
        for(const u of [-1.44,1.44])add(u,0,.14,2.62,2.22,2.32,'slab',true);
        break;
      case 'wall':
        add(0,-1.23,2.75,.13,.18,2.23);
        break;
      case 'roof':
        add(0,0,3.7,3.3,2.10,2.23,'roof',true,s.terrain==='snow'?1.16:.8);
        for(const u of [-1.44,0,1.44]){
          add(u,0,.105,2.72,2.2225,2.3275,'slab',true);
          add(u,0,.1,.112,2.30,(s.terrain==='snow'?3.39:3.03)-.12);
        }
        break;
      case 'fence':
        add(0,0,1.74,.075,-.20,.96);
        for(const u of [-.84,.84])add(u,0,.105,.105,-.30,1.12,'oval');
        break;
      case 'chest':
        add(0,0,1.12,.70,-.12,.8);
        break;
      case 'stand':
        add(0,-.035,1.72,.86,-.25,.88);
        for(const u of [-.75,.75])for(const v of [-.38,.33])add(u,v,.10,.10,.82,v<0?2.06:1.99);
        add(0,0,1.78,1.08,1.94,2.04,'slab',true);
        break;
    }
  }
  return parts;
}

// The framing can be attached while its builder stands on the floor. Check the
// actual post, sill or sloping sheet, leaving the clear interior usable.
export function frameTouchesPlayer(part,player) {
  if(!player)return false;
  const size=player.buffs?.full>0?1.28:1, radius=size>1?.33:.26;
  const feet=player.y, head=feet+(1.66+1.07*(player.airStretch||0))*size;
  const c=Math.cos(part.yaw), s=Math.sin(part.yaw);
  const dx=player.x-part.x,dz=player.z-part.z;
  const u=Math.abs(dx*c-dz*s),v=Math.abs(dx*s+dz*c);
  if(Math.hypot(Math.max(0,u-part.w/2),Math.max(0,v-part.d/2))>=radius)return false;
  if(part.kind==='roof') {
    const heightAt=d=>part.top+part.rise*Math.max(0,1-d/(part.d/2));
    return feet<heightAt(Math.max(0,v-radius)) && head>heightAt(v+radius)-.13;
  }
  return feet<part.top && head>part.bottom;
}
