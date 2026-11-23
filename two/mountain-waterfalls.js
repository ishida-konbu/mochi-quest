import * as T from './vendor/three.module.min.js';
import { KAEDE_SEEP, MOUNTAIN_STREAMS, mountainStreamWaterAt, waterfallSurface } from './mountain-streams.js';
import { terrainMeshHeight, terrainHeight, seeded, wrapDelta } from './terrain.js';
import { currentPigment, cragPigment, kaedeCragPigment, sprayPigment } from './cascade-pigments.js';
import { carveKaedeRock } from './kaede-bedrock.js';

const {sin,cos,PI,hypot}=Math;
const mix=(a,b,t)=>a+(b-a)*t;
const unit=t=>Math.min(1,Math.max(0,t));
const smooth=t=>(t=unit(t))*t*(3-2*t);
const styles={
  'kaede-spring':{splits:[-1,-.76,-.17,.56,1],notch:.039,spray:180,seed:7631,spring:true},
  maple:{splits:[-1,-.42,.37,1],notch:.116,apron:3.4,spray:145,seed:762},
  sakura:{splits:[-1,-.75,-.27,.17,.72,1],notch:.081,apron:2.3,spray:95,seed:146},
  peach:{splits:[-1,-.49,.57,1],notch:.117,apron:4.9,spray:185,seed:914},
};

