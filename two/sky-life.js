import * as T from './vendor/three.module.min.js';
import { wrapDelta } from './terrain.js';
import { createAmbientFlocks } from './ambient-flocks.js';
import { legendFlight, SPECIES } from './bestiary.js';
import { kirinFrequency } from './animal-motion.js';
import { kirinTouchdowns } from './handscroll-beasts.js';
import { kirinCloudBrush } from './kirin-cloud-art.js';

const TAU=Math.PI*2;

export function migratoryBird(swift,distant=false,tern=false) {
  const points=[],colors=[],motion=[],indices=[];
  const ink=tern?'#424742':swift?'#454943':'#514c40',belly=tern?'#eae3cc':swift?'#d8cdb2':'#d2c4a4';
  function vertex(x,y,z,wing,shade) {
    const i=points.length/3,tint=new T.Color(shade);
    points.push(x,y,z);colors.push(tint.r,tint.g,tint.b);motion.push(wing);
    return i;
  }
  // The cheek and neck of the goose and the short, russet chin of the
  // swallow are modelled all the way round, including the ventral silhouette.
  const spine=tern?[[-.39,.01,.013,.014],[-.26,.009,.066,.061],[-.12,.008,.09,.079],
    [.047,.02,.094,.092],[.16,.044,.071,.067],[.236,.075,.066,.063],
    [.307,.065,.043,.030],[.435,.061,.003,.002]]:swift?[[-.35,.015,.015,.012],[-.23,.003,.058,.050],[-.10,.01,.084,.078],
    [.06,.012,.093,.092],[.15,.045,.071,.067],[.212,.062,.064,.059],
    [.257,.048,.046,.032],[.300,.045,.003,.003]]:
    [[-.42,-.01,.014,.013],[-.31,-.003,.061,.057],[-.17,.01,.10,.085],[.006,.018,.116,.112],
      [.16,.037,.087,.089],[.245,.062,.052,.057],[.35,.091,.039,.044],[.445,.119,.040,.048],
      [.514,.138,.058,.063],[.567,.142,.053,.052],[.607,.137,.035,.021],[.685,.125,.003,.003]];
  const sides=distant?6:14;
  for(let j=0;j<spine.length;j++)for(let k=0;k<sides;k++){
    const [z,y,w,h]=spine[j],a=k*TAU/sides,upper=Math.sin(a);
    let shade=upper<-.18?belly:ink;
    if(tern)shade=j===spine.length-1?'#414640':j===spine.length-2?'#c39d5f':j>=5&&upper>.02?ink:upper>.35?'#b9b9ab':belly;
    else if(j===spine.length-1)shade=swift?ink:'#a38b65';
    else if(swift&&j>=4&&upper<.08)shade='#8b6651';
    else if(!swift&&j>=6&&j<=8&&upper<.38&&upper>-.65)shade='#cabea1';
    else if(upper>.7)shade=swift?'#555c57':'#827a65';
    const i=vertex(Math.cos(a)*w,y+upper*h,z,0,shade);
    if(j<spine.length-1){const next=j*sides+(k+1)%sides;indices.push(i,next,i+sides,next,next+sides,i+sides);}
  }
  function feather(start,end,width,shade,dark) {
    const [x,y,z]=start,[dx,dy,dz]=end.map((v,i)=>v-start[i]);
    const d=Math.hypot(dx,dz),rx=-dz/d,rz=dx/d;
    let prev;
    const steps=distant?2:5;
    for(let i=0;i<=steps;i++){
      const u=i/steps,w=Math.max(.001,width*Math.sin(Math.PI*u**.78)**.78);
      const row=[-1,0,1].map(v=>{
        const xx=x+u*dx+v*w*rx,zz=z+u*dz+v*w*rz;
        return vertex(xx,y+u*dy+.018*Math.sin(Math.PI*u)+.009*(1-Math.abs(v)),zz,Math.max(-1,Math.min(1,xx)),
          v===-1?dark:shade);
      });
      if(prev)for(let k=0;k<2;k++)indices.push(prev[k],prev[k+1],row[k],prev[k+1],row[k+1],row[k]);
      prev=row;
    }
  }
  for(const s of [-1,1]) {
    // A swallow's fork and narrow swept primaries differ from the rounded
    // secondary fan of the migrating goose.
    const tailCount=distant?2:swift?3:5;
    for(let k=0;k<tailCount;k++){
      const u=k/(tailCount-1);
      feather([s*(.009+.025*u),.006,-.235],[s*(.016+u*(swift?.170:.107)),.009,
        swift?-.39-(tern?.14:.21)*u:-.485+.048*u],swift?.031:.039,tern?belly:ink,tern?'#a6a899':'#797464');
    }
    const sections=tern?[[.04,.02,.12,-.18],[.30,.11,.16,-.24],[.54,.19,.15,-.225],
      [.75,.12,.035,-.230],[1.04,-.015,-.23,-.238]]:swift?[[.04,.018,.104,-.175],[.28,.094,.084,-.25],[.53,.147,.014,-.282],
      [.77,.111,-.107,-.281],[.995,.032,-.286,-.291]]:
      [[.04,.018,.132,-.17],[.31,.102,.142,-.30],[.53,.152,.136,-.31],
        [.69,.167,.098,-.254],[.81,.142,.035,-.218],[.978,.076,-.041,-.056]];
    const first=points.length/3, spanSteps=distant?5:16, chords=distant?6:16;
    const leading=new T.CatmullRomCurve3(sections.map(([x,y,z])=>new T.Vector3(x,y,z)));
    const trailing=new T.CatmullRomCurve3(sections.map(([x,y,l,z])=>new T.Vector3(x,y,z)));
    for(let j=0;j<=spanSteps;j++) {
      const u=j/spanSteps, front=leading.getPoint(u),rear=trailing.getPoint(u);
      for(let k=0;k<chords;k++) {
        const a=k*TAU/chords,v=(1-Math.cos(a))*.5,z=T.MathUtils.lerp(front.z,rear.z,v);
        const fleck=v>.47&&Math.sin(u*49+v*2.5)>.29;
        const upper=tern?(u>.77?(fleck?'#565a55':ink):(fleck?'#abae9f':'#bfc2b5')):swift?(fleck?'#575c54':'#464c47'):(fleck?'#897f6a':'#746c5d');
        const lower=tern?(u>.78?'#777d73':belly):swift?(fleck?'#8c8a76':'#6d746c'):(fleck?'#bcb399':'#a49b85');
        const shade=Math.sin(a)<-.01?lower:upper;
        const i=vertex(s*front.x,front.y+.040*Math.sin(a)*(1-.87*front.x)+.023*Math.sin(v*Math.PI),z,s*front.x,shade);
        if(j<spanSteps){const next=first+j*chords+(k+1)%chords;indices.push(i,next,i+chords,next,next+chords,i+chords);}
      }
    }
    if(!distant){
      const face=tern?[.059,.087,.251]:swift?[.052,.082,.227]:[.053,.151,.540],r=swift?.009:.012;
      for(const [radius,tone,lift] of [[r*1.34,'#bfaf88',0],[r,ink,.0015]]){
        const center=vertex(s*(face[0]+lift),face[1],face[2],0,tone);
        for(let k=0;k<12;k++){
          const a=k*TAU/12;
          vertex(s*(face[0]+lift-radius*.32*Math.cos(a)),face[1]+radius*Math.sin(a),
            face[2]+radius*Math.cos(a),0,tone);
          indices.push(center,center+1+k,center+1+(k+1)%12);
        }
      }
    }
    const quills=distant?3:8;
    for(let k=0;k<quills;k++){
      const u=k/(quills-1),x=.115+.63*u;
      feather([s*x,.021+.127*Math.sin(u*1.9),.050],
        [s*(x+.12+.14*u),.015+.113*Math.sin(u*2.7),-.315+.06*u],swift?.054:.069,
        tern?(u>.7?ink:'#c3c2af'):k>4?ink:'#938c79',tern?'#929786':k>4?'#3c403a':'#6a685b');
    }
  }
  const geometry=new T.BufferGeometry();
  geometry.setIndex(indices);geometry.setAttribute('position',new T.Float32BufferAttribute(points,3));
  geometry.setAttribute('color',new T.Float32BufferAttribute(colors,3));
  geometry.setAttribute('wingSpan',new T.Float32BufferAttribute(motion,1));
  geometry.computeVertexNormals();
  return geometry;
}

