// Scroll silhouettes are lofted through painted cross-sections. A single atlas per
// pelt wraps continuously across both flanks; the mane, joints and toes retain volume.
import * as THREE from './vendor/three.module.min.js';
import { inkVolume } from './scroll-sculpt.js';
import { seeded } from './terrain.js';
import { SPECIES } from './bestiary.js';

const TAU=Math.PI*2, soot='#493d35', paper='#eadbc0', ivory='#efdfbc', cinnabar='#a75142';
const pigment={monkey:'#97806a',bird:'#eae4d4',fox:'#be8555',tiger:'#bc8d52',dragon:'#658477',kirin:'#c1a56a'};
const coats=new Map();
function coat(type,detail) {
  const key=type+'-'+(detail||'body');
  if(coats.has(key))return coats.get(key);
  const c=document.createElement('canvas'); c.width=768;c.height=384;
  const g=c.getContext('2d'),rng=seeded(1381+type.charCodeAt(1)),w=c.width,h=c.height;
  g.fillStyle=pigment[type];g.fillRect(0,0,w,h);
  // U follows length, V a full rotation: back above both flanks, belly below.
  const tone=g.createLinearGradient(0,0,0,h);
  for(const [t,col] of [[0,'rgba(244,214,168,.03)'],[.25,'rgba(68,52,43,.19)'],[.5,'rgba(218,195,155,.05)'],[.75,'rgba(255,238,209,.78)'],[1,'rgba(244,214,168,.03)']])tone.addColorStop(t,col);
  g.fillStyle=tone;g.fillRect(0,0,w,h);
  g.lineCap='round';
  for(let i=0;i<7200;i++) {
    const x=rng()*w,y=rng()*h;
    g.strokeStyle=i%3?'rgba(67,43,32,.09)':'rgba(255,243,214,.19)';
    g.lineWidth=.4+rng()*1.4;g.beginPath();g.moveTo(x,y);g.lineTo(x+1+rng()*7,y-1+rng()*2.4);g.stroke();
  }
  if(detail==='brush') {
    g.fillStyle='#efddbb';g.beginPath();g.moveTo(w*1.02,0);g.lineTo(w*.63,0);
    for(let j=0;j<=48;j++){const y=j*h/48;g.lineTo(w*(.65+.05*Math.cos(TAU*j/24)+.025*Math.sin(TAU*j/6)),y);}
    g.lineTo(w+2,h);g.closePath();g.fill();
    for(let i=0;i<950;i++){const x=rng()*w,y=rng()*h;g.strokeStyle=x>w*.64?'rgba(127,103,74,.24)':'rgba(74,49,30,.26)';
      g.lineWidth=.8+rng()*.8;g.beginPath();g.moveTo(x,y);g.quadraticCurveTo(x+4,y+1,x+10+rng()*9,y+2*rng());g.stroke();}
  } else if(detail) {
    paintMask(g,type);
  } else if(type==='tiger') {
    for(let i=0;i<14;i++) {
      const x=i*58+8*rng(),droop=45+38*rng();
      // One tapered, occasionally forked calligraphic band across the spine.
      g.fillStyle=i%4?'#534536':'#63513c';g.beginPath();g.moveTo(x-12,105-droop);
      g.bezierCurveTo(x+20,76-droop,x-24,121,x+8,135);
      g.quadraticCurveTo(x+36,170,x+22,130+droop);
      g.bezierCurveTo(x+47,131+droop,x+32,133,x+25,115);
      g.quadraticCurveTo(x-4,94,x+8,79-droop);g.closePath();g.fill();
      if(i%3===1){g.beginPath();g.moveTo(x+6,110);g.quadraticCurveTo(x-24,143,x-13,168);g.quadraticCurveTo(x-10,142,x+19,123);g.fill();}
    }
  } else if(type==='dragon'||type==='kirin') {
    const step=type==='dragon'?22:32;
    for(let j=-1;j<Math.ceil(h/step)+1;j++)for(let i=-1;i<w/step+1;i++) {
      const x=i*step+((j&1)?step*.5:0),y=j*step*.68;
      g.strokeStyle=type==='dragon'?'rgba(52,71,62,.64)':'rgba(102,75,50,.67)';
      g.lineWidth=1.8;g.beginPath();g.moveTo(x-step*.49,y);
      g.bezierCurveTo(x-step*.4,y+step*.27,x-step*.18,y+step*.45,x,y+step*.48);
      g.quadraticCurveTo(x+step*.36,y+step*.32,x+step*.5,y);g.stroke();
      g.strokeStyle='rgba(253,227,170,.70)';g.lineWidth=1.15;g.beginPath();
      g.moveTo(x-step*.25,y+step*.16);g.quadraticCurveTo(x-step*.17,y+step*.31,x-.5,y+step*.32);g.stroke();
    }
  } else if(type==='monkey'||type==='fox') {
    for(let k=0;k<360;k++){
      let x=rng()*w,y=rng()*h;
      g.strokeStyle='rgba(77,57,44,.42)';g.lineWidth=.8+rng();g.beginPath();
      g.moveTo(x,y);g.quadraticCurveTo(x-5,y+2,x-11,y+1+rng()*3);g.stroke();
    }
  }
  const map=new THREE.CanvasTexture(c);map.colorSpace=THREE.SRGBColorSpace;map.anisotropy=4;
  const mat=new THREE.MeshStandardMaterial({map,roughness:.97,side:THREE.DoubleSide});
  mat.onBeforeCompile=shader=>{
    shader.fragmentShader=shader.fragmentShader.replace('#include <opaque_fragment>',
      'float margin=1.-smoothstep(.015,.23,abs(dot(normalize(normal),normalize(vViewPosition))));outgoingLight*=1.-.48*margin;\n#include <opaque_fragment>');
  };
  coats.set(key,mat);return mat;
}
// Both sides are painted in the head's own UV space. With no billboards on
// the muzzle the eye, taper of the brow and cheek hatching survive a profile view.
function paintMask(g,type) {
  const monkey=type==='monkey', tiger=type==='tiger', dragon=type==='dragon', fox=type==='fox';
  const ink='#443a31', light='#ede2c9', accent=monkey?'#bf8373':dragon?'#b09262':'#ad7955';
  const ellipse=(x,y,rx,ry,c)=>{
    g.fillStyle=c;g.beginPath();g.ellipse(x,y,rx,ry,0,0,TAU);g.fill();
  };
  function leaf(a,b,c,d,shade){
    g.fillStyle=shade;g.beginPath();g.moveTo(...a);g.bezierCurveTo(...b,...c,...d);
    g.bezierCurveTo(c[0]+2,c[1]+7,b[0]+2,b[1]+7,...a);g.fill();
  }
  if(tiger){
    g.strokeStyle='#4f4033';g.lineCap='round';g.lineWidth=11;g.beginPath();g.moveTo(162,96);g.quadraticCurveTo(259,89,408,96);g.stroke();
    for(const [u,v,w] of [[197,47,13],[276,37,10],[349,28,8]]){
      g.lineWidth=w;g.beginPath();g.moveTo(u-10,96-v);g.quadraticCurveTo(u+17,97,u-4,96+v);g.stroke();
    }
  }
  for(const [y,sign] of [[0,1],[192,-1],[384,1]]){
    g.save();g.translate(0,y);g.scale(1,sign);
    if(monkey){
      g.fillStyle='#c18d79';g.beginPath();g.moveTo(293,7);g.bezierCurveTo(311,53,473,70,521,39);
      g.bezierCurveTo(565,18,687,21,745,-5);g.bezierCurveTo(717,-39,615,-65,492,-59);
      g.bezierCurveTo(383,-60,307,-25,293,7);g.fill();
      ellipse(459,-12,48,20,'#c9907a');
    } else{
      // Buff jaw and ruff wash set off the eye at the edge of the white cheek.
      g.fillStyle=dragon?'#b7ae84':light;g.beginPath();g.moveTo(218,-47);
      g.bezierCurveTo(283,-43,342,-20,401,-18);g.bezierCurveTo(526,-15,625,-30,710,4);
      g.lineTo(790,-39);g.lineTo(790,-89);g.lineTo(234,-87);g.closePath();g.fill();
    }
    // Eye and brush-drawn upper lid. Coordinates stretch with the snout.
    const ex=monkey?426:dragon?393:fox?437:365,ey=monkey?17:20;
    g.save();g.translate(ex,ey);
    if(!monkey){
    g.fillStyle='#63503d';g.beginPath();g.moveTo(-41,-6);g.quadraticCurveTo(-6,24,40,1);
    g.quadraticCurveTo(7,-17,-41,-6);g.fill();
    g.fillStyle=ivory;g.beginPath();g.moveTo(-31,-4);g.quadraticCurveTo(-6,16,29,1);
    g.quadraticCurveTo(3,-11,-31,-4);g.fill();ellipse(3,1,11,10,ink);ellipse(7,5,3.1,2.5,'#fff7df');
    leaf([-54,-8],[-26,24],[8,24],[45,2],ink);
    leaf([-61,25],[-28,39],[13,41],[35,28],type==='kirin'?'#806344':ink);
    }
    g.restore();
    if(tiger){
      leaf([122,78],[151,61],[138,18],[197,-6],ink);
      leaf([232,94],[245,72],[229,40],[293,27],ink);
      leaf([334,89],[337,74],[330,61],[353,50],ink);
      leaf([184,8],[244,24],[258,0],[326,-12],ink);
      leaf([200,-16],[253,-11],[278,-29],[297,-36],ink);
      leaf([354,-20],[385,-12],[435,-15],[464,-24],ink);
      for(let i=0;i<7;i++)ellipse(533+(i%3)*28, -29+Math.floor(i/3)*8+(i%2)*2.5,3.6,2.1,ink);
    }else if(fox){
      leaf([202,-30],[311,-34],[345,-17],[377,-11],accent);
      leaf([248,-37],[326,-43],[356,-24],[394,-21],accent);
      leaf([222,9],[302,11],[347,3],[382,2],accent);
    }else if(dragon||type==='kirin'){
      for(let i=0;i<8;i++){
        const x=174+23*(i%3),ly=-11+12*Math.floor(i/3);
        g.strokeStyle='#7f7156';g.lineWidth=1.8;g.beginPath();g.arc(x,ly,12,.18*Math.PI,.82*Math.PI);g.stroke();
      }
      leaf([200,-10],[288,-23],[315,-19],[374,-12],accent);
    }else{
      leaf([137,-3],[224,-15],[266,-6],[300,-4],'#766659');
      leaf([159,8],[219,3],[254,9],[295,6],'#816f5d');
    }
    for(let k=0;k<14;k++) {
      const x=137+(k*37)%147,ly=-15+(k*19)%60;
      leaf([x,ly],[x+4,ly+1],[x+16,ly],[x+24,ly+3],k%3?'#95816c':'#d4bb98');
    }
    g.restore();
  }
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
function whiskers(b,side,y,z,r=.16) {
  for(let i=0;i<3;i++)tusk(b,[[side*r,y-.024*i,z],[side*(r+.1),y+.006-.035*i,z+.10],[side*(r+.19+.04*i),y+.035-.05*i,z+.13]],.0055,soot);
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
function paw(b,s,h,front,type) {
  const hoof=type==='kirin', cats=type==='fox'||type==='tiger',back=front<0;
  const fur=pigment[type],dark=hoof?'#66564c':type==='fox'?'#54473e':'#9f7850';
  const r=type==='tiger'?.118:hoof?.086:.075;
  const knee=back?.094:-.036,hock=back?-.13:-.015;
  volume(b,[[0,.03,0,r,r*1.12],[s*.018,-h*.15,.008,r*1.32,r*1.4],[s*.006,-h*.43,knee,r*.83,r],
    [s*.014,-h*.70,hock,r*.59,r*.67],[s*.018,-h*.91,hock+.018,r*.53,r*.53]],fur);
  volume(b,[[s*.014,-h*.63,hock,r*.62,r*.6],[s*.018,-h*.84,hock+.02,r*.51,r*.53],[s*.019,-h*.94,hock+.044,r*.66,r*.68],
    [s*.018,-h*.95,hock+.10,r*.67,r*.34],[s*.018,-h*.97,hock+.15,.003,.004]],dark);
  const z=hock+.098;
  for(let i=0;i<(hoof?2:3);i++) {
    const side=(i-(hoof?.5:1))*.043;
    b.ball(side,-h*.962,z+.02,.033,hoof?.032:.019,hoof?.07:.049,hoof?'#514744':dark);
  }
  if(cats && type==='tiger')for(let i=0;i<3;i++)
    tusk(b,[[s*r*.84,-h*(.21+i*.107),.015],[s*r,-h*(.24+i*.107),.043],[s*r*.48,-h*(.28+i*.107),.074]],.016,soot);
  if(hoof)tusk(b,[[0,-h*.46,knee],[s*.041,-h*.38,knee-.12],[0,-h*.36,knee-.20]],.04,'#ac754c');
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
    volume(b,[[.12,-.12,-.64,.05,.06],[.21,-.06,-.84,.11,.14],[.24,.10,-.92,.08,.1],[.18,.23,-.93,.004,.002]],'#90694c');
  }
}
function quadruped(root,type,{group,batch}){
  const fox=type==='fox',kirin=type==='kirin',tiger=type==='tiger',wide=fox?.215:kirin?.31:.38;
  const high=kirin?1.26:tiger?.87:.62, length=fox?.57:kirin?.84:.77;
  const body=group(root,'trunk');
  pelt(body,type,[[0,high-.09,-length,.045,.06],[0,high-.02,-length*.78,wide*.85,wide*.94],
    [0,high,-length*.43,wide,wide],[0,high+.018,0,wide*.9,wide*.89],[0,high+.026,length*.42,wide,wide*1.14],
    [0,high+.08,length*.7,wide*.86,wide*.91],[0,high+.11,length*.89,wide*.42,wide*.71]]);
  for(const s of [-1,1])for(const front of [-1,1]) {
    const leg=group(body,'leg'+s+','+front,s*wide*.68,high-.047,front*length*.59);
    batch(leg,b=>paw(b,s,high-.047,front,type));
  }
  const tail=group(body,'tail',0,high+.03,-length*.74);
  if(fox)pelt(tail,type,[[0,0,0,.098,.104],[.024,.11,-.19,.134,.159],[.095,.28,-.37,.185,.210],
    [.148,.41,-.51,.194,.215],[.161,.54,-.63,.166,.186],[.123,.65,-.73,.110,.119],
    [.046,.74,-.81,.048,.046],[-.028,.789,-.824,.001,.001]],'brush');
  else batch(tail,b=>tailBrush(b,type));
  const neckTop=kirin?2.15:fox?.93:1.15;
  batch(body,b=>{
    volume(b,[[0,high-.05,length*.32,wide*.82,wide*.96],[0,high+.17,length*.55,wide*.87,wide*.84],
      [0,(high+neckTop)*.5+.04,length*.73,wide*.62,wide*.69],[0,neckTop,length*.89,wide*.55,wide*.6]],pigment[type]);
    if(kirin){
      for(let k=0;k<10;k++){const t=k/9,y=high+.16+t*(neckTop-high),z=length*(.48+.36*t);
        tusk(b,[[0,y,z],[.025*Math.sin(k),y+.05,z-.11],[0,y+.14,z-.21-.06*Math.sin(k)]],.088,'#9a694b');}
      // Flame scrolls curl away from each shoulder and hock, like the gilded hems of a painted kirin.
      for(const side of [-1,1])for(let k=0;k<3;k++){
        const y=high+.06+.09*k,z=length*.29-.045*k;
        tusk(b,[[side*.216,y,z],[side*(.37+.023*k),y+.04,z-.112],[side*(.43+.022*k),y+.15,z-.25],[side*(.38+.021*k),y+.22,z-.30]],.034,'#ab7851');
      }
      for(let k=0;k<6;k++)for(const s of [-1,1])tusk(b,[[s*wide*.67,high+.19,-.58+k*.16],
        [s*wide*.8,high+.29,-.65+k*.16],[s*wide*.65,high+.34,-.72+k*.16]],.038,ivory);
    }
    if(fox){
      volume(b,[[0,.62,.32,.15,.16],[0,.72,.40,.21,.14],[0,.77,.43,.16,.11]],paper,12);
      volume(b,[[0,.79,.41,.177,.145],[0,.82,.42,.184,.143],[0,.85,.426,.168,.137]],cinnabar,9);
      b.ball(0,.747,.565,.046,.052,.043,'#c3a163');tusk(b,[[0,.73,.606],[0,.753,.611],[.006,.771,.608]],.006,soot);
    }
  });
  const head=group(body,'mask',0,neckTop,length*.86);
  const mask=fox?.18:kirin?.22:.29, snout=fox?.38:kirin?.45:.37;
  pelt(head,type,[[0,.015,-.16,.045,.08],[0,.055,-.095,mask*.86,mask],[0,.065,.015,mask,mask*.99],
    [0,.05,.12,mask*.94,mask*.80],[0,.016,snout*.67,mask*.68,mask*.53],[0,.008,snout*.95,mask*.37,mask*.27],[0,.017,snout,.028,.029]],true);
  batch(head,b=>{
    for(const s of [-1,1]){
      if(tiger){
        b.ball(s*.192,.231,-.004,.094,.109,.052,soot,[0,s*.2,s*-.27]);
        b.ball(s*.19,.239,.037,.061,.070,.021,paper);
        volume(b,[[s*.19,.045,.08,.068,.08],[s*.237,-.012,.084,.089,.089],[s*.286,-.091,.034,.031,.042],[s*.33,-.116,-.01,.004,.003]],paper);
        for(let i=0;i<3;i++)tusk(b,[[s*.23,.079-i*.048,.105],[s*.25,.093-i*.055,.066],[s*.267,.108-i*.06,.007]],.014,soot);
      } else {
        ear(b,s,mask*.62,.135,-.01,fox?.24:.21,pigment[type],fox?'#855749':'#a77e67');
        if(kirin)antler(b,s,.203,-.016,.94);
      }

      b.ball(s*mask*.39,-.022,snout*.77,mask*.45,mask*.35,mask*.48,paper);
      tusk(b,[[0,-.035,snout],[s*mask*.26,-.059,snout*.94],[s*mask*.60,-.04,snout*.80]],.009,soot);
      whiskers(b,s,-.01,snout*.75,mask*.59);
      if(fox)tusk(b,[[s*.116,.105,.181],[s*.16,.126,.13],[s*.20,.132,.068]],.014,'#985d44');
    }
    b.ball(0,.035,snout*.97,mask*.33,mask*.19,mask*.22,soot);
    if(tiger)for(let i=0;i<3;i++){
      const y=.293-.018*i,z=-.01+i*.038;
      tusk(b,[[-.122,y-.04,z],[0,y,z+.013],[.122,y-.04,z]],.016,soot);
    }
    if(kirin){
      tusk(b,[[0,.20,.061],[0,.335,.10],[.012,.55,.18],[.02,.68,.21]],.067,'#cbb17e');
      for(const s of [-1,1])tusk(b,[[s*.09,-.065,.218],[s*.095,-.181,.215],[s*.12,-.24,.149]],.039,'#987353');
    }
  });
}
function simian(root,{group,batch}) {
  const body=group(root,'trunk'), head=group(body,'mask',0,1.34,.065);
  pelt(body,'monkey',[[0,.55,-.10,.03,.04],[0,.58,-.085,.245,.202],[0,.73,-.06,.287,.227],
    [0,.92,-.01,.248,.199],[0,1.10,.018,.266,.212],[0,1.23,.075,.203,.17],[0,1.30,.08,.12,.11]]);
  batch(body,b=>{
    // Indigo sleeveless travelling coat, with a crossed collar, obi and small inro.
    volume(b,[[0,.64,-.066,.251,.203],[0,.67,-.058,.287,.217],[0,.91,-.01,.256,.204],[0,1.13,.019,.274,.213],
      [0,1.22,.032,.213,.168],[0,1.255,.055,.137,.13]],'#718187',18);
    for(const s of [-1,1]){
      volume(b,[[s*.091,1.231,.16,.024,.015],[s*.095,1.16,.21,.027,.012],
        [s*.026,1.02,.206,.032,.016],[-s*.075,.88,.17,.014,.011]],'#d7c7a2');
      for(let i=0;i<4;i++)for(let j=0;j<3;j++){
        const y=.72+.105*i,x=s*(.134+.021*j);
        b.ball(x,y,.150+.012*i-.012*j,.013,.009,.009,'#cdc9b1');
      }
    }
    volume(b,[[0,.798,-.026,.273,.205],[0,.816,-.026,.279,.207],[0,.85,-.02,.271,.207]],'#9d785c',8);
    b.ball(.26,.756,.021,.059,.078,.049,'#785743');b.ball(.263,.764,.061,.032,.022,.008,'#c6a06b');
    b.ball(0,.592,-.28,.066,.085,.08,pigment.monkey);
    // The scribe's lacquered fude case hangs diagonally from a braided tasuki.
    tusk(b,[[-.151,1.24,.161],[.012,1.065,.220],[.149,.875,.187],[.210,.735,.123]],.017,'#644c3a');
    volume(b,[[.211,.693,.102,.040,.041],[.224,.774,.08,.045,.048],[.244,.889,.04,.038,.04]],'#856242',9);
    for(let i=0;i<2;i++)b.ball(.219+i*.018,.746+i*.11,.102-i*.04,.043,.011,.038,'#d4b172');
    tusk(b,[[.242,.871,.042],[.256,.972,.022],[.255,1.004,.016]],.018,'#a7895d');
  });
  pelt(head,'monkey',[[0,-.03,-.193,.035,.056],[0,.036,-.14,.17,.20],[0,.07,-.035,.232,.232],
    [0,.089,.067,.225,.216],[0,.05,.14,.171,.154],[0,.002,.187,.13,.102],[0,-.019,.225,.073,.051]],true);
  for(const s of [-1,1]){
    const brow=group(head,'eyeMask'+s,s*.096,.107,.160);
    brow.rotation.y=s*.39;
    batch(brow,b=>{
      b.ball(0,0,.006,.099,.084,.058,'#c38e78');
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

      for(let i=0;i<3;i++)tusk(b,[[s*.17,.065-i*.047,.10],[s*.211,.037-i*.044,.082],[s*.226,.015-i*.042,.043]],.016,'#c5b095');
    }
    b.ball(0,-.01,.179,.117,.093,.069,'#cf9d85');
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
    const arm=group(body,'arm'+s,s*.24,1.137,.008);
    batch(arm,b=>{
      volume(b,[[0,0,0,.065,.085],[s*.075,-.083,.011,.089,.1],[s*.117,-.216,.018,.076,.079],
        [s*.11,-.32,.062,.068,.08],[s*.125,-.44,.141,.052,.055],[s*.11,-.50,.17,.039,.039]],pigment.monkey);
      b.ball(s*.107,-.518,.191,.058,.063,.047,'#be9480');
      for(let j=0;j<4;j++)tusk(b,[[s*(.082+j*.017),-.533,.200],[s*(.071+j*.018),-.575,.218],[s*(.068+j*.017),-.58,.247]],.0125,'#bc917c');
    });
  }
}

// Tapered laminae give primary feathers a cut-paper edge with a raised quill.
function feather(b,root,tip,w,shade) {
  const start=new THREE.Vector3(...root),end=new THREE.Vector3(...tip);
  const delta=end.clone().sub(start), chord=new THREE.Vector3(-delta.z,0,delta.x).normalize();
  const positions=[],ix=[],n=12;
  for(let j=0;j<=n;j++){
    const t=j/n,center=start.clone().addScaledVector(delta,t);
    center.y+=Math.sin(t*Math.PI)*w*.56;
    const radius=Math.max(.001,w*Math.sin(Math.PI*t**.83)**.79);
    for(const side of [-1,0,1]){
      const p=center.clone().addScaledVector(chord,radius*side*(side<0?.82:1));p.y-=Math.abs(side)*radius*.23;
      positions.push(...p.toArray());
    }
    if(j){const k=j*3;ix.push(k-3,k-2,k,k-2,k+1,k,k-2,k-1,k+1,k-1,k+2,k+1);}
  }
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
  g.setIndex(ix);g.computeVertexNormals();b.add(g,shade);g.dispose();
  // Four separate flicks on each vane follow the longitudinal quill.
  const marks=[],tri=[];
  for(const side of [-1,1])for(let i=1;i<6;i++) {
    const t=.09+i*.105, at=start.clone().addScaledVector(delta,t);
    at.y+=Math.sin(t*Math.PI)*w*.57+.002;
    const away=at.clone().addScaledVector(delta,.087).addScaledVector(chord,w*side*.69*Math.sin(t*Math.PI));
    const ridge=at.clone().lerp(away,.58);ridge.y+=.002;
    away.y-=w*.145;
    const base=marks.length/3;
    marks.push(...at.toArray(),...ridge.clone().addScaledVector(delta,.008).toArray(),...away.toArray(),...ridge.clone().addScaledVector(delta,-.008).toArray());
    tri.push(base,base+1,base+2,base,base+2,base+3);
  }
  const barbs=new THREE.BufferGeometry();barbs.setAttribute('position',new THREE.Float32BufferAttribute(marks,3));barbs.setIndex(tri);barbs.computeVertexNormals();
  b.add(barbs,shade==='#534f4a'||shade==='#6b6558'?'#948777':'#a49886');barbs.dispose();
  const mid=start.clone().lerp(end,.47);mid.y+=w*.63;
  tusk(b,[[...start.toArray()],[...mid.toArray()],[...end.toArray()]],w*.043,'#9e927f');
}
function crane(root,{group,batch}) {
  const body=group(root,'trunk'), head=group(body,'mask',0,0,0);
  pelt(body,'bird',[[0,.09,-.50,.006,.008],[0,.11,-.33,.088,.078],[0,.12,-.14,.151,.16],
    [0,.14,.04,.165,.174],[0,.17,.21,.121,.144],[0,.185,.33,.053,.07]]);
  batch(body,b=>{
    for(let i=-2;i<=2;i++)feather(b,[i*.034,.122,-.18],[i*.077,.073,-.58+Math.abs(i)*.044],.045,ivory);
    for(const s of [-1,1]){
      volume(b,[[s*.056,.074,-.19,.023,.024],[s*.083,.019,-.37,.018,.017],[s*.10,-.039,-.63,.015,.012],[s*.11,-.026,-.89,.012,.011]],soot,14);
      for(let toe=-1;toe<=1;toe++)tusk(b,[[s*.11,-.026,-.86],[s*.111+toe*.021,-.034,-.94],[s*.118+toe*.038,-.042,-1.05+Math.abs(toe)*.03]],.009,soot);
    }
  });
  batch(head,b=>{
    volume(b,[[0,.17,.235,.106,.104],[0,.19,.35,.071,.078],[0,.246,.49,.052,.06],[0,.284,.62,.048,.056],[0,.32,.72,.064,.066],[0,.32,.79,.063,.056],[0,.311,.839,.037,.037]],paper,23);
    for(const s of [-1,1]) {
      volume(b,[[s*.033,.313,.806,.017,.017],[s*.061,.302,.742,.026,.032],[s*.044,.26,.617,.023,.035],
        [s*.044,.222,.515,.023,.031],[s*.035,.20,.431,.019,.023],[s*.028,.185,.376,.004,.005]],soot,17);
      b.ball(s*.052,.32,.8,.012,.015,.012,soot);
    }
    b.ball(0,.364,.749,.054,.027,.073,cinnabar);
    volume(b,[[0,.313,.81,.041,.032],[0,.314,.87,.038,.022],[0,.314,1.024,.019,.012],[0,.308,1.11,.002,.002]],'#6d684d',10);
  });
  for(const s of [-1,1]) {
    const wing=group(body,'wing'+s,s*.10,.17,-.021);
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
      for(let i=0;i<10;i++){
        const u=i/9, x=.12+u*.81, y=.065+.16*Math.sin(u*Math.PI*.86);
        feather(b,[s*x,y,.04+u*.085],[s*(x+.17+.16*u),y-.029,-.30-u*.11],.118-u*.035,i%3?'#dcd5c4':'#c9c3b4');
      }
      for(let i=0;i<8;i++){
        const u=i/7;
        feather(b,[s*(.83+.24*u),.207-.042*u,.089+u*.042],[s*(.93+.62*u),.105-.084*u,-.51+.44*u],.071+.014*Math.sin(u*Math.PI),i%3?'#534f4a':'#6b6558');
      }
      volume(b,[[s*.019,.015,0,.045,.071],[s*.16,.089,.027,.084,.101],[s*.47,.171,.048,.063,.107],
        [s*.77,.214,.082,.046,.081],[s*1.05,.175,.12,.025,.056],[s*1.17,.143,.13,.006,.009]],'#ddd6c5',14);
      for(let j=0;j<2;j++)for(let i=0;i<8;i++){
        const u=i/9,x=.052+.87*u,y=.045+.177*Math.sin((.12+.8*u)*Math.PI*.8);
        feather(b,[s*x,y+.012+j*.01,.057+j*.034+u*.075],[s*(x+.102),y-.024,-.102+j*.065+u*.04],.075-j*.013, j?'#e8e1cf':'#d2cdbd');
      }
    });
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
      tusk(b,[[0,r*.84,.04],[.01,r+flare*.58,-.045],[.031,r+flare,-.14-.04*Math.sin(i)]],.026+r*.13,'#98734d');
      for(const s of [-1,1])tusk(b,[[s*r*.70,-r*.54,.025],[s*r*.46,-r*.83,.028],[s*.002,-r*.92,.052]],.016,'#c9b58a');
      if(i===7||i===13)for(const s of [-1,1]){
        const q=i===7?-1:1;
        volume(b,[[s*r*.57,-.05,0,.079,.089],[s*(r+.12),-.12,-q*.10,.09,.086],
          [s*(r+.24),-.27,-q*.21,.059,.066],[s*(r+.31),-.37,-q*.07,.044,.048],[s*(r+.37),-.41,.037,.039,.038]],pigment.dragon,16);
        for(let j=-1;j<=1;j++)tusk(b,[[s*(r+.34),-.40,.016],[s*(r+.39+j*.04),-.45,.075],[s*(r+.43+j*.07),-.468,.10],[s*(r+.40+j*.075),-.458,.142]],.018,ivory);
      }
    });
  }
  const head=group(body,'mask',-.13,1.88,1.42);
  head.scale.setScalar(1.17);
  pelt(head,'dragon',[[0,.005,-.28,.127,.167],[0,.08,-.17,.263,.277],[0,.11,.02,.327,.294],[0,.11,.20,.306,.237],
    [0,.048,.38,.231,.16],[0,.045,.53,.176,.117],[0,.087,.70,.199,.127],[0,.088,.775,.10,.081]],true);
  batch(head,b=>{
    volume(b,[[0,-.066,-.026,.152,.10],[0,-.10,.20,.247,.106],[0,-.115,.45,.181,.052],[0,-.091,.64,.168,.045],[0,-.049,.752,.088,.028]],'#c6ae82',19);
    for(const s of [-1,1]){
      antler(b,s,.291,-.057,1.16);ear(b,s,.258,.136,-.12,.20,pigment.dragon,'#ac9472');

      tusk(b,[[s*.13,.222,.37],[s*.238,.29,.25],[s*.343,.264,.13],[s*.398,.31,.013]],.048,'#ab8058');
      for(let j=0;j<5;j++){
        const y=.10-j*.06,z=.023-j*.032;
        tusk(b,[[s*.235,y,z],[s*(.348+.02*j),y-.018,z-.14],[s*(.403+.03*j),y+.069,z-.32],[s*(.390+.021*j),y+.105,z-.46]],.043,'#a47851');
      }
      b.ball(s*.116,.142,.707,.044,.027,.058,soot);
      tusk(b,[[s*.072,-.006,.745],[s*.16,-.018,.673],[s*.183,-.05,.490],[s*.22,-.029,.348]],.018,soot);
      tusk(b,[[s*.174,-.009,.571],[s*.182,-.099,.583],[s*.168,-.128,.605]],.028,ivory);
      tusk(b,[[s*.131,.066,.702],[s*.435,.075,.69],[s*.64,.241,.54],[s*.824,.298,.34],[s*.93,.190,.18],[s*.891,.127,.097]],.015,'#896a4c');
    }
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
      j['arm'+s].rotation.x=-s*.40*Math.sin(p)*walk-.10;
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
