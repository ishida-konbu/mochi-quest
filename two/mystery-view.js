import * as THREE from './vendor/three.module.min.js';
import { makeNPC, animateNPC, batchActorParts as paint } from './actors.js';
import { wrapDelta, terrainHeight } from './terrain.js';
import { WEDDING_SITES } from './pilgrimage-layout.js';
import { assets, evidence } from './mystery-data.js';

const cedar='#8c6748', dark='#584738', rice='#f1dfb7', vermilion='#974c3d', cord='#b4956b';
const appearance=new Map(assets.filter(a=>a.npcId).map(a=>[a.npcId,a.recipe]));
const physicalStations=new Set(evidence.filter(e=>['inspect','reconstruct'].includes(e.acquisition.mode)).map(e=>e.locationId));
physicalStations.add('LOC_KYO_EAST_VIEW');

function table(b) {
  b.box(0,.59,0,.93,.075,.57,cedar);
  for (const side of [-1,1]) {
    b.box(side*.36,.27,0,.09,.54,.45,dark);
    b.box(side*.36,.06,0,.14,.09,.53,cedar);
  }
  b.box(0,.28,0,.73,.068,.055,cord);
}
function ledger(b,left=0) {
  b.box(left,.65,0,.63,.052,.43,rice);
  b.box(left,.68,0,.60,.015,.39,'#f8eacb');
  b.box(left-.22,.693,0,.042,.013,.39,'#7e8a7e');
  for (let col=0;col<4;col++) for(let j=0;j<3;j++) {
    b.box(left+.20-col*.067,.692,-.12+j*.057,.013,.007,.034-(col+j)%3*.005,dark);
  }
  b.box(left+.23,.691,.123,.058,.009,.055,vermilion);
}
function mallet(b,base) {
  b.rod([-.36,base+.13,-.08],[.35,base+.13,-.08],.124,'#b4885a');
  b.rod([.18,base+.13,-.08],[.18,base+.07,.56],.038,cedar);
  for(let i=0;i<3;i++) b.rod([.18,base+.103,.22+i*.041],[.18,base+.102,.238+i*.041],.046,cord);
}
function measure(b,standard=false) {
  const wood='#c29769';
  b.box(0,.65,0,.48,.05,.42,wood);
  for(const s of [-1,1]){
    b.box(s*.22,.79,0,.04,.28,.42,wood);
    b.box(0,.79,s*.19,.46,.28,.04,wood);
  }
  b.box(0,standard?.678:.724,0,.395,.022,.337,'#ab815c');
  for(let i=0;i<5;i++)b.box(.133,.686+i*.046,.213,i===4?.12:.067,.012,.008,dark);
}
function bales(b,count) {
  for(let i=0;i<count;i++){
    const x=(i%4-1.5)*.67,z=(Math.floor(i/4)%2-.5)*.70,y=.28+.51*Math.floor(i/8);
    b.rod([x-.30,y,z],[x+.30,y,z],.268,'#ba9a60');
    for(const s of [-1,1])b.rod([x+s*.165-.015,y,z],[x+s*.165+.015,y,z],.276,'#716044');
    for(let j=0;j<8;j++) {
      const a=j*Math.PI/4;
      b.rod([x-.274,y+.263*Math.sin(a),z+.263*Math.cos(a)],
        [x+.274,y+.263*Math.sin(a),z+.263*Math.cos(a)],.008,j%2?'#ac8b56':'#d2b37d');
    }
    b.box(x,y+.257,z,.175,.018,.138,rice);
    b.box(x+.034,y+.27,z,.034,.008,.035,vermilion);
  }
}
function foldedLetter(b) {
  b.box(0,.648,0,.55,.04,.37,rice);
  b.box(0,.676,-.07,.54,.015,.19,'#e8d5ae');
  b.box(0,.688,.030,.53,.007,.015,'#aa9b7e');
  b.box(.16,.692,.08,.068,.009,.078,vermilion);
}
function prayer(b) {
  for(let i=0;i<3;i++){
    const x=(i-1)*.26;
    b.box(x,.661,0,.20,.029,.37,rice);
    b.box(x,.679,-.045,.18,.01,.012,cord);
    b.box(x+.037,.682,-.042,.045,.007,.052,vermilion);
    for(let j=0;j<3;j++) b.box(x-.04,.682,.009+j*.042,.012,.007,.026,dark);
  }
}
function slate(b) {
  b.box(0,.77,0,.71,.69,.092,'#697f78');
  b.box(0,.77,.052,.63,.60,.018,'#89988b');
  for(let i=0;i<4;i++)b.box(0,.62+i*.091,.066,.48-i*.032,.015,.005,'#435f5b');
  b.box(.186,.59,.067,.074,.066,.007,'#b27962');
  for(const s of [-1,1])b.box(s*.245,.23,0,.08,.48,.13,dark);
}
// Small printed placards are real world surfaces. The notebook supplies the
// readable text when the camera is farther from the stall.
const placardMaterials=new Map();
function printed(lines) {
  const key=lines.join('|');
  if(!placardMaterials.has(key)){
    const canvas=document.createElement('canvas');
    canvas.width=448;canvas.height=224;
    const c=canvas.getContext('2d');
    c.fillStyle='#ead8ac';c.fillRect(0,0,448,224);
    c.strokeStyle='#896e4a';c.lineWidth=8;c.strokeRect(8,8,432,208);
    c.fillStyle='#503c31';c.textAlign='center';c.textBaseline='middle';
    c.font='bold 53px "Hiragino Mincho ProN","Yu Mincho",serif';
    lines.forEach((line,i)=>c.fillText(line,224,38+(i+.5)*148/lines.length,401));
    const map=new THREE.CanvasTexture(canvas);map.colorSpace=THREE.SRGBColorSpace;
    placardMaterials.set(key,new THREE.MeshLambertMaterial({map,side:THREE.DoubleSide}));
  }
  return placardMaterials.get(key);
}
function placard(parent,label,lines,x,y,z,width,height){
  const sign=new THREE.Mesh(new THREE.PlaneGeometry(width,height),printed(lines));
  sign.name=label;sign.position.set(x,y,z);parent.add(sign);
  return sign;
}
function closingScene(root,id) {
  const part=new THREE.Group();
  root.add(part);
  if(id==='LOC_DAWN_RACK'){
    part.name='一搗きの空席と食べる餅';
    paint(part,b=>{
      for(const s of [-1,1])for(const f of [-1,1])b.box(-.93+s*.19,.15,.14+f*.14,.06,.29,.06,cedar);
      b.box(-.93,.315,.14,.57,.065,.43,cedar);
      b.box(-.93,.361,.14,.52,.029,.39,'#aa8d79');
      b.box(.18,.66,.25,.64,.035,.25,'#895f42');
      for(let j=0;j<3;j++)b.ball(-.026+j*.18,.719,.257,.085,.061,.088,'#f3e8c9');
    });
  }else if(id==='LOC_RIVER_REQUEST') {
    part.name='承諾を待つ番付の空欄';
    paint(part,b=>{
      for(const side of [-1,1])b.box(side*.38,.55,0,.08,1.10,.09,cedar);
      b.box(0,.98,0,.97,.51,.065,dark);
      b.box(0,.88,.043,.68,.10,.024,rice);
    });
    placard(part,'番付',['次の取組','　　　　　'],0,.987,.037,.90,.45);
  }else if(id==='LOC_MARKET_DEALER') {
    part.name='米代と手間賃を分けた値札';
    for(const [i,word] of ['米代','手間賃'].entries()){
      const x=-.31+i*.62;
      paint(part,b=>{b.box(x,.84,-.255,.043,.45,.045,cedar);b.box(x,1.02,-.25,.55,.29,.035,dark);});
      placard(part,word,[word],x,1.02,-.228,.52,.26);
    }
  }
}
function propAt(station,solved,ending) {
  const id=station.id,root=new THREE.Group();
  root.name=station.label;
  paint(root,b=>{
    if(id==='LOC_RIVER_REQUEST') { b.box(0,.05,0,.92,.10,.26,cedar);return; }
    if(id==='LOC_RYUGU_CRATES') return bales(b,12);
    if(id==='LOC_RYUGU_LEDGER' || id==='LOC_RYUGU_REQUEST') return slate(b);
    if(id==='LOC_SNOW_STORE')return bales(b,8);
    if(id==='LOC_MARKET_STORE')return bales(b,10);
    if(!station.onWorkbench)table(b);
    if(id==='LOC_DAWN_RACK') {
      b.box(0,.635,0,.88,.019,.50,'#ddccb1');
      for(const s of [-1,1]) b.box(s*.16,.648,0,.027,.008,.45,'#a48a69');
      if(solved) mallet(b,.65);
    } else if(id==='LOC_DAWN_BENCH') {
      if(!solved) mallet(b,.65);
      b.box(-.26,.651,.17,.17,.045,.11,cord);
    } else if(id==='LOC_MARKET_SCALE'||id==='LOC_TERRACES_STANDARD'||id==='LOC_MARKET_DEALER')measure(b,ending || id==='LOC_TERRACES_STANDARD');
    else if(id.startsWith('LOC_INARI_')||id==='LOC_PEACH_WEDDING')foldedLetter(b);
    else if(id==='LOC_TODAIJI_PRAYER'||id==='LOC_TODAIJI_BACKING'||id==='LOC_MOON_TEMPLE')prayer(b);
    else ledger(b);
  });
  if(station.onWorkbench)root.children[0].position.y=-.625;
  const stock={LOC_RYUGU_CRATES:['A17',12],LOC_SNOW_STORE:['B08',8],LOC_MARKET_STORE:['C10',10]}[id];
  if(stock)for(let i=0;i<stock[1];i++){
    const x=(i%4-1.5)*.67,z=(Math.floor(i/4)%2-.5)*.70,y=.28+.51*Math.floor(i/8);
    const serial=stock[0]+'-'+String(i+1).padStart(2,'0');
    const tag=placard(root,serial,[serial],x,y+.14,z+.238,.264,.132);tag.rotation.x=-.44;
  }
  if(ending && ['LOC_DAWN_RACK','LOC_RIVER_REQUEST','LOC_MARKET_DEALER'].includes(id))closingScene(root,id);
  return root;
}

