import * as T from './vendor/three.module.min.js';
import { sculpture } from './pilgrimage-pigment.js';
import { brushWash } from './scroll-sculpt.js';
import { WINTER_SKIFF, HULL_DRAFT } from './shoreline.js';
import { WINTER_REEFS } from './winter-reefs.js';
import { WATER_Y, seeded } from './terrain.js';

const ink='#3d403c', straw='#b59c6d', darkStraw='#8e7856';
const fur='#dbcead', frogSkin='#a5a47e', winterWhite='#e3e4d7';

function netHauler(hare) {
  const b=sculpture(), skin=hare?fur:frogSkin, coat=hare?'#677674':'#946c51';
  // Both figures look in +Z. The bent knee plants the body against the
  // thole while the chest and muzzle follow the pull of the wet line.
  for(const sign of [-1,1]) {
    const x=sign*.14;
    b.ball(coat,x,.30,-.01,.18,.23,.21,-.24);
    b.stroke(skin,[[x,.30,.07],[x*1.28,.17,.22],[x*1.36,.085,.36]],[.084,.071,.045],7);
    b.ball(skin,x*1.36,.066,.38,.099,.048,.148);
  }
  b.ball(coat,0,.53,0,.24,.37,.18,-.18);
  b.ball('#514e45',0,.38,.014,.24,.055,.18,-.16);
  for(const sign of [-1,1]) {
    b.stroke('#c6b99b',[[sign*.12,.82,.09],[sign*.085,.70,.17],[-sign*.10,.44,.18]],[.029,.025,.014],7);
    const hand=[sign*.19,.66+(sign>0?.08:0),.48+(sign<0?.075:0)];
    b.stroke(coat,[[sign*.16,.73,.014],[sign*.25,.59,.15],[hand[0],hand[1]-.035,.38]],[.138,.116,.076],9);
    b.stroke(skin,[[hand[0],hand[1]-.025,.35],hand,[hand[0]+sign*.025,hand[1]+.044,hand[2]+.057]],[.061,.055,.024],7);
    for(let j=0;j<3;j++) {
      const x=hand[0]+sign*(j-1)*.024;
      b.stroke(skin,[[x,hand[1]+.03,hand[2]+.018],[x,hand[1]+.05,hand[2]+.08],
        [x,hand[1]+.013,hand[2]+.10]],[.013,.013,.006],4);
    }
  }
  if(hare){
    b.ball(skin,0,.94,.094,.178,.173,.212,-.14);
    b.ball(skin,0,.91,.26,.127,.094,.144);
    b.ball(ink,0,.958,.387,.041,.024,.02);
    b.ball('#eae0c7',0,.35,-.223,.095,.10,.082);
    for(const sign of [-1,1]){
      b.ball(skin,sign*.09,1.24,-.005,.056,.253,.075,-.36,0,-sign*.15);
      b.ball('#ab8975',sign*.095,1.25,.046,.031,.190,.027,-.36,0,-sign*.15);
      b.ball(ink,sign*.155,.996,.191,.019,.026,.029);
      b.stroke(ink,[[sign*.062,.91,.353],[sign*.099,.901,.319],[sign*.13,.905,.281]],[.006,.006,.002],5);
      for(let j=0;j<2;j++) b.stroke(darkStraw,[[sign*.103,.926,.314],[sign*.168,.934+j*.019,.301],
        [sign*.225,.94+j*.040,.274]],[.003,.002,.001],5);
    }
    // A short workman's headcloth, with the knot and ends trailing astern.
    b.ball('#59696d',0,1.065,.083,.165,.043,.177,-.11);
    b.ball('#566466',.13,1.04,-.067,.057,.042,.039);
    b.stroke('#65787b',[[.13,1.04,-.061],[.15,.98,-.16],[.17,.88,-.21]],[.029,.030,.009],7);
  } else {
    b.ball(skin,0,.88,.12,.222,.127,.204);
    b.ball('#d2c6a2',0,.843,.171,.187,.069,.159);
    for(const sign of [-1,1]){
      b.ball(skin,sign*.147,.988,.181,.079,.088,.078);
      b.ball('#c8b889',sign*.187,1.008,.214,.041,.055,.044);
      b.ball(ink,sign*.211,1.012,.228,.024,.026,.03);
      b.stroke(ink,[[sign*.188,.868,.169],[sign*.137,.866,.267],[sign*.046,.865,.312]],[.008,.008,.003],6);
      for(let k=0;k<3;k++) b.ball('#7b816b',sign*(.05+k*.04),.979-k*.006,.012,.015,.009,.019);
    }
  }
  return b.finish();
}

