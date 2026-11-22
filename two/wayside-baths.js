import * as T from './vendor/three.module.min.js';
import { RETREATS, retreatStones, sitePoint } from './retreat-layout.js';
import { waterSurfaceAt,terrainHeight } from './terrain.js';
import { workshopFrame, inscriptionMaterial } from './civic-art.js';
import { roundedStone } from './pigments.js';
import { sculpture, brushStroke } from './pilgrimage-pigment.js';
import { dressRegionalBath } from './regional-bath-art.js';

const {PI,sin,cos}=Math;
const palettes={
  cedar:['#747b68','#899077','#686f64','#72816b'],
  reed:['#a7a088','#8d8775','#9e9985','#9a927e'],
  peach:['#a19786','#b2a997','#8c8b79','#a99688'],
  slate:['#777c7b','#8f9591','#606766','#88908b'],
  coast:['#a3a69c','#8e9991','#c0b8a2','#909d97'],
  maple:['#797f6f','#989386','#78786d','#968969'],
};
function curtain() {
  const g=new T.PlaneGeometry(1,1,26,12),pos=g.attributes.position;
  for(let i=0;i<pos.count;i++){
    const x=pos.getX(i),y=pos.getY(i),lo=.5-y;
    pos.setXYZ(i,x,y+.034*lo*lo*cos(x*8),(.028+.075*lo)*sin(x*9+.43*lo)-lo*lo*.08);
  }
  g.computeVertexNormals();return g;
}
function tools(p,f,x,z) {
  f.put('bathPail',x,.28,z,.26,.39,.26,'#ac8c63',p.wood);
  for(const y of [.34,.58]) f.put('bathBand',x,y,z,.257,.036,.257,'#686657',p.fine);
  f.bar([x-.24,.7,z],[x+.24,.7,z],.028,'#725c45');
  f.put('box',x+.74,.61,z,.77,.09,.41,'#ab9067',p.deck);
  for(const side of [-1,1]) f.put('box',x+.74+side*.26,.455,z,.09,.24,.33,'#826748');
  f.put('bathPail',x+.68,.67,z,.095,.11,.095,'#beab76');
  f.bar([x+.74,.755,z],[x+1.14,.81,z+.09],.021,'#9e875c');
}
function bathhouse(p,f,s,cloth) {
  const cedar='#8d7457',beam='#6f604a',z=-5.2;
  for(let j=0;j<16;j++)f.put('box',(j-7.5)*.39,.17,z,.38,.2,3.14,'#b8a07b',p.deck);
  for(const u of [-2.9,2.9]) for(const v of [-6.5,-3.9]){
    f.put('rock',u,.13,v,.29,.25,.28,'#8c9282',p.stone);
    f.put('box',u,1.85,v,.19,3.18,.19,beam);
    f.bar([u,2.67,v],[u-Math.sign(u)*.59,3.24,v],.065,cedar,p.wood,true);
  }
  for(const v of [-6.51,-3.83])f.put('box',0,3.20,v,6.50,.21,.24,beam);
  const thatch=s.kind==='peach';
  f.put('roof',0,3.35,z,7.23,1.64,4.4,thatch?'#a29472':'#78776a',thatch?p.thatch:p.roofs);
  for(const side of [-1,1]) {
    for(let k=-6;k<=6;k++)f.bar([k*.51,3.24,z+side*1.46],[k*.51,3.31,z+side*2.14],.053,cedar,p.wood,true);
    f.bar([-3.49,3.37,z+side*2.11],[3.49,3.37,z+side*2.11],.089,beam);
  }
  // A rolled bamboo blind over the changing bench with two hemp lashings.
  for(let j=0;j<28;j++){
    const u=(j-13.5)*.21,y=1.47+.05*sin(j*4.67);
    f.put('round',u,y,-6.53,.091,2.56,.083, j%3?'#aa9b76':'#998c66');
  }
  for(const y of [.73,1.64,2.73])f.bar([-2.97,y,-6.42],[2.97,y,-6.42],.034,beam);
  f.put('round',0,2.97,-6.42,.18,6.1,.18,'#a79b75',p.wood,0,0,PI/2);
  f.bar([-2.67,3.08,-3.83],[-.25,3.08,-3.83],.041,'#776442');
  for(let i=0;i<3;i++)
    f.put('springCurtain',-2.29+i*.77,2.53,-3.82,.75,1.04,.92,'#e8decb',cloth[i],0,0,.009*sin(i));
  tools(p,f,1.05,-4.97);
}
function inlet(p,f,s) {
  const u=-s.rx*.71,v=-s.rz*.51;
  const wood=s.hut||s.kind==='reed';
  f.put('rock',u,.41,v-.75,.88,1.01,.79,'#858d7c',p.stone,-.3);
  if(wood) {
    f.put('springGutter',u,1.04,v,.21,1.64,.21,'#ad9670',p.wood,0,PI/2-.07);
    for(const dz of [-.38,.18])f.put('bathBand',u,1.04,v+dz,.219,.057,.219,'#736e54',p.fine,0,PI/2-.07);
  } else {
    f.put('rock',u,.91,v,.53,.21,.91,'#8c897a',p.stone,.08,-.08);
  }
  f.put('springTrickle',u,.011,v+.83,1,1,1,'#c4d9c7',p.springFlow);
}
function pampas() {
  const form=sculpture();
  for(let i=0;i<12;i++){
    const a=i*2.4,x=cos(a),z=sin(a),h=.93+.45*(1+sin(i*3.8));
    const knots=[[0,-.04,0],[x*.05,h*.45,z*.07],[x*.17,h*.77,z*.14],[x*.34,h,z*.3]];
    form.stroke('#8e8562',knots,[.010,.015,.009,.004],8);
    if(i%2===0)for(let j=0;j<8;j++){
      const t=j/9,y=h+j*.029;
      const ox=x*(.33+.18*t),oz=z*(.29+.12*t);
      form.stroke(j%3?'#c5b28c':'#e3d3ad',[[ox,y,oz],[ox+x*.117,y+.09,oz+z*.075],[ox+x*(.19-.14*t),y+.16,oz+z*.14]],
        [.011,.018,.002],5);
    }
    form.stroke('#919072',[[0,.012,0],[.18*x,.58,.14*z],[.40*x,.87,.49*z],[.70*x,.70,.69*z]], [.009,.035,.017,.002],7);
  }
  return form.finish();
}
function plants(p,f,s) {
  for(let j=0;j<5;j++) {
    const u=s.rx*.60+j*.43,v=-s.rz*.8+.105*j*j,angle=j*2.4;
    if(s.kind==='slate'||s.kind==='coast') {
      f.put('springCrag'+(j%3),u,.39,v,.63+j*.07,.77+j*.081,.51,palettes[s.kind][j%4],p.stone,angle);
    } else {
      f.put('rock',u,.19,v,.75,.34,.62,palettes[s.kind][j%4],p.stone,angle);
      for(let k=0;k<3;k++){
        const a=angle+k*2;
        f.put('leaf',u+.15*cos(a),.36,v+.16*sin(a),.47,.75+.11*k,.45,'#899076',p.solid,a,.17);
      }
    }
  }
  if(s.kind==='reed') {
    for(let i=0;i<22;i++) {
      const a=PI+.108*i,w=1+.23*sin(i*1.8),u=(s.rx+1.5+.7*cos(i*2.2))*cos(a),v=(s.rz+1.55)*sin(a);
      const [x,z]=sitePoint(s,u,v),y=terrainHeight(x,z)-waterSurfaceAt(s.x,s.z);
      f.put('waysidePampas',u,y,v,w,w,w,'#fff',p.stems,i*2.4);
    }
  }
  if(s.kind==='slate'||s.kind==='maple'){
    for(let i=0;i<9;i++){
      const u=-4.3+.83*i,v=-4.15-.35*cos(i*.7),height=(1+.58*sin(i*.64))*(s.kind==='slate'?1.8:1);
      f.put('springCrag'+(i%3),u,height*.28,v,1.2+.4*cos(i*.7),height,1.12,palettes[s.kind][i%4],p.stone,i*.17,.11,-.18);
    }
  }
  // Petals or maple leaves collect on the quiet lip away from the inlet.
  if(s.kind==='peach'||s.kind==='maple')for(let j=0;j<12;j++){
    const a=.38+j*.21,r=.72+.13*sin(j*2.4);
    f.put('ball',r*cos(a)*s.rx,.019,r*sin(a)*s.rz,.062,.009,.032,
      s.kind==='peach'?'#dec0ac':j%3?'#ad7552':'#b18851',p.fine,j);
  }
}
export function dressWaysideBaths(p) {
  const vector=a=>a.map(v=>new T.Vector2(...v));
  p.shapes.springCurtain=curtain();
  p.shapes.waysidePampas=pampas();
  p.shapes.bathPail=new T.LatheGeometry(vector([[.68,0],[.87,.06],[1,.91],[1,1],[.92,1],[.82,.16],[.03,.16]]),24);
  p.shapes.bathBand=new T.CylinderGeometry(1,1,1,24,1,true);
  p.shapes.springGutter=new T.CylinderGeometry(1,1,1,18,1,true,0,PI*1.26);
  p.shapes.springTrickle=brushStroke([[0,1.08,-.02],[.012,.99,.12],[.016,.75,.24],[.033,.38,.32],[.025,0,.34]],
    [.071,.061,.050,.065,.093],22,10);
  p.springFlow=new T.MeshPhysicalMaterial({roughness:.18,clearcoat:.32,transparent:true,opacity:.76,depthWrite:false});
  p.springFlow.onBeforeCompile=shader=>{
    shader.uniforms.springTime=p.sway;
    shader.vertexShader='varying vec3 springLocal;\n'+shader.vertexShader.replace('#include <begin_vertex>',
      '#include <begin_vertex>\nspringLocal = position;');
    shader.fragmentShader='uniform float springTime; varying vec3 springLocal;\n'+shader.fragmentShader.replace('#include <color_fragment>',`
      #include <color_fragment>
      float fall = springLocal.y * 27.0 + springTime * 12.0;
      float glint = pow(.5+.5*sin(fall + sin(springLocal.x*83.0 + fall*.34)), 4.0);
      diffuseColor.rgb += vec3(.16,.19,.18)*glint;
      diffuseColor.a *= .70+.30*glint;
    `);
  };
  for(let i=0;i<3;i++)p.shapes['springCrag'+i]=roundedStone(i*2.59+.42);
  for(const s of RETREATS){
    const level=waterSurfaceAt(s.x,s.z),f=workshopFrame(p,s,level),tints=palettes[s.kind];
    if(s.regional){dressRegionalBath(p,f,s,level);continue;}
    for(const q of retreatStones(s)) {
      const scale=q.scanned?.64:1;
      f.put('springCrag'+(q.i%3),q.u,.075,q.v,q.w*scale,q.h*scale,q.d*scale,tints[q.i%4],p.stone,q.angle,0,.13*sin(q.i));
      if(q.i%4===1){
        // Thin deposits of pale travertine cap the wet ledge at its high side.
        f.put('rock',q.u*.99,.077+.64*q.h,q.v*.99,q.w*.76,q.h*.37,q.d*.76,
          s.kind==='maple'||s.kind==='cedar'?'#949b7d':'#b7b5a1',p.stone,q.angle,0,.13*sin(q.i));
      }
    }
    const dye={cedar:'#5e6b58',peach:'#9b6862',coast:'#566d73'};
    if(s.hut) {
      const dyePot={cloth:true,ground:dye[s.kind],ink:'#e8e0c7'};
      const crest=inscriptionMaterial('♨',dyePot);
      bathhouse(p,f,s,[crest,inscriptionMaterial('ゆ',dyePot),crest]);
    }
    inlet(p,f,s);plants(p,f,s);
    const u=s.rx*.74,v=s.rz*.96;
    f.put('rock',u,.07,v,.45,.21,.40,'#969680',p.stone);
    f.put('box',u,.80,v-.11,.13,1.65,.14,'#76664e');
    f.put('box',u,1.34,v,1.65,.57,.12,'#927654');
    f.put('plane',u,1.34,v+.083,1.56,.49,1,'#fff',
      inscriptionMaterial(s.name,{ground:'#766548',ink:'#ecdfbd'}));
  }
}