function nameTag(text) {
  const canvas=document.createElement('canvas');
  canvas.width=256;canvas.height=72;
  const c=canvas.getContext('2d');
  c.font='600 38px "Hiragino Mincho ProN", "Yu Mincho", serif';
  const w=Math.ceil(c.measureText(text).width+26);
  c.fillStyle='rgba(246,234,201,.96)';
  c.fillRect((256-w)/2,8,w,56);
  c.fillStyle=vermilion;c.fillRect((256-w)/2,8,4,56);
  c.fillStyle='#382f29';c.textAlign='center';c.textBaseline='middle';c.fillText(text,130,36);
  const texture=new THREE.CanvasTexture(canvas);
  texture.colorSpace=THREE.SRGBColorSpace;
  const sprite=new THREE.Sprite(new THREE.SpriteMaterial({map:texture,transparent:true,depthWrite:false}));
  sprite.scale.set(1.85,.52,1);
  return sprite;
}
function createPerson(p,root) {
  const entity={type:p.species,role:p.npcId==='NPC_ASHINOYAMA'?'sumo':p.species==='turtle'?'rest':'wander',
    side:1,stature:1,speed:0,phase:p.label.codePointAt(0)%7};
  const record=makeNPC(entity,root), recipe=appearance.get(p.npcId);
  record.mesh.name=p.label;
  if (recipe) {
    const accent=recipe.baseColor, species=p.species;
    const quadruped=species==='deer'||species==='fox'||species==='turtle';
    const y=species==='turtle'?.32:species==='deer'?.99:species==='fox'?.67:species==='monkey'?.82:.82;
    paint(record.mesh,b=>{
      const z=species==='turtle'?.48:quadruped?.39:.20;
      if(p.npcId==='NPC_TOKA'){
        b.rod([.30,1.17,.21],[.34,.94,.23],.016,dark);
        b.ball(.34,.83,.23,.098,.14,.098,accent);b.box(.34,.70,.23,.12,.025,.12,dark);
      }else if(p.npcId==='NPC_NAOKI'){
        for(let i=0;i<2;i++)b.rod([.23+i*.041,.71,z],[.27+i*.061,1.23,z],.012,accent);
      }else if(p.npcId==='NPC_FUDEM'||p.npcId==='NPC_HABUMI'){
        b.rod([-.21,y+.44,z], [.24,y-.11,z+.074],.022,accent);
        b.box(.19,y-.09,z+.08,.25,.24,.094,accent);b.box(.19,y+.005,z+.132,.21,.02,.019,rice);
      }else if(quadruped){
        b.rod([-.13,y+.08,z],[.011,y-.13,z+.11],.021,accent);
        b.rod([.13,y+.08,z],[.011,y-.13,z+.11],.021,accent);
        b.box(0,y-.15,z+.12,.109,.146,.028,accent);
      }else{
        b.loop(0,y,.015,.30,.24,.055,accent);
        b.box(.12,y-.12,z+.056,.10,.25,.025,accent);
      }
    },p.npcId==='NPC_ASHINOYAMA'?'白い稽古綱':'持ち物');
  }
  return {record,entity};
}

