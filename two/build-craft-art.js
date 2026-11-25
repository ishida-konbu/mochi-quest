// Bench, stock and tools use the same measured wood, end grain, metal and
// bamboo finishes as the house they are made for.
import { Group,Mesh } from './vendor/three.module.min.js';
import { hokoraCarpentry } from './kaede-hokora-mesh.js';
import { homesteadFinish } from './homestead-pigment.js';
import { makeJoinersMallet } from './homestead-work-trestle.js';
import { BENCH_LEGS } from './build-craft-motion.js';
import { makePullSaw } from './homestead-sawing.js';

function woodMesh(form,name){
  const mesh=new Mesh(form.finish(),homesteadFinish());
  mesh.castShadow=mesh.receiveShadow=true;mesh.name=name;return mesh;
}
function timber(b,x,y,z,w,h,d,grain,seed,tint='#d4b88a'){
  b.box('wood',tint,[x,y,z],[w,h,d],{grain,seed,bevel:.004});
  const end=grain==='x'?w:d;
  for(const side of [-1,1]){
    const face=grain==='x'?[.002,h-.009,d-.009]:[w-.009,h-.009,.002];
    b.box('endGrain',tint,[x+(grain==='x'?side*end*.5:0),y,z+(grain==='z'?side*end*.5:0)],
      face,{grain,seed,bevel:.0006});
  }
}
function bench(heights,h,saw){
  const b=hokoraCarpentry();
  let i=0;
  for(const [x,z] of BENCH_LEGS){
    const y=heights[i++]-.064;
    b.beam('wood','#a68b64',[x,y,z],[x*.88,h-.077,z*.81],.115,.128,{bevel:.009,seed:i});
    b.box('endGrain','#897856',[x*.88,h-.145,z*.81+Math.sign(z)*.06],[.029,.025,.023],{bevel:.003});
  }
  for(const z of [-.39,.39]){
    b.beam('wood','#aa9068',[-.74,h-.12,z],[.74,h-.12,z],.095,.101,{bevel:.005});
  }
  for(const x of [-.61,.61]){
    b.beam('wood','#aa936f',[x,h-.19,-.43],[x,h-.19,.43],.085,.090,{bevel:.004});
    b.beam('wood','#b7a37a',[x*1.07,Math.min(h-.24,Math.max(...heights)+.11),-.39],
      [x,h-.18,.36],.055,.062,{bevel:.004});
  }
  // The end being severed lands on the lower board instead of disappearing.
  for(let j=0;j<4;j++){
    const z=-.453+j*.302,split=saw?.31:.03,drop=saw?.059:0;
    timber(b,(split-.88)/2,h-.043,z,split+.88,.086,.298,'x',j+2,'#bb9d72');
    timber(b,(split+.035+.88)/2,h-.043-drop,z,.88-split-.035,.086,.298,'x',j+9,'#c4a77d');
  }
  return woodMesh(b,'楔締めの作業台');
}

