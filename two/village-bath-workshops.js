import * as T from './vendor/three.module.min.js';
import { RETREATS, sitePoint } from './retreat-layout.js';
import { bathEnclosure } from './bath-enclosures.js';
import { waterSurfaceAt,wrapDelta } from './terrain.js';
import { roofProfile } from './architecture.js';
import { sculpture } from './pilgrimage-pigment.js';
import { scrollPigment } from './kyo-scrollwork.js';
import { surface,rod,dab } from './village-bath-figures.js';
import { villageBathPainting } from './village-bath-paintings.js';
import { addVillageYard } from './village-bath-yards.js';
import { addVillageTrade } from './village-workshop-crafts.js';
import { isVillageWorkshop,villageFrames } from './village-workshop-plan.js';

const {sin,cos,PI}=Math,tau=2*PI;
const materials={
  sakura:['#5f5145','#a88b70','#9e8866','#c8b58b'],
  bamboo:['#716f4d','#a8a775','#83835b','#c5bd8a'],
  earthen:['#584d43','#9b8063','#535c5c','#909088'],
  sulfur:['#6e5e4d','#a59a7c','#787669','#b5ab91'],
  paddy:['#756246','#ae9a70','#9e895e','#cbb380'],
  shore:['#665c50','#998976','#786e5e','#b0a38e'],
  maple:['#724f40','#ad8665','#776956','#aa9375'],
  susuki:['#695b49','#a59476','#8b8068','#baac8c'],
};
function stroke(s,tone,fn,r,n=16){
  const pts=Array.from({length:n+1},(_,i)=>fn(i/n));
  s.stroke(tone,pts,pts.map(()=>r),n);
}
function beam(s,shade,a,b,w,d=w){
  const start=new T.Vector3(...a),end=new T.Vector3(...b),axis=end.clone().sub(start),len=axis.length();
  const q=new T.Quaternion().setFromUnitVectors(new T.Vector3(0,1,0),axis.normalize());
  const e=new T.Euler().setFromQuaternion(q,'YXZ'),m=start.lerp(end,.5);
  s.box(shade,m.x,m.y,m.z,w,len,d,e.x,e.y,e.z);
}
function plankDeck(s,r,k){
  const {w,d}=r,[dark,wood]=materials[k],board=k==='earthen'?.31:.21;
  s.box(k==='earthen'?'#807e71':'#6d6454',0,-.16,0,w+.15,.55,d+.18);
  const n=Math.round(w/board);
  const brown=new T.Color(wood);
  for(let j=0;j<n;j++){
    const px=(j+.5)*w/n-w/2;
    s.box(brown.clone().multiplyScalar(.84+.17*(.5+.5*cos(j*1.762))),px,.136,0,w/n-.009,.073,d+.14);
    for(const side of [-1,1])dab(s,dark,px+w/n*.31,.174,side*(d/2-.05),.011,.005,.011);
  }
  s.box(dark,0,.085,d/2+.079,w+.10,.083,.055);
}
function timberFrame(s,r,k){
  const {w,d,eave}=r,[dark,wood]=materials[k],round=['bamboo','susuki'].includes(k);
  for(const side of [-1,1])for(const end of [-1,1]){
    const x=side*w/2,z=end*d/2;
    dab(s,'#949383',x,.118,z,.195,.128,.187);
    if(round){
      s.post(wood,x,eave/2+.095,z,.106,eave-.15,.11);
      for(let i=1;i<=5;i++)s.post(dark,x,eave*i/6,z,.115,.026,.116);
    }else{
      s.box(dark,x,eave*.52,z,.178,eave-.12,.173);
      s.box(wood,x-side*.092,eave*.57,z,.023,eave*.71,.108);
    }
    beam(s,dark,[x,eave-.49,z],[x-.44*side,eave-.135,z],.105,.100);
  }
  for(const side of [-1,1]){
    const z=side*d/2;
    s.box(dark,0,eave-.14,z,w+.28,.21,.20);
    s.box(wood,0,eave-.07,z+side*.11,w+.31,.056,.040);
    s.box(dark,side*w/2,eave-.14,0,.17,.17,d+.27);
  }
}
function sideSlats(s,r,k){
  const [dark,wood]=materials[k], {w,d,eave}=r;
  for(const side of [-1,1]){
    const x=side*w/2;
    const high=k==='maple'?.85:k==='shore'?1.10:k==='susuki'?1.27:eave-.31;
    if(k==='bamboo'){
      for(let i=0;i<16;i++){
        const z=-d/2+(i+.5)*d/16,rr=.035+(i%3)*.002;
        s.post(i%3===0?'#8f8960':'#a5a178',x,high/2+.11,z,rr,high-.16,rr);
        for(const y of [.57,1.36,2.04])s.post(dark,x,y+(i%3)*.046,z,rr*1.12,.025,rr*1.12);
      }
      for(const y of [.50,1.32,2.13])s.box(dark,x+.027*side,y,0,.069,.065,d);
    }else if(k==='earthen'){
      s.box('#d4c8b1',x,high/2+.065,0,.127,high-.08,d);
      const n=10;
      for(let j=0;j<n;j++)s.box(j%2?'#74695b':'#857768',x+side*.075,.56,(j+.5)*d/n-d/2,.056,.79,d/n-.012);
      s.box(dark,x+side*.088,1.01,0,.097,.069,d);
      s.box(wood,x+side*.085,2.02,0,.069,.056,d);
    }else if(k==='sulfur'){
      for(let j=0;j<8;j++){
        const y=.28+(high-.27)*j/8;
        s.box(j%2?wood:'#8a8069',x,y,0,.09,(high-.27)/8*.91,d,0,0,side*.31);
      }
    }else{
      const n=Math.round(d/.17);
      for(let j=0;j<n;j++)s.box(j%3===0?dark:wood,x,.12+high/2,(j+.5)*d/n-d/2,.086,high-.17,d/n*.91);
      s.box(dark,x,high,0,.128,.089,d);
      if(high<eave-1){
        for(let j=1;j<5;j++)
          s.box(wood,x,(eave+high)/2,(j/5-.5)*d,.032,eave-high-.30,.034);
      }
    }
  }
}
function arcWindow(s,r){
  const z=-r.d/2,x=r.w*.239,y=1.46,radius=.92,h=r.eave-.22;
  const shape=new T.Shape();
  shape.moveTo(-r.w/2,.18);shape.lineTo(r.w/2,.18);shape.lineTo(r.w/2,h);shape.lineTo(-r.w/2,h);shape.closePath();
  const hole=new T.Path();hole.absarc(x,y,radius,0,tau,true);shape.holes.push(hole);
  s.add(new T.ExtrudeGeometry(shape,{depth:.091,bevelEnabled:false,curveSegments:42}),'#b9ab8f',0,0,z-.034);
  for(const rr of [radius,radius+.102])stroke(s,rr===radius?'#675947':'#8d785c',t=>[x+rr*cos(t*tau),y+rr*sin(t*tau),z+.068],rr===radius?.044:.026,54);
  for(const dx of [-.51,0,.51]){
    const dy=Math.sqrt(radius**2-dx**2);
    s.box('#87765b',x+dx,y,z+.013,.032,2*dy,.045);
  }
  s.box('#968366',x,y-.36,z+.005,2*Math.sqrt(radius**2-.36**2),.028,.032);
}
function rearWall(s,r,k){
  const {w,d,eave}=r,[dark,wood]=materials[k],z=-d/2,h=eave-.22;
  if(k==='susuki'){arcWindow(s,r);return;}
  if(k==='earthen'){
    s.box('#c9bba4',0,(h+.18)/2,z,w,h-.18,.12);
    for(const px of [-w*.36,-w*.27,w*.30,w*.39])
      s.box(dark,px,1.42,z+.073,.041,2.33,.051);
    s.box(wood,0,.46,z+.080,w,.17,.071);
    return;
  }
  if(k==='bamboo'||k==='paddy'){
    s.box(k==='paddy'?'#8b7b5f':'#8f8c66',0,h*.52,z-.035,w,h-.16,.056);
    const pitch=k==='paddy'?.14:.094;
    for(let j=0;j<Math.ceil(w/pitch);j++){
      const px=-w/2+(j+.5)*pitch;
      s.post(j%3?wood:dark,px,h*.53,z+.026,.025+(j%2)*.010,h-.19,.029);
    }
    for(const y of [.39,.99,1.60,2.21])
      s.box(dark,0,y,z+.059,w,.042,.056);
    return;
  }
  if(k==='maple'){
    const n=14;
    for(let j=0;j<n;j++){
      const ht=(h-.16)/n;
      s.box(j%2?wood:'#94745a',0,.17+(j+.5)*ht,z,w+.13*(j%2),ht*.99,.14,0,0,0);
      s.box(dark,0,.166+(j+.09)*ht,z+.077,w+.07,ht*.16,.025);
    }
    return;
  }
  const n=Math.ceil(w/.237),brown=new T.Color(wood);
  for(let j=0;j<n;j++){
    const x=-w/2+(j+.5)*w/n,top=(k==='sulfur'?h-.48:h);
    s.box(brown.clone().multiplyScalar(.79+.22*(.5+.5*sin(j*3.64))),x,(top+.15)/2,z,w/n-.012,top-.15,.11);
  }
  if(k==='sulfur')for(let j=0;j<4;j++)
    s.box(wood,0,h-.4+j*.115,z,w,.087,.109,.34);
  else s.box(dark,0,.90,z+.075,w,.098,.047);
}
function roof(s,r,plan,k,distant=false){
  const {eave,rise}=r,[dark,wood,shade,washed]=materials[k],halfW=(r.w+.66)/2,halfD=(r.d+.65)/2;
  const hip=plan.roof==='hip',tile=k==='earthen',cane=k==='bamboo',straw=k==='susuki'||k==='paddy';
  const cols=tile?174:cane?128:straw?140:104,rows=tile?32:straw?26:22;
  const gutter=t=>hip?1:.86+.14*t;
  const patch=(u,t,side)=>{
    const norm=(2*u-1)*gutter(t),z=side*t,p=roofProfile(hip?'hip':'gable',norm,z);
    const x=(2*u-1)*halfW*gutter(t),ridge=Math.cos(u*tau*(tile?29:cane?32:35));
    const strawGrain=.010*sin(u*503+t*2.2)+.014*cos(u*277+.7*sin(t*4+u*27));
    const scale=tile?.033*(.5+.5*ridge)**2+.012*Math.cos(t*tau*7):cane?.033*ridge:
      straw?strawGrain+.018*sin(t*tau*6+.82*sin(u*49)):.008*cos(u*tau*26+.19*sin(4*t));
    return [x,eave+rise*p+scale,halfD*z];
  };
  const colA=new T.Color(shade),colB=new T.Color(washed);
  const color=(u,t)=>{
    const rib=cos(u*tau*(tile?29:cane?32:straw?35:26)),age=.13*cos(u*36+.56*sin(t*7))+.09*cos(9*t+13*u);
    const band=tile?.10*cos(t*tau*7):straw?.12*(1-t)**2:.16*cos(t*tau*6+.7*sin(2*u*PI));
    const grain=straw?.10*sin(493*u+1.7*t)+.10*cos(271*u+.65*sin(11*t+u*19))+.06*cos(5*u-76*t):
      tile||cane?.23*rib:.07*rib+.08*sin(u*170+t*2.2);
    return colA.clone().lerp(colB,.40+grain+age+band);
  };
  for(const side of [-1,1]){
    if(distant){
      s.add(surface(24,9,(u,v)=>patch(u,v,side),color),'#fff');
      continue;
    }
    s.add(surface(cols,rows,(u,v)=>patch(u,v,side),color),'#fff');
    s.add(surface(60,1,(u,v)=>{const p=patch(u,1,side);p[1]-=v*(straw?.20:cane?.12:.095);return p;}),straw?'#897551':dark);
    s.add(surface(26,10,(u,v)=>{const p=patch(u,v,side);p[1]-=straw?.2:.10;return p;}),dark);
    for(const u of [0,1])s.add(surface(2,24,(j,v)=>{const p=patch(u,v,side);p[1]-=j*(straw?.2:.10);return p;}),wood);
    if(straw){
      // Overlapping handfuls of reed flatten into each course. Wide, soft
      // sweeps of straw end in a finely broken fringe instead of a sawn edge.
      for(let row=0;row<5;row++){
        const n=23;
        for(let j=0;j<n;j++){
          const start=(j+.033)/n,end=(j+.96)/n;
          const jitter=.017*sin(j*3.3+row*4);
          const strawLayer=(u,v)=>{
            const pu=start+(end-start)*u,t=Math.max(0,Math.min(1,(row+.12+.91*v)/5+jitter*(.35+.65*v)));
            const pt=patch(pu,t,side);
            pt[1]+=.016+.034*v*v+.014*cos(u*17*PI+row)*v;
            pt[2]+=side*(.027+.043*v)*v;
            return pt;
          };
          s.add(surface(6,3,strawLayer,(u,v)=>colA.clone().lerp(colB,
            .28+.20*sin(17*u+j+row)+.15*cos(j*1.3+row*1.69)+.08*v)),'#fff');
          if(row===4)for(let i=0;i<3;i++){
            const u=(i+.37)/3.2,tip=strawLayer(u,.995);
            rod(s,i%2?washed:shade,[tip[0],tip[1]-.003,tip[2]-.035*side],[tip[0]+.018*cos(j+i),tip[1]-.07-.088*(.5+.5*sin(j*3.2+i)),tip[2]+.013*side],.016,.006);
          }
        }
      }
    }else if(cane||tile){
      for(let j=0;j<(tile?29:32);j++){
        const x=halfW*(j/(tile?14.5:16)-1),y=patch(j/(tile?29:32),1,side)[1]-.019;
        s.post(cane?'#b1a573':'#747a70',x,y,halfD*side+.026*side,cane?.046:.067,.069,cane?.046:.067,PI/2);
        s.post(cane?'#635f48':'#535750',x,y,(halfD+.062)*side,cane?.030:.045,.008,cane?.030:.045,PI/2);
        if(tile){
          for(let n=0;n<3;n++)dab(s,'#97998b',x+.022*cos(n*tau/3),y+.022*sin(n*tau/3),(halfD+.071)*side,.013,.013,.006);
        }
      }
    }else{
      // Bark and shakes break joints from one course to the next.
      for(let j=1;j<=5;j++){
        const t=j/5;
        stroke(s,shade,u=>{const p=patch(u,t,side);p[1]+=.028;return p;},.025,20);
        if(k!=='maple' && j%2){
          for(let i=0;i<5;i++){
            const u=.10+.20*i+.020*sin(i+j),p=patch(u,t*.95,side);
            dab(s,k==='sulfur'?'#9e9987':'#89867a',p[0],p[1]+.073,p[2],.13,.075,.102);
          }
        }
        for(let i=0;i<12;i++){
          const u=(i+.3+.33*(j%2))/12,start=patch(u,(j-1)/5+.015,side),end=patch(u,t,side);
          beam(s,dark,start,end,.017,.017);
        }
      }
    }
    // Exposed rafters meet the purlin instead of hanging in mid-air.
    for(let j=0;j<12;j++){
      const u=(j+.5)/12;
      stroke(s,wood,t=>{const p=patch(u,t,side);p[1]-=straw?.239:.14;return p;},.045,8);
    }
  }
  const ridgeLen=halfW*(hip?.46:.86);
  beam(s,dark,[-ridgeLen-.07,eave+rise+.031,0],[ridgeLen+.07,eave+rise+.031,0],.13,straw?.29:.19);
  if(distant)return;
  if(straw){
    const rolls=k==='susuki'?9:13;
    for(let j=0;j<rolls;j++){
      const x=ridgeLen*((j+.5)*2/rolls-1),width=2*ridgeLen/rolls;
      s.post(j%3?shade:washed,x,eave+rise+.085,0,.118,width+.004,.15,0,0,PI/2);
      if(j%2===0)for(const side of [-1,1])rod(s,wood,[x-.047,eave+rise+.225,.025*side],[x+.035,eave+rise-.075,.21*side],.023);
    }
  }
  if(cane){
    for(const sgn of [-1,1]){
      const x=sgn*ridgeLen*.83;
      for(const side of [-1,1])beam(s,wood,[x,eave+rise-.24,.33*side],[x,eave+rise+.47,-.31*side],.064,.111);
      rod(s,dark,[x-.12,eave+rise+.11,0],[x+.12,eave+rise+.11,0],.033);
    }
  }
  if(!hip)for(const end of [-1,1]){
    const x=end*(halfW*.84);
    const half=halfD*.78;
    for(const d of [-1,1])beam(s,dark,[x,eave-.09,half*d],[x,eave+rise-.09,0],.079,.088);
    for(let j=-4;j<=4;j++){
      const z=j*half/5,top=eave+(1-Math.abs(z)/half)**1.52*rise;
      s.box(j%2?wood:dark,x,(top+eave)/2,z,.066,Math.max(.06,top-eave-.047),Math.max(.045,half*.13));
    }
  }
  if(tile){
    // Shuttered high-level steam vent of the kura, capped in fired tile.
    const top=eave+rise,span=r.w*.50;
    s.box('#807362',0,top+.19,0,span,.43,.74);
    for(let j=-8;j<=8;j++)s.box(dark,j*span/17,top+.22,.378,.076,.32,.055);
    for(const sign of [-1,1])s.add(surface(52,10,(u,t)=>[(u-.5)*(span+.55),top+.41+.43*roofProfile('gable',(u*2-1)*gutter(t),t),sign*.65*t],(u,v)=>colA.clone().lerp(colB,.36+.20*cos(u*tau*13))),'#fff');
    s.box(shade,0,top+.86,0,span*.95,.08,.17);
  }
}
function paintingMount(s,r,k){
  const f=villageFrames[k],z=-r.d/2+.133,height=f.w/1.78,shadow='#655943';
  const x=f.x,y=f.y;
  if(f.style==='roll'){
    s.box('#a8a58b',x,y,z,f.w+.12,height+.33,.052);
    for(const side of [-1,1]){
      const dy=(height/2+.15)*side;
      rod(s,'#6d6854',[x-f.w/2-.13,y+dy,z+.029],[x+f.w/2+.13,y+dy,z+.029],.039);
    }
  }else{
    s.box(shadow,x,y,z,f.w+.14,height+.13,.079);
    s.box(f.style==='plaster'?'#baaa8b':'#ab9876',x,y,z+.043,f.w+.059,height+.068,.028);
    if(f.style==='shutter')for(const side of [-1,1])for(const j of [-1,1]){
      s.box('#706c5b',x+side*(f.w/2+.061),y+j*height*.28,z+.050,.18,.046,.029);
      dab(s,'#b2a588',x+side*(f.w/2+.11),y+j*height*.28,z+.067,.013,.013,.006);
    }
  }
}
export function villageWorkshopGeometry(site,distant=false){
  const plan=bathEnclosure(site),r=plan.room,k=site.kind,s=sculpture();
  if(distant){
    const [dark,wood]=materials[k];
    s.box(wood,0,.03,0,r.w+.15,.28,r.d+.15);
    if(k==='susuki')arcWindow(s,r);
    else s.box(k==='earthen'?'#c9bba4':wood,0,r.eave*.49,-r.d/2,r.w,r.eave*.93,.10);
    for(const side of [-1,1]){
      s.box(wood,side*r.w/2,r.eave*.54,r.d/2,.15,r.eave-.11,.15);
      s.box(dark,side*r.w/2,.76,0,.11,1.35,r.d);
    }
    roof(s,r,plan,k,true);
    return s.finish();
  }
  plankDeck(s,r,k);
  sideSlats(s,r,k);rearWall(s,r,k);timberFrame(s,r,k);
  roof(s,r,plan,k);addVillageTrade(s,k,r);paintingMount(s,r,k);
  addVillageYard(s,site,plan);
  return s.finish();
}
export function createVillageWorkshops(scene){
  const sites=RETREATS.filter(isVillageWorkshop).map(site=>{
    const room=bathEnclosure(site).room;
    const [x,z]=sitePoint(site,room.u,room.v);
    return {site,room,x,z,y:waterSurfaceAt(site.x,site.z),group:null};
  });
  return player=>{
    for(const court of sites){
      const {x,z,site,room}=court,dx=wrapDelta(x-player.x),dz=wrapDelta(z-player.z);
      const range=dx*dx+dz*dz;
      if(range>380**2){if(court.group)court.group.visible=false;continue;}
      if(!court.group){
        court.group=new T.Group();
        court.group.name=site.name+'の湯屋';court.group.rotation.y=site.yaw;
        court.skyline=new T.Mesh(villageWorkshopGeometry(site,true),scrollPigment());
        court.group.add(court.skyline);scene.add(court.group);
      }
      const close=range<=135**2;
      if(close&&!court.details){
        court.details=new T.Group();
        const building=new T.Mesh(villageWorkshopGeometry(site),scrollPigment());
        building.receiveShadow=building.castShadow=true;court.details.add(building);
        const frame=villageFrames[site.kind];
        const painting=new T.Mesh(new T.PlaneGeometry(frame.w,frame.w/1.78),villageBathPainting(site.kind));
        painting.position.set(frame.x,frame.y,-room.d/2+.210);
        court.details.add(painting);court.group.add(court.details);
      }
      court.skyline.visible=!close;
      if(court.details)court.details.visible=close;
      court.group.position.set(player.x+dx,court.y,player.z+dz);
      court.group.visible=true;
    }
  };
}