function skiffRig() {
  const b=sculpture();
  // The yard leans away from the stern. Each brail loops over the yard,
  // while the foot of the little square sail stays clear of the fishers.
  b.stroke('#7f694b',[[.12,.15,-.03],[.14,1.76,-.065],[.19,4.62,-.19]],[.078,.052,.027],10);
  b.stroke(straw,[[.12,4.42,-1.26],[.18,4.43,-.19],[.30,4.34,1.14]],[.025,.044,.022],9);
  b.stroke(darkStraw,[[.18,4.44,-.19],[-.10,2.29,-1.40],[-.34,.45,-2.38]],[.014,.009,.012],8);
  b.stroke(darkStraw,[[.18,4.44,-.19],[.26,2.45,1.12],[.24,.5,2.46]],[.014,.009,.012],8);
  for(const sign of [-1,1]){
    b.stroke(straw,[[.17,1.88,sign*1.05],[.27,1.10,sign*1.48],[.31,.39,sign*1.83]],[.012,.012,.011],6);
  }
  // The two haulers have the same rope between their hands. It drops across
  // the gunwale in a shallow bag, with cork floats and a single silver catch.
  b.add(netHauler(true),'#fff',-.21,.145,-1.43,1,1,1,0,.32);
  b.add(netHauler(false),'#fff',-.29,.145,1.32,1,1,1,0,Math.PI-.28);
  const edge=t=>[-.29-.64*Math.sin(Math.PI*t),.81-.28*Math.sin(Math.PI*t),-.9+1.76*t];
  const mesh=(t,v)=>{
    const [x,y,z]=edge(t),s=Math.sin(Math.PI*t);
    return [x-.27*v*s,y-.72*v*s,z+.046*v*Math.sin(t*7)];
  };
  const stations=(fn,count)=>Array.from({length:count+1},(_,i)=>fn(i/count));
  const top=stations(edge,12);
  b.stroke(darkStraw,top,top.map(()=>.019),18);
  for(let j=0;j<=14;j++){
    const t=j/14,[x,y,z]=edge(t);
    if(j%2===0)b.ball(j%4?'#ad8856':'#c29b65',x,y,z,.042,.039,.051);
    if(j===0||j===14)continue;
    for(const sign of [-1,1]){
      const path=stations(v=>mesh(Math.min(1,Math.max(0,t+v*sign*.095)),v),5);
      b.stroke('#777967',path,[.007,.007,.006,.006,.005,.005],7);
    }
  }
  b.ball('#82979a',-1.07,.17,.028,.067,.12,.204,0,0,-.33);
  b.ball('#d3d7c6',-1.095,.18,.089,.046,.076,.122);
  b.ball(ink,-1.135,.225,.132,.012,.012,.012);
  b.stroke('#8c9691',[[-1.06,.17,-.10],[-1.07,.20,-.185],[-1.09,.28,-.24]],[.045,.022,.006],6);
  b.stroke('#8c9691',[[-1.06,.17,-.10],[-1.07,.16,-.18],[-1.10,.13,-.25]],[.039,.022,.006],6);
  return b.finish();
}