export function createMysteryView(scene,world) {
  const root=new THREE.Group();
  root.name='十五景もち寄り帖';scene.add(root);
  const props=new Map(), actors=new Map(), tags=new Map(), rehearsals=new Map();
  function update(time,player) {
    world.update();
    const solved=world.solved('C01'), ending=world.solved('C07');
    for(const index of [0,2]) {
      const site=WEDDING_SITES[index], x=site.x, z=site.z+4.1;
      const near=Math.hypot(wrapDelta(x-player.x),wrapDelta(z-player.z))<38;
      let marker=rehearsals.get(index);
      if(near && !marker) {
        marker=new THREE.Group();root.add(marker);rehearsals.set(index,marker);
        paint(marker,b=>{b.box(0,.45,0,.059,.89,.07,cedar);b.box(0,.77,0,.82,.39,.06,cedar);});
        placard(marker,'婚礼行列の稽古',[index?'上の行列':'下の行列','稽古'],0,.77,.035,.79,.35);
        marker.position.set(x,terrainHeight(x,z),z);
      }
      if(marker)marker.visible=near;
    }
    for(const station of world.stations) {
      if(!physicalStations.has(station.id) && !(ending && station.id==='LOC_RIVER_REQUEST'))continue;
      const dx=wrapDelta(station.x-player.x), dz=wrapDelta(station.z-player.z);
      const near=dx*dx+dz*dz<42**2 && Math.abs(station.y-player.y)<35;
      let prop=props.get(station.id);
      const change=prop && ((prop.userData.solved!==solved && ['LOC_DAWN_RACK','LOC_DAWN_BENCH'].includes(station.id)) ||
        (prop.userData.ending!==ending && ['LOC_DAWN_RACK','LOC_MARKET_DEALER','LOC_MARKET_SCALE'].includes(station.id)));
      if(change){
        prop.traverse(node=>node.geometry?.dispose());root.remove(prop);props.delete(station.id);prop=null;
      }
      if(near && !prop){prop=propAt(station,solved,ending);Object.assign(prop.userData,{solved,ending});props.set(station.id,prop);root.add(prop);}
      if(!prop)continue;
      prop.visible=near;
      if(!near)continue;
      const at=station.furnishing;
      prop.position.set(player.x+wrapDelta(at.x-player.x),at.y,player.z+wrapDelta(at.z-player.z));
      prop.rotation.y=station.heading;
    }
    for(const p of world.people()) {
      const dx=wrapDelta(p.x-player.x),dz=wrapDelta(p.z-player.z),d=Math.hypot(dx,dz);
      const visible=d<52 && Math.abs(p.y-player.y)<32;
      let rec=actors.get(p.npcId);
      if(visible && p.draw && !rec){rec=createPerson(p,root);actors.set(p.npcId,rec);}
      if(rec){
        rec.record.mesh.visible=visible;
        if(visible) {
          if(p.npcId==='NPC_ASHINOYAMA' && world.solved('C02')){
            rec.entity.role='wander';
            rec.record.mesh.getObjectByName('白い稽古綱').visible=false;
          }
          Object.assign(rec.entity,{x:player.x+dx,y:p.y,z:player.z+dz,heading:
            d<5 ? Math.atan2(-dx,-dz) : p.heading});
          animateNPC(rec.record,rec.entity,time);
        }
      }
      const close=d<11 && Math.abs(p.y-player.y)<3.5;
      let tag=tags.get(p.npcId);
      if(close && !tag){tag=nameTag(p.label);tags.set(p.npcId,tag);root.add(tag);}
      if(tag){
        tag.visible=close;
        const y={rabbit:2.42,frog:1.95,fox:1.97,monkey:2.18,deer:2.43,turtle:1.60}[p.species]||2.25;
        if(close)tag.position.set(player.x+dx,p.y+y,player.z+dz);
      }
    }
  }
  return {update};
}
