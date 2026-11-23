import * as T from './vendor/three.module.min.js';
import { makeNPC, animateNPC, batchActorParts } from './actors.js';
import { buildFaunaParts, faunaPigment, poseFaunaPart } from './scroll-fauna-art.js';
import { elephantTrunkSpine } from './otsu-beasts.js';
import { makeSeaSolo, seaArmSpine } from './ryugu-performers.js';
import { workingHabit, townHand } from './heian-dress.js';
import { paintedSilk, townPortrait } from './emaki-costume.js';
import { dressedRiceFace } from './mochi-model.js';
import { inkVolume } from './scroll-sculpt.js';
import { createStoryEvidence, tieStoryApron, festivalWaterVessel } from './story-crafts.js';
export { createStoryFood, createStoryEvidence, createStoryStillLife, animateStoryStillLife, setEvidencePose } from './story-crafts.js';

import { drawTradeTool } from './trade-tools.js';
import { dressStoryWorker, dressPackAnimal, dressSpecial, detailStoryFace } from './story-attire.js';
import { connectStoryHands, connectStoryAppendage, poseStoryHands } from './story-hands.js';
export { storyGrip, storyTool, poseStoryHands } from './story-hands.js';

const looseTools=new Map();
export function createStoryTool(role,index=0){
  const key=role+'/'+index;
  if(!looseTools.has(key)){
    const g=new T.Group();g.name='職道具・'+role;batchActorParts(g,b=>drawTradeTool(role,index,b));looseTools.set(key,g);
  }
  return looseTools.get(key).clone();
}
const kinds = {
  '兎':'rabbit','蛙':'frog','老蛙':'frog','亀':'turtle','猪':'boar','猿':'monkey','鹿':'deer',
  '牛':'ox','老婆餅':'riceElder','僧侶餅':'riceMonk','鶏':'chicken','蛸':'octopus','鯛':'bream',
  '海亀':'seaTurtle','魚人':'fishfolk','象':'elephant','狐':'fox','丹頂':'crane'
};
const trades = {
  卯助:'ferry',おはな:'bake',弥平:'wrap',ささ:'wrap',お絹:'loom',樽平:'ladle',留吉:'ladle',
  みのり:'winnow',おせん:'bake',網次:'fisher',お浜:'mend',お冬:'bake',雪丸:'lantern',
  望:'bake',甚八:'rake',朝吉:'pound',うめ:'bake',八重:'account',すずり:'scribe',
  ちよ:'tea',桃子:'bake',ふみ:'scribe',笛丸:'flute',のり:'wrap',杢吉:'wrap',とわ:'ladle'
};
const motions = new WeakMap(), faunas = new Map();
const tau=2*Math.PI, {sin,cos}=Math;
function part(parent,name,x=0,y=0,z=0){
  const group=new T.Group();group.name=name;group.position.set(x,y,z);parent.add(group);return group;
}
function attachEvidence(parent,code,x,y,z,scale,yaw=0) {
  const obj=createStoryEvidence(code);obj.scale.setScalar(scale);obj.position.set(x,y,z);obj.rotation.y=yaw;parent.add(obj);
  return obj;
}