// At a few pixels across, the outer primaries, the fork of the tail and the
// wing's turning edge carry the drawing. Use the same moving span as the
// feathered model and keep the body three-dimensional when seen edge-on.
function flightSilhouette(kind) {
  const points=[],colors=[],wing=[],indices=[];
  const tern=kind===2,goose=kind===0;
  const back=tern?'#a8aca2':goose?'#796f5c':'#535b55';
  const belly=tern?'#e7dfc7':goose?'#bcaf92':'#a29d87',tip='#454a44';
  function vertex(x,y,z,shade,span=0){
    const c=new T.Color(shade);
    points.push(x,y,z);colors.push(c.r,c.g,c.b);wing.push(span);
    return wing.length-1;
  }
  const nose=vertex(0,.075,goose?.66:tern?.43:.30,tern?'#9d7854':tip);
  const tail=vertex(0,.02,-.40,back);
  const sides=[vertex(-.087,.015,.06,back),vertex(0,.105,.07,back),
    vertex(.087,.015,.06,back),vertex(0,-.074,.04,belly)];
  for(let i=0;i<4;i++)indices.push(nose,sides[i],sides[(i+1)%4],tail,sides[(i+1)%4],sides[i]);
  const stations=goose?[[.04,.015,.13,-.18],[.35,.12,.15,-.31],[.68,.16,.10,-.25],[.99,.075,-.04,-.055]]:
    tern?[[.04,.02,.12,-.18],[.35,.12,.16,-.24],[.65,.16,.09,-.24],[1.04,-.015,-.23,-.24]]:
    [[.04,.018,.10,-.175],[.32,.10,.08,-.26],[.63,.14,-.03,-.28],[.995,.032,-.286,-.294]];
  for(const sign of [-1,1]){
    let prev;
    for(const [x,y,front,rear] of stations){
      const row=[vertex(sign*x,y,front,x>.75?tip:back,sign*x),
        vertex(sign*x,y+.025,(front+rear)*.5,x>.75?tip:back,sign*x),
        vertex(sign*x,y,rear,x>.55?tip:belly,sign*x)];
      if(prev)for(let i=0;i<2;i++)indices.push(prev[i],prev[i+1],row[i],prev[i+1],row[i+1],row[i]);
      prev=row;
    }
    indices.push(tail,vertex(sign*.06,.012,-.22,back),vertex(sign*(goose?.10:.16),.016,goose?-.49:tern?-.54:-.60,tip));
  }
  const geometry=new T.BufferGeometry();
  geometry.setIndex(indices);
  geometry.setAttribute('position',new T.Float32BufferAttribute(points,3));
  geometry.setAttribute('color',new T.Float32BufferAttribute(colors,3));
  geometry.setAttribute('wingSpan',new T.Float32BufferAttribute(wing,1));
  geometry.computeVertexNormals();
  return geometry;
}

