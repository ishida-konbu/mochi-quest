import * as T from './vendor/three.module.min.js';
import { skinGeometry } from './ryugu-sculpt.js';
import { bathFinish } from './bath-material-study.js';
import { sculpture } from './pilgrimage-pigment.js';
import { SAZAE_POOL, SHELL_STEPS } from './ryugu-shell-bath.js';

const {sin,cos,PI,exp}=Math,tau=2*PI;
const vec=(x,y,z)=>new T.Vector3(x,y,z);

// A dextral logarithmic tube ends with its aperture turned towards the sky.
// The spire grows obliquely away from the opening, leaving the bather room.
function whorl(t,a) {
  const k=exp(.213*t), ca=cos(a),sa=sin(a),ct=cos(t),st=sin(t);
  const cord=1+.029*cos(14*a+.34*sin(2*t))+.012*cos(28*a-t*.06)+.018*sin(3*a-.4);
  const mouth=1.39+.07*ca-.31*Math.max(sa,0)**6;
  const radial=(.98+1.32*sa*cord)*k;
  const x=-2.79*(1-k)+k*1.48*ca*cord;
  let y=mouth*k+2.54*(1-k)+st*radial;
  const z=-1.03*(1-k)-.98+ct*radial;
  // A straight mathematical tube overlaps its previous whorl on the inner
  // turn. The living shell resorbs this wall to leave the aperture hollow.
  const r=Math.hypot(x/SAZAE_POOL.rx,z/SAZAE_POOL.rz);
  const cap=.23+.59*r**4+1.5*T.MathUtils.smoothstep(r,.96,1.20);
  y-=Math.max(0,y-cap)*T.MathUtils.smoothstep(-t,.02,.31);
  return vec(x,Math.max(.055,y),z);
}

function skin(parent,name,geometry,material) {
  const mesh=new T.Mesh(geometry,material);
  mesh.name=name;mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);
  return mesh;
}

