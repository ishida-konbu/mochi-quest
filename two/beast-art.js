// Scroll silhouettes are lofted through painted cross-sections. A single atlas per
// pelt wraps continuously across both flanks; the mane, joints and toes retain volume.
import { prepareDragon, poseDragon } from './dragon-flight.js';
import { kirinFrequency, hoofPhase, poseKirinLeg, poseKirinTrunk } from './animal-motion.js';
import * as THREE from './vendor/three.module.min.js';
import { buildScrollBeast, buildQuadrupedTrunk, bindScrollSkin } from './handscroll-beasts.js';
import { inkVolume, brushWash, brushContour, surfaceGrain } from './scroll-sculpt.js';
import { SPECIES } from './bestiary.js';

const TAU=Math.PI*2, soot='#493d35', paper='#eadbc0', ivory='#efdfbc', cinnabar='#a75142';
const pigment={monkey:'#957057',bird:'#eae4d4',fox:'#bd7445',tiger:'#c18b49',dragon:'#648575',kirin:'#c5a46c',deer:'#bbae92',boar:'#968d74',shishi:'#d0bfa2'};
const coats = new Map(), coatLoads = new Map();
const coatLoader = new THREE.TextureLoader();
const coatParts = {
  monkey: ['body', 'face'],
  bird: ['body', 'wing'],
  fox: ['body', 'face', 'brush', 'leg'],
  tiger: ['body', 'face', 'leg', 'tail'],
  dragon: ['body', 'face'],
  kirin: ['body', 'face', 'leg'],
  deer: ['body'], boar: ['body'], shishi: ['body','mane'],
};