function quietCrane(root){
  // The porter is standing on the quay. A supporting tarsus, three spread
  // forward toes, a short hind toe and closed primaries carry the silhouette.
  const body=part(root,'胴'),neck=part(body,'襟首',0,1.12,.23);
  const soot='#53524a',white='#eee7d5',shade='#d0cbb9';
  batchActorParts(body,b=>{
    inkVolume(b,[[0,.98,-.46,.012,.01],[0,1.00,-.34,.16,.13],[0,1.01,-.16,.22,.19],
      [0,1.025,.02,.235,.211],[0,1.04,.19,.19,.19],[0,1.095,.29,.113,.125],[0,1.11,.30,.06,.063]],white,36);
    for(const s of [-1,1]){
      for(let i=0;i<9;i++){
        const d=i/8;
        inkVolume(b,[[s*(.132+.055*d),1.146-.032*d,.125-.036*d,.009,.017],
          [s*(.189+.038*d),1.115-.063*d,-.025,.041+.014*d,.064],
          [s*(.179+.032*d),1.074-.108*d,-.215,.048,.061],
          [s*(.121+.035*d),1.034-.111*d,-.385-.035*d,.035,.045],
          [s*(.077+.022*d),1.020-.142*d,-.515-.048*d,.003,.004]],i<4?white:i<6?shade:soot,21);
      }
      for(let j=0;j<7;j++){
        const y=1.046+j*.015;
        b.stroke([[s*.220,y,-.065],[s*.225,y-.025,-.161],[s*.202,y-.037,-.274]],.002, '#9a998b',8,4);
      }
      const z=s*.067;
      inkVolume(b,[[s*.091,.927,z,.049,.05],[s*.078,.794,z-.035,.045,.039],[s*.073,.66,z+.005,.019,.021],
        [s*.076,.525,z+.036,.012,.014],[s*.079,.382,z+.07,.019,.019],[s*.086,.232,z+.053,.010,.012],[s*.087,.038,z+.044,.014,.014]],soot,27);
      for(const dx of [-.082,0,.086])b.stroke([[s*.087,.031,z+.046],[s*.087+dx*.45,.014,z+.11],[s*.087+dx,.006,z+.193-Math.abs(dx)*.42]],.009,soot,7,5);
      b.rod([s*.087,.027,z+.045],[s*.091,.007,z-.040],.009,soot,.002);
    }
  });
  batchActorParts(neck,b=>{
    inkVolume(b,[[0,-.08,-.065,.106,.10],[0,.005,-.01,.09,.10],[0,.115,.074,.081,.087],
      [0,.241,.102,.062,.065],[.003,.383,.069,.051,.057],[.006,.485,.05,.050,.056],[.006,.559,.095,.056,.061]],soot,33);
    inkVolume(b,[[0,.01,.048,.037,.039],[0,.13,.148,.028,.023],[0,.255,.151,.019,.017],
      [0,.383,.116,.015,.010],[0,.48,.098,.017,.011],[0,.53,.139,.025,.028]],shade,25);
    inkVolume(b,[[0,.546,.036,.005,.01],[0,.563,.058,.065,.074],[0,.571,.119,.074,.081],
      [0,.566,.176,.064,.054],[0,.548,.215,.033,.026]],white,27);
    b.ball(0,.63,.116,.048,.017,.061,'#ac5545',[.048,0,0]);
    inkVolume(b,[[0,.555,.172,.033,.026],[0,.551,.219,.039,.032],[0,.546,.296,.025,.021],
      [0,.544,.389,.009,.009],[0,.543,.426,.001,.001]],'#aa9779',26);
    for(const s of [-1,1]){
      b.stroke([[s*.060,.557,.088],[s*.068,.572,.127],[s*.056,.562,.173],[s*.033,.551,.204]],.009,soot,9);
      b.ball(s*.068,.578,.132,.009,.011,.013,'#463d34');
      b.stroke([[s*.033,.548,.205],[s*.022,.543,.296],[s*.007,.542,.392]],.0028,'#71634d',7,4);
    }
  });
  return (t,engaged)=>{neck.rotation.y=.12*sin(t*.67);neck.rotation.x=.08*sin(t*.93)+(engaged?.22:0);};
}
function riceResident(root,monk) {
  const torso=part(root,'身頃'),head=part(torso,'首',0,1.13,0),kind=monk?0:2;
  const {body,sleeves}=workingHabit(monk?5:2);
  const coat=new T.Mesh(body,paintedSilk());coat.castShadow=coat.receiveShadow=true;torso.add(coat);
  const face=dressedRiceFace(kind,0,townPortrait(kind));
  face.scale.set(.423,.352,.347);face.position.set(0,-.362,-.011);head.add(face);
  for(const [index,s] of [-1,1].entries()){
    const sleeve=new T.Mesh(sleeves[index],paintedSilk());sleeve.name='動く袂'+s;
    sleeve.castShadow=sleeve.receiveShadow=true;torso.add(sleeve);
    const z=s>0?.35:.24,center=new T.Vector3(s*.492,.728,z+.057),tool=new T.Group();
    const points=[[s*.264,.865,-.02],[s*.374,.817,.061],[s*.407,.744,z-.116],[s*.477,.748,z-.032],center.toArray()];
    const grip=connectStoryAppendage(root,s>0?'right':'left',sleeve,points,4,tool);
    const hand=batchActorParts(grip,b=>townHand(b,0,s));
    hand.geometry.translate(-center.x,-center.y,-center.z);grip.add(tool);
    if(s>0){
      batchActorParts(tool,b=>{
        if(monk){
          for(let i=0;i<24;i++){const a=i*tau/24;b.ball(.010+.059*cos(a),-.080+.091*sin(a),-.007,.012,.014,.012,i%6?'#775e44':'#a78858');}
          b.stroke([[.014,-.175,-.007],[.008,-.199,-.007],[.022,-.234,-.009]],.006,'#ac7052');
        }else{
          b.rod([-.011,.012,.001],[.066,.067,.020],.0026,'#877f70',.001);
          b.stroke([[.063,.064,.020],[.086,.088,.018],[.118,.046,.018],[.088,-.025,.038],[.016,-.041,.010]],.0033,'#7d8980',15,4);
        }
      });
    }else if(!monk){const patch=attachEvidence(tool,'cloth',.052,-.024,.073,.35);patch.rotation.z=.29;}
  }
  batchActorParts(torso,b=>{for(const s of [-1,1]){
    b.ball(s*.17,.045,.009,.093,.038,.148,'#9b8769');
    b.stroke([[s*.24,.068,-.038],[s*.195,.099,.004],[s*.171,.094,.077],[s*.145,.09,.013]],.008,'#665c48');
  }});
  return (t,engaged)=>{poseStoryHands(root);head.rotation.y=.09*sin(t*.72);head.rotation.x=.043*sin(t*1.02)+(engaged?.1:0);torso.rotation.x=monk?.015:.044;};
}