function addWhorls(group) {
  const map=new T.TextureLoader().load(new URL('./assets/world/sazae-calcite.webp',import.meta.url).href);
  map.wrapS=map.wrapT=T.RepeatWrapping;map.colorSpace=T.SRGBColorSpace;map.anisotropy=8;
  const outer=new T.MeshStandardMaterial({map,bumpMap:map,bumpScale:.032,
    color:0xfff4de,roughness:.70,side:T.DoubleSide});
  const resorbed=outer.clone();
  resorbed.onBeforeCompile=shader=>{
    shader.vertexShader='varying vec3 sazaePoint;\n'+shader.vertexShader.replace('#include <begin_vertex>',
      '#include <begin_vertex>\nsazaePoint=position;');
    shader.fragmentShader='varying vec3 sazaePoint;\n'+shader.fragmentShader.replace('#include <clipping_planes_fragment>',`#include <clipping_planes_fragment>
      vec2 mouth=sazaePoint.xz/vec2(1.48,1.32);
      float angle=atan(mouth.y,mouth.x);
      float edge=1.+.029*cos(14.*angle)+.012*cos(28.*angle)+.018*sin(3.*angle-.4);
      if(length(mouth)<edge*1.001 && sazaePoint.y>.25)discard;`);
  };
  const rows=152,columns=112;
  const coil=skinGeometry(rows,columns,(u,v)=>{
    const t=-20.1*(1-v)**1.37,a=tau*u,p=whorl(t,a);
    return [p.x,p.y,p.z,u,t/tau];
  },true,true);
  const depth=new T.MeshDepthMaterial({depthPacking:T.RGBADepthPacking,side:T.DoubleSide});
  depth.onBeforeCompile=resorbed.onBeforeCompile;
  skin(group,'螺塔・褐緑の成長紋と螺肋',coil,resorbed).customDepthMaterial=depth;
  // The body whorl widens below the lip before curling under the foot.
  // These profiles also expose a full painted shell on the columellar side.
  const bodyProfile=[[1,1],[1.022,.94],[1.09,.75],[1.10,.51],[1.04,.33],
    [.93,.18],[.72,.075],[.45,.025],[.01,.025]];
  const belly=skinGeometry(bodyProfile.length-1,columns,(u,v)=>{
    const a=tau*u,[width,height]=bodyProfile[Math.round(v*(bodyProfile.length-1))],mouth=whorl(0,a);
    const rib=1+.019*sin(17*a+2.7*v)*sin(v*PI);
    return [mouth.x*width*rib-.09*v,mouth.y*height,mouth.z*width*rib-.22*v,
      u+.074*sin(PI*v),-.16-.65*v+.10*sin(a)*sin(PI*v)];
  },false,true);
  skin(group,'太く張り出す体層',belly,outer);

  // A turban shell has hollow, backward-swept spines. Start their flared
  // skirts on the parent whorl's true normal, then turn each tip inside.
  const hornPoints=[],hornNormals=[],hornUV=[],hornFaces=[],hornTone=[];
  function horn(p,along,across,normal,k,extent,lean) {
    if(p.y+normal.y*extent<.08)return;
    const geom=skinGeometry(12,16,(u,v)=>{
      const angle=tau*u,inside=v>.835;
      const len=inside?1-(v-.835)*2.78:v/.835;
      const base=(.28-.238*len**.67+.015*sin(len*PI*3))*k*(inside?.65:1);
      const taper=base*(1+.065*cos(angle*6+len));
      const point=p.clone().addScaledVector(normal,-.033*k+extent*(len-.15*len*len))
        .addScaledVector(along,-extent*(.19*len+.43*len*len))
        .addScaledVector(across,lean*extent*len*len);
      point.addScaledVector(along,cos(angle)*taper).addScaledVector(across,sin(angle)*taper*.78);
      const patina=.89+.13*sin(angle*5+.47*len)*sin(PI*len);
      const shade=inside?.52:.83+.38*len;
      hornTone.push(shade*patina,shade*patina*(1-.06*len),shade*patina*(1-.19*len));
      return [point.x,Math.max(.03,point.y),point.z,u,inside?.26:1.05-.29*len];
    },false,true);
    const first=hornPoints.length/3;
    hornPoints.push(...geom.attributes.position.array);hornNormals.push(...geom.attributes.normal.array);
    hornUV.push(...geom.attributes.uv.array);
    for(const j of geom.index.array)hornFaces.push(j+first);
    geom.dispose();
  }
  for(const [band,count] of [[1.28,17],[2.31,12]]) {
    for(let i=0;i<count;i++){
      const t=-.45-i*.77+(band>2?-.23:0),a=band+.11*sin(i*3.23);
      const p=whorl(t,a),k=exp(.213*t);
      const along=whorl(t+.011,a).sub(whorl(t-.011,a)).normalize();
      const across=whorl(t,a+.011).sub(whorl(t,a-.011)).normalize();
      const normal=along.clone().cross(across).normalize();
      const expected=vec(cos(a),sin(t)*sin(a),cos(t)*sin(a));
      if(normal.dot(expected)<0)normal.negate();
      const extent=(band>2?.44:.71)*k*(.86+.21*sin(i*1.91+.5));
      horn(p,along,across,normal,k,extent,band>2?-.14:.23);
    }
  }
  for(const a of [-2.68,-1.84,-.95,-.17,.59,2.58]){
    const rim=whorl(0,a),point=vec(rim.x*1.065,rim.y*.77,rim.z*1.065-.05);
    const normal=vec(cos(a),.85,sin(a)).normalize(),along=vec(-sin(a),0,cos(a));
    horn(point,along,normal.clone().cross(along).normalize(),normal,.93,.68+.19*cos(3*a),-.25);
  }
  const horns=new T.BufferGeometry();
  for(const [name,values,width] of [['position',hornPoints,3],['normal',hornNormals,3],['uv',hornUV,2]])
    horns.setAttribute(name,new T.Float32BufferAttribute(values,width));
  horns.setAttribute('color',new T.Float32BufferAttribute(hornTone,3));
  const tips=resorbed.clone();tips.vertexColors=true;tips.onBeforeCompile=resorbed.onBeforeCompile;
  horns.setIndex(hornFaces);skin(group,'二列の棘と摩耗した筒先',horns,tips).customDepthMaterial=depth;
}