function fishingSail() {
  const positions=[],uv=[],faces=[];
  for(let v=0;v<=12;v++)for(let u=0;u<=16;u++){
    const a=u/16,t=v/12;
    const billow=Math.sin(Math.PI*a)*Math.sin(Math.PI*t);
    positions.push(.12+.18*a+.37*billow+.035*Math.sin(a*23)*Math.sin(t*Math.PI),
      1.91+2.47*t+.08*a*(1-2*t)+.092*Math.cos(2*Math.PI*a)*(1-t),
      (a-.5)*(2.15+.22*t)-.09*t);
    uv.push(a,t);
    const k=v*17+u;
    if(u&&v)faces.push(k-18,k-17,k,k-18,k,k-1);
  }
  const geometry=new T.BufferGeometry();
  geometry.setAttribute('position',new T.Float32BufferAttribute(positions,3));
  geometry.setAttribute('uv',new T.Float32BufferAttribute(uv,2));geometry.setIndex(faces);geometry.computeVertexNormals();
  const c=document.createElement('canvas');c.width=384;c.height=448;
  const g=c.getContext('2d'),random=seeded(846811);
  g.fillStyle='#e3d9bc';g.fillRect(0,0,c.width,c.height);
  for(let j=0;j<4;j++){
    const x=j*96;
    g.fillStyle=j%2?'rgba(167,144,102,.13)':'rgba(255,248,220,.16)';g.fillRect(x,0,96,448);
    g.fillStyle='#ac9f81';g.fillRect(x,0,2.3,448);
    for(let y=3;y<448;y+=12){g.fillRect(x+2,y,3,1.5);}
  }
  // The dyer's mark is a plover overhead. Open linen under the wings keeps
  // the silhouette readable from the tower, even with only a few sail pixels.
  g.fillStyle='#44565a';
  g.beginPath();g.moveTo(77,184);g.bezierCurveTo(123,183,157,197,183,226);
  g.bezierCurveTo(196,198,216,179,238,178);g.bezierCurveTo(252,177,260,183,267,189);
  g.lineTo(287,188);g.lineTo(267,199);g.bezierCurveTo(250,199,243,207,235,218);
  g.bezierCurveTo(219,246,199,257,172,251);g.bezierCurveTo(143,246,119,224,105,207);
  g.bezierCurveTo(124,216,139,218,151,219);g.bezierCurveTo(129,203,102,194,77,184);g.fill();
  g.fillStyle='#d8caa8';g.beginPath();g.arc(254,187,2.8,0,Math.PI*2);g.fill();
  for(let i=0;i<2;i++){
    g.strokeStyle='#738082';g.lineWidth=4-i;g.lineCap='round';g.beginPath();
    g.moveTo(102+i*23,276+i*12);g.bezierCurveTo(146,262+i*10,182,287+i*11,230,272+i*11);
    g.quadraticCurveTo(250,263+i*11,265-i*11,266+i*12);g.stroke();
  }
  for(let k=0;k<12500;k++){
    g.fillStyle=k%3?'rgba(254,244,211,.14)':'rgba(94,83,67,.12)';
    g.fillRect(random()*384,random()*448,.45+random()*2.7,.42+random());
  }
  const texture=new T.CanvasTexture(c);texture.colorSpace=T.SRGBColorSpace;texture.anisotropy=4;
  return {geometry,material:new T.MeshLambertMaterial({map:texture,side:T.DoubleSide})};
}