function surfaceGeometry(stream,style){
  const {stations,lipIndex,toeIndex,fall:{lip,toe}}=stream;
  const xyz=[],flow=[],indices=[];
  const lengths=[0];
  for(let i=1;i<stations.length;i++){
    const a=stations[i-1],b=stations[i];
    lengths.push(lengths[i-1]+hypot(b.x-a.x,b.y-a.y,b.z-a.z));
  }
  function point(x,y,z,u,s,fall,fade){
    xyz.push(x-lip.x,y-lip.y,z-lip.z);
    flow.push(u,s,fall,fade);
  }
  function quad(row,width){
    for(let i=0;i<width;i++){
      const a=row+i,b=a+width+1;
      indices.push(a,b,a+1,a+1,b,b+1);
    }
  }
  function channel(start,end){
    const cols=14;
    for(let i=start;i<=end;i++){
      const a=stations[i],row=xyz.length/3;
      function waterEdge(side){
        if(i===lipIndex || i===toeIndex)return a.width;
        const reach=a.width+Math.min(2.6,a.width*.72);
        for(let r=a.width*.80;r<reach;r+=.14){
          const x=a.x+r*side*a.nx,z=a.z+r*side*a.nz;
          if(Math.max(terrainMeshHeight(x,z),terrainHeight(x,z))>a.y+.055)return r;
        }
        return reach;
      }
      const left=waterEdge(-1),right=waterEdge(1);
      for(let j=0;j<=cols;j++){
        const u=2*j/cols-1;
        const extent=u<0?left:right;
        const fade=(i===0||i===stations.length-1?.14:1)*smooth((1-Math.abs(u))/.10);
        point(a.x+u*extent*a.nx,a.y+.028,a.z+u*extent*a.nz,u,lengths[i]-lengths[lipIndex],i===lipIndex?.23:0,fade);
      }
      if(i<end)quad(row,cols);
    }
  }
  channel(0,lipIndex);
  if(style.spring){
    // Two thin rills issue from one bedding plane. Their first vertices are
    // inside the stone and their last ones submerge in the spring head.
    const vent=KAEDE_SEEP;
    for(const [offset,radius] of [[0,.106],[-.31,.044]]){
      const rows=18,cols=12;
      for(let j=0;j<=rows;j++){
        const t=j/rows,row=xyz.length/3;
        for(let k=0;k<=cols;k++){
          const angle=2*PI*k/cols,r=radius*(1-.32*t)*(1+.077*cos(3*angle+t*3));
          const tilt=Math.atan2(2*t*(vent.y-vent.landY),Math.hypot(vent.landX-vent.x,vent.landZ-vent.z));
          const up=r*sin(angle),side=r*cos(angle);
          point(mix(vent.x,vent.landX,t)+up*sin(tilt),mix(vent.y,vent.landY-.06,t*t)+up*cos(tilt),
            mix(vent.z,vent.landZ,t)+offset+side+.025*sin(PI*t),k/cols,t*1.4,2,
            1-.72*smooth((t-.85)/.15));
        }
        if(j<rows)quad(row,cols);
      }
    }
  }
  const dx=toe.x-lip.x,dz=toe.z-lip.z,run=hypot(dx,dz),drop=lip.y-toe.y,face={};
  const rows=Math.ceil(drop*1.5)+9;
  // Each ribbon leaves the same rounded crest and peels away at its own seam.
  // In profile, the travelling sheet projects in front of the undercut scarp.
  for(let k=0;k<style.splits.length-1;k++){
    const left=style.splits[k],right=style.splits[k+1],cols=Math.ceil((right-left)*14);
    for(let j=0;j<=rows;j++){
      const v=j/rows,bow=sin(PI*v),row=xyz.length/3;
      for(let i=0;i<=cols;i++){
        const f=i/cols,opening=style.notch*bow**.72*(.56+.31*sin(v*11+k)+.13*cos(v*21-3*k));
        const seam=(u,j)=>u+bow*(.072*sin(v*8.2+j*2.21)+.023*sin(v*19+3*j));
        const u=mix(seam(left,k)+(k?opening:0),seam(right,k+1)-(k<style.splits.length-2?opening:0),f);
        const rag=sin(3*k+.92*i)+.54*sin(1.7*i+5.4*v+k);
        waterfallSurface(stream,u,v,face);
        point(face.x+bow*.027*rag*face.nx,face.y+.055*bow*sin(u*13+.32*j),face.z+bow*.027*rag*face.nz,
          u,mix(0,lengths[toeIndex]-lengths[lipIndex],v),.23+.77*Math.min(1,v*8),1);
      }
      if(j<rows)quad(row,cols);
    }
  }
  // A river-fed basin shares the receiving water sheet all the way to the
  // falling curtain. Only elevated pools need their own surface and outlet.
  if(!stream.riverPool){
    const cols=16,coveRows=6;
    for(let j=0;j<=coveRows;j++){
      const t=j/coveRows,row=xyz.length/3;
      for(let i=0;i<=cols;i++){
        const u=2*i/cols-1,dist=(1-t)*run*.46*Math.sqrt(Math.max(0,1-u*u));
        point(toe.x+u*toe.width*toe.nx-dx/run*dist,toe.y+.021,
          toe.z+u*toe.width*toe.nz-dz/run*dist,u,lengths[toeIndex]-lengths[lipIndex]-dist,0,smooth(t/.69)*smooth((1-Math.abs(u))/.21));
      }
      if(j<coveRows)quad(row,cols);
    }
    channel(toeIndex,stations.length-1);
  }
  const geo=new T.BufferGeometry();
  geo.setAttribute('position',new T.Float32BufferAttribute(xyz,3));
  geo.setAttribute('current',new T.Float32BufferAttribute(flow,4));
  geo.setIndex(indices);geo.computeVertexNormals();geo.computeBoundingSphere();return geo;
}

