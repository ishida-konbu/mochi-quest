import * as T from './vendor/three.module.min.js';
import { registerFallingWater, jetContacts, interceptedJetGLSL } from './falling-water-contact.js';
import { washCurtain } from './bath-pavilion-art.js';
import { SNOW_SPRING as bath, SPRING_STONES, BATH_STEPS } from './terrain.js';

// Snow settles on the ledges above the exposed, mineral-stained waterline.
export function dressSnowBath(p,frame,light) {
  const f=frame(p,bath.x,bath.z,0,bath.level);
  const rock=['#858076','#686e6b','#7b7772','#8e887d','#767d7c'];
  for(const {x,z,w,h,d,yaw,roll,index:i} of SPRING_STONES) {
    f.part('rock',x,.18,z,w,h,d,rock[i%rock.length],p.stone,yaw,0,roll);
    f.part('rock',x-.03,.20+h*.80,z-.04,w*.96,h*.29,d*.93,'#edf3ef',p.fine,yaw);
    if(i%4===1)f.part('rock',x*.92,-.12,z*.92,.39,.37,.55,'#82928b',p.stone,yaw);
  }
  for(const {top,z} of BATH_STEPS) {
    f.part('box',0,top-.085,z,2.64,.17,.52,'#a29c84',p.stone);
    f.part('box',0,top-.019,z+.244,2.52,.04,.045,'#bfc0a5',p.stone);
  }
  for(const sign of [-1,1]) {
    for(const step of [BATH_STEPS[0],BATH_STEPS[5]]) f.part('round',sign*1.33,step.top+.36,step.z,.049,.72,.049,'#8e7754',p.wood);
    f.link([sign*1.33,BATH_STEPS[0].top+.71,BATH_STEPS[0].z],[sign*1.33,BATH_STEPS[5].top+.71,BATH_STEPS[5].z],.065,'#aa9070',p.wood);
  }
  // A cedar washing pavilion overlooks the north edge. Snow lies on the
  // roof crest and eaves, while the open bays show the tubs and hand pails.
  const py=.52, pz=-8.9;
  for(let j=0;j<17;j++) f.part('box',(j-8)*.46,py,pz,.445,.18,3.1,'#a58964',p.deck);
  for(const x of [-3.67,0,3.67]) for(const z of [-1.13,1.06]) {
    f.part('box',x,py+1.75,pz+z,.19,3.50,.19,'#745640',p.wood);
    f.part('box',x,py+.11,pz+z,.36,.27,.37,'#8e8d81',p.stone);
  }
  for(const z of [-1.13,1.06])f.part('box',0,py+3.32,pz+z,8.35,.29,.28,'#735445',p.wood);
  // The wind-formed cornice, rafters and icicles are part of the lodge's
  // sculpted roof. Its six posts and floor have matching winter solids.
  const cloth=washCurtain({dye:'#556877',motif:'雪灯'},'snow');
  f.link([-3.55,py+3.12,pz+1.12],[-.48,py+3.12,pz+1.12],.043,'#72644b',p.wood);
  f.part('plane',-2.02,py+2.58,pz+1.12,2.87,.98,1,'#fff',cloth);
  for(let j=0;j<28;j++) {
    const x=(j-13.5)*.294;
    f.part('pole',x,py+1.54,pz-1.30,.102,2.91,.102,'#ae9a6d',p.wood);
    for(let k=0;k<4;k++)f.part('round',x,py+.45+k*.65+(j%3)*.04,pz-1.30,.112,.031,.112,'#877751',p.wood);
  }
  for(const x of [-2.55,.82,2.68]){
    f.part('vase',x,py+.13,pz+.03,.28,.38,.28,'#ac8860',p.wood);
    f.part('round',x,py+.47,pz+.03,.222,.014,.222,'#746148',p.wood);
    f.part('round',x,py+.49,pz+.03,.192,.013,.192,'#acc6bf',p.fine);
    f.link([x-.27,py+.57,pz+.03],[x+.27,py+.57,pz+.03],.027,'#705842');
    f.part('box',x,py+.28,pz+.81,.65,.10,.35,'#b0926f',p.deck);
    for(const sign of [-1,1]) f.part('box',x+sign*.23,py+.16,pz+.81,.079,.21,.28,'#836548',p.wood);
  }
  // Three fluted wooden flumes empty into the garden, over a mineral sill.
  for(let j=-1;j<=1;j++) {
    const x=8.85+j*.67,z=-4.60;
    f.part('rock',x,1.09,z-.83,.82,1.56,1.16,'#858377',p.stone,j*.38);
    f.part('rock',x,2.37,z-.85,.76,.33,1.0,'#e4eeec',p.fine,j*.38);
    f.part('box',x,1.46,z,.43,.16,1.66,'#a2865e',p.wood);
    for(const side of [-1,1]) f.part('box',x+side*.22,1.57,z,.07,.20,1.66,'#92784f',p.wood);
  }
  // Stone tōrō keep their flames recessed in the firebox.
  for(const [x,z] of [[-11.7,4.8],[-13,-4],[6.4,7.9],[13.1,-1.4]]) {
    f.part('rock',x,.36,z,.70,.34,.65,'#93998d',p.stone);
    f.part('round',x,.98,z,.21,1.13,.21,'#9a9c90',p.stone);
    f.part('box',x,1.52,z,.78,.18,.71,'#898e82',p.stone);
    f.part('box',x,1.84,z,.45,.49,.43,'#edb67b',light);
    for(const dx of [-.24,.24]) for(const dz of [-.22,.22])
      f.part('box',x+dx,1.82,z+dz,.105,.58,.103,'#878b80',p.stone);
    f.part('kasa',x,2.06,z,.56,.42,.51,'#868a81',p.stone);
    f.part('kasa',x,2.14,z,.55,.42,.51,'#f0f1e7',p.fine);
    f.part('finial',x,2.47,z,.22,.46,.22,'#888d82',p.stone);
  }
  const cx=-14.8,cz=0;
  for(const v of [-1.23,1.23]) {
    f.part('box',cx,1.73,cz+v,.155,3.33,.15,'#725b43',p.wood);
  }
  f.link([cx,3.30,cz-1.46],[cx,3.30,cz+1.46],.074,'#8a7255',p.wood);
  for(const sign of [-1,1]) f.part('box',cx,2.74,cz+sign*.56,.054,1.03,1.08,'#745057',p.fine);
  const c=document.createElement('canvas');c.width=c.height=256;const g=c.getContext('2d');
  g.fillStyle='#f2e0b7';g.font='190px "Hiragino Mincho ProN","Yu Mincho",serif';g.textAlign='center';g.fillText('ゆ',128,183);
  g.fillRect(12,209,232,3);g.fillRect(35,218,186,1);
  const map=new T.CanvasTexture(c);map.colorSpace=T.SRGBColorSpace;
  const sign=new T.MeshLambertMaterial({map,side:T.DoubleSide,transparent:true,alphaTest:.1});
  f.part('plane',cx-.034,2.75,cz,1.38,.93,1,'#fff',sign,-Math.PI/2,0,0,false);
}