function pineOnReef() {
  const b=sculpture();
  const wood='#514f43',accent='#7b7461';
  b.stroke(wood,[[0,-.23,0],[-.09,.55,-.04],[-.56,1.15,.07],[-.84,1.82,.02],
    [-1.64,2.16,.14],[-1.99,2.89,.13]], [.21,.20,.178,.13,.091,.034],23);
  b.stroke(accent,[[-.11,.02,.13],[-.17,.59,.11],[-.56,1.07,.19],[-.75,1.42,.15]],[.037,.028,.015,.003],14);
  for(const [x,y,z,u,v,w,size] of [[-.44,1.08,.05,.76,1.47,.38,.89],[-.79,1.6,.03,-2.53,1.69,.51,1.05],
    [-1.42,2.11,.12,-.67,2.4,-.64,.86],[-1.73,2.25,.16,-3.06,2.54,.03,1.18],
    [-1.93,2.66,.15,-2.03,3.04,-.2,.91]]) {
    b.stroke(wood,[[x,y,z],[(x+u)*.5,y+.035,(z+w)*.5],[u,v,w]],[.083,.061,.023],10);
    for(let j=0;j<6;j++){
      const a=j*2.4,dx=Math.cos(a)*size*.55,dz=Math.sin(a)*size*.37,dy=.07*Math.cos(a);
      b.ball(j%2?'#475747':'#3f5146',u+dx,v+dy,w+dz,size*(.47+.06*(j%3)),.20*size,.36*size,
        .11,Math.sin(a)*.6,-.07);
      if(j!==2)b.ball(winterWhite,u+dx-.04,v+dy+.107*size,w+dz,.48*size,.127*size,.29*size,.1,Math.sin(a)*.6,-.04);
    }
  }
  return b.finish();
}

// The roof shell supplies continuous pitch UVs, with negative V on the
// exposed cedar lining. Broken snow collects between the rolled tile courses.
export function winterPagodaRoof(p) {
  if(p.winterRoof)return p.winterRoof;
  const material=p.solid.clone();
  material.onBeforeCompile=shader=>{
    shader.vertexShader='varying vec2 snowPitch; varying vec3 snowLot;\n'+shader.vertexShader.replace(
      '#include <begin_vertex>',`#include <begin_vertex>
      snowPitch=uv;
      snowLot=(modelMatrix*instanceMatrix*vec4(position,1.)).xyz;`);
    shader.fragmentShader='varying vec2 snowPitch; varying vec3 snowLot;\n'+shader.fragmentShader.replace(
      '#include <color_fragment>',`#include <color_fragment>
      if(snowPitch.y>=0.){
        float crest=snowPitch.x*6.;
        float aa=clamp(fwidth(crest),.016,.50);
        float ridge=1.-smoothstep(.035,.078+aa,abs(fract(crest)-.50));
        float toe=smoothstep(1.64,2.,snowPitch.y);
        float wind=.49+.29*sin(snowLot.x*1.5+snowLot.z*.32)+.17*sin(snowLot.z*1.2-snowLot.x*.91)
                  +.07*sin(snowLot.x*4.3+snowLot.z);
        float shear=smoothstep(.30,.78,wind+.39*toe)*(.14+.86*toe);
        float clay=clamp(ridge*shear*.84+.17*smoothstep(1.95,2.,snowPitch.y)*wind,0.,1.);
        vec3 slate=vec3(.165,.201,.218);
        diffuseColor.rgb*=1.-ridge*.066*(1.-aa);
        diffuseColor.rgb=mix(diffuseColor.rgb,slate,clay*(1.-smoothstep(.19,.50,aa)));
      }`);
  };
  material.customProgramCacheKey=()=>'winter-pagoda-snow';
  p.winterRoof=material;
  return material;
}

export function dressWinterCoast(p) {
  const paint=brushWash(new T.MeshLambertMaterial({vertexColors:true,side:T.DoubleSide}),.17);
  p.shapes.winterRig=skiffRig();
  const {geometry,material}=fishingSail();
  p.shapes.winterSail=geometry;
  const boat=WINTER_SKIFF,waterline=WATER_Y-HULL_DRAFT;
  for(const [shape,mat] of [['winterRig',paint],['winterSail',material]]){
    p.shapes[shape].userData.range=210;
    p.part(shape,boat.x,waterline,boat.z,1,1,1,'#fff',boat.yaw,0,0,mat,true,true);
  }
  const rock=WINTER_REEFS[0];
  p.shapes.reefPine=pineOnReef();p.shapes.reefPine.userData.range=205;
  p.part('reefPine',rock.x+.59,rock.top-.051,rock.z+.36,1.03,1,1,'#fff',.22,0,0,paint,true,true);
}