function bamboo(b,x0,x1,seed){
  const r=.0725,n=32,steps=[x0,x1],base=Array.from({length:n},(_,i)=>2*Math.PI*i/n);
  for(const node of [-.48,.18,.49])if(node>x0+.021 && node<x1-.022)steps.push(node-.020,node-.012,node-.001,node+.010,node+.020);
  steps.sort((a,c)=>a-c);
  const nodeRise=x=>{
    const d=Math.min(...[-.48,.18,.49].map(v=>Math.abs(x-v)));
    return d<.017?.005*(1-d/.017):0;
  };
  const at=(x,i,inner=false)=>{const a=base[i%n],rad=(inner?r-.011:r+nodeRise(x))*(1+.017*Math.sin(3*a));
    return [x,r+rad*Math.cos(a),rad*Math.sin(a)];};
  for(let k=1;k<steps.length;k++)for(let i=0;i<n;i++){
    const a=steps[k-1],c=steps[k];
    b.face('culmSkin',nodeRise(a)+nodeRise(c)>.001?'#a2935d':'#a9a475',[at(a,i),at(a,i+1),at(c,i+1),at(c,i)],
      {uvs:[[a,i/n],[a,(i+1)/n],[c,(i+1)/n],[c,i/n]],seed});
  }
  for(const x of [x0,x1])for(let i=0;i<n;i++){
    const u=x===x0?.05:-.05;
    b.face('culmCut','#e0ce95',[at(x,i),at(x,i+1),at(x,i+1,true),at(x,i,true)]);
    b.face('culmSkin','#8b8059',[at(x,i,true),at(x,i+1,true),at(x+u,i+1,true),at(x+u,i,true)]);
  }
}
function planeTool(){
  const b=hokoraCarpentry();
  // The mouth runs all the way through the sole; the shaving emerges on
  // the bevelled iron between the two cheeks, as on a pulling kanna.
  const part=(x,z,w,d)=>timber(b,x,.040,z,w,.080,d,'z',11,'#bd986c');
  part(0,-.103,.181,.131);part(0,.093,.181,.144);
  for(const side of [-1,1])part(side*.075,-.008,.031,.060);
  // Forge an actual bevel down to the sole. The blade edges pass through
  // the throat between the heel and toe; the honed lip just skims the board.
  const edge=[[-.056,-.0003,.012],[.056,-.0003,.012]],high=[[-.056,.173,-.099],[.056,.173,-.099]];
  const bevel=[[-.056,.026,-.025],[.056,.026,-.025]],back=[[-.056,.171,-.117],[.056,.171,-.117]];
  b.face('metal','#62655b',[...edge,high[1],high[0]]);
  b.face('metal','#c0bcaa',[edge[1],edge[0],...bevel]);
  b.face('metal','#4e554e',[bevel[1],bevel[0],...back]);
  b.face('metal','#81887b',[high[0],high[1],back[1],back[0]]);
  for(const i of [0,1])b.face('metal','#666c60',[edge[i],bevel[i],back[i],high[i]]);
  b.box('metal','#aaa78d',[0,.102,-.025],[.095,.090,.013],{rotation:[-.57,0,0],grain:'y',bevel:.003});
  b.beam('metal','#756c56',[-.08,.076,-.009],[.08,.076,-.009],.012,.012,{bevel:.003});
  return woodMesh(b,'二枚刃の台鉋');
}
function shaving(){
  const b=hokoraCarpentry(),n=42;
  const point=(i,side)=>{
    const t=i/n,r=.055*t,a=t*Math.PI*3.6;
    return [side*(.032+.003*Math.sin(t*6))+.015*t,.070+r*(1-Math.cos(a)),.016+.062*t+r*Math.sin(a)];
  };
  for(let i=0;i<n;i++)b.face('wood','#e2cda9',[point(i,-1),point(i,1),point(i+1,1),point(i+1,-1)],
    {grain:'z',uvs:[[i/n,0],[i/n,.128],[(i+1)/n,.128],[(i+1)/n,0]]});
  return woodMesh(b,'鉋口から巻く薄い削り華');
}
function pinnedJoint(b){
  const z=-.015,x=.06,w=.19,d=.19;
  // Two half-laps, with an actual open square through the top rail for the peg.
  timber(b,0,.05,z,1.16,.10,d,'x',6);
  for(const side of [-1,1]){
    const lo=side<0?-.58:x+w*.5,hi=side<0?x-w*.5:.58;
    timber(b,(lo+hi)/2,.15,z,hi-lo,.10,d,'x',6);
    const a=side<0?-.32:z+d/2,c=side<0?z-d/2:.34;
    timber(b,x,.05,(a+c)/2,w,.10,c-a,'z',12,'#bea17a');
    timber(b,x+side*.0605,.15,.01,.069,.10,.66,'z',12,'#bea17a');
    const m=side<0?-.32:z+.026,n=side<0?z-.026:.34;
    timber(b,x,.15,(m+n)/2,.052,.10,n-m,'z',12,'#bea17a');
  }
}
export function makeCraftBay(cut,h,heights){
  const group=new Group(),b=hokoraCarpentry(),loose=hokoraCarpentry();
  group.add(bench(heights,h,cut.tool==='saw'));
  let tool,chip,firstShaving,offcut,pin;
  if(cut.tool==='saw'){
    const set=(form,begin,end)=>cut.bamboo?bamboo(form,begin,end,3):
      timber(form,(begin+end)/2,.071,0,end-begin,.142,.165,'x',3);
    set(b,-.79,.318);set(loose,.322,.67);
    offcut=woodMesh(loose,'挽き落とす木端');offcut.position.y=h;group.add(offcut);
    if(cut.bamboo){
      for(const x of [-.55,-.25])for(const sign of [-1,1])
        b.box('wood','#b49f79',[x,.017,sign*.061],[.075,.035,.045],{rotation:[sign*.47,0,0],bevel:.003,grain:'x'});
    }
    tool=makePullSaw(.91);
  }else if(cut.tool==='plane'){
    timber(b,0,.040,0,.246,.080,1.28,'z',4);
    b.box('wood','#9b7d59',[0,.023,.663],[.253,.046,.042],{bevel:.004,grain:'x'});
    tool=planeTool();chip=shaving();tool.add(chip);
    firstShaving=shaving();group.add(firstShaving);
  }else{
    pinnedJoint(b);
    loose.box('wood','#a78c67',[0,-.083,0],[.048,.166,.048],{grain:'y',seed:9,bevel:.0015});
    loose.box('endGrain','#bba17d',[0,-.0004,0],[.046,.001,.046],{grain:'y',seed:9,bevel:.0004});
    pin=woodMesh(loose,'継ぎ手の木栓');group.add(pin);
    tool=makeJoinersMallet();
  }
  const stock=woodMesh(b,'加工中の部材');stock.position.y=h;group.add(stock,tool);
  return {group,update(f){
    tool.position.fromArray(f.position);tool.rotation.set(...f.rotation,'XYZ');
    if(offcut)offcut.position.set(.018*f.fall,h-.059*f.fall,0);
    if(chip){
      chip.visible=f.shave>.001;chip.geometry.setDrawRange(0,Math.floor(f.shave*42)*6);
      // The first curl slides out of the iron during the return and comes
      // to rest on the bench beside the plank. The second stays in the mouth.
      firstShaving.visible=f.progress>=.4;
      firstShaving.position.set(.20*f.shed,f.workTop-.150*f.shed*f.shed,.34+.025*f.shed);
    }
    if(pin)pin.position.set(.06,f.workTop+.109-f.pin,-.015);
  },dispose(){
    group.traverse(m=>{if(m.geometry)m.geometry.dispose();});
    if(cut.tool==='saw')tool.material.dispose();
  }};
}