export function createFlockFlights(scene) {
  const time={value:0}, material=new T.MeshLambertMaterial({vertexColors:true,side:T.DoubleSide});
  material.onBeforeCompile=shader=>{
    shader.uniforms.flockTime=time;
    shader.vertexShader='uniform float flockTime;attribute float wingSpan;attribute float wingBeat;\n'+shader.vertexShader;
    shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>',`#include <begin_vertex>
      float w=abs(wingSpan);
      float phase=flockTime*(4.4+.8*sin(wingBeat))+wingBeat;
      float flutter=sin(phase-1.15*w)+.17*sin(2.*phase-.6);
      float glide=.24+.76*smoothstep(-.45,.8,sin(flockTime*.32+wingBeat*.37));
      transformed.y+=w*(.46*flutter*glide-.035);
      transformed.z+=.13*w*w*cos(phase-.5)*glide;
      transformed.x*=1.-.12*w*abs(flutter)*glide;
    `);
  };
  const population=createAmbientFlocks(), names=['渡り雁の雁行','高空の燕の群れ','浜のコアジサシ'];
  const batches=Array.from({length:9},(_,i)=>{
    const kind=i%3, count=population.capacity[kind];
    const geo=i>=6?flightSilhouette(kind):migratoryBird(kind!==0,i>=3,kind===2);
    const beat=new T.InstancedBufferAttribute(new Float32Array(count),1);
    beat.setUsage(T.DynamicDrawUsage);geo.setAttribute('wingBeat',beat);
    const mesh=new T.InstancedMesh(geo,material,count);
    mesh.name=names[kind];
    mesh.frustumCulled=false;mesh.instanceMatrix.setUsage(T.DynamicDrawUsage);
    scene.add(mesh);return mesh;
  });
  const dummy=new T.Object3D(); dummy.rotation.order='YXZ';
  const frustum=new T.Frustum(), projection=new T.Matrix4(), sphere=new T.Sphere();
  return (t,camera)=>{
    time.value=t;
    frustum.setFromProjectionMatrix(projection.multiplyMatrices(camera.projectionMatrix,camera.matrixWorldInverse));
    for(const mesh of batches)mesh.count=0;
    for(const f of population.near(camera.position.x,camera.position.z)) {
      const u=f.angle+t*f.cruise, cs=Math.cos(u),sn=Math.sin(u);
      const x=camera.position.x+wrapDelta(f.x+f.radius*(sn*f.cosAxis+.72*cs*f.sinAxis)-camera.position.x);
      const z=camera.position.z+wrapDelta(f.z+f.radius*(.72*cs*f.cosAxis-sn*f.sinAxis)-camera.position.z);
      const altitude=f.y+3.1*Math.sin(u*.65);
      sphere.center.set(x,altitude,z);sphere.radius=f.spread;
      if(!frustum.intersectsSphere(sphere))continue;
      const distance=Math.hypot(x-camera.position.x,z-camera.position.z);
      if(distance>=240)continue;
      const coverage=1-T.MathUtils.smoothstep(distance,202,240);
      const sightline=Math.hypot(distance,altitude-camera.position.y);
      const mesh=batches[f.kind+(sightline>81?6:sightline>30?3:0)];
      const heading=Math.atan2(cs,-sn*.72)+f.axis+(f.cruise<0?Math.PI:0);
      const dx=Math.sin(heading), dz=Math.cos(heading);
      for(const bird of f.birds) {
        const side=bird.side+.55*Math.sin(t*.49+bird.beat);
        const forward=bird.forward+.42*Math.cos(t*.36+bird.beat);
        dummy.position.set(x+dx*forward+dz*side,altitude+bird.rise+.27*Math.cos(t*.8+bird.beat),z+dz*forward-dx*side);
        dummy.rotation.set(.035*Math.cos(u*.65),heading+.047*Math.sin(t*.56+bird.beat),-.17*Math.sign(f.cruise)+.07*Math.sin(t*.72+bird.beat),'YXZ');
        dummy.scale.setScalar(bird.scale*Math.sqrt(coverage));dummy.updateMatrix();
        mesh.setMatrixAt(mesh.count,dummy.matrix);mesh.geometry.attributes.wingBeat.setX(mesh.count++,bird.beat);
      }
    }
    for(const mesh of batches){
      mesh.visible=mesh.count>0;
      if(!mesh.visible)continue;
      for(const a of [mesh.instanceMatrix,mesh.geometry.attributes.wingBeat]){
        a.clearUpdateRanges();a.addUpdateRange(0,mesh.count*a.itemSize);a.needsUpdate=true;
      }
    }
  };
}

// Each hoof leaves one suspended print. The contact point stays in place while
// the foot bears weight; only after lift-off does the wake carry the wash away.
function royalFootsteps(scene) {
  const interval=Math.PI/(2*kirinFrequency), lead=.20, lifetime=2.62;
  const count=Math.ceil((lifetime+lead)/interval);
  const {texture,crests}=kirinCloudBrush();
  const geometry=new T.PlaneGeometry(1,1);
  const opacity=new T.InstancedBufferAttribute(new Float32Array(count),1).setUsage(T.DynamicDrawUsage);
  const print=new T.InstancedBufferAttribute(new Float32Array(count*2),2).setUsage(T.DynamicDrawUsage);
  geometry.setAttribute('cloudOpacity',opacity);
  geometry.setAttribute('cloudPrint',print);
  const material=new T.MeshBasicMaterial({map:texture,transparent:true,depthWrite:false});
  material.onBeforeCompile=shader=>{
    shader.vertexShader='attribute float cloudOpacity; attribute vec2 cloudPrint; varying float wisp;\n'+
      shader.vertexShader.replace('#include <uv_vertex>',`#include <uv_vertex>
        wisp=cloudOpacity;
        vMapUv.x=(cloudPrint.x+mix(vMapUv.x,1.-vMapUv.x,cloudPrint.y))/${crests.length}.0;`);
    shader.fragmentShader='varying float wisp;\n'+shader.fragmentShader.replace('#include <color_fragment>',
      `#include <color_fragment>
        // Keep the pooled ink visible against the game's sunlit paper sky.
        float inkDeposit=1.-smoothstep(.10,.84,dot(diffuseColor.rgb,vec3(.21,.72,.07)));
        diffuseColor.rgb*=1.-.68*inkDeposit;
        diffuseColor.a=mix(diffuseColor.a,sqrt(diffuseColor.a),inkDeposit);
        diffuseColor.a*=wisp*mix(1.,diffuseColor.a,.35*(1.-wisp));`);
  };
  const clouds=new T.InstancedMesh(geometry,material,count);clouds.frustumCulled=false;clouds.name='麒麟の瑞雲';
  clouds.instanceMatrix.setUsage(T.DynamicDrawUsage);scene.add(clouds);
  const dummy=new T.Object3D(), offset=new T.Vector3(),flight={};
  const trail=Array.from({length:count},()=>({}));
  let lastRoyal,lastSeed;

  return (t,royal,player,camera)=>{
    clouds.count=0;clouds.visible=false;
    if(!royal)return;
    // Follow the same wrapped copy and fade as the distant kirin atlas.
    const range=SPECIES.kirin.skyRange;
    const distance=Math.hypot(wrapDelta(royal.x-player.x),wrapDelta(royal.z-player.z));
    if(distance>=range)return;
    const presence=Math.min(1,(range-distance)/(range*.20));
    const scale=royal.stature;
    const step=Math.floor((t+royal.phase+lead)/interval);
    if(royal!==lastRoyal || royal.flightSeed!==lastSeed) {
      for(const stamp of trail)stamp.time=NaN;
      lastRoyal=royal;lastSeed=royal.flightSeed;
    }
    for(let k=step-count+1;k<=step;k++) {
      const touch=k*interval-royal.phase, age=t-touch;
      if(age<=-lead || age>=lifetime)continue;
      const stamp=trail[T.MathUtils.euclideanModulo(k,count)];
      if(touch!==stamp.time) {
        const leg=T.MathUtils.euclideanModulo(k,4), sole=kirinTouchdowns[leg];
        legendFlight(royal,touch,flight);
        const c=Math.cos(flight.heading),s=Math.sin(flight.heading),side=leg<2?-1:1;
        stamp.time=touch;stamp.side=side;
        stamp.tile=T.MathUtils.euclideanModulo(k,crests.length);
        stamp.mirror=side>0?1:0;
        stamp.x=flight.x+scale*(c*sole.x+s*sole.z);
        stamp.y=flight.y+scale*sole.y;
        stamp.z=flight.z+scale*(c*sole.z-s*sole.x);
        // The dying wash slips away from the belly and into the hoof's wake.
        stamp.driftX=scale*(side*.14*c-.28*s);stamp.driftZ=scale*(-side*.14*s-.28*c);
      }
      const form=T.MathUtils.smoothstep(age,-lead,0);
      const release=T.MathUtils.smoothstep(age,.24,lifetime);
      const fade=1-T.MathUtils.smoothstep(age,.60,lifetime);
      const x=player.x+wrapDelta(stamp.x+release*stamp.driftX-player.x);
      const z=player.z+wrapDelta(stamp.z+release*stamp.driftZ-player.z);
      const y=stamp.y-.14*scale*release;
      const dx=camera.position.x-x,dz=camera.position.z-z;
      const tilt=Math.atan2(camera.position.y-y,Math.hypot(dx,dz));
      dummy.rotation.set(-.12-.78*tilt,Math.atan2(dx,dz),stamp.side*(.045+.04*release),'YXZ');
      // Three times the former 0.755 × 0.326 contact impression. It opens
      // across the sole, then broadens and flattens as the wash thins.
      dummy.scale.set(2.265*scale*(.44+.56*form)*(1+.18*release),
        .978*scale*(.42+.58*form)*(1-.12*release),1);
      const [u,v]=crests[stamp.tile];
      offset.set(stamp.mirror ? .5-u : u-.5,v-.5,0).multiply(dummy.scale).applyQuaternion(dummy.quaternion);
      dummy.position.set(x,y,z).sub(offset);dummy.updateMatrix();
      clouds.setMatrixAt(clouds.count,dummy.matrix);
      opacity.setX(clouds.count,form*fade*presence*.96);
      print.setXY(clouds.count++,stamp.tile,stamp.mirror);
    }
    clouds.visible=clouds.count>0;
    clouds.instanceMatrix.needsUpdate=true;opacity.needsUpdate=true;print.needsUpdate=true;
  };
}
export function createSkyLife(scene) {
  const flock=createFlockFlights(scene), steps=royalFootsteps(scene);
  let roster,royal;
  return (time,state,camera,atPhotoTime)=>{
    if(roster!==state.npcs) {
      roster=state.npcs;royal=roster.find(n=>n.type==='kirin');
    }
    flock(time,camera);
    steps(time,royal && atPhotoTime ? atPhotoTime(royal,time) : royal,state.player,camera);
  };
}