function addNacre(group) {
  const palette=['#baaa81','#f0dbb3','#fff1ce','#d6ddc6','#b7d1c7','#ede0c7','#b0b3b4',
    '#d2cfc1','#a4c7bf','#91aca7','#658e89','#597875'];
  // The return folds around the rough outer edge. Deeper bands meet the
  // water circle exactly, leaving a pale, polished collar above its surface.
  const rings=[[1,0],[1.018,.041],[1.009,.088],[.986,.119],[.961,.117],
    [.941,.084],[.927,.023],[.922,-.033],[.911,-.12],[.892,-.31],[.70,-.66],[.004,-.97]];
  const colors=[],c=new T.Color();
  const shell=skinGeometry(rings.length-1,112,(u,v)=>{
    const a=u*tau,j=Math.round(v*(rings.length-1)),[scale,h]=rings[j],rim=whorl(0,a);
    const polish=.5+.5*sin(4*a+v*2.4+sin(a*3+.5));
    const point=rim.clone().multiplyScalar(scale);
    const depth=SAZAE_POOL.y+.012;
    let y=rim.y+h;
    if(j===8)y=depth+.045;
    if(j===9)y=depth-.045;
    if(j===10)y=.43;
    if(j===11)y=.29;
    if(j>=8){
      const inner=[1.025,.985,.7,.004][j-8];
      point.x=SAZAE_POOL.rx*cos(a)*inner;point.z=SAZAE_POOL.rz*sin(a)*inner;
    }
    c.set(palette[j]).lerp(new T.Color(j<7?'#e6cfc1':'#b1bcb7'),.28*polish);
    colors.push(c.r,c.g,c.b);
    return [point.x,y,point.z,u,v];
  },true,true);
  shell.setAttribute('color',new T.Float32BufferAttribute(colors,3));
  const nacre=new T.MeshPhysicalMaterial({vertexColors:true,roughness:.32,iridescence:.39,
    iridescenceIOR:1.38,iridescenceThicknessRange:[170,385],clearcoat:.34,clearcoatRoughness:.26,
    side:T.DoubleSide});
  nacre.onBeforeCompile=shader=>{
    shader.vertexShader='varying vec2 nacreGrowth;\n'+shader.vertexShader.replace('#include <begin_vertex>',
      '#include <begin_vertex>\nnacreGrowth=uv;');
    shader.fragmentShader='varying vec2 nacreGrowth;\n'+shader.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
      float angle=6.2831853*nacreGrowth.x, depth=nacreGrowth.y;
      float pearl=depth*64.+1.7*sin(3.*angle)+.8*sin(9.*angle+depth*6.);
      float lamina=.5+.5*sin(pearl);
      diffuseColor.rgb*=mix(vec3(.96,1.015,1.015),vec3(1.035,.965,.98),lamina);
      diffuseColor.rgb+=vec3(.055,.052,.040)*pow(lamina,9.);
    `);
  };
  skin(group,'殻口・真珠層と湯の底',shell,nacre);
}

function addStepsAndOperculum(group) {
  const art=sculpture(),timber=sculpture();
  for(const [i,q] of SHELL_STEPS.entries()){
    const wet=i>4;
    for(let j=0;j<3;j++){
      const w=q.w/3-.014,x=(j-1)*q.w/3;
      const riser=q.h-.06;
      timber.box(wet?'#828e74':'#896246',x,riser/2,q.v,w-.012,riser,q.d-.022);
      timber.box(wet?'#aab095':['#d0af79','#c4a271','#d5ba8b'][(j+i)%3],
        x,q.h-.030,q.v,w,.06,q.d);
      for(const side of [-1,1]){
        timber.stroke(wet?'#868a76':'#a98a64',[[x+side*.108,q.h+.003,q.v-q.d*.40],
          [x+side*.087,q.h+.004,q.v],[x+side*.115,q.h+.003,q.v+q.d*.39]],[.001,.006,.001],6);
      }
      if(j!==1)timber.ball('#82765d',x,q.h+.005,q.v+.14,.023,.007,.023);
    }
  }
  // The foremost edge of each dry tread is a shell inlay, set into a
  // shallow rebate. Smaller flakes change direction across the joint.
  for(const [i,step] of SHELL_STEPS.slice(0,5).entries()){
    const chips=14;
    for(let j=0;j<chips;j++){
      const span=step.w*.86/chips,x=-span*chips*.5+span*(j+.5);
      const g=skinGeometry(2,6,(u,v)=>{
        const t=2*u-1,arc=.019*(1-t*t);
        return [x+t*span*.46,step.h+.0023,step.v+.32*step.d+arc+(v-.5)*.018*(1-.7*t*t),u,v];
      },false,true);
      art.add(g,['#b9cab7','#e1d0b4','#cac6af','#aebdb3'][(j+3*i)%4]);
    }
  }
  skin(group,'海水で磨かれた檜の踏段',timber.finish(),bathFinish('cedar'));
  // The detached operculum, convex like a cat's eye, rests on a small
  // lacquer stand. An eccentric spiral is incised in its cream outer face.
  const lid=new T.Group();
  lid.position.set(1.71,.81,-.79);lid.rotation.set(-.12,-.38,.24);group.add(lid);
  const lidArt=sculpture();
  lidArt.ball('#776851',0,0,0,.59,.62,.14);
  lidArt.ball('#b3ab84',0,0,.031,.57,.61,.151);
  lidArt.ball('#e1d2aa',0,0,.087,.54,.58,.126);
  const knots=[];
  for(let j=0;j<=50;j++){
    const f=j/50,a=f*PI*6+.23,r=.024+.475*f**1.15;
    const x=-.09*(1-f)+r*cos(a),y=-.07*(1-f)+1.06*r*sin(a);
    knots.push([x,y,.089+.126*Math.sqrt(Math.max(.002,1-(x/.54)**2-(y/.58)**2))]);
  }
  lidArt.stroke('#9e8e72',knots,knots.map((_,i)=>.003+.01*i/50),90);
  const painted=new T.MeshStandardMaterial({vertexColors:true,roughness:.64,side:T.DoubleSide});
  skin(lid,'猫目の蓋・渦の刻み',lidArt.finish(),painted);
  art.box('#674a3c',1.71,.09,-.77,1.16,.18,.56);
  for(const side of [-1,1])art.stroke('#8c5940',[[1.71+side*.43,.14,-.93],
    [1.71+side*.39,.36,-.74],[1.71+side*.34,.42,-.52]],[.065,.048,.030],9);
  skin(group,'漆の蓋立てと踏段の螺鈿',art.finish(),painted);
}

function addNameboard(group) {
  const c=document.createElement('canvas');c.width=512;c.height=128;
  const g=c.getContext('2d');
  g.fillStyle='#d2bd96';g.fillRect(0,0,512,128);
  g.textBaseline='middle';g.textAlign='center';
  g.font='bold 63px "Yu Mincho","Hiragino Mincho ProN",serif';g.fillStyle='#42392f';g.fillText('栄螺の壺湯',248,66);
  g.fillStyle='#97513c';g.fillRect(445,76,26,26);
  g.font='bold 19px serif';g.fillStyle='#efe2c1';g.fillText('湯',458,90);
  const map=new T.CanvasTexture(c);map.colorSpace=T.SRGBColorSpace;map.anisotropy=4;
  const frame=new T.Group();frame.position.set(1.85,0,.65);frame.rotation.y=-.28;group.add(frame);
  const wood=sculpture();wood.box('#6f5844',0,.35,0,.10,.70,.10);
  wood.box('#534b3e',0,.74,0,1.24,.37,.084);
  skin(frame,'湯札の木枠',wood.finish(),new T.MeshLambertMaterial({vertexColors:true}));
  const sign=new T.Mesh(new T.PlaneGeometry(1.18,.31),new T.MeshLambertMaterial({map}));
  sign.name='栄螺の壺湯の湯札';sign.position.set(0,.74,.046);frame.add(sign);
}

export function addSazaeBath(parent) {
  const bath=new T.Group();bath.name='栄螺の壺湯';parent.add(bath);
  addWhorls(bath);addNacre(bath);addStepsAndOperculum(bath);addNameboard(bath);
}