// Falling water is a thin undulating sheet. A broken white ripple expands from
// each impact without allocating new objects during play.
export function addFlumes(parent) {
  const time={value:0};
  const mat=new T.ShaderMaterial({
    uniforms:{clock:time,jetContacts},transparent:true,side:T.DoubleSide,depthWrite:false,
    vertexShader:'varying vec2 v; varying vec3 worldFlow; uniform float clock;void main(){v=uv;vec3 p=position;p.x+=.024*sin(p.y*12.+clock*4.6)*uv.y;worldFlow=(modelMatrix*vec4(p,1.)).xyz;gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.);}',
    fragmentShader:interceptedJetGLSL+`varying vec3 worldFlow; varying vec2 v;uniform float clock;
      void main(){float streak=sin(v.x*46.+3.*sin(v.y*7.+clock*6.)+clock*.8);
        float fade=smoothstep(0.,.18,v.x)*smoothstep(0.,.18,1.-v.x);
        gl_FragColor=vec4(mix(vec3(.38,.59,.57),vec3(.90,.95,.87),.58+.35*streak),fade*.80*fallingCoverage(worldFlow));
        #include <colorspace_fragment>
      }`,
  });
  const paths=[],rings=[],geo=new T.PlaneGeometry(.38,1.50,6,13),ring=new T.RingGeometry(.92,1,42);
  ring.rotateX(-Math.PI/2);
  for(let j=-1;j<=1;j++){
    const x=8.85+j*.67,z=-3.74;
    const spill=new T.Mesh(geo,mat);spill.position.set(x,1.33,z);spill.rotation.x=.07;parent.add(spill);
    spill.updateMatrix();
    paths.push({width:.19,points:[.75,-.75].map(y=>new T.Vector3(0,y,0).applyMatrix4(spill.matrix).add(new T.Vector3(0,-.61,0)))});
    const m=new T.MeshBasicMaterial({color:'#e0e9db',transparent:true,depthWrite:false});
    const swirl=new T.Mesh(ring,m);swirl.position.set(x,.626,z+.08);parent.add(swirl);rings.push(swirl);
  }
  registerFallingWater(bath,'flumes',paths);
  return t=>{time.value=t;for(const [i,r] of rings.entries()) {
    const age=(t*1.05+i*.33)%1;r.scale.setScalar(.12+age*.61);r.material.opacity=(1-age)*.55;
  }};
}