function escarpment(stream,style){
  const {stations,fall:{lip,toe}}=stream,random=seeded(style.seed);
  const xyz=[],uv=[],colors=[],indices=[],shade=new T.Color();
  const dry=new T.Color(stream.id==='peach'?'#dac7a9':'#cfccae');
  const wet=new T.Color('#70827c'),lichen=new T.Color('#a7ae86'),slate=new T.Color('#a8a99c');
  const dx=toe.x-lip.x,dz=toe.z-lip.z,run=hypot(dx,dz),fx=dx/run,fz=dz/run;
  function stonePoint(x,y,z,tint,gain=1,alpha=1){
    const u=(x-lip.x)*fz-(z-lip.z)*fx;
    const v=(x-lip.x)*fx+(z-lip.z)*fz;
    const i=xyz.length/3;
    xyz.push(x-lip.x,y-lip.y,z-lip.z);
    uv.push(.113*u+.031*v+style.seed*.07,-.084*y-.093*v+.021*u);
    colors.push(gain*tint.r,gain*tint.g,gain*tint.b,alpha);return i;
  }
  // Trace the actual broken terrain triangles. A torn outer edge dies away
  // into the original mountain; the darker rock continues under the veil.
  if(style.spring)carveKaedeRock(stream,stonePoint,indices,random);
  const cols=42,rows=Math.ceil((run+7)*3);
  if(!style.spring)for(let j=0;j<=rows;j++)for(let i=0;i<=cols;i++){
    const t=j/rows,u=i/cols*2-1;
    const shoulder=.53+.47*sin(PI*t),flank=u<0?1:1.13;
    const width=lip.width+.7+style.apron*shoulder*flank+.32*sin(t*9+u*.7);
    const across=u*width+.18*sin(t*11+u*5)*sin(PI*t);
    const along=mix(-2.75,run+2.90,t)+.60*cos(u*7+.4)+.21*sin(u*16+t*3);
    const x=lip.x+along*fx+across*fz,z=lip.z+along*fz-across*fx;
    const feather=unit(Math.min((1-Math.abs(u))*7,t*9,(1-t)*9));
    const rib=.12*sin(3.6*along+1.23*across+.7*sin(along*1.7));
    const y=terrainMeshHeight(x,z)-.17+feather*(.23+rib+.07*cos(across*3.1-along*1.2));
    shade.copy(wet).lerp(dry,unit((Math.abs(across)-lip.width*.48)/(width*.60)));
    const moss=unit((Math.abs(u)-.56)*1.47)*(.4+.3*cos(across*2+.8*along));
    shade.lerp(lichen,moss);
    stonePoint(x,y,z,shade,.94+.07*cos(3.8*along+.9*across),smooth(feather));
    if(j<rows && i<cols){
      const a=j*(cols+1)+i,b=a+cols+1;
      indices.push(a,b,a+1,a+1,b,b+1);
    }
  }

  // The world grid is coarse enough to cut a chord across a curved bank.
  // These local strips follow its actual walking surface into the water and
  // die into the painted terrain on the outside, including at the pool.
  const banks=[[stream.toeIndex,stations.length-2]];
  if(!style.spring)banks.unshift([1,stream.lipIndex]);
  for(const [from,until] of banks){
    for(const side of [-1,1]){
      const strips=8,first=xyz.length/3;
      for(let j=from;j<=until;j++){
        const a=stations[j];
        for(let k=0;k<=strips;k++){
          const f=k/strips,r=side*(a.width*.80+f*(a.width*.29+2.7+.27*sin(j*.79)));
          const x=a.x+a.nx*r,z=a.z+a.nz*r;
          const blend=smooth((1-f)/.70)*smooth((j-from)/2)*smooth((until-j)/2);
          const coarse=terrainMeshHeight(x,z),physical=terrainHeight(x,z);
          // Only the missing sliver at the waterline needs dressing. A rock
          // skin over an already exposed slope would intersect every coarse
          // triangle and leave a conspicuous comb of dark edges.
          const missing=Math.max(0,Math.min(a.y+.26,physical)-coarse);
          const nearWash=1-smooth((physical-a.y-.19)/1.22);
          const opacity=blend*nearWash*smooth((missing-.12)/.61);
          const y=coarse+blend*missing+.035;
          shade.copy(wet).lerp(dry,.39+.59*f);
          stonePoint(x,y,z,shade,.94+.06*sin(j*1.7+f*4.8),opacity);
          if(j<until && k<strips){
            const v=first+(j-from)*(strips+1)+k,w=v+strips+1;
            if(side===1)indices.push(v,w,v+1,v+1,w,w+1);
            else indices.push(v,v+1,w,v+1,w+1,w);
          }
        }
      }
    }
  }

  // Weathered ledges have a basal plate, a sheared vertical face and a chipped
  // crown. Root every corner in the same mountain as the player's feet.
  function ledge(x,z,rx,rz,rise,angle,dark){
    const sides=7+Math.floor(random()*4),outline=[],base=xyz.length/3;
    const cap=shade.copy(dark?wet:slate).lerp(lichen,random()*.65).clone();
    for(let i=0;i<sides;i++){
      const a=(i+.24*(random()-.5))*2*PI/sides;
      const u=(.74+.30*random())*rx*cos(a),v=(.75+.34*random())*rz*sin(a);
      outline.push([u*cos(angle)-v*sin(angle),u*sin(angle)+v*cos(angle),.76+.31*random()]);
    }
    for(let j=0;j<4;j++)for(let i=0;i<sides;i++){
      const [u,v,w]=outline[i],rad=[1,.97,.85,.57][j];
      const px=x+rad*u+.11*rise*j/3,pz=z+rad*v;
      const h=terrainMeshHeight(px,pz)+[-.20,.14,.65,1][j]*rise*w;
      stonePoint(px,h,pz,j===3?cap:dark?wet:dry,j===1?.59:j===2?.87:1);
      const a=base+j*sides+i,b=base+j*sides+(i+1)%sides;
      if(j<3)indices.push(a,a+sides,b,b,a+sides,b+sides);
    }
    const center=stonePoint(x,terrainMeshHeight(x,z)+1.03*rise,z,cap);
    for(let i=0;i<sides;i++)indices.push(base+3*sides+(i+1)%sides,center,base+3*sides+i);
  }
  if(!style.spring)for(const side of [-1,1]){
    for(let i=0;i<12;i++){
      const t=(i+.5*random())/12,along=mix(-2.9,run+3.4,t);
      const across=side*lip.width*(.83+random()*1.23);
      const x=lip.x+along*fx+across*fz,z=lip.z+along*fz-across*fx;
      ledge(x,z,.53+random()*1.37,.35+random()*.66,.17+random()*.32,
        Math.atan2(fz,fx)+.62+random()*.68,Math.abs(across)<lip.width*1.5);
    }
  }
  if(!style.spring)for(let i=2;i<stations.length-2;i+=3+Math.floor(random()*3)){
    const a=stations[i],bank=(random()<.5?-1:1)*a.width*(.84+.25*random());
    ledge(a.x+bank*a.nx,a.z+bank*a.nz,.32+random()*.62,.23+random()*.38,
      .10+random()*.21,random()*PI,true);
  }
  const g=new T.BufferGeometry();
  g.setAttribute('position',new T.Float32BufferAttribute(xyz,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));
  g.setAttribute('color',new T.Float32BufferAttribute(colors,4));
  g.setIndex(indices);g.computeVertexNormals();g.computeBoundingSphere();return g;
}