function kitForBeast(parent,type,c,index){
  // Soft, split pack cloth follows the rib cage; leave the shoulder and the
  // entire sweep of the muzzle clear. Knots and contrasting hems read in profile.
  const sections={
    deer:[[-.43,1.018,.232,.256],[-.25,1.027,.207,.228],[-.075,1.029,.189,.217],[.08,1.016,.196,.239],[.21,1.008,.227,.272]],
    boar:[[-.49,.739,.327,.399],[-.27,.768,.339,.381],[-.072,.780,.355,.399],[.115,.786,.362,.415],[.277,.776,.346,.403]],
    fox:[[-.34,.675,.216,.23],[-.18,.705,.204,.187],[-.05,.692,.203,.194],[.11,.659,.225,.224],[.20,.659,.233,.253]],
    ox:[[-.55,1.099,.486,.531],[-.29,1.068,.500,.504],[.006,1.091,.536,.554],[.263,1.16,.519,.607]],
    elephant:[[-.63,1.27,.625,.686],[-.23,1.20,.657,.667],[.13,1.20,.647,.666],[.45,1.27,.625,.685]]
  }[type];
  const d={deer:.35,boar:.4,fox:.225,ox:.44,elephant:.54}[type], bottom=type==='fox'?.04:.06;
  function point(u,v){
    const a=(u-.5)*Math.PI*1.29,z=-.12+(v-.5)*d*1.50;
    const k=Math.max(1,sections.findIndex(s=>s[0]>=z));
    const left=sections[k-1],right=sections[k],t=T.MathUtils.clamp((z-left[0])/(right[0]-left[0]),0,1);
    const [h,w,rise]=[1,2,3].map(i=>T.MathUtils.lerp(left[i],right[i],t));
    const fold=.006*cos(v*18+u);
    return [(w+.010+fold)*sin(a),h+(rise+.007+fold)*cos(a),z];
  }
  const colors=['#8b9890','#a4947c','#a87764','#878d9b','#a5a18c'];
  const shade=colors[index%colors.length], cloth=part(parent,'肩に掛けた裂');
  batchActorParts(cloth,b=>{
    const p=[],ix=[];for(let j=0;j<=12;j++)for(let i=0;i<=22;i++){p.push(...point(i/22,j/12));const k=j*23+i;if(j<12&&i<22)ix.push(k,k+1,k+23,k+1,k+24,k+23);}
    const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(p,3));geo.setIndex(ix);geo.computeVertexNormals();b.add(geo,shade);
    for(const v of [.03,.075,.92,.967])b.stroke(Array.from({length:19},(_,i)=>point(i/18,v).map((n,k)=>k===1?n+.004:n)),.0045,'#d4c3a3',20,4);
    for(const s of [-1,1]){
      const end=point(s<0?0:1,.55);
      for(let j=0;j<5;j++)b.rod([end[0]+s*.002,end[1],end[2]-.037+j*.018],[end[0]+s*.004,end[1]-bottom,end[2]-.035+j*.019],.004, '#a89776',.0015);
    }
  });
  dressPackAnimal(cloth,c.name,point);
  if(c.name==='稲次'){
    const top=point(.5,.5)[1];
    attachEvidence(cloth,'rice',0,top+.06,-.13,.82,Math.PI/2);
    batchActorParts(cloth,b=>{
      for(const s of [-1,1])b.stroke([[s*.18,top+.025,-.34],[s*.166,top+.223,-.244],[s*.05,top+.321,-.14],[-s*.11,top+.235,-.035],[-s*.18,top+.025,.068]],.010,'#907756',19);
    });
  }

}
function fauna(root,type,phase){
  if(!faunas.has(type))faunas.set(type,buildFaunaParts(type));
  const parts=faunas.get(type).map(p=>{
    const mesh=new T.Mesh(p.geometry,p.material||faunaPigment());mesh.name=p.name;mesh.castShadow=mesh.receiveShadow=true;root.add(mesh);return [p,mesh];
  });
  const state={type,phase,speed:0,flash:0,gesture:0,variant:0,spread:0};
  return (time,engaged)=>{
    state.gesture=engaged?.40:.10;
    for(const [p,m] of parts)poseFaunaPart(p,state,time,m);
  };
}
export function createStoryCharacter(character,{festivalGuest=false}={}){
  const root=new T.Group();root.name=character.name;
  const type=kinds[character.species], number=(character.id.match(/\d+/g)||[0,0]).map(Number);
  const index=number[0]*7+number[1],phase=index*.752;
  let pose;
  if(['bream','octopus','seaTurtle'].includes(type)){
    if(festivalGuest && type!=='seaTurtle'){
      festivalWaterVessel(root);
      const guest=part(root,'水面から顔を出す海客',0,type==='octopus'?.29:.205,0);
      guest.scale.setScalar(type==='octopus'?.81:.75);
      pose=makeSeaSolo(type,guest,phase);
    }else pose=makeSeaSolo(type,root,phase);
  }
  else if(['elephant','ox','chicken','fishfolk'].includes(type)){
    pose=fauna(root,type,phase);
    if(type==='ox'||type==='elephant')kitForBeast(root,type,character,index);
  }
  else if(type==='riceMonk'||type==='riceElder')pose=riceResident(root,type==='riceMonk');
  else if(type==='crane')pose=quietCrane(root);
  else{
    if(!type)throw new RangeError('Missing character sculpture for '+character.species);
    const artisan=type==='rabbit'||type==='frog',old=character.species==='老蛙';
    const dining=festivalGuest && (character.name==='弥平'||character.name==='八重');
    const n={type,role:artisan?'artisan':'rest',craft:dining?'feast':trades[character.name]||'account',area:artisan,
      dye:index%6,stature:type==='turtle'?1:old?.94:1+.03*sin(index),build:old?1.07:1+.055*cos(index),
      x:0,y:0,z:0,heading:0,speed:0,phase,gesture:0,variation:0};
    const model=makeNPC(n,root);
    if(artisan && !dining && /餅|窯|陶工|繕|蒸し|蒸籠|船大工|世話役|包み手|染物|茶屋/.test(character.occupation))
      tieStoryApron(model.limbs.torso,type,index,character.occupation);
    if(['deer','boar','fox'].includes(type))kitForBeast(model.limbs.trunk,type,character,index);
    if(artisan||type==='monkey'){
      dressStoryWorker(artisan?model.limbs.torso:model.limbs.trunk,type,character.name,dining);
      detailStoryFace(artisan?model.limbs.head:model.limbs.mask,type,character.name);
    }
    if(type==='turtle'){
      dressPackAnimal(model.mesh,character.name,(u,v)=>{
        const a=(u-.5)*Math.PI*1.03,z=-.14+(v-.5)*.32,bow=Math.sqrt(1-((z+.055)/.514)**2);
        return [.396*bow*sin(a),.238+.347*bow*Math.sign(cos(a))*Math.abs(cos(a))**.83+.008,z];
      });
      model.mesh.scale.setScalar(1.72+.1*sin(index));
    }else if(type==='monkey'){
      const {fude,letter}=model.limbs,admin=/勘定|帳場/.test(character.occupation);
      if(!admin){
        fude.visible=false;letter.visible=false;
        const roles={こま:['wrap',1],蓮照:['ladle',1],昆太:['ladle',1],お登勢:['tea',0],栗太:['bake',1],久蔵:['fisher',1]};
        const [role,number]=roles[character.name]||['wrap',1],tool=createStoryTool(role,number);
        tool.position.set(-.06,-.194,.368);tool.scale.setScalar(.84);model.limbs['arm-1'].add(tool);
      }
    }
    if(artisan||type==='monkey')connectStoryHands(root,type,model.limbs);
    pose=(t,engaged,action)=>{
      poseStoryHands(root);
      n.gesture=engaged?.33:.04;animateNPC(model,n,t);
      if (root.userData.storyPerforming && artisan) {
        // Leave the ordinary ladle, pestle or brush stroke while using the
        // evidence. A small forward lean keeps the near hand in view.
        model.limbs.torso.rotation.set(.045,0,.012*sin(t));
        model.limbs.head.rotation.set(.06,.055*sin(t*.9),0);
      }
      if(action?.effort && artisan){model.limbs.torso.rotation.x+=.095*action.effort;model.limbs.head.rotation.x+=.09*action.effort;}
      if(old){model.limbs.head.rotation.x+=.16;model.limbs.torso.rotation.x+=.12;}
      if(artisan && engaged){model.limbs.head.rotation.y*=.45;model.limbs.head.rotation.x+=.08;}
    };
  }
  if(['riceMonk','riceElder','chicken','crane','fishfolk'].includes(type))dressSpecial(root,type,character.name);
  if(type==='octopus'){
    const sheet=root.getObjectByName('octopus-paper'),notes=part(sheet.parent,'墨八の書付');
    notes.add(sheet,...[0,1,2].map(i=>root.getObjectByName('scribe-stroke-'+i)));
    for(const [side,index,grasp] of [['right',0,4],['left',2,5]]){
      const surface=root.getObjectByName('octopus-arm-'+index);
      connectStoryAppendage(root,side,surface,seaArmSpine(index),grasp,side==='right'?root.getObjectByName('octopus-brush'):notes);
    }
  }else if(type==='seaTurtle'){
    for(const [side,s] of [['right',1],['left',-1]]){
      const fin=root.getObjectByName('turtle-'+side),stick=root.getObjectByName('turtle-stick-'+side);
      const path=[[0,-.015,0],[.096,-.107,-.017],[.21,-.116,.060],[.343,-.067,.221],[.421,.012,.339]].map(([x,y,z])=>[x*s,y,z]);
      connectStoryAppendage(root,side,fin,path,4,stick);
    }
  }else if(type==='elephant')connectStoryAppendage(root,'right',root.getObjectByName('trunk'),elephantTrunkSpine,7);
  else if(type==='fishfolk'){
    // The gatekeeper's left fin remains free while the right holds the shaku.
    connectStoryAppendage(root,'right',root.getObjectByName('sleeve-1'),[[0,0,0],[-.144,-.177,.053],[-.14,-.39,.108],[-.15,-.46,.22],[-.158,-.47,.31]],4);
  }
  if(['octopus','fishfolk','elephant','seaTurtle'].includes(type)){
    const idle=pose;pose=(t,engaged,action)=>{poseStoryHands(root);idle(t,engaged,action);};
  }
  motions.set(root,pose);
  pose(0,false);
  return root;
}
export function poseStoryCharacter(group,time,engaged=false,action=null){motions.get(group)?.(time,engaged,action);}
