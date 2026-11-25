import { Mesh } from './vendor/three.module.min.js';
import { hokoraCarpentry } from './kaede-hokora-mesh.js';
import { homesteadFinish } from './homestead-pigment.js';

// A portable joiner's trestle with broad treads, not invisible standing
// points in midair. Motion samples use these same tread heights and nosings.
export function makeWorkTrestle({center, normal, height, width, depth, run, count, stairWidth=width, stairOffset=0,footGround}) {
  const timber=hokoraCarpentry();
  const dark='#ae9472', clear='#dfc89b', grain='#cbb58d';
  const plank=(x,y,z,w,h,d,seed)=>timber.box('wood',seed%2?grain:clear,[x,y,z],[w,h,d],
    {grain:'x',bevel:.009,seed});
  const beam=(from,to,w,d)=>timber.beam('wood',dark,from,to,w,d,{bevel:.005,seed:to[2]});
  function toe(x,z) {
    if(!footGround)return -.06;
    const u=center[0]+normal[1]*x+normal[0]*z,v=center[2]-normal[0]*x+normal[1]*z;
    return footGround([u,v])-center[1]-.065;
  }
  const legs=width/2-.10;
  const outer=depth/2+(count-1)*run;
  for(const x of [-legs,legs]){
    for(const z of [-depth/2+.07,depth/2-.07]) beam([x*1.08,toe(x*1.08,z*1.10),z*1.10],[x,height-.056,z],.085,.10);
    beam([x,height-.10,-depth/2],[x,height-.10,depth/2],.088,.093);
    if(height>.5) beam([x,.12,-depth/2+.07],[x,height-.17,depth/2-.07],.047,.061);
  }
  if(count>1)for(const side of [-1,1]){
    const x=stairOffset+side*(stairWidth/2-.07);
    beam([x,toe(x,outer-.04),outer-.04],[x,height-.11,depth/2-.07],.064,.10);
  }
  beam([-legs,.16,-depth/2],[legs,.16,-depth/2],.068,.075);
  const boards=Math.max(2,Math.round(depth/.23));
  for(let j=0;j<boards;j++)
    plank(0,height-.032,-depth/2+(j+.5)*depth/boards,width,.064,depth/boards-.006,j);
  for(let i=1;i<count;i++) {
    const y=height*(1-i/count);
    plank(stairOffset,y-.027,depth/2+(i-.5)*run,stairWidth-.035,.054,run-.009,boards+i);
  }
  const mesh=new Mesh(timber.finish(),homesteadFinish());
  mesh.name='踏み段の付いた足場台';
  mesh.position.fromArray(center);mesh.rotation.y=Math.atan2(normal[0],normal[1]);
  mesh.castShadow=mesh.receiveShadow=true;
  return mesh;
}

export function makeJoinersMallet() {
  const timber=hokoraCarpentry();
  const points=14, tau=2*Math.PI;
  function turned(axis,sections,tint,grain) {
    const rings=sections.map(([length,w,d])=>Array.from({length:points},(_,i)=>{
      const a=tau*i/points;
      return axis==='y'?[w*Math.cos(a),length,d*Math.sin(a)]:[w*Math.cos(a),d*Math.sin(a),length];
    }));
    for(let j=1;j<rings.length;j++)for(let i=0;i<points;i++){
      const k=(i+1)%points, corners=[rings[j-1][i],rings[j-1][k],rings[j][k],rings[j][i]];
      timber.face('wood',tint,axis==='y'?corners.reverse():corners,{grain});
    }
    for(const n of [0,rings.length-1]){
      const ring=[...rings[n]];
      if((n===0)===(axis==='z'))ring.reverse();
      timber.face('endGrain','#b49a70',ring,{uvs:ring.map(v=>[.5+v[0]*4, .5+(axis==='y'?v[2]:v[1])*4])});
    }
  }
  turned('y',[[-.066,.049,.052],[-.056,.058,.060],[-.032,.060,.061],[.039,.059,.060],[.065,.051,.054]],
    '#c5a775','y');
  turned('z',[[.035,.010,.013],[.075,.016,.019],[.13,.017,.020],[.22,.019,.021],[.285,.022,.024],[.305,.019,.021]],
    '#d6bb8c','z');
  // The through tenon and its darker wedge are visible on the back of the head.
  timber.box('wood','#b2956c',[0,.001,-.059],[.023,.032,.006],{grain:'y',bevel:.0015});
  timber.box('wood','#756347',[.001,.001,-.062],[.0037,.027,.002],{grain:'y'});
  const mesh=new Mesh(timber.finish(),homesteadFinish());
  mesh.name='楔留めの木槌';mesh.castShadow=mesh.receiveShadow=true;
  return mesh;
}

// A doubled hemp thong cradles the handle below its wooden head. It stays
// tied to the worker when the mallet is lifted out to drive a joint.
export function makeMalletLoop(size) {
  const timber=hokoraCarpentry(),tau=2*Math.PI,angle=1.20;
  const center=[-.82*size,.69*size,.23*size];
  const at=t=>[center[0]+.035*Math.cos(t),center[1]-.085*Math.sin(angle)+.035*Math.sin(t)*Math.cos(angle),
    center[2]+.085*Math.cos(angle)+.035*Math.sin(t)*Math.sin(angle)];
  for(let i=0;i<16;i++)timber.beam('rope',i%2?'#866941':'#a58b58',at(tau*i/16),at(tau*(i+1)/16),.013,.012,{bevel:.003});
  for(const side of [-1,1]){
    const from=at(side*.66),mid=[center[0]+.042*size,center[1]+.018*size,center[2]+side*.030];
    const tied=[center[0]+.135*size,center[1]+.100*size,center[2]+side*.065];
    timber.beam('rope','#997d51',from,mid,.018,.012,{bevel:.004});
    timber.beam('rope','#8e734a',mid,tied,.018,.012,{bevel:.004});
  }
  const mesh=new Mesh(timber.finish(),homesteadFinish());
  mesh.name='腰に結んだ木槌の下げ緒';mesh.castShadow=mesh.receiveShadow=true;
  return mesh;
}