// Upward threads loosen into individual flecks. Each ballistic arc lands at
// its starting water level, with a different phase and projected nib direction.
function sprayGeometry(stream,style){
  const {lip,toe}=stream.fall,random=seeded(style.seed+371);
  const xyz=[],uv=[],jets=[],nibs=[],indices=[];
  for(let i=0;i<style.spray;i++){
    const across=(random()-.5)*1.69*Math.min(toe.width,lip.width),along=(random()-.4)*.83;
    const px=toe.x-lip.x+across*toe.nx-along*toe.nz,pz=toe.z-lip.z+across*toe.nz+along*toe.nx;
    const mist=i%4===0;
    const flight=mist?.86+random()*.83:.42+random()*.67;
    const vy=mist?.85+.54*random():4.9*flight;
    const drift=(random()-.5)*2.7+.37*across,forward=.38+random()*1.83;
    const vx=toe.nx*drift-toe.nz*forward,vz=toe.nz*drift+toe.nx*forward;
    const width=mist?-(.82+random()*1.42):.019+.061*random();
    const length=mist?.72+random()*1.28:width*(1.32+2.62*random()),phase=random();
    for(const [s,t] of [[0,0],[1,0],[0,1],[1,1]]){
      xyz.push(px,toe.y-lip.y+.04,pz);uv.push(s,t);jets.push(vx,vy,vz,flight);nibs.push(width,length,phase);
    }
    const k=i*4;indices.push(k,k+1,k+2,k+2,k+1,k+3);
  }
  if(style.spring){
    const drop=lip.y-toe.y,run=hypot(lip.x-toe.x,lip.z-toe.z);
    const fx=(toe.x-lip.x)/run,fz=(toe.z-lip.z)/run,flight=Math.sqrt(drop/4.9);
    // Eddies entering the crest shed small packets of water as they fall.
    // Their axes follow their velocity and the jet inherits the sheet speed.
    for(let i=0;i<168;i++){
      const v=.27+.63*random(),side=random()<.5?-1:1;
      const u=side*(.58+.48*random()),across=lip.width*u;
      const x=fx*(run*v+.46*sin(PI*v))+fz*across,z=fz*(run*v+.46*sin(PI*v))-fx*across;
      const spread=side*(.31+1.33*random());
      const vx=fx*run/flight+fz*spread,vz=fz*run/flight-fx*spread;
      const life=(1-v)*flight*(.36+.55*random()),width=.012+random()*.036;
      const phase=random(),elongation=width*(1.8+2.7*random()),k=xyz.length/3;
      for(const [s,t] of [[0,0],[1,0],[0,1],[1,1]]){
        xyz.push(x,-drop*v*v,z);uv.push(s,t);jets.push(vx,-9.8*flight*v,vz,life);nibs.push(width,elongation,phase);
      }
      indices.push(k,k+1,k+2,k+2,k+1,k+3);
    }
  }
  const g=new T.BufferGeometry();
  for(const [name,data,size] of [['position',xyz,3],['uv',uv,2],['jet',jets,4],['nib',nibs,3]]){
    g.setAttribute(name,new T.Float32BufferAttribute(data,size));
  }
  g.setIndex(indices);g.computeBoundingSphere();g.boundingSphere.radius+=5;return g;
}