// Paper shows through a thinly charged brush. Reserve the darkest passages
// for eyelids, stripes and contour ink, and keep enough ambient colour for night.
function paperPigment(material) {
  const previous=material.onBeforeCompile, key=material.customProgramCacheKey();
  material.onBeforeCompile=function(shader,renderer) {
    previous.call(this,shader,renderer);
    shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
      float value=dot(diffuseColor.rgb,vec3(.27,.59,.14));
      float wet=smoothstep(.012,.56,value);
      vec3 inkTone=mix(vec3(.009,.008,.006),vec3(.81,.767,.649),pow(wet,.67));
      diffuseColor.rgb=mix(inkTone,diffuseColor.rgb,.24);`);
  };
  material.customProgramCacheKey=()=>key+'-diluted-sumi-v2';
  return material;
}

function coat(type, detail) {
  const part = typeof detail === 'string' ? detail : detail ? 'face' : 'body';
  const key = type + '-' + part;
  let material = coats.get(key);
  if (!material) {
    material = new THREE.MeshStandardMaterial({color:pigment[type], roughness:.94, side:THREE.DoubleSide});
    material.onBeforeCompile = shader => {
      shader.fragmentShader = shader.fragmentShader.replace('#include <opaque_fragment>',
        'float margin=1.-smoothstep(.015,.23,abs(dot(normalize(normal),normalize(vViewPosition))));outgoingLight*=1.-.48*margin;\n#include <opaque_fragment>');
    };
    if(type==='monkey' && part==='face') brushWash(material,.42);
    else paperPigment(brushWash(material,.56));
    coats.set(key, material);
  }
  if (!coatLoads.has(key)) {
    const url = new URL('./assets/bestiary/' + key + '.webp', import.meta.url).href;
    const ready = coatLoader.loadAsync(url).then(image => {
      image.colorSpace = THREE.SRGBColorSpace;
      image.anisotropy = 4;
      material.map = image;
      material.color.set(0xffffff);
      material.needsUpdate = true;
      material.dispatchEvent({type:'pigmentready'});
      return image;
    });
    coatLoads.set(key, ready);
    // A transient fetch can retry against the same material, including clones already on stage.
    ready.catch(() => coatLoads.delete(key));
  }
  return material;
}

export function preloadBeastCoats(types=Object.keys(SPECIES)) {
  const pending = [];
  for (const type of types) {
    for (const part of coatParts[type]) {
      coat(type, part);
      pending.push(coatLoads.get(type + '-' + part));
    }
  }
  return Promise.all(pending);
}

function pelt(parent,type,sections,mask=false) {
  const line=new THREE.CatmullRomCurve3(sections.map(s=>new THREE.Vector3(...s.slice(0,3))));
  const dims=new THREE.CatmullRomCurve3(sections.map(s=>new THREE.Vector3(s[3],s[4],0)));
  const rows=sections.length*4,sides=32,positions=[],indices=[],uv=[];
  const tangent=new THREE.Vector3(),across=new THREE.Vector3(),up=new THREE.Vector3(),point=new THREE.Vector3();
  for(let j=0;j<=rows;j++){
    const t=j/rows, center=line.getPoint(t),r=dims.getPoint(t);
    line.getTangent(t,tangent);across.set(1,0,0).addScaledVector(tangent,-tangent.x).normalize();up.crossVectors(tangent,across).normalize();
    for(let k=0;k<=sides;k++) {
      const a=k*TAU/sides;
      const angular=Math.sin(a);
      // Broad ventral shields and a narrow dorsal spine give the dragon a
      // keeled section. A circular tube catches a hard, plastic highlight.
      const dragonBody=type==='dragon'&&!mask;
      const keel=dragonBody ? .17*Math.max(0,angular)**12-.075*Math.max(0,-angular)**4 : 0;
      const flank=dragonBody ? 1+.026*Math.cos(t*TAU*19+a*.72)*Math.cos(a)**2 : 1;
      point.copy(center).addScaledVector(across,Math.cos(a)*Math.max(.002,r.x)*flank)
        .addScaledVector(up,(angular+keel)*Math.max(.002,r.y));
      positions.push(...point.toArray());uv.push(t,1-k/sides);
      if(j<rows&&k<sides){const n=j*(sides+1)+k;indices.push(n,n+1,n+sides+1,n+1,n+sides+2,n+sides+1);}
    }
  }
  for(let k=1;k<sides-1;k++) {
    indices.push(0,k+1,k);
    const front=rows*(sides+1);indices.push(front,front+k,front+k+1);
  }
  const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
  geo.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));geo.setIndex(indices);geo.computeVertexNormals();
  const normals=geo.attributes.normal;
  for(let j=0;j<=rows;j++){
    const k=j*(sides+1);
    up.fromBufferAttribute(normals,k).add(point.fromBufferAttribute(normals,k+sides)).normalize();
    normals.setXYZ(k,up.x,up.y,up.z);normals.setXYZ(k+sides,up.x,up.y,up.z);
  }
  const mesh=new THREE.Mesh(geo,coat(type,mask));mesh.castShadow=mesh.receiveShadow=true;parent.add(mesh);
  if(mask!=='leg' && mask!=='wing')brushContour(mesh);
  return mesh;
}
const volume=(b,s,col,steps=16)=>inkVolume(b,s,col,steps);
function tusk(b,points,r,color){
  const n=points.length-1;
  volume(b,points.map((p,i)=>[...p,r*(1-i/n)**.78+.002,r*.82*(1-i/n)**.8+.001]),color,n*4);
}
// A swept lock has a broad base, a raised brush ridge and a thin dark reverse.
// Successive locks share roots so the ruff, mane and flames read as one pelt.
function lock(b,path,radius,normal,colors) {
  const curve=new THREE.CatmullRomCurve3(path.map(p=>new THREE.Vector3(...p)));
  const out=new THREE.Vector3(...normal).normalize(), tangent=new THREE.Vector3(), side=new THREE.Vector3();
  const strips=[[],[],[]], indices=[], n=12;
  for(let j=0;j<=n;j++) {
    const t=j/n, p=curve.getPoint(t), w=radius*(.10+.90*Math.sin(Math.PI*t**.64))*(1-t**4)+.0006;
    curve.getTangent(t,tangent);side.crossVectors(tangent,out).normalize();
    const edgeA=p.clone().addScaledVector(side,-w);
    const edgeB=p.clone().addScaledVector(side,w*.78);
    const crest=p.clone().addScaledVector(side,-w*.23).addScaledVector(out,w*.57);
    const back=p.clone().addScaledVector(out,-w*.27);
    for(const [i,a,c] of [[0,edgeA,crest],[1,crest,edgeB],[2,edgeB,back]])strips[i].push(...a.toArray(),...c.toArray());
    if(j){const k=j*2;indices.push(k-2,k-1,k+1,k-2,k+1,k);}
  }
  for(let i=0;i<3;i++) {
    const geo=new THREE.BufferGeometry();
    geo.setAttribute('position',new THREE.Float32BufferAttribute(strips[i],3));geo.setIndex(indices);
    geo.computeVertexNormals();b.add(geo,colors[i]);geo.dispose();
  }
}

function sculptEye(head,stations,type,group,batch) {
  const dragon=type==='dragon',fox=type==='fox',kirin=type==='kirin';
  const t=dragon?.445:fox?.53:kirin?.51:.64;
  const centers=new THREE.CatmullRomCurve3(stations.map(s=>new THREE.Vector3(...s.slice(0,3))));
  const sizes=new THREE.CatmullRomCurve3(stations.map(s=>new THREE.Vector3(s[3],s[4],0)));
  function skin(q,a) {
    const r=sizes.getPoint(q),center=centers.getPoint(q),tangent=centers.getTangent(q);
    const across=new THREE.Vector3(1,0,0);
    const up=tangent.clone().cross(across).normalize();
    return center.addScaledVector(across,r.x*Math.cos(a)).addScaledVector(up,r.y*Math.sin(a));
  }
  for(const s of [-1,1]){
    const roll=type==='tiger'?.61:.37,angle=s===1?roll:Math.PI-roll,anchor=skin(t,angle);
    const along=skin(t+.003,angle).sub(skin(t-.003,angle)).normalize();
    const around=skin(t,angle+.004).sub(skin(t,angle-.004)).normalize();
    const outward=around.cross(along).normalize();
    if(type==='tiger')outward.lerp(new THREE.Vector3(s*.48,.13,.87),.48).normalize();
    const right=new THREE.Vector3(0,1,0).cross(outward).normalize();
    anchor.addScaledVector(outward,fox?.0055:.0085);
    const eye=group(head,'eyelid'+s,...anchor.toArray());
    eye.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(right,outward.clone().cross(right).normalize(),outward));
    eye.scale.setScalar(dragon?1.36:fox?.87:kirin?.93:1.14);
    const pupil=dragon?'#362b20':'#3c3027',iris=kirin?'#937345':fox?'#956432':'#b48a41';
    batch(eye,b=>{
      function almond(width,height,base,depth,color) {
        const vertices=[0,.008,base+depth],index=[];
        for(let k=0;k<32;k++){
          const a=TAU*k/32,x=Math.cos(a),y=Math.sin(a);
          vertices.push(x*width,.008+y*height*(.78+.22*Math.abs(y))+x*s*.006,base-.003*x*x);
          index.push(0,k+1,(k+1)%32+1);
        }
        const shell=new THREE.BufferGeometry();
        shell.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));
        shell.setIndex(index);shell.computeVertexNormals();b.add(shell,color);shell.dispose();
      }
      almond(.066,.029,-.010,.015,soot);
      almond(.056,.022,-.003,.013,'#ead7a9');
      b.ball(-s*.008,.009,.010,.021,.017,.005,iris);
      b.ball(-s*.010,.010,.014,dragon?.007:.010,.016,.003,pupil);
      b.ball(-s*.014,.016,.017,.003,.003,.0015,'#f5ead0');
      const side=[0,0,1];
      lock(b,[[-s*.067,.008,.000],[-s*.030,.034,.007],[s*.026,.033,.008],[s*.075,.027,-.010]],
        .0055,side,[soot,soot,soot]);
      lock(b,[[-s*.053,.037,-.005],[-s*.018,.054,-.001],[s*.025,.055,-.001],[s*.081,.069,-.014]],
        dragon?.012:.0074,side,[soot,dragon?'#996941':'#65503a',soot]);
    });
  }
}

function ear(b,s,x,y,z,h,fur,inner) {
  foldedEar(b,s,[s*x,y-.018,z],.092,h*.56,false,fur,inner);
}
function antler(b,s,y,z,k=1) {
  const points=[[s*.15,y,z],[s*.22,y+.20*k,z-.11*k],[s*.40,y+.43*k,z-.27*k],[s*.52,y+.54*k,z-.45*k]];
  tusk(b,points,.046*k,'#967953');
  tusk(b,[points[1],[s*.19,y+.33*k,z+.022],[s*.25,y+.44*k,z+.02]],.035*k,ivory);
  tusk(b,[points[2],[s*.4,y+.56*k,z-.20],[s*.45,y+.65*k,z-.235]],.029*k,ivory);
}
function kirinBrush(b) {
    tusk(b,[[0,0,0],[0,.03,-.26],[.09,-.14,-.55],[.19,-.09,-.79],[.23,.04,-.91]],.07,'#8d7853');
    for(let k=0;k<5;k++){
      const x=.18+.023*k,y=-.089+.022*k;
      lock(b,[[x,y,-.69],[x+.046,y+.064,-.828],[x+.076,y+.174,-.908],
        [x-.007+.032*k,y+.236+.018*k,-.959+.009*k]],.056,[.89,.1,-.3],
        k%2?['#9c6e45','#ce9d5c','#795b3f']:['#b17a4b','#dbb571','#8b6343']);
    }
}
function quadruped(root,type,{group,batch}){
  const fox=type==='fox',kirin=type==='kirin',tiger=type==='tiger',wide=fox?.215:kirin?.31:.38;
  const high=kirin?1.26:tiger?.87:.62, length=fox?.57:kirin?.84:.77;
  const body=group(root,'trunk');
  // Haunch, tucked flank, deep ribs, withers and brisket are separately
  // measured sections. In a stride the shoulder stays inside the moving leg.
  const trunk=[
    [0,high-.012,-length,.038,.061],[0,high+.040,-length*.82,wide*.79,wide*.88],
    [0,high+.050,-length*.59,wide*1.03,wide*1.03],[0,high+.076,-length*.31,wide*.89,wide*.80],
    [0,high+.067,-length*.08,wide*.89,wide*.89],[0,high+.034,length*.19,wide,wide*1.08],
    [0,high+.035,length*.43,wide*1.04,wide*1.20],[0,high+.11,length*.69,wide*.86,wide*.91],
    [0,high+.14,length*.88,wide*.43,wide*.69]
  ];
  const neckTop=kirin?2.15:fox?.93:1.15;
  const head=buildQuadrupedTrunk(body,type,trunk,neckTop,length,wide,group,batch,coat);
  const tail=group(body,'tail',0,high+.03,-length*.74);
  if(fox){
    pelt(tail,type,[[0,0,0,.084,.101],[.026,.018,-.22,.122,.145],[.15,.06,-.41,.175,.198],
      [.28,.171,-.56,.193,.224],[.325,.318,-.66,.187,.204],[.303,.468,-.751,.124,.162],
      [.231,.605,-.785,.052,.078],[.134,.675,-.769,.002,.002]],'brush');
    batch(tail,b=>{
      for(const side of [-1,1]) {
        for(let i=0;i<4;i++){
          const x=.246+side*(.074+.010*i),y=.192+i*.061,z=-.572-.052*i;
          lock(b,[[x,y,z],[x+side*.077,y+.058,z-.069],[x+side*.062,y+.180,z-.140]],
            .043,[side,.2,-.5],i>1?[ivory,'#d9b888','#a08762']:['#c28853','#a9663f','#8a5637']);
        }
      }
    });
  }else if(tiger){
    pelt(tail,type,[[0,.00,.07,.096,.087],[.018,.047,-.19,.086,.083],[.087,.083,-.39,.077,.074],
      [.188,.126,-.59,.068,.061],[.269,.222,-.76,.056,.054],[.275,.383,-.896,.044,.045],
      [.208,.491,-.972,.035,.035],[.122,.502,-.987,.020,.024],[.080,.480,-.975,.003,.004]],'tail');
  }else batch(tail,b=>kirinBrush(b));
  batch(body,b=>{
    if(kirin){
      for(let k=0;k<9;k++) {
        const t=k/8,y=high+.14+t*(neckTop-high),z=length*(.43+.39*t);
        for(const side of [-1,1]) {
          const x=side*(.063+.035*(1-t));
          lock(b,[[x,y+.01,z],[x+side*.025,y+.072,z-.125],
            [x+side*.031,y+.027,z-.241],[x+side*.052,y+.077+.048*t,z-.389]],
            .063+.014*t,[side,.2,0],['#a96340','#d59655','#784e3c']);
        }
      }
      // Flame scrolls curl away from each shoulder and hock, like the gilded hems of a painted kirin.
      for(const side of [-1,1])for(let k=0;k<3;k++){
        const y=high+.06+.09*k,z=length*.29-.045*k;
        lock(b,[[side*.201,y,z],[side*(.288+.012*k),y+.016,z-.105],
          [side*(.332+.013*k),y+.103,z-.25],[side*(.321+.019*k),y+.122,z-.34],
          [side*(.345+.020*k),y+.174,z-.409]],.042,[side,.17,.12],['#a78b66','#d6bc8c','#796a51']);
      }
      for(let k=0;k<7;k++){
        const z=-.61+k*.13,y=high+.285+.028*Math.cos(k);
        lock(b,[[0,y-.057,z+.105],[.004,y+.072,z+.005],[.012,y+.102,z-.097],
          [.013,y+.15,z-.188]],.053,[1,.1,.17],['#a87549','#d2a663','#7c5c40']);
      }
    }
    if(fox){
      volume(b,[[0,.536,.377,.039,.05],[0,.618,.418,.121,.099],[0,.735,.447,.160,.118],
        [0,.831,.457,.148,.107],[0,.904,.484,.105,.077]],'#e2cea9',16);
      for(const side of [-1,1]){
        lock(b,[[side*.116,.814,.471],[side*.156,.758,.477],[side*.146,.658,.451],
          [side*.126,.611,.424]],.027,[side*.66,0,.74],['#d9c29c','#dfcba7','#bcaa8a']);
      }
      volume(b,[[0,.79,.41,.177,.145],[0,.82,.42,.184,.143],[0,.85,.426,.168,.137]],cinnabar,9);
      b.ball(0,.747,.565,.046,.052,.043,'#c3a163');tusk(b,[[0,.73,.606],[0,.753,.611],[.006,.771,.608]],.006,soot);
    }
  });
  const mask=fox?.18:kirin?.22:.29, snout=fox?.38:kirin?.45:.37;
  const headStations=fox?[
    [0,.028,-.175,.037,.064],[0,.075,-.09,.146,.16],[0,.089,-.005,.183,.163],
    [0,.067,.108,.172,.132],[0,.046,.203,.122,.088],[0,.031,.293,.079,.053],[0,.019,.382,.030,.027]
  ]:kirin?[
    [0,.047,-.19,.065,.113],[0,.075,-.095,.187,.219],[0,.089,.038,.216,.211],
    [0,.076,.142,.191,.155],[0,.042,.27,.131,.114],[0,.011,.381,.116,.086],[0,.043,.46,.082,.059]
  ]:[
    [0,.011,-.226,.066,.107],[0,.062,-.146,.224,.22],[0,.090,-.038,.264,.205],
    [0,.081,.091,.273,.195],[0,.052,.19,.218,.138],[0,.033,.291,.160,.091],[0,.044,.37,.099,.054]
  ];
  pelt(head,type,headStations,true);
  sculptEye(head,headStations,type,group,batch);
  batch(head,b=>{
    volume(b,[[0,-.068,.099,mask*.47,.054],[0,-.063,snout*.53,mask*.45,.044],
      [0,-.049,snout*.81,mask*.35,.035],[0,-.028,snout*.96,mask*.18,.019]],
      fox?'#dcc7a3':'#e4cfaa',13);
    for(const s of [-1,1]){
      if(tiger){
        foldedEar(b,s,[s*.19,.17,-.057],.091,.071,true,soot,paper);
        lock(b,[[s*.184,.092,.113],[s*.239,.036,.101],[s*.268,-.054,.048],
          [s*.285,-.079,-.033],[s*.31,-.117,-.090]],.052,[s,.08,.12],['#b5a585',paper,'#806f55']);
        for(let i=0;i<3;i++)tusk(b,[[s*.23,.079-i*.048,.105],[s*.25,.093-i*.055,.066],[s*.267,.108-i*.06,.007]],.014,soot);
      } else {
        ear(b,s,mask*.62,.135,-.01,fox?.24:.21,pigment[type],fox?'#855749':'#a77e67');
        if(kirin)antler(b,s,.203,-.016,.94);
        if(fox){
          lock(b,[[s*.132,.247,-.050],[s*.154,.300,-.058],[s*.200,.375,-.055]],.039,
            [s*.3,.1,-1],['#4d4238','#66503d','#493f36']);
        }
      }

      if(fox||tiger) {
        const shades=fox?['#dfcba7','#e9d7b6','#b39873']:['#ded0a9','#eedbbe','#a78f6d'];
        const startY=fox?.069:.085;
        for(let i=0;i<4;i++){
          const cx=mask*(.62+.018*i),y=startY-.028*i,z=fox?.115:.08;
          lock(b,[[s*cx,y+.035,z],[s*(cx+.068),y-.016,z-.054],
            [s*(cx+.088),y-.028-i*.009,z-.136],[s*(cx+.117-.011*i),y-.077-i*.018,z-.21]],
            fox?.022:.035,[s,.3,.13],shades);
        }
      }
      const muzzleWidth=fox?.052:kirin?.078:.108;
      // The whisker cushion grows out of the side of the snout, broad at the
      // cheek and tucked under the philtrum. In front view the two lips meet.
      volume(b,[[s*muzzleWidth*.61,-.002,snout*.42,muzzleWidth*.69,fox?.027:.048],
        [s*muzzleWidth*.85,-.013,snout*.62,muzzleWidth*.85,fox?.036:.059],
        [s*muzzleWidth*.69,-.021,snout*.79,muzzleWidth*.83,fox?.034:.055],
        [s*muzzleWidth*.51,-.010,snout*.93,muzzleWidth*.54,fox?.024:.040],
        [s*muzzleWidth*.29,-.006,snout*.984,muzzleWidth*.25,.015]],paper,15);
      if(tiger||fox)for(let i=0;i<6;i++){
        const x=muzzleWidth*(.50+.25*(i%3));
        b.ball(s*x,-.018-Math.floor(i/3)*.012,snout*(.89+.031*(i%3)),
          .0046,.0046,.0046,'#6a5141');
      }
      tusk(b,[[0,-.027,snout*.978],[s*mask*.21,-.047,snout*.926],[s*mask*.41,-.035,snout*.823]],.0062,soot);
      if(!kirin)for(let j=0;j<3;j++){
        const x=fox?.060:.12,len=fox?.131:.190;
        tusk(b,[[s*x,-.008-j*.011,snout*.86],[s*(x+len*.48),.003-j*.014,snout*.86+.054],
          [s*(x+len+j*.018),.018-j*.035,snout*.86+.061]],fox?.0027:.0038,'#665346');
      }
    }
    // The wide philtrum of the tiger and tapered nose of the fox end in
    // different silhouettes even in the small rotating portraits.
    volume(b,[[0,-.023,snout*.979,.009,.012],[0,.012,snout,.043,.032],
      [0,.043,snout*.987,tiger?.087:fox?.046:.058,.040],[0,.06,snout*.970,.025,.016]],
      tiger?'#765648':soot,12);
    if(kirin)for(const side of [-1,1]){
      lock(b,[[side*.118,.139,-.05],[side*.219,.16,-.144],[side*.268,.183,-.277],
        [side*.234,.286,-.385]],.054,[side,.3,.1],['#bb8350','#d5a563','#805b42']);
      lock(b,[[side*.104,-.05,.21],[side*.114,-.14,.20],[side*.103,-.26,.14],
        [side*.163,-.33,.06]],.045,[side,0,.4],['#b38050','#d6af70','#836042']);
    }
    if(kirin){
      tusk(b,[[0,.20,.061],[0,.335,.10],[.012,.55,.18],[.02,.68,.21]],.067,'#cbb17e');
      for(const s of [-1,1])tusk(b,[[s*.09,-.065,.218],[s*.095,-.181,.215],[s*.12,-.24,.149]],.039,'#987353');
    }
  });
}
// Height, half breadth, occiput, face plane and muzzle projection, from chin
// to crown. The nose and jaws project ahead of the orbit in the scroll's profile.
const macaqueSections = [
  [-.171,.003,.018,.024,.061],[-.155,.091,-.059,.088,.102],
  [-.131,.140,-.106,.124,.134],[-.103,.165,-.145,.142,.143],
  [-.080,.178,-.138,.149,.141],[-.063,.185,-.158,.158,.122],
  [-.048,.188,-.183,.162,.156],[-.027,.190,-.187,.166,.159],
  [-.005,.192,-.190,.172,.153],[.018,.197,-.194,.182,.129],
  [.049,.199,-.199,.176,.071],[.077,.198,-.203,.182,.027],
  [.104,.197,-.205,.188,.010],[.132,.198,-.205,.196,0],
  [.159,.195,-.20,.189,0],[.191,.187,-.186,.174,0],
  [.216,.167,-.166,.140,0],[.236,.139,-.140,.104,0],
  [.251,.107,-.118,.074,0],[.263,.070,-.090,.043,0],
  [.270,.032,-.059,.004,0],[.272,.002,-.029,-.025,0],
];
const gaussian=(x)=>Math.exp(-x*x);
function macaqueFace(head,batch) {
  const positions=[],indices=[],uv=[],blink=[],jaw=[];
  const rows=76,sides=84, bottom=macaqueSections[0][0],top=macaqueSections.at(-1)[0];
  function sample(y,a) {
    const cols=macaqueSections;
    let j=1;
    while(j<cols.length-1 && cols[j][0]<y) j++;
    const p=cols[j-1],q=cols[j],f=(y-p[0])/(q[0]-p[0]);
    function section(k) {
      const prev=cols[Math.max(0,j-2)],next=cols[Math.min(cols.length-1,j+1)];
      const dy=q[0]-p[0],m0=dy*(q[k]-prev[k])/(q[0]-prev[0]),m1=dy*(next[k]-p[k])/(next[0]-p[0]);
      return (2*f**3-3*f*f+1)*p[k]+(f**3-2*f*f+f)*m0+(-2*f**3+3*f*f)*q[k]+(f**3-f*f)*m1;
    }
    const w=section(1),back=section(2),front=section(3),reach=section(4),sin=Math.sin(a),cos=Math.cos(a);
    const x=sin*w,absX=Math.abs(x),forward=Math.max(0,cos);
    const hinge=gaussian((y+.061)/.038),cheek=gaussian((Math.abs(a)-1.2)/.62);
    const mane=.010*cheek*Math.cos(3.2*a+1.7)*gaussian((y+.058)/.051);
    // Small projecting brow, scooped eye socket, maxillary pads and broad
    // nostril wings are continuous with the forehead and hanging lower cheek.
    const eyeY=.094+.004*Math.sign(a);
    const socket=gaussian((absX-.090)/.047)*gaussian((y-eyeY)/.024);
    const brow=gaussian((absX-.087)/.057)*gaussian((y-.132-.012*(absX/.18))/.015);
    const globe=gaussian((absX-.089)/.023)*gaussian((y-eyeY)/.013);
    const nose=gaussian((absX-.029)/.025)*gaussian((y-.004)/.017);
    const muzzleWidth=.78-.23*THREE.MathUtils.smoothstep(y,-.01,.093);
    const snout=reach*Math.exp(-Math.pow(Math.abs(a)/muzzleWidth,2.55));
    const z=(front+back)/2+(front-back)/2*cos+snout+forward*(.014*brow-.017*socket+.014*globe+.024*nose);
    const drop=.035*cheek*hinge*(.65+.35*Math.cos(8*a+1));
    const edge=THREE.MathUtils.smoothstep(Math.abs(a),.96,1.48)*gaussian((y+.065)/.080);
    const tufts=edge*(.009*Math.cos(61*y+2*a)+.003*Math.sin(121*y-4*a));
    // Shallow overlapping locks change the outline as well as the pigment.
    const crown=gaussian((y-.199)/.062)*THREE.MathUtils.smoothstep(Math.abs(a),.47,1.55);
    const ragged=crown*(.0038*Math.sin(10*a+45*y)+.0029*Math.cos(17*a+68*y));
    return [x+Math.sign(a)*(mane+tufts)+sin*ragged,
      y-drop-.19*Math.max(0,y-.148)+ragged*.50,z+cos*ragged];
  }
  for(let j=0;j<=rows;j++)for(let k=0;k<=sides;k++){
    const t=j/rows,y=THREE.MathUtils.lerp(bottom,top,t),u=k/sides,a=(u-.5)*TAU;
    const [x,yy,z]=sample(y,a),eyeY=.094+.004*Math.sign(a);
    positions.push(x,yy,z);uv.push(u,t);
    const nearEye=gaussian((Math.abs(a)-.477)/.173);
    const lid=nearEye*gaussian((y-eyeY)/.026);
    blink.push(0,(eyeY-y)*lid*.95,-.010*lid);
    const hinge=THREE.MathUtils.smoothstep(-y,.059,.115)*gaussian(a/.83);
    jaw.push(0,-.015*hinge,-.004*hinge);
    if(j<rows&&k<sides){
      const i=j*(sides+1)+k;
      indices.push(i,i+1,i+sides+1,i+1,i+sides+2,i+sides+1);
    }
  }
  for(let i=1;i<sides-1;i++){
    const n=rows*(sides+1);
    indices.push(0,i+1,i,n,n+i,n+i+1);
  }
  const geo=new THREE.BufferGeometry();
  geo.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
  geo.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));
  geo.setIndex(indices);geo.computeVertexNormals();
  const n=geo.attributes.normal, v=new THREE.Vector3(),w=new THREE.Vector3();
  for(let j=0;j<=rows;j++){
    const k=j*(sides+1);
    v.fromBufferAttribute(n,k).add(w.fromBufferAttribute(n,k+sides)).normalize();
    n.setXYZ(k,v.x,v.y,v.z);n.setXYZ(k+sides,v.x,v.y,v.z);
  }
  geo.morphTargetsRelative=true;
  geo.morphAttributes.position=[new THREE.Float32BufferAttribute(blink,3),new THREE.Float32BufferAttribute(jaw,3)];
  const skull=new THREE.Mesh(geo,coat('monkey','face'));
  skull.name='猿の面相';skull.castShadow=skull.receiveShadow=true;head.add(skull);
  const outline=brushContour(skull);
  outline.morphTargetInfluences=skull.morphTargetInfluences;
  // The auricle is turned out to the side. Its pale helix folds back over a
  // hollow concha, with a tragus at the front and a softly pointed lower lobe.
  const earXYZ=[],earRGB=[],earTriangles=[];
  const furEdges=batch(head,b=>{
    for(const s of [-1,1]){
      const center=new THREE.Vector3(s*.199,.098,-.047),tangent=new THREE.Vector3(s*.51,.055,-.85).normalize();
      const out=new THREE.Vector3(s*.85,.055,.51).normalize(),up=new THREE.Vector3().crossVectors(tangent,out);
      if(up.y<0)up.negate();
      up.normalize();
      const ear=(x,y,d)=>center.clone().addScaledVector(tangent,x).addScaledVector(up,y).addScaledVector(out,d).toArray();
      const rim=[
        [.02,-.009,-.043,'#97856b'],[.55,-.004,-.033,'#9c866d'],[.88,0,-.014,'#947d63'],
        [1,.002,.003,'#a68b6f'],[.96,.003,.014,'#c4a789'],[.83,.005,.018,'#c6a88b'],
        [.68,.003,.011,'#ae8d70'],[.53,.001,-.001,'#937259'],[.30,-.006,.001,'#96775e'],
        [.01,-.009,.001,'#a1846b']
      ];
      const base=earXYZ.length/3,count=40;
      for(const [r,shift,depth,tint] of rim)for(let k=0;k<count;k++){
        const a=k*TAU/count,h=Math.sin(a),c=Math.cos(a);
        const ridge=.008*r*Math.cos(2*a+.45)+.014*r*c;
        earXYZ.push(...ear(r*(.062*c*(1+.21*h)+.013*h),shift+.065*r*h,depth+ridge));
        const shade=new THREE.Color(tint).multiplyScalar(.99+.10*Math.sin(3*a+.65*r));
        earRGB.push(shade.r,shade.g,shade.b);
      }
      for(let row=0;row<rim.length-1;row++)for(let k=0;k<count;k++){
        const i=base+row*count+k,n=base+row*count+(k+1)%count;
        if(s>0)earTriangles.push(i,n,i+count,n,n+count,i+count);
        else earTriangles.push(n,i,i+count,n+count,n,i+count);
      }
      tusk(b,[ear(-.025,-.017,.023),ear(-.014,-.009,.019),ear(-.001,-.006,.011),
        ear(.009,.012,.012)],.0031,'#816851');
      tusk(b,[ear(-.007,-.024,.010),ear(.006,-.021,.009),ear(.016,-.009,.008),
        ear(.017,.002,.009)],.0015,'#705e4a');
      // Short locks lie flush on the crown before lifting away at the tips.
      // The elevation and direction change from the eyebrow to the occiput.
      for(let i=0;i<18;i++){
        const row=i%3,column=Math.floor(i/3),a=s*(.54+.43*column+.17*row);
        const rootY=.245-.021*row+.008*Math.sin(i*2.7);
        const drift=.28+.11*Math.sin(1.7*i),fall=.036+.029*row+.009*Math.cos(i);
        const normal=[Math.sin(a),.70-row*.22,Math.cos(a)];
        const path=[[0,-.002],[.36,.001],[.73,.0035],[1,.008+row*.0015]].map(([f,raised])=>{
          const angle=a+s*drift*f,point=sample(rootY-fall*f,angle);
          point[0]+=raised*Math.sin(angle);point[1]+=raised*(.65-.22*row);point[2]+=raised*Math.cos(angle);
          return point;
        });
        lock(b,path,.0021+.00085*(i%4),normal,
          i%3===0?['#766b56','#95856b','#635847']:['#a18e71','#b3a081','#8f7d61']);
      }
      // Only the tips leave the pelt. They spread irregularly at the jaw,
      // following the painted hair that runs towards the hinge of the ear.
      for(let i=0;i<9;i++){
        const y=.045-i*.022,angle=1.41+.26*Math.sin(2.39*i);
        const start=sample(y,angle*s),end=sample(y-.030,(angle+.19)*s);
        const lift=.007+.004*Math.sin(i*.81);
        tusk(b,[start,[end[0]+s*.002,end[1]+.012,end[2]+.016],
          [end[0]+s*lift,end[1]-.006,end[2]-.012],
          [end[0]+s*(lift+.003),end[1]-.013,end[2]-.020-i%3*.008]],.0021+i%3*.00055,
          i%3?'#a89b80':'#8b7e67');
      }
    }
  });
  // Keep the ear's translucent ochre wash in the same colour range as its
  // fur. The ear and loose hair share the facial ink's rendering response.
  const skin=surfaceGrain(brushWash(new THREE.MeshStandardMaterial({
    vertexColors:true,roughness:.96,side:THREE.DoubleSide
  }),.40),14);
  skin.userData.portrait=true;
  furEdges.material=skin;
  const ears=new THREE.BufferGeometry();
  ears.setAttribute('position',new THREE.Float32BufferAttribute(earXYZ,3));
  ears.setAttribute('color',new THREE.Float32BufferAttribute(earRGB,3));
  ears.setIndex(earTriangles);ears.computeVertexNormals();
  const pair=new THREE.Mesh(ears,skin);
  pair.castShadow=pair.receiveShadow=true;head.add(pair);
}

function foldedEar(b,side,base,width,height,round,fur,inside) {
  // The raised helix folds over the shaded concha and joins a closed furry back.
  const xyz=[],idx=[],sectors=28;
  for(const [depth,radius] of [[-.029,.02],[-.019,.74],[.002,1],[.016,.92],[.019,.73],[.001,.52],[-.003,.05]]) {
    for(let i=0;i<sectors;i++) {
      const a=i*TAU/sectors,h=Math.sin(a),w=Math.cos(a)*(round?1:1-.49*h);
      const x=width*radius*w;
      xyz.push(base[0]+side*(x+.28*height*h),base[1]+height*(1+h*radius),base[2]+depth-.21*x-.16*height*h*radius);
    }
  }
  for(let row=0;row<6;row++) {
    idx.length=0;
    for(let i=0;i<sectors;i++) {
      const k=row*sectors+i,n=row*sectors+(i+1)%sectors;
      idx.push(k,n,k+sectors,n,n+sectors,k+sectors);
    }
    const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(xyz,3));g.setIndex(idx);g.computeVertexNormals();
    b.add(g,row<3?fur:row===3?'#6c5b49':inside);g.dispose();
  }
}

function scribeCoat(b) {
  // A cut hem, deep pleats from the obi and the slightly stooped shoulders
  // hold their shape as the scribe lifts the paper to his face.
  const cloth='#607071',xyz=[],idx=[],around=48,rows=28;
  const profile=new THREE.SplineCurve([[.293,.206],[.280,.196],[.260,.184],[.238,.177],
    [.249,.187],[.266,.19],[.254,.173],[.172,.127]].map(p=>new THREE.Vector2(...p)));
  function drape(t,a) {
    const r=profile.getPoint(t),pleat=(.007+.022*(1-t)**2)*(Math.cos(7*a+.40*t)+.31*Math.cos(13*a-.62*t));
    return [(r.x+pleat)*Math.cos(a),.596+.659*t+.020*(1-t)**5*Math.cos(5*a+.7),
      -.056+.103*t+(r.y+pleat)*Math.sin(a)];
  }
  for(let j=0;j<=rows;j++)for(let k=0;k<=around;k++){
    xyz.push(...drape(j/rows,k*TAU/around));
    if(j<rows&&k<around){const i=j*(around+1)+k;idx.push(i,i+around+1,i+1,i+1,i+around+1,i+around+2);}
  }
  const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(xyz,3));
  geo.setIndex(idx);geo.computeVertexNormals();b.add(geo,cloth);geo.dispose();
  for(let k=0;k<14;k++){
    const a=(k+.32)*TAU/14;
    const path=[.016,.087,.167,.255,.325].map(t=>{const p=drape(t,a+.047*Math.sin(t*5+k*.4));p[0]*=1.006;p[2]+=.0017*Math.sin(a);return p;});
    tusk(b,path,.004,k%2?'#394b4c':'#bdbaa1');
  }
}

function simian(root,{group,batch}) {
  const body=group(root,'trunk'), head=group(body,'mask',0,1.302,.125);
  pelt(body,'monkey',[[0,.55,-.10,.03,.04],[0,.58,-.085,.225,.172],[0,.73,-.06,.221,.169],
    [0,.92,-.01,.194,.147],[0,1.10,.018,.206,.151],[0,1.23,.067,.134,.104],[0,1.30,.08,.105,.089]]);
  batch(body,b=>{
    // Indigo sleeveless travelling coat, with a crossed collar, obi and small inro.
    scribeCoat(b);
    // An embroidered plum crest on the back of the haori. Its irregular five
    // petals are visible when the scribe turns away from the camera.
    for(let k=0;k<5;k++) {
      const a=TAU*k/5;
      b.ball(.035*Math.sin(a),1.054+.035*Math.cos(a),-.196,.018,.022,.005,'#c2b491',[0,0,-a]);
    }
    b.ball(0,1.054,-.198,.012,.012,.006,'#ceb379');
    for(const s of [-1,1]){
      volume(b,[[s*.091,1.231,.16,.024,.015],[s*.095,1.16,.21,.027,.012],
        [s*.026,1.02,.206,.032,.016],[-s*.075,.88,.17,.014,.011]],'#d7c7a2');
      for(let i=0;i<4;i++)for(let j=0;j<3;j++){
        const y=.72+.105*i,x=s*(.134+.021*j);
        b.ball(x,y,.150+.012*i-.012*j,.013,.009,.009,'#cdc9b1');
      }
    }
    volume(b,[[0,.798,-.026,.273,.205],[0,.816,-.026,.279,.207],[0,.85,-.02,.271,.207]],'#9d785c',8);
    // The dyed sash forms a tied bow at the back, with two hanging ends.
    for(const side of [-1,1]){
      volume(b,[[0,.834,-.229,.028,.016],[side*.065,.853,-.252,.034,.029],
        [side*.118,.882,-.244,.023,.014],[side*.148,.881,-.231,.008,.006]],'#995e46',10);
      lock(b,[[side*.009,.837,-.24],[side*.046,.753,-.273],[side*.073,.670,-.289],
        [side*.13,.602,-.273]],.046,[0,0,-1],['#a56d50','#be916a','#654e42']);
    }
    for(const side of [-1,1])for(let band=0;band<2;band++){
      const y=.679+band*.030;
      b.stroke([[side*.033,y,.150],[side*.104,y+.004,.153],[side*.17,y+.002,.122],
        [side*.24,y+.002,.061]],.005,'#c1b79c',8,5);
    }
    b.ball(.26,.756,.021,.059,.078,.049,'#785743');b.ball(.263,.764,.061,.032,.022,.008,'#c6a06b');
    b.ball(0,.592,-.28,.066,.085,.08,pigment.monkey);
    // The scribe's lacquered fude case hangs diagonally from a braided tasuki.
    tusk(b,[[-.151,1.24,.161],[.012,1.065,.220],[.149,.875,.187],[.210,.735,.123]],.017,'#644c3a');
    volume(b,[[.211,.693,.102,.040,.041],[.224,.774,.08,.045,.048],[.244,.889,.04,.038,.04]],'#856242',9);
    for(let i=0;i<2;i++)b.ball(.219+i*.018,.746+i*.11,.102-i*.04,.043,.011,.038,'#d4b172');
    tusk(b,[[.242,.871,.042],[.256,.972,.022],[.255,1.004,.016]],.018,'#a7895d');
  });
  head.rotation.x=.068;
  macaqueFace(head,batch);
  for(const s of [-1,1]) {
    const leg=group(body,'leg'+s+',1',s*.133,.65,-.05);
    batch(leg,b=>{
      volume(b,[[0,.04,-.013,.086,.1],[s*.032,-.11,.05,.112,.136],[s*.039,-.28,.09,.077,.071],
        [s*.054,-.42,-.01,.067,.078],[s*.055,-.54,-.012,.053,.052]],pigment.monkey,16);
      b.ball(s*.055,-.566,.045,.072,.048,.13,'#ac8876');
      for(let j=0;j<4;j++)b.ball(s*.055+(j-1.5)*.028,-.582,.146-Math.abs(j-1.5)*.012,.017,.019,.048,'#ba9581');
    });
    const arm=group(body,'arm'+s,s*.224,1.14,.030);
    const wrist=s===1?[s*.148,-.126,.308]:[s*.072,-.270,.294];
    batch(arm,b=>{
      const elbow=s===1?[s*.171,-.275,.069]:[s*.113,-.31,.067];
      // Folded haori sleeve opens at the elbow, then a slender wrist turns in.
      volume(b,[[0,.038,-.014,.092,.100],[s*.071,-.025,.004,.113,.116],
        [s*.143,-.143,.019,.104,.126],[elbow[0],elbow[1]+.026,elbow[2],.10,.105]],
        '#607b80',16);
      volume(b,[[s*.155,elbow[1]+.055,.057,.104,.116],
        [elbow[0],elbow[1]+.025,elbow[2],.105,.109],[elbow[0],elbow[1]+.003,elbow[2]+.007,.09,.094]],'#c2b690',9);
      for(let k=0;k<2;k++) {
        tusk(b,[[s*.082,-.023,.095],[s*.149,-.103,.10],[s*(.174+k*.031),-.161-k*.023,.089]],
          .009-k*.003,k?'#d2c3a4':'#425e64');
      }
      volume(b,[[...elbow,.074,.075],[s*.163,elbow[1]-.012,.132,.071,.080],
        [s*.110,wrist[1]-.031,.228,.052,.056],[...wrist,.036,.042]],pigment.monkey,18);
      const [x,y,z]=wrist;
      b.ball(x,y,z+.027,.050,.045,.047,'#bf9279',[0,s*.2,0]);
      for(let j=0;j<4;j++){
        b.stroke([[x+s*(.016-j*.014),y+.021,z+.047],[x+s*(.020-j*.014),y+.039-j*.003,z+.062],
          [x+s*(.012-j*.014),y+.039-j*.004,z+.077]],.010,'#c99e84',8,6);
      }
    });
    const [x,y,z]=wrist;
    if(s===1){
      const brush=group(arm,'fude',x,y+.035,z+.065);
      batch(brush,b=>{
        b.rod([0,-.158,0],[0,.239,0],.013,'#846547',.010);
        b.rod([0,.229,0],[0,.253,0],.015,'#5d4636');
        volume(b,[[0,.25,0,.016,.015],[0,.278,0,.024,.021],[0,.312,0,.015,.013],
          [0,.348,0,.001,.001]],'#413a32',12);
      });
    }else{
      const sheet=group(arm,'letter',x+.012,y+.076,z+.074);
      sheet.rotation.set(.10,-.23,-.34);
      batch(sheet,b=>{
        b.box(0,0,0,.162,.145,.008,'#e5d4a8');
        for(let j=0;j<3;j++)b.stroke([[-.044+j*.030,.047,.005],[-.034+j*.03,.028,.005],
          [-.041+j*.03,.008,.005],[-.032+j*.03,-.014,.005]],.0025,soot,7);
      });
    }
  }
}

// All the quills on a wing share a single UV mesh. The ridge is sculpted into
// its surface, and the barbules are painted directly on either side of it.
class FeatherFan {
  constructor(origin=new THREE.Vector3()) { this.origin=origin;this.xyz=[];this.uv=[];this.indices=[]; }
  add(root,tip,width,shade) {
    const start=new THREE.Vector3(...root), end=new THREE.Vector3(...tip);
    const delta=end.sub(start), chord=new THREE.Vector3(-delta.z,0,delta.x).normalize();
    const swatch=shade==='#474942'||shade==='#5c5a4e'?3:shade==='#77786b'||shade==='#888675'?2:
      ['#c9c3b4','#d2cdbd'].includes(shade)?1:0;
    const rows=16,columns=6,offset=this.xyz.length/3;
    for(let i=0;i<=rows;i++){
      const t=i/rows,center=start.clone().addScaledVector(delta,t);
      center.y+=Math.sin(t*Math.PI)*width*.49;
      const w=Math.max(.0004,width*Math.sin(t**.86*Math.PI)**.72);
      for(let j=0;j<=columns;j++){
        const f=j/columns,side=2*f-1;
        const p=center.clone().addScaledVector(chord,side*w*(side<0?.81:1));
        p.y+=w*(.092-.253*Math.abs(side)**.82);
        this.xyz.push(...p.sub(this.origin).toArray());
        this.uv.push(.001+.998*t,1-(swatch+.025+.95*f)/4);
        if(i<rows&&j<columns){
          const a=offset+i*(columns+1)+j;
          this.indices.push(a,a+1,a+columns+1,a+1,a+columns+2,a+columns+1);
        }
      }
    }
  }
  attach(parent) {
    const geo=new THREE.BufferGeometry();
    geo.setAttribute('position',new THREE.Float32BufferAttribute(this.xyz,3));
    geo.setAttribute('uv',new THREE.Float32BufferAttribute(this.uv,2));geo.setIndex(this.indices);geo.computeVertexNormals();
    const mesh=new THREE.Mesh(geo,coat('bird','wing'));mesh.castShadow=mesh.receiveShadow=true;
    parent.add(mesh);
  }
}
function crane(root,{group,batch}) {
  const body=group(root,'trunk'), head=group(body,'mask',0,0,0);
  pelt(body,'bird',[[0,.09,-.50,.006,.008],[0,.11,-.33,.088,.078],[0,.12,-.14,.151,.16],
    [0,.14,.04,.165,.174],[0,.17,.21,.121,.144],[0,.185,.33,.053,.07]]);
  const train=new FeatherFan();
  for(let i=-2;i<=2;i++)train.add([i*.034,.122,-.18],[i*.077,.073,-.58+Math.abs(i)*.044],.045,ivory);
  train.attach(body);
  batch(body,b=>{
    for(const s of [-1,1]){
      volume(b,[[s*.056,.074,-.19,.023,.024],[s*.083,.019,-.37,.018,.017],[s*.10,-.039,-.63,.015,.012],[s*.11,-.026,-.89,.012,.011]],soot,14);
      for(let toe=-1;toe<=1;toe++)tusk(b,[[s*.11,-.026,-.86],[s*.111+toe*.021,-.034,-.94],[s*.118+toe*.038,-.042,-1.05+Math.abs(toe)*.03]],.009,soot);
    }
  });
  batch(head,b=>{
    volume(b,[[0,.17,.235,.106,.104],[0,.19,.35,.071,.078],[0,.246,.49,.052,.06],[0,.298,.62,.048,.056],[0,.342,.72,.068,.074],[0,.342,.79,.070,.066],[0,.331,.842,.039,.042]],paper,23);
    for(const s of [-1,1]) {
      volume(b,[[s*.033,.313,.806,.017,.017],[s*.061,.302,.742,.026,.032],[s*.044,.26,.617,.023,.035],
        [s*.044,.222,.515,.023,.031],[s*.035,.20,.431,.019,.023],[s*.028,.185,.376,.004,.005]],soot,17);
      b.ball(s*.058,.356,.793,.014,.014,.018,'#bf9a59');
      b.ball(s*.067,.359,.797,.010,.012,.010,'#332f2a');
      tusk(b,[[s*.069,.337,.80],[s*.070,.332,.744],[s*.064,.329,.690]],.0065,'#7a7666');
      for(let k=0;k<4;k++)lock(b,[[s*.025,.245+k*.016,.487+k*.033],[s*.053,.229+k*.020,.419+k*.034],
        [s*.039,.198+k*.015,.322+k*.047]],.0105,[s,.08,0],['#918e7d','#d4cfbc','#9d9985']);
    }
    b.ball(0,.405,.745,.057,.022,.074,'#a34439');
    volume(b,[[0,.333,.817,.045,.036],[0,.338,.90,.037,.027],[0,.342,1.08,.017,.014],[0,.336,1.159,.001,.002]],'#827b53',12);
    for(const side of [-1,1])tusk(b,[[side*.035,.330,.852],[side*.031,.331,.928],[side*.014,.337,1.067]],.004,'#48483c');
  });
  for(const s of [-1,1]) {
    const wing=group(body,'wing'+s,s*.075,.175,-.031);
    const wrist=new THREE.Vector3(s*.775,.168,.109), hand=group(wing,'wingtip'+s,...wrist.toArray());
    const coverts=new FeatherFan(), primaries=new FeatherFan(wrist);
    function leadingEdge(parent,outer) {
      const positions=[],indices=[],uv=[],rows=18,sides=16;
      const lo=outer?.70:0,hi=outer?1.20:.82;
      for(let j=0;j<=rows;j++){
        const t=j/rows,span=lo+(hi-lo)*t,c=Math.sin(Math.min(1,span/1.25)*Math.PI*.86);
        const depth=(outer?.205-.165*t:.14+.105*Math.sin(t*Math.PI))*(.88+.12*c);
        const y=.020+.156*c,z=.009+.133*span;
        for(let k=0;k<=sides;k++){
          const a=k*TAU/sides,chord=(1-Math.cos(a))/2;
          positions.push(s*span-(outer?wrist.x:0),y+.023*Math.sin(Math.PI*chord)+
            Math.sin(a)*(.036+.021*(1-span/1.25))-.078*chord**2-(outer?wrist.y:0),z-depth*2*chord-(outer?wrist.z:0));
          uv.push(.04+.92*t,1-(.04+.90*chord)/4);
          if(j<rows&&k<sides){const i=j*(sides+1)+k;indices.push(i,i+1,i+sides+1,i+1,i+sides+2,i+sides+1);}
        }
      }
      const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
      geo.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));geo.setIndex(indices);geo.computeVertexNormals();
      const m=new THREE.Mesh(geo,coat('bird','wing'));m.castShadow=m.receiveShadow=true;parent.add(m);
    }
    leadingEdge(wing,false);leadingEdge(hand,true);
    // Long black remiges grow from the wrist. Their tips fan out along a
    // swept arc while the broad, shorter secondaries carry the elbow.
    for(let i=0;i<10;i++){
      const u=i/9,span=.71+.31*u;
      primaries.add([s*span,.158+.025*Math.sin(u*2.7),.058+.08*u],
        [s*(.82+.78*u),.064-.104*u,-.53+.485*u**1.45],.083-.025*u,i%4?'#474942':'#5c5a4e');
    }
    for(let i=0;i<12;i++){
      const u=i/11,x=.028+.75*u,y=.025+.141*Math.sin(u*1.80);
      coverts.add([s*x,y,.005+.054*u],[s*(x+.13+.065*u),y-.097,-.405-.082*Math.sin(u*2.2)],
        .080+.013*Math.sin(u*2.3),i<4?'#d2cdbd':i>8?'#77786b':'#888675');
    }
    for(let i=0;i<12;i++) {
      const u=i/11,x=.03+1.008*u,y=.058+.145*Math.sin(2.12*u);
      const fan=x>.74?primaries:coverts;
      fan.add([s*x,y,.051+.086*u],[s*(x+.154),y-.059,-.19-.093*Math.sin(Math.PI*u)],
        .076-.019*u,i%3?'#dcd5c4':'#c9c3b4');
    }
    coverts.attach(wing);primaries.attach(hand);
  }
}

const dragonSpine=[[-.78,1.21,-2.95,.004,.004],[-.80,.98,-3.12,.061,.073],[-.65,.65,-3.16,.092,.108],
  [-.35,.36,-2.92,.141,.15],[-.19,.26,-2.56,.182,.19],[-.29,.50,-2.12,.204,.214],
  [-.28,.90,-1.76,.225,.25],[.02,1.06,-1.46,.249,.262],[.39,.96,-1.17,.258,.275],
  [.54,.66,-.79,.279,.291],[.45,.50,-.35,.301,.318],[.10,.52,.04,.315,.323],
  [-.24,.75,.40,.312,.32],[-.44,1.06,.70,.286,.301],[-.45,1.45,.87,.27,.284],
  [-.35,1.74,1.08,.239,.264],[-.13,1.88,1.42,.214,.243]];
function dragon(root,{group,batch}){
  const body=group(root,'trunk');
  const skin=pelt(body,'dragon',dragonSpine);
  skin.name='龍の胴';
  const curve=new THREE.CatmullRomCurve3(dragonSpine.map(s=>new THREE.Vector3(...s.slice(0,3))));
  for(let i=0;i<18;i++){
    const t=.05+i*.051,pt=curve.getPoint(t),r=dragonSpine[Math.round(t*(dragonSpine.length-1))][4];
    const joint=group(body,'spine'+i,pt.x,pt.y,pt.z);
    batch(joint,b=>{
      const flare=.085+r*.49;
      lock(b,[[0,r*.73,.108],[.013,r+flare*.47,.006],[.026,r+flare*.79,-.070],
        [.029,r+flare*1.40,-.167-.035*Math.sin(i)]],.047+r*.16,[.96,0,.12],['#aa7346','#d19d64','#765741']);
      if(i%2===0)for(const side of [-1,1]){
        lock(b,[[side*r*.22,r*.81,.085],[side*r*.37,r*.97,.006],[side*r*.40,r*1.16,-.077],
          [side*r*.52,r*1.19,-.14]],.034+r*.065,[side,.22,0],['#668979','#85a28a','#4b6256']);
      }
      for(const s of [-1,1])tusk(b,[[s*r*.70,-r*.54,.025],[s*r*.46,-r*.83,.028],[s*.002,-r*.92,.052]],.016,'#c9b58a');
      if(i===7||i===13)for(const s of [-1,1]){
        const q=i===7?-1:1;
        const reach=i===13?.16:-.07;
        const wrist=[s*(r+.41),-.49,.107*q+reach];
        volume(b,[[s*r*.57,-.04,0,.103,.12],[s*(r+.123),-.102,-q*.090,.117,.111],
          [s*(r+.265),-.221,-q*.257,.093,.101],[s*(r+.337),-.326,-q*.137,.059,.068],
          [...wrist,.052,.058],[s*(r+.47),-.530,.146*q+reach,.063,.043]],pigment.dragon,19);
        for(let digit=-1;digit<=1;digit++){
          const x=s*(r+.47+digit*.083),z=q*.16+reach;
          volume(b,[[s*(r+.404+digit*.034),-.49,q*.121+reach,.034,.030],
            [x,-.567,z,.027,.022],[x+s*.014,-.617,z+.054,.014,.014]],'#9b9566',11);
          tusk(b,[[x+s*.011,-.603,z+.043],[x+s*.032,-.631,z+.085],
            [x+s*.013,-.620,z+.138]],.017,ivory);
        }
        // The rear talon opposes the three extended digits.
        tusk(b,[[s*(r+.39),-.495,.113*q+reach],[s*(r+.353),-.507,.038*q+reach],
          [s*(r+.341),-.547,.008*q+reach],[s*(r+.350),-.566,-.023*q+reach]],.020,ivory);
        lock(b,[[s*(r+.072),-.080,-q*.009],[s*(r+.190),-.129,-q*.121],
          [s*(r+.223),-.081,-q*.235],[s*(r+.204),-.043,-q*.302]],.053,
          [s,.1,0],['#a57c4f','#c39b65','#795e42']);
      }
    });
  }
  const head=group(body,'mask',-.13,1.88,1.42);
  head.scale.setScalar(1.26);
  const stations=[[0,.005,-.28,.127,.167],[0,.08,-.17,.263,.277],[0,.11,.02,.327,.294],[0,.11,.20,.306,.237],
    [0,.048,.38,.231,.16],[0,.045,.53,.176,.117],[0,.087,.70,.199,.127],[0,.088,.775,.10,.081]];
  pelt(head,'dragon',stations,true);
  sculptEye(head,stations,'dragon',group,batch);
  batch(head,b=>{
    volume(b,[[0,-.061,-.016,.17,.084],[0,-.123,.19,.224,.093],[0,-.150,.42,.175,.064],
      [0,-.150,.61,.154,.046],[0,-.118,.743,.071,.027]],'#ccb587',19);
    volume(b,[[0,-.088,.15,.146,.085],[0,-.117,.32,.188,.067],[0,-.108,.49,.158,.043],
      [0,-.116,.61,.131,.026],[0,-.109,.699,.062,.014]],'#825541',16);
    volume(b,[[0,-.107,.391,.057,.039],[0,-.113,.49,.087,.024],[0,-.110,.61,.062,.015],
      [0,-.112,.64,.031,.008]],'#ad765a',12);
    for(const s of [-1,1]){
      antler(b,s,.291,-.057,1.16);
      tusk(b,[[s*.267,.590,-.273],[s*.314,.710,-.346],[s*.289,.813,-.439]],.025,'#b4a27e');
      ear(b,s,.258,.136,-.12,.20,pigment.dragon,'#ac9472');

      tusk(b,[[s*.13,.222,.37],[s*.238,.29,.25],[s*.343,.264,.13],[s*.398,.31,.013]],.048,'#ab8058');
      // Layered gill plates erupt into hooked flame locks behind the jaw.
      // Their dark roots are visible between the vermilion and gold sweeps.
      for(let j=0;j<6;j++){
        const y=.224-j*.070,z=.021-j*.012,x=.210+j*.009;
        lock(b,[[s*x,y,z],[s*(x+.135),y+.068,z-.124],
          [s*(x+.224),y+.015+j*.012,z-.265],[s*(x+.295),y+.14-j*.010,z-.396]],
          .083-j*.004,[s,.08,.13],j%2?['#ac6b44','#c68c53','#74503c']:['#966244','#bd8b53','#684b39']);
      }
      for(let j=0;j<3;j++){
        const y=.08-j*.07,z=.023-j*.032;
        tusk(b,[[s*.235,y,z],[s*(.348+.02*j),y-.018,z-.14],[s*(.403+.03*j),y+.069,z-.32],[s*(.390+.021*j),y+.105,z-.46]],.043,'#a47851');
      }
      volume(b,[[s*.105,.112,.662,.027,.023],[s*.134,.143,.698,.056,.042],
        [s*.119,.163,.735,.045,.027],[s*.091,.144,.757,.018,.013]],'#8d966e',12);
      b.ball(s*.129,.163,.718,.032,.017,.036,soot,[.20,0,-s*.18]);
      lock(b,[[s*.141,.204,.39],[s*.232,.308,.269],[s*.272,.328,.12],[s*.353,.410,-.01]],
        .059,[s,.18,.20],['#93603e','#c38b55','#684c37']);
      tusk(b,[[s*.072,-.006,.745],[s*.16,-.018,.673],[s*.183,-.05,.490],[s*.22,-.029,.348]],.018,soot);
      tusk(b,[[s*.174,-.009,.571],[s*.182,-.099,.583],[s*.168,-.128,.605]],.028,ivory);
      const whisker=[[s*.131,.066,.702],[s*.286,.075,.857],[s*.484,.223,.908],[s*.697,.357,.743],
        [s*.839,.296,.505],[s*.834,.164,.404],[s*.733,.126,.417],[s*.700,.151,.490]];
      tusk(b,whisker,.019,'#655540');
      lock(b,[whisker[0],[s*.197,.079,.776],[s*.232,.114,.800],[s*.273,.137,.797]],.029,
        [s,.15,.4],['#a88d65','#d0b991','#79654c']);
    }
    for(let j=-1;j<=1;j++)lock(b,[[j*.048,-.081,.608],[j*.074,-.196,.557],
      [j*.087,-.295,.467],[j*.121,-.381,.341]],.054,[j*.6,-.13,.85],['#af8957','#d3b37c','#806847']);
    for(let j=-2;j<=2;j++)tusk(b,[[j*.04,-.11,.528],[j*.053,-.264,.43],[j*.047,-.32,.31]],.035,'#a5845a');
  });
}

const brushMaterials=new WeakMap();
export function buildBeast(parent,type,builders,variant=0) {
  if(type==='deer'||type==='boar'||type==='shishi')buildScrollBeast(parent,type,builders,variant,coat);
  else if(type==='monkey')simian(parent,builders);
  else if(type==='bird')crane(parent,builders);
  else if(type==='dragon')dragon(parent,builders);
  else {quadruped(parent,type,builders);bindScrollSkin(parent);}
  // The studio's shared vertex-colour material also paints the buildings.
  // Give these brush details their own reusable ink response.
  parent.traverse(part=>{
    const source=part.material;
    if(!source?.vertexColors || !source.isMeshStandardMaterial || source.userData.portrait)return;
    if(!brushMaterials.has(source)) {
      const copy=source.clone();
      copy.onBeforeCompile=source.onBeforeCompile;copy.customProgramCacheKey=source.customProgramCacheKey;
      brushMaterials.set(source,surfaceGrain(paperPigment(brushWash(copy,.50)),1.8));
    }
    part.material=brushMaterials.get(source);
  });
}
// The open-mouthed lion follows a little copper butterfly, as in scroll B.
let butterflyWing, butterflyPaint;
function lionButterfly(trunk) {
  if(!butterflyWing) {
    const outline=new THREE.Shape();
    outline.moveTo(0,0);outline.bezierCurveTo(.09,.12,.26,.135,.30,.095);
    outline.bezierCurveTo(.31,.043,.235,-.018,.154,-.035);
    outline.bezierCurveTo(.20,-.075,.152,-.118,.106,-.099);
    outline.bezierCurveTo(.044,-.09,.026,-.025,0,0);
    butterflyWing=new THREE.ShapeGeometry(outline,16);
    const ink=[];
    for(let i=0;i<butterflyWing.attributes.position.count;i++){
      const a=butterflyWing.attributes.position,x=a.getX(i),y=a.getY(i);
      const pigment=new THREE.Color(x>.19 || y<-.071?'#534336':'#e9a641');
      ink.push(pigment.r,pigment.g,pigment.b);
    }
    butterflyWing.setAttribute('color',new THREE.Float32BufferAttribute(ink,3));
    butterflyPaint=new THREE.MeshBasicMaterial({vertexColors:true,side:THREE.DoubleSide});
  }
  const insect=new THREE.Group();
  for(const side of [-1,1]){
    const wing=new THREE.Mesh(butterflyWing,butterflyPaint);wing.scale.x=side;insect.add(wing);
  }
  trunk.add(insect);return insect;
}
export function beastRig(mesh,n) {
  bindScrollSkin(mesh);
  const joints={};mesh.traverse(o=>{if(o.isGroup&&o.name)joints[o.name]=o;});
  if(n.type==='dragon')prepareDragon(mesh,joints);
  if(n.type==='monkey') {
    joints.face=mesh.getObjectByName('猿の面相');
    joints.face.getObjectByName('墨の輪郭').morphTargetInfluences=joints.face.morphTargetInfluences;
  }
  if(n.type==='shishi' && !n.variant)joints.butterfly=lionButterfly(joints.trunk);
  joints.mask.userData.restY=joints.mask.position.y;
  joints.mask.userData.restZ=joints.mask.position.z;
  mesh.scale.setScalar(n.stature||SPECIES[n.type].stature);
  return joints;
}
const brushTarget=new THREE.Vector3(), brushGrip=new THREE.Vector3(), brushUp=new THREE.Vector3(0,1,0);
const brushRest=new THREE.Quaternion().setFromEuler(new THREE.Euler(-.16,0,-.18)), brushAngle=new THREE.Quaternion();
export function poseBeast(j,n,time) {
  const t=time+(n.phase||0),g=j.trunk,head=j.mask;
  const walk=Math.min(1,n.speed??1),p=t*(n.type==='tiger'?2.8:3.8);
  const hold=n.gesture||0, variation=n.variation||0;
  if(n.type==='dragon') {poseDragon(j,n,time);return;}
  if(n.type==='bird') {
    const flap=t*4.35, thermal=.5+.5*Math.cos(t*.51);
    const amplitude=.18+.82*thermal*thermal;
    const stroke=amplitude*(.79*Math.sin(flap)+.21*Math.sin(2*flap-.32));
    for(const s of [-1,1]){
      j['wing'+s].rotation.z=s*(.15+stroke*.69);
      j['wing'+s].rotation.y=s*(.05+amplitude*.13*Math.cos(flap-.39));
      j['wing'+s].rotation.x=-.07*amplitude*Math.cos(flap);
      const wrist=j['wingtip'+s];
      if(wrist){
        wrist.rotation.z=s*amplitude*(.22*Math.sin(flap-.92)-.10);
        wrist.rotation.y=s*amplitude*(.075+.16*Math.cos(flap-.42));
      }
    }
    g.rotation.z=.11+.19*Math.sin(t*.53);
    g.position.y=.045*amplitude*Math.cos(flap-.3);
    head.rotation.x=-.055*amplitude*Math.cos(flap-.63);
    head.rotation.y=.05*Math.sin(t*.62);return;
  }
  if(n.type==='kirin') {
    const phase=t*kirinFrequency;
    for(const s of [-1,1])for(const f of [-1,1]){
      poseKirinLeg(j['leg'+s+','+f],s,phase-hoofPhase(s,f));
    }
    poseKirinTrunk(g,phase);
    head.rotation.x=.030*Math.sin(phase)+.045*Math.sin(t*.48);
    head.rotation.y=.15*Math.sin(t*.64);j.tail.rotation.y=.22*Math.sin(t*.93);return;
  }
  for(const s of [-1,1]){
    if(n.type==='monkey'){
      j['leg'+s+',1'].rotation.x=s*.45*Math.sin(p)*walk;
      const arm=j['arm'+s];
      arm.rotation.x=-s*(s===1?.16:.24)*Math.sin(p)*walk-.06;
      arm.rotation.z=s===1?.075*Math.sin(t*1.7):.035*Math.cos(t*1.5);
      arm.rotation.y=s===1?-.42*hold:.48*hold;
      // The scribe raises the sheet to read it, or traces a character.
      if(s===1) {
        arm.rotation.x-=hold*(.28+.11*Math.sin(t*3.8));
        arm.rotation.z+=hold*(.12+.08*Math.sin(t*5));
      } else arm.rotation.x-=hold*(variation===1?.52:.25);
    }else for(const f of [-1,1]){
      const stride=Math.sin(p+(s<0?Math.PI:0)+(f<0?Math.PI*.73:0));
      const leg=j['leg'+s+','+f];
      leg.rotation.set(stride*.31*walk,0,0);
    }
  }
  g.position.y=.023*walk*Math.abs(Math.cos(p));g.rotation.set(0,0,.025*walk*Math.sin(p));
  head.rotation.set(.032*Math.cos(p)*walk,.18*Math.sin(t*.88),0);
  if(n.type==='monkey') {
    head.rotation.x+=hold*(.22+.11*Math.cos(t*2));head.rotation.z=.13*hold;
    const lidClock=(t+1.07)%4.83;
    j.face.morphTargetInfluences[0]=Math.exp(-((lidClock-.63)**2)/.0038);
    j.face.morphTargetInfluences[1]=hold*(variation===1?.45+.42*Math.sin(t*3.2):.18);
    const writing=variation!==1?hold:0;
    j.fude.quaternion.copy(brushRest);
    if(writing>0){
      brushTarget.set(.039*Math.sin(t*2.1),.043*Math.cos(t*3.1),.009);
      j.letter.localToWorld(brushTarget);
      j.fude.parent.worldToLocal(brushTarget);
      brushGrip.copy(brushTarget).sub(j.fude.position);
      brushAngle.setFromUnitVectors(brushUp,brushGrip.normalize());
      j.fude.quaternion.slerp(brushAngle,writing);
    }
  } else if(n.type==='deer'){
    const bow=n.encounter==='bow' ? hold : 0;
    const graze=variation===1?0:hold;
    head.position.y=head.userData.restY-.07*graze;
    head.position.z=head.userData.restZ+.035*graze;
    head.rotation.x+=hold*(variation===1?-.22:1.34+.04*Math.cos(t*4));
    head.rotation.y+=hold*.16*Math.sin(t*2.2);
    head.rotation.x+=1.08*bow;
    g.rotation.x+=.12*graze+.22*bow;
    for(const s of [-1,1]) j['leg'+s+',1'].rotation.x-=.18*bow;
    for(const s of [-1,1])j['pinna'+s].rotation.y=s*(.13*Math.sin(t*1.8+s)+hold*.49*Math.sin(t*1.13+s));
  } else if(n.type==='boar'){
    g.rotation.x=.15*hold;
    head.position.y=head.userData.restY-.09*hold;
    head.rotation.x+=hold*(.69+.14*Math.cos(t*3.9));
    for(const s of [-1,1])j['pinna'+s].rotation.z=s*.18*hold*Math.sin(t*3.9);
    head.rotation.y+=hold*.26*Math.sin(t*2.4);
  } else if(n.type==='tiger'){
    g.position.y-=.09*hold;g.rotation.x=.06*hold;
    head.rotation.y+=hold*.46*Math.sin(t*.8);
    if(variation===2){
      j['leg1,1'].rotation.x-=.92*hold;head.rotation.x+=.35*hold;head.rotation.y+=.32*hold;
    }else j['leg1,1'].rotation.x-=.28*hold;
  } else if(n.type==='fox'){
    head.rotation.z=hold*(.32+.1*Math.sin(t*.91));
    j['leg-1,1'].rotation.x-=hold*.60;
  } else if(n.type==='shishi'){
    if(n.variant===1){
      head.rotation.z=.42*hold;head.rotation.y=-.46*hold;
      g.rotation.z=-.11*hold;
      const hind=j['leg-1,-1'];
      hind.rotation.x-=hold*(1.7+.17*Math.sin(t*9));hind.rotation.z=-.71*hold;
    } else {
      if(j.butterfly) {
        const insect=j.butterfly;
        insect.position.set(.55*Math.sin(t*1.8),1.85+.24*Math.cos(t*2.4),1.54+.26*Math.cos(t*1.73));
        insect.rotation.set(-.33,.66*Math.cos(t*1.8),.25*Math.sin(t*2.4));
        for(const [i,wing] of insect.children.entries())wing.rotation.y=(i?1:-1)*(.77+.66*Math.sin(t*14));
      }
      g.rotation.x=-.19*hold;g.position.y+=hold*.075;
      j['leg1,1'].rotation.x-=hold*(.57+.13*Math.cos(t*2.7));
      head.rotation.x-=.27*hold;head.rotation.y+=.44*hold*Math.sin(t*1.8);
    }
  }
  if(n.flash>0)head.rotation.z+=.15*Math.sin(n.flash*6);
  if(j.tail){j.tail.rotation.y=.24*Math.sin(t*1.43)+hold*.18*Math.sin(t*2);j.tail.rotation.x=.10*Math.sin(p*.6);}
}
