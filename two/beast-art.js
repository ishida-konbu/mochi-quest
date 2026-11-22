// Scroll silhouettes are lofted through painted cross-sections. A single atlas per
// pelt wraps continuously across both flanks; the mane, joints and toes retain volume.
import * as THREE from './vendor/three.module.min.js';
import { inkVolume } from './scroll-sculpt.js';
import { SPECIES } from './bestiary.js';

const TAU=Math.PI*2, soot='#493d35', paper='#eadbc0', ivory='#efdfbc', cinnabar='#a75142';
const pigment={monkey:'#957057',bird:'#eae4d4',fox:'#bd7445',tiger:'#c18b49',dragon:'#648575',kirin:'#c5a46c'};
const coats = new Map(), coatLoads = new Map();
const coatLoader = new THREE.TextureLoader();
const coatParts = {
  monkey: ['body', 'face'],
  bird: ['body', 'wing'],
  fox: ['body', 'face', 'brush', 'leg'],
  tiger: ['body', 'face', 'leg'],
  dragon: ['body', 'face'],
  kirin: ['body', 'face', 'leg'],
};

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
      point.copy(center).addScaledVector(across,Math.cos(a)*Math.max(.002,r.x)).addScaledVector(up,Math.sin(a)*Math.max(.002,r.y));
      positions.push(...point.toArray());uv.push(t,1-k/sides);
      if(j<rows&&k<sides){const n=j*(sides+1)+k;indices.push(n,n+1,n+sides+1,n+1,n+sides+2,n+sides+1);}
    }
  }
  const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
  geo.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));geo.setIndex(indices);geo.computeVertexNormals();
  const mesh=new THREE.Mesh(geo,coat(type,mask));mesh.castShadow=mesh.receiveShadow=true;parent.add(mesh);
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
  const t=dragon?.445:fox?.49:kirin?.51:.50;
  const centers=new THREE.CatmullRomCurve3(stations.map(s=>new THREE.Vector3(...s.slice(0,3))));
  const sizes=new THREE.CatmullRomCurve3(stations.map(s=>new THREE.Vector3(s[3],s[4],0)));
  function skin(q,a) {
    const r=sizes.getPoint(q),center=centers.getPoint(q),tangent=centers.getTangent(q);
    const across=new THREE.Vector3(1,0,0);
    const up=tangent.clone().cross(across).normalize();
    return center.addScaledVector(across,r.x*Math.cos(a)).addScaledVector(up,r.y*Math.sin(a));
  }
  for(const s of [-1,1]){
    const angle=s===1?.37:Math.PI-.37, anchor=skin(t,angle);
    const along=skin(t+.003,angle).sub(skin(t-.003,angle)).normalize();
    const around=skin(t,angle+.004).sub(skin(t,angle-.004)).normalize();
    const outward=around.cross(along).normalize(),right=new THREE.Vector3(0,1,0).cross(outward).normalize();
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
  // A pointed three-plane pinna with warm shell and a separately painted hollow.
  volume(b,[[s*x,y,z,.08,.065],[s*(x+.016),y+.09,z-.003,.105,.075],[s*(x+.06),y+h*.68,z-.03,.058,.038],[s*(x+.09),y+h,z-.045,.002,.001]],fur);
  volume(b,[[s*x,y+.058,z+.058,.055,.009],[s*(x+.025),y+.122,z+.054,.067,.012],[s*(x+.068),y+h*.81,z-.003,.001,.002]],inner,12);
}
function antler(b,s,y,z,k=1) {
  const points=[[s*.15,y,z],[s*.22,y+.20*k,z-.11*k],[s*.40,y+.43*k,z-.27*k],[s*.52,y+.54*k,z-.45*k]];
  tusk(b,points,.046*k,'#967953');
  tusk(b,[points[1],[s*.19,y+.33*k,z+.022],[s*.25,y+.44*k,z+.02]],.035*k,ivory);
  tusk(b,[points[2],[s*.4,y+.56*k,z-.20],[s*.45,y+.65*k,z-.235]],.029*k,ivory);
}
function paw(leg,s,h,front,type,batch) {
  const hoof=type==='kirin',tiger=type==='tiger',back=front<0;
  const r=tiger?.125:hoof?.072:.071;
  const knee=back?.12:-.055, hock=back?-.128:-.009;
  const stations=[
    [0,.115,-.016,.058,.074],[s*.006,.038,-.004,r*1.10,r*1.22],
    [s*.021,-h*.17,.027,r*(back?1.48:1.14),r*(back?1.64:1.19)],
    [s*.016,-h*.40,knee,r*.85,r*(back?1.08:.85)],
    [s*.02,-h*.58,(knee+hock)*.5,r*.66,r*.75],
    [s*.019,-h*.71,hock,r*.57,r*.68],
    [s*.016,-h*.82,hock+.003,r*.48,r*.51],
    [s*.018,-h*.905,hock+.020,r*.52,r*.56],
    [s*.016,-h*.955,hock+.060,r*.63,r*.43]
  ];
  pelt(leg,type,stations,'leg');
  batch(leg,b=>{
    const z=hock+.07, pad=hoof?'#625449':tiger?'#c49760':'#5d493d';
    if(hoof){
      for(const d of [-1,1]){
        volume(b,[[s*.016+d*.023,-h*.91,z-.015,.027,.037],
          [s*.016+d*.025,-h*.951,z,.032,.049],[s*.018+d*.026,-h*.969,z+.064,.026,.019],
          [s*.016+d*.028,-h*.975,z+.080,.002,.003]],pad,10);
      }
      lock(b,[[0,-h*.43,knee-.03],[s*.030,-h*.39,knee-.112],[s*.027,-h*.33,knee-.20]],
        .028,[s,0,.17],['#996848','#bc8b56','#765941']);
    }else{
      const size=tiger?1:.62;
      b.ball(s*.017,-h*.938,z,.100*size,.056*size,.108*size,pad);
      for(let digit=-1;digit<=1;digit++){
        b.ball(s*.017+digit*.051*size,-h*.959,z+(.072-.014*Math.abs(digit))*size,.041*size,.031*size,.061*size,pad);
      }
    }
  });
}
function tailBrush(b,type) {
  if(type==='tiger'){
    const path=[[0,0,0],[.03,.08,-.28],[.17,.1,-.57],[.29,.25,-.77],[.28,.48,-.91],[.21,.56,-.97]];
    const curve=new THREE.CatmullRomCurve3(path.map(q=>new THREE.Vector3(...q)));
    for(let i=0;i<14;i++){
      const stations=[];for(let j=0;j<=4;j++){const t=(i+j/4)/14,r=.086*(1-.59*t)*(t>.92?Math.max(.04,(1-t)/.08):1);stations.push([...curve.getPoint(t).toArray(),r,r]);}
      volume(b,stations,i%2?soot:pigment.tiger,6);
    }
  }else{
    tusk(b,[[0,0,0],[0,.03,-.26],[.09,-.14,-.55],[.19,-.09,-.79],[.23,.04,-.91]],.07,'#8d7853');
    for(let k=0;k<5;k++){
      const x=.18+.023*k,y=-.089+.022*k;
      lock(b,[[x,y,-.69],[x+.046,y+.064,-.828],[x+.076,y+.174,-.908],
        [x-.007+.032*k,y+.236+.018*k,-.959+.009*k]],.056,[.89,.1,-.3],
        k%2?['#9c6e45','#ce9d5c','#795b3f']:['#b17a4b','#dbb571','#8b6343']);
    }
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
  pelt(body,type,trunk);
  for(const s of [-1,1])for(const front of [-1,1]) {
    const leg=group(body,'leg'+s+','+front,s*wide*.68,high-.047,front*length*.59);
    paw(leg,s,high-.047,front,type,batch);
  }
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
  }else batch(tail,b=>tailBrush(b,type));
  const neckTop=kirin?2.15:fox?.93:1.15;
  const neck=[
    [0,high-.06,length*.30,wide*.80,wide*.91],[0,high+.14,length*.54,wide*.86,wide*.87],
    [0,(high+neckTop)*.5+.04,length*.73,wide*.68,wide*.74],[0,neckTop,length*.89,wide*.53,wide*.57]
  ];
  if(kirin)pelt(body,type,neck);
  batch(body,b=>{
    if(!kirin)volume(b,neck,pigment[type]);
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
        tusk(b,[[side*.216,y,z],[side*(.37+.023*k),y+.04,z-.112],[side*(.43+.022*k),y+.15,z-.25],[side*(.38+.021*k),y+.22,z-.30]],.034,'#ab7851');
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
  const head=group(body,'mask',0,neckTop,length*.86);
  const mask=fox?.18:kirin?.22:.29, snout=fox?.38:kirin?.45:.37;
  const headStations=fox?[
    [0,.028,-.175,.037,.064],[0,.075,-.09,.146,.16],[0,.089,-.005,.183,.163],
    [0,.067,.108,.172,.132],[0,.046,.203,.122,.088],[0,.031,.293,.079,.053],[0,.019,.382,.030,.027]
  ]:kirin?[
    [0,.047,-.19,.065,.113],[0,.075,-.095,.187,.219],[0,.089,.038,.216,.211],
    [0,.076,.142,.191,.155],[0,.042,.27,.131,.114],[0,.011,.381,.116,.086],[0,.043,.46,.082,.059]
  ]:[
    [0,.011,-.226,.066,.115],[0,.068,-.146,.235,.235],[0,.103,-.038,.282,.247],
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
        b.ball(s*.192,.231,-.004,.094,.109,.052,soot,[0,s*.2,s*-.27]);
        b.ball(s*.19,.239,.037,.061,.070,.021,paper);
        volume(b,[[s*.19,.045,.08,.068,.08],[s*.237,-.012,.084,.089,.089],[s*.286,-.091,.034,.031,.042],[s*.33,-.116,-.01,.004,.003]],paper);
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
            fox?.030:.050,[s,.3,.13],shades);
        }
      }
      const muzzleWidth=fox?.052:kirin?.078:.108;
      b.ball(s*muzzleWidth*.66,-.012,snout*.81,muzzleWidth,fox?.045:kirin?.067:.077,
        fox?.072:kirin?.094:.089,paper,[0,s*.30,s*.14]);
      if(tiger||fox)for(let i=0;i<6;i++){
        const x=muzzleWidth*(.50+.25*(i%3));
        b.ball(s*x,-.01-Math.floor(i/3)*.016,snout*.81+.068+.01*Math.cos(i),
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
function simian(root,{group,batch}) {
  const body=group(root,'trunk'), head=group(body,'mask',0,1.302,.125);
  pelt(body,'monkey',[[0,.55,-.10,.03,.04],[0,.58,-.085,.225,.172],[0,.73,-.06,.221,.169],
    [0,.92,-.01,.194,.147],[0,1.10,.018,.206,.151],[0,1.23,.067,.134,.104],[0,1.30,.08,.105,.089]]);
  batch(body,b=>{
    // Indigo sleeveless travelling coat, with a crossed collar, obi and small inro.
    volume(b,[[0,.64,-.066,.251,.203],[0,.67,-.058,.287,.217],[0,.91,-.01,.256,.204],[0,1.13,.019,.274,.213],
      [0,1.22,.032,.213,.168],[0,1.255,.055,.137,.13 ]],'#526d73',18);
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
  pelt(head,'monkey',[[0,-.03,-.193,.035,.056],[0,.036,-.14,.17,.20],[0,.07,-.035,.232,.232],
    [0,.089,.067,.225,.216],[0,.05,.14,.171,.154],[0,.002,.187,.13,.102],[0,-.019,.225,.073,.051]],true);
  for(const s of [-1,1]){
    const brow=group(head,'eyeMask'+s,s*.096,.107,.160);
    brow.rotation.y=s*.39;
    batch(brow,b=>{
      b.ball(0,0,.006,.099,.084,.058,'#bf846c');
      b.ball(0,.001,.054,.039,.030,.019,'#f2dcaf',[0,0,-s*.09]);
      b.ball(-s*.003,.001,.069,.017,.024,.013,soot);
      b.ball(-s*.008,.008,.080,.0054,.0054,.003,ivory);
      tusk(b,[[-s*.045,.007,.050],[-s*.024,.031,.056],[s*.013,.034,.060],[s*.049,.017,.048]],.008,soot);
      tusk(b,[[-s*.056,.051,.033],[-s*.018,.070,.042],[s*.023,.068,.041],[s*.071,.041,.027]],.013,'#695548');
      tusk(b,[[s*.020,-.033,.052],[s*.051,-.034,.042],[s*.070,-.026,.028]],.005,'#956d5d');
    });
  }
  batch(head,b=>{
    for(const s of [-1,1]){
      b.ball(s*.213,.09,.005,.071,.084,.044,'#a37669',[0,s*.27,.05*s]);
      b.ball(s*.224,.094,.044,.044,.056,.015,'#c9957d');

      // Pale sideburns spread from the cheekbones into the throat ruff.
      for(let i=0;i<5;i++){
        const y=.093-i*.033;
        lock(b,[[s*.134,y+.043,.122],[s*.198,y+.008,.115],[s*.235,y-.057,.074],
          [s*(.231+.008*i),y-.084,.042-i*.012]],.041,[s,0,.25],
          i%2?['#ab9070','#b6a084','#8c7660']:['#b29777','#bfa88d','#99846b']);
      }
      for(let i=0;i<3;i++)tusk(b,[[s*.17,.065-i*.047,.10],[s*.211,.037-i*.044,.082],[s*.226,.015-i*.042,.043]],.016,'#c5b095');
    }
    b.ball(0,-.016,.180,.124,.086,.074,'#cc957c');
    b.ball(0,.037,.224,.07,.042,.028,'#b68371');
    for(const s of [-1,1])b.ball(s*.03,.036,.245,.015,.009,.008,soot);
    tusk(b,[[-.058,-.022,.236],[-.015,-.037,.242],[.04,-.029,.241],[.072,-.01,.226]],.008,soot);
    for(let i=-2;i<=2;i++)tusk(b,[[i*.038,.247,.04],[i*.05,.286,.001],[i*.046+.02,.31,-.033]],.033,pigment.monkey);
  });
  for(const s of [-1,1]) {
    const leg=group(body,'leg'+s+',1',s*.133,.65,-.05);
    batch(leg,b=>{
      volume(b,[[0,.04,-.013,.086,.1],[s*.032,-.11,.05,.112,.136],[s*.039,-.28,.09,.077,.071],
        [s*.054,-.42,-.01,.067,.078],[s*.055,-.54,-.012,.053,.052]],pigment.monkey,16);
      b.ball(s*.055,-.566,.045,.072,.048,.13,'#ac8876');
      for(let j=0;j<4;j++)b.ball(s*.055+(j-1.5)*.028,-.582,.146-Math.abs(j-1.5)*.012,.017,.019,.048,'#ba9581');
    });
    const arm=group(body,'arm'+s,s*.224,1.14,.030);
    batch(arm,b=>{
      const elbow=s===1?[s*.171,-.275,.069]:[s*.113,-.31,.067];
      const wrist=s===1?[s*.148,-.126,.308]:[s*.072,-.270,.294];
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
      if(s===1) {
        // A loaded brush, held between the fingertips with its bristles raised.
        const a=[x-.031,y-.127,z+.093],c=[x+.048,y+.268,z+.007];
        b.rod(a,c,.014,'#81543a',.011);
        b.rod([x+.045,y+.248,z+.013],[x+.051,y+.288,z+.004],.017,'#5d4636');
        volume(b,[[x+.052,y+.286,z+.004,.016,.015],[x+.056,y+.315,z-.005,.026,.022],
          [x+.064,y+.353,z-.009,.019,.016],[x+.079,y+.40,z-.002,.001,.001]],'#413a32',12);
      }else {
        // A folded letter provides a broad light silhouette against the jacket.
        b.box(x+.014,y+.075,z+.066,.16,.142,.010,'#e5d4a8',[.10,-.23,-.38]);
        for(let j=0;j<3;j++){
          b.stroke([[x-.032+j*.029,y+.081,z+.078],[x-.022+j*.029,y+.113,z+.075],
            [x-.027+j*.029,y+.122,z+.072]],.0036,'#6a5844',5,5);
        }
      }
    });
  }
}

// All the quills on a wing share a single UV mesh. The ridge is sculpted into
// its surface, and the barbules are painted directly on either side of it.
class FeatherFan {
  constructor() { this.xyz=[];this.uv=[];this.indices=[]; }
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
        this.xyz.push(...p.toArray());
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
    const wing=group(body,'wing'+s,s*.10,.17,-.021),fan=new FeatherFan();
    batch(wing,b=>{
      const leading=[],indices=[],rows=16,columns=7;
      for(let i=0;i<=rows;i++)for(let j=0;j<=columns;j++){
        const t=i/rows,v=j/columns,x=(.018+1.09*t),depth=.42*(.96-.35*t);
        const y=.039+.158*Math.sin(t*Math.PI*.81)-.04*v*v+.036*Math.sin(v*Math.PI);
        leading.push(s*(x+.09*v*t),y,.065+.068*t-v*depth);
        const k=i*(columns+1)+j;
        if(i<rows&&j<columns)indices.push(k,k+1,k+columns+1,k+1,k+columns+2,k+columns+1);
      }
      const cover=new THREE.BufferGeometry();cover.setAttribute('position',new THREE.Float32BufferAttribute(leading,3));
      cover.setIndex(indices);cover.computeVertexNormals();b.add(cover,'#d5cebb');cover.dispose();
      // Coverts first, then long separated primaries sweep behind the wrist.
      for(let k=0;k<8;k++){
        const u=k/7,x=.06+.74*u,y=.047+.145*Math.sin(u*2.54);
        fan.add([s*x,y,-.045],[s*(x+.205),y-.077,-.439-u*.022],.095,
          k%3?'#77786b':'#888675');
      }
      for(let i=0;i<10;i++){
        const u=i/9, x=.12+u*.81, y=.065+.16*Math.sin(u*Math.PI*.86);
        fan.add([s*x,y,.04+u*.085],[s*(x+.17+.16*u),y-.029,-.30-u*.11],.118-u*.035,i%3?'#dcd5c4':'#c9c3b4');
      }
      for(let i=0;i<8;i++){
        const u=i/7;
        fan.add([s*(.83+.24*u),.207-.042*u,.089+u*.042],[s*(.93+.62*u),.059-.12*u,-.54+.447*u],.071+.014*Math.sin(u*Math.PI),i%3?'#474942':'#5c5a4e');
      }
      volume(b,[[s*.019,.015,0,.045,.071],[s*.16,.089,.027,.084,.101],[s*.47,.171,.048,.063,.107],
        [s*.77,.214,.082,.046,.081],[s*1.05,.175,.12,.025,.056],[s*1.17,.143,.13,.006,.009]],'#ddd6c5',14);
      for(let j=0;j<2;j++)for(let i=0;i<8;i++){
        const u=i/9,x=.052+.87*u,y=.045+.177*Math.sin((.12+.8*u)*Math.PI*.8);
        fan.add([s*x,y+.012+j*.01,.057+j*.034+u*.075],[s*(x+.102),y-.024,-.102+j*.065+u*.04],.075-j*.013, j?'#e8e1cf':'#d2cdbd');
      }
    });
    fan.attach(wing);
  }
}

const dragonSpine=[[-.78,1.21,-2.95,.004,.004],[-.80,.98,-3.12,.061,.073],[-.65,.65,-3.16,.092,.108],
  [-.35,.36,-2.92,.141,.15],[-.19,.26,-2.56,.182,.19],[-.29,.50,-2.12,.204,.214],
  [-.28,.90,-1.76,.225,.25],[.02,1.06,-1.46,.249,.262],[.39,.96,-1.17,.258,.275],
  [.54,.66,-.79,.279,.291],[.45,.50,-.35,.301,.318],[.10,.52,.04,.315,.323],
  [-.24,.75,.40,.312,.32],[-.44,1.06,.70,.286,.301],[-.45,1.45,.87,.27,.284],
  [-.35,1.74,1.08,.239,.264],[-.13,1.88,1.42,.214,.243]];
const swimming={value:0};
function dragon(root,{group,batch}){
  const body=group(root,'trunk');
  const skin=pelt(body,'dragon',dragonSpine);
  skin.material.onBeforeCompile=shader=>{
    shader.uniforms.swimming=swimming;
    shader.vertexShader=shader.vertexShader.replace('#include <common>','#include <common>\nuniform float swimming;')
      .replace('#include <begin_vertex>','#include <begin_vertex>\n transformed.x+=.19*sin(.98*position.z+swimming);transformed.y+=.08*cos(.82*position.z+swimming);');
    shader.fragmentShader=shader.fragmentShader.replace('#include <opaque_fragment>','outgoingLight*=1.-.48*(1.-smoothstep(.015,.23,abs(dot(normalize(normal),normalize(vViewPosition)))));\n#include <opaque_fragment>');
  };
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
        const wrist=[s*(r+.38),-.51,.107*q];
        volume(b,[[s*r*.57,-.04,0,.103,.12],[s*(r+.123),-.102,-q*.090,.117,.111],
          [s*(r+.265),-.251,-q*.177,.084,.087],[s*(r+.292),-.365,-q*.08,.051,.062],
          [...wrist,.052,.058],[s*(r+.43),-.551,.146*q,.057,.043]],pigment.dragon,19);
        for(let digit=-1;digit<=1;digit++){
          const x=s*(r+.43+digit*.073),z=q*.16;
          volume(b,[[s*(r+.38+digit*.031),-.50,q*.121,.034,.030],
            [x,-.567,z,.027,.022],[x+s*.014,-.617,z+.054,.014,.014]],'#9b9566',11);
          tusk(b,[[x+s*.011,-.603,z+.043],[x+s*.032,-.631,z+.085],
            [x+s*.013,-.620,z+.138]],.017,ivory);
        }
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
      antler(b,s,.291,-.057,1.16);ear(b,s,.258,.136,-.12,.20,pigment.dragon,'#ac9472');

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
      tusk(b,[[s*.131,.066,.702],[s*.299,.071,.853],[s*.495,.218,.861],
        [s*.689,.338,.686],[s*.838,.271,.483],[s*.824,.139,.431],[s*.760,.106,.472]],.023,'#806241');
    }
    for(let j=-1;j<=1;j++)lock(b,[[j*.048,-.081,.608],[j*.074,-.196,.557],
      [j*.087,-.295,.467],[j*.121,-.381,.341]],.054,[j*.6,-.13,.85],['#af8957','#d3b37c','#806847']);
    for(let j=-2;j<=2;j++)tusk(b,[[j*.04,-.11,.528],[j*.053,-.264,.43],[j*.047,-.32,.31]],.035,'#a5845a');
  });
}

export function buildBeast(parent,type,builders) {
  if(type==='monkey')simian(parent,builders);
  else if(type==='bird')crane(parent,builders);
  else if(type==='dragon')dragon(parent,builders);
  else quadruped(parent,type,builders);
}
export function beastRig(mesh,n) {
  const joints={};mesh.traverse(o=>{if(o.isGroup&&o.name)joints[o.name]=o;});
  mesh.scale.setScalar(n.stature||SPECIES[n.type].stature);
  return joints;
}
export function poseBeast(j,n,time) {
  const t=time+(n.phase||0),g=j.trunk,head=j.mask;
  const walk=Math.min(1,n.speed||0),p=t*(n.type==='tiger'?2.8:3.8);
  if(n.type==='dragon') {
    swimming.value=t*1.12;
    for(let i=0;i<19;i++){
      const bone=i===18?head:j['spine'+i];
      if(!bone.userData.bind)bone.userData.bind=bone.position.clone();
      const bind=bone.userData.bind;
      bone.position.x=bind.x+.19*Math.sin(.98*bind.z+swimming.value);
      bone.position.y=bind.y+.08*Math.cos(.82*bind.z+swimming.value);
      if(i===18)bone.rotation.y=.12*Math.cos(t*.82);
    }
    return;
  }
  if(n.type==='bird') {
    const flap=t*4.35, stroke=(.24+.76*(.5+.5*Math.cos(t*.69))**2)*Math.sin(flap);
    for(const s of [-1,1]){
      j['wing'+s].rotation.z=s*(.11+stroke*.56);
      j['wing'+s].rotation.y=s*(.06+.10*Math.cos(flap));
    }
    g.rotation.z=.10*Math.sin(t*.67);g.position.y=.035*Math.cos(flap);
    head.rotation.x=-.036*Math.cos(flap);return;
  }
  for(const s of [-1,1]){
    if(n.type==='monkey'){
      j['leg'+s+',1'].rotation.x=s*.45*Math.sin(p)*walk;
      j['arm'+s].rotation.x=-s*(s===1?.16:.24)*Math.sin(p)*walk-.06;
      j['arm'+s].rotation.z=s===1?.075*Math.sin(t*1.7):.035*Math.cos(t*1.5);
    }else for(const f of [-1,1]){
      const stride=Math.sin(p+(s<0?Math.PI:0)+(f<0?Math.PI*.73:0));
      j['leg'+s+','+f].rotation.x=stride*.31*walk;
    }
  }
  g.position.y=.023*walk*Math.abs(Math.cos(p));g.rotation.z=.025*walk*Math.sin(p);
  head.rotation.y=.18*Math.sin(t*.88);head.rotation.x=.032*Math.cos(p)*walk;
  if(n.flash>0)head.rotation.z=.15*Math.sin(n.flash*6);
  if(j.tail){j.tail.rotation.y=.24*Math.sin(t*1.43);j.tail.rotation.x=.10*Math.sin(p*.6);}
}