export function createMountainWaterfalls(scene){
  const clock={value:0},submerged={value:0},spray=sprayPigment(clock);
  const sites=MOUNTAIN_STREAMS.map(stream=>{
    const style=styles[stream.id],{lip}=stream.fall,root=new T.Group();
    root.name=stream.name;root.userData.waterfallId=stream.id;root.position.set(lip.x,lip.y,lip.z);
    for(const [name,part,geo,material] of [
      ['濡れた岩棚と苔の節理','stone',escarpment(stream,style),style.spring?kaedeCragPigment():cragPigment()],
      ['岩間を割る落水と渓流','water',surfaceGeometry(stream,style),currentPigment(stream,clock,submerged)],
      ['滝壺の飛沫','spray',sprayGeometry(stream,style),spray],
    ]){
      const mesh=new T.Mesh(geo,material);mesh.name=name;mesh.userData.waterfallPart=part;
      mesh.receiveShadow=part!=='spray';
      if(part==='spray')mesh.renderOrder=3;
      if(part==='stone')mesh.renderOrder=-2;
      root.add(mesh);
    }
    scene.add(root);
    const reach=Math.max(...stream.stations.map(a=>hypot(a.x-lip.x,a.z-lip.z)))+245;
    return {root,lip,reach};
  });
  return (time,_player,camera)=>{
    clock.value=time;
    submerged.value=camera.position.y<mountainStreamWaterAt(camera.position.x,camera.position.z)?1:0;
    for(const {root,lip,reach} of sites){
      const dx=wrapDelta(lip.x-camera.position.x),dz=wrapDelta(lip.z-camera.position.z);
      root.visible=dx*dx+dz*dz<reach*reach;
      if(root.visible){root.position.x=camera.position.x+dx;root.position.z=camera.position.z+dz;}
    }
  };
}
