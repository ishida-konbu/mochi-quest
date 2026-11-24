import { CRAFT_OPTIONS } from './living-craft.js';

// All points are in metres, in the worktop's frame. The cook stands on +Z.
// A hand locked to a tool follows its rotating grip throughout a stroke.
const PI = Math.PI;
const clamp = x => Math.max(0, Math.min(1, x));
const ease = x => x*x*(3-2*x);
const mix = (a,b,f) => a+(b-a)*f;
const blend = (a,b,f) => a.map((v,i)=>mix(v,b[i],f));
const angleTo = (a,b) => Math.atan2(Math.sin(b-a),Math.cos(b-a));
const still = (position,rotation=[0,0,0]) => ({position,rotation});
const grip = (tool,offset) => ({tool,offset});
const onPiece = (index,offset) => ({index,offset});
const rest = null;
const LID = still([.50,1.166,.02]);
const BOWL = still([.045,.798,.31]);
const CLOTH = still([.50,.995,.02]);
const MALLET = still([-.68,1.378,-.28],[.059,0,0]);
const PADDLE = still([.13,.773,-.16],[0,.88,0]);
const rightLid=grip('lid',[.042,.028,0]);
const bowlHands=[grip('bowl',[.145,.072,.035]),grip('bowl',[-.145,.072,.035])];
const clothHands=[grip('cloth',[.145,.16,.035]),grip('cloth',[-.145,.16,.035])];
const malletHands=[grip('mallet',[.012,0,.49]),grip('mallet',[-.012,0,.24])];
const paddleGrip=grip('paddle',[0,.01,.18]);
const lidPark=still([.815,1.035,-.19],[0,.04,1.45]);
const malletRack=still([-1.31,.834,-.396],[0,PI/2,0]);
const board=[-.045,.798,.29], well=[-.68,1.187,.01];
const unwrap=(a,b,f)=>a+angleTo(a,b)*f;

function rotateXYZ(p,r) {
  const [x,y,z]=p,[rx,ry,rz]=r;
  const ax=x*Math.cos(rz)-y*Math.sin(rz), ay=x*Math.sin(rz)+y*Math.cos(rz);
  const bx=ax*Math.cos(ry)+z*Math.sin(ry), bz=z*Math.cos(ry)-ax*Math.sin(ry);
  return [bx,ay*Math.cos(rx)-bz*Math.sin(rx),ay*Math.sin(rx)+bz*Math.cos(rx)];
}
function at(object,offset) {
  const d=rotateXYZ(offset,object.rotation);
  return object.position.map((v,i)=>v+d[i]);
}
function traySlot(i) {return [-1.48+(i%2 ? .109 : -.109),.803,.10+(i<2 ? -.086 : .086)];}
function grillSlot(i) {return [1.36+(i%2 ? .078 : -.078),.949,(i<2 ? -.112 : .112)];}
function boardSlot(i) {return [board[0]+(i%2 ? .098 : -.098),board[1],board[2]+(i<2 ? -.089 : .089)];}

function makeState(start) {
  const piece = ()=>({position:board.slice(),rotation:[0,0,0],size:0,shape:0,fill:0,toast:0,flip:0,wrap:0,top:0});
  return {stance:start,hands:[rest,rest],focus:[0,.98,.12],lean:0,lift:0,effort:0,
    tools:{lid:LID,bowl:BOWL,cloth:CLOTH,mallet:MALLET,paddle:PADDLE},pieces:[0,1,2,3].map(piece),
    food:{bowlRice:1,steamerRice:0,clothRice:0,mortarRice:0,steam:0,doneness:0,smooth:0,compression:0,
      mixed:0,boardDough:0,paddleDough:0,prep:0,prepIndex:0,prepCarry:0,mixLoad:0,pinch:0,pinchIndex:-1,pinchPortion:0,gather:0,stretch:0,pourRice:0,tipRice:0}};
}

// Each entry is a physical transition. Props stay precisely where they were
// put down; a later reach starts with the hand open and the tool stationary.
export function createCookingScore(draft,layout={},entry={}) {
  const ground = layout.floor || (()=>0);
  const origin=entry.start || [.32,0,1.35];
  const start=[origin[0],origin[2],Number.isFinite(entry.heading)?entry.heading:PI];
  let state=makeState(start), end=0, chapter;
  const steps=[], chapters=[], cues=[];
  function phase(id,label) {
    chapter={id,label,start:end,end};chapters.push(chapter);
  }
  function beat(seconds,change={},curve='soft') {
    const next={...state,...change,food:{...state.food,...change.food},tools:{...state.tools,...change.tools}};
    if(change.piece) {
      const {index,...fields}=change.piece;
      next.pieces=state.pieces.slice();
      next.pieces[index]={...state.pieces[index],...fields};
      delete next.piece;
    }
    steps.push({start:end,duration:seconds,a:state,b:next,curve,chapter});
    end+=seconds;chapter.end=end;state=next;
  }
  function sound(name){cues.push({time:end,name});}
  // The traveller's rounded cheeks project almost a metre forward when
  // leaning. Keep the grips on the outside of that silhouette.
  const stance=(x,z=1.18,yaw=PI)=>[x,z+.37,yaw];
  const moveTool=(name,p,r=[0,0,0])=>({[name]:still(p,r)});
  const steer=(x,z,yaw=PI)=>{
    const [u,v,a]=state.stance;
    return Math.max(.39,Math.hypot(x-u,z+.37-v)/1.42,Math.abs(angleTo(a,yaw))/3.4);
  };
  function openLid() {
    beat(.43,{hands:[rightLid,rest],focus:LID.position,lean:.16});
    beat(.40,{tools:moveTool('lid',[.51,1.55,.07],[-.15,0,.07]),lean:.09});
    beat(.46,{tools:{lid:lidPark},lean:.18});
    sound('lid');
    beat(.31,{hands:[rest,rest],lean:.08});
  }
  // Captions follow what is actually on the worktop, including recipes
  // with the same ingredient used in two different ways.
  const namesFor = placement => draft.fillings.filter(f => f.placement === placement)
    .map(f => f.id === 'azuki' && placement === 'inside' ? '小豆餡' : CRAFT_OPTIONS.filling[f.id]);
  const fillingNames = [...new Set(draft.fillings.map(f => CRAFT_OPTIONS.filling[f.id]))];
  const mixedNames = namesFor('mixed');
  if (draft.seasoning !== 'none') mixedNames.push(CRAFT_OPTIONS.seasoning[draft.seasoning]);
  const insideNames = namesFor('inside'), garnishNames = namesFor('top');
  phase('approach','作業台の前に立つ');
  // Walk around the worktop if the traveller opened the recipe from its
  // rear. The front posts and the folding tray shelf also need hip clearance.
  const approach=(x,z,yaw)=>{
    const [u,v]=state.stance;
    beat(Math.max(.30,Math.hypot(x-u,z-v)/1.48),{stance:[x,z,yaw],focus:[.45,1.12,.06]});
  };
  if(start[1]<.70){
    const lane=start[0]<0?-2.85:2.67;
    if(start[1]<0 && Math.abs(start[0])<Math.abs(lane))approach(start[0],Math.min(-1.41,start[1]),PI);
    approach(lane,state.stance[1],start[0]<0?-PI/2:PI/2);
    approach(lane,2.93,0);
    approach(.40,2.93,PI);
  }
  if (state.stance[1]<1.42) approach(state.stance[0],1.44,PI);
  beat(steer(.40,1.19),{stance:stance(.40,1.19),focus:[.45,1.12,.06]});

  phase('steam','水に浸しておいた'+(draft.base === 'brownRice' ? '玄もち米' : 'もち米')+'を蒸す');
  openLid();
  beat(.43,{stance:stance(.18,1.17),hands:bowlHands,focus:BOWL.position,lean:.15});
  beat(.45,{tools:moveTool('bowl',[.14,1.36,.34]),stance:stance(.28),lean:.09});
  beat(.37,{tools:moveTool('bowl',[.40,1.44,.17],[.30,0,-.10]),focus:[.5,1.20,.04]});
  beat(.53,{tools:moveTool('bowl',[.47,1.40,.15],[1.48,0,-.11]),food:{bowlRice:.45,steamerRice:.55,pourRice:1}});
  sound('grain');
  beat(.36,{food:{bowlRice:0,steamerRice:1,pourRice:0}});
  beat(.38,{tools:moveTool('bowl',[.14,1.40,.16])});
  beat(.42,{tools:moveTool('bowl',[-.07,.763,-.20]),lean:.20});
  beat(.32,{hands:[rightLid,rest],focus:lidPark.position});
  beat(.38,{tools:moveTool('lid',[.50,1.52,.02],[-.12,0,0]),lean:.09});
  beat(.38,{tools:{lid:LID},food:{steam:.18}});sound('lid');
  beat(.28,{hands:[rest,rest],lean:.06});

  phase('prep',fillingNames.length ? '米を蒸す間に、'+fillingNames.join('と')+'の下ごしらえをする' : '米を蒸す間に、手を水で湿らせる');
  const prepHands=[rest,[.11,.846,.34]];
  if(draft.fillings.length) {
    beat(.57,{stance:stance(.035,1.15),hands:prepHands,focus:[.02,.84,.28],food:{steam:.45}});
    for(const [i,f] of draft.fillings.entries()) {
      const pluck=f.id==='sakura'||f.id==='herb';
      const prepEnd=i/draft.fillings.length;
      const dishX=-.175+i*.107;
      beat(.29,{hands:[rest,[dishX,.807,.05]],food:{prepIndex:i,prep:prepEnd,prepCarry:0},lean:.16});
      beat(.32,{hands:[rest,[.015,.82,.27]],food:{prepCarry:1}});
      beat(.34,{hands:[pluck?[.12,.91,.27]:paddleGrip,[-.10,.864,.28]],lean:.13});
      const times=pluck?2:3;
      for(let n=0;n<times;n++) {
        const x=.03+.065*Math.sin(n*1.6+i),z=.252+.039*Math.cos(n*1.9);
        beat(.24,{hands:[pluck?[x,.986,z]:paddleGrip,[-.105,.859,.30]],
          tools:pluck?{}:moveTool('paddle',[x+.04,.994,z],[.20,-.28,0]),lean:.085,food:{steam:.8}});
        beat(.21,{hands:[pluck?[x-.059,.849,z+.034]:paddleGrip,[-.105,.855,.30]],
          tools:pluck?{}:moveTool('paddle',[x,.815,z],[-.28,-.25,.08]),lean:.17,effort:.27,
          food:{prep:(i+(n+1)/times)/draft.fillings.length}});
        if(!pluck)sound('chop');
      }
      if(!pluck) {
        beat(.28,{tools:moveTool('paddle',[.12,.995,.13]),lean:.10});
        beat(.25,{tools:{paddle:PADDLE}});
      }
      beat(.22,{hands:[rest,[.015,.82,.27]],effort:0});
      beat(.34,{hands:[rest,[dishX,.807,.05]],food:{prepCarry:0}});
      beat(.22,{hands:[rest,rest]});
    }
  }else{
    beat(.47,{stance:stance(.66,1.18),hands:[[1.02,.90,.17],rest],focus:[1.02,.90,.17],lean:.16,food:{steam:.5}});
    beat(.50,{hands:[[.71,1.04,.43],[.62,1.02,.45]],lean:.10,food:{steam:.88,prep:1}});
    sound('water');beat(.38,{hands:[rest,rest]});
  }
  beat(.58,{stance:stance(.50),hands:[rest,rest],focus:[.50,1.21,.02],food:{steam:1,doneness:1},effort:0});

  phase('transfer','蒸した米を布ごと持ち上げ、臼に移す');
  // Free the mouth of the mortar before bringing across the hot rice.
  beat(.87,{stance:stance(-.64,1.13),hands:[rest,rest],focus:MALLET.position});
  beat(.38,{hands:malletHands,lean:.19});
  beat(.39,{tools:moveTool('mallet',[-.69,1.53,-.16]),lean:.10});
  beat(.60,{stance:stance(-1.03),tools:moveTool('mallet',[-1.31,1.47,-.396],[0,PI/2,0])});
  beat(.36,{tools:{mallet:malletRack},lean:.19});beat(.25,{hands:[rest,rest],lean:.07});
  beat(steer(.50,1.18),{stance:stance(.50),focus:LID.position});
  openLid();
  beat(.46,{hands:clothHands,lean:.19,food:{gather:1}});
  beat(.43,{tools:moveTool('cloth',[.50,1.235,.045]),food:{steamerRice:0,clothRice:1,steam:.75},lean:.11});
  beat(.45,{tools:moveTool('cloth',[.34,1.345,.19]),stance:stance(.29)});
  beat(.88,{tools:moveTool('cloth',[-.54,1.46,.16]),stance:stance(-.49),focus:[-.57,1.32,.05]});
  beat(.56,{tools:moveTool('cloth',[-.63,1.405,.105],[1.30,0,-.06]),lean:.16,food:{clothRice:.43,mortarRice:.57,tipRice:1}});
  beat(.35,{food:{clothRice:0,mortarRice:1,tipRice:0}});sound('grain');
  beat(.40,{tools:moveTool('cloth',[-.43,1.50,.16],[.38,0,0]),lean:.09});
  beat(.82,{stance:stance(.46),tools:moveTool('cloth',[.50,1.40,.10]),focus:LID.position});
  beat(.42,{tools:{cloth:CLOTH},lean:.16});
  beat(.32,{hands:[rest,rest],food:{steam:.32,gather:0}});

  phase('pound',draft.technique==='half'?'杵で軽くつき、米粒を残す':'杵で米をつぶし、粘りが出るまでつく');
  beat(steer(-1.04,1.18),{stance:stance(-1.04),focus:malletRack.position,lean:.08});
  beat(.36,{hands:malletHands,lean:.21});
  beat(.38,{tools:moveTool('mallet',[-1.31,1.49,-.396],[0,PI/2,0]),lean:.11});
  beat(.61,{stance:stance(-1.12,1.16,PI-.12),tools:moveTool('mallet',[-.68,1.55,.01],[-.12,0,-1.48]),focus:well,lean:.08});
  // Press the grains first. A long downstroke before they cohere scatters rice.
  for(let i=0;i<2;i++){
    beat(.31,{tools:moveTool('mallet',[-.70+i*.045,1.287,.005],[-.49,.025,-1.50]),lean:.20,effort:.55,
      food:{compression:.45,smooth:.055+.06*i}});
    beat(.27,{tools:moveTool('mallet',[-.66,1.46,.048],[-.16,0,-1.49]),lean:.12,effort:.12,food:{compression:0}});
  }
  const strikes=draft.technique==='half'?3:5;
  const finalSmooth=draft.technique==='half'?.57:1;
  for(let i=0;i<strikes;i++){
    const force=.84+.16*Math.sin((i+1)*1.7), sway=.025*Math.cos(i*1.6);
    beat(.48,{tools:moveTool('mallet',[-.66+sway,1.98+.08*force,.245],[.97,-.035,-1.33]),lean:-.035,lift:.065,effort:.45,food:{compression:0}});
    beat(.12,{tools:moveTool('mallet',[-.68+sway,2.04,.26],[1.09,-.035,-1.36]),lift:.068});
    beat(.26,{tools:moveTool('mallet',[-.68+sway,1.308,.0],[-.35,.025,-1.51]),lean:.23,lift:-.035,effort:1,
      food:{compression:1,smooth:.12+(finalSmooth-.12)*(i+1)/strikes}},'fall');sound('pound');
    beat(.17,{tools:moveTool('mallet',[-.67+sway,1.397,.018],[-.30,.01,-1.50]),lean:.18,lift:-.014,effort:.52,food:{compression:.36,stretch:.7}});
    beat(.19,{tools:moveTool('mallet',[-.67,1.49,.044],[-.17,0,-1.49]),lean:.11,lift:0,effort:.19,food:{compression:0,stretch:0}});
  }
  beat(.39,{tools:moveTool('mallet',[-.68,1.48,-.17],[-.05,0,0]),lean:.12});
  // Set it on the rear of the bench, clear of the mortar while folding.
  beat(.58,{tools:moveTool('mallet',[-1.31,1.49,-.396],[0,PI/2,0]),stance:stance(-1.04),lean:.10});
  beat(.35,{tools:{mallet:malletRack},lean:.21});
  beat(.28,{hands:[rest,rest],lean:.075,effort:0});

  phase('knead',mixedNames.length ? '餅を折り返し、'+mixedNames.join('と')+'を練り込む' : '餅を折り返して生地を整える');
  beat(.55,{stance:stance(.02),hands:[paddleGrip,rest],focus:[.04,.86,.23],lean:.15});
  const mixed=draft.fillings.some(f=>f.placement==='mixed')||draft.seasoning!=='none';
  if(mixed) {
    beat(.35,{tools:moveTool('paddle',[-.035,.799,.09],[-.08,0,0]),hands:[paddleGrip,[-.13,.826,.05]],food:{mixLoad:1}});
    beat(.60,{tools:moveTool('paddle',[-.55,1.42,.13],[.03,.1,0]),stance:stance(-.48),hands:[paddleGrip,rest],focus:well});
    beat(.36,{tools:moveTool('paddle',[-.64,1.28,.06],[.49,.14,.03]),food:{mixed:.27,mixLoad:0}});
  }
  beat(.57,{tools:moveTool('paddle',[-.65,1.385,.13],[-.64,.11,0]),stance:stance(-.55,1.12),focus:well,hands:[paddleGrip,[-.87,1.30,.195]],lean:.13});
  for(let n=0;n<3;n++){
    beat(.28,{tools:moveTool('paddle',[-.73,1.17,.06],[-.82,.27,-.13]),lean:.22,effort:.56,food:{compression:.60}});
    beat(.32,{tools:moveTool('paddle',[-.605,1.32,.12],[-.68,-.20,.20]),lean:.13,effort:.16,
      food:{compression:0,mixed:mixed?(n+1)/3:0}});sound('knead');
  }
  beat(.29,{tools:moveTool('paddle',[-.66,1.19,.034],[-.70,0,0]),hands:[paddleGrip,[-.81,1.24,.10]]});
  beat(.46,{tools:moveTool('paddle',[-.58,1.41,.15],[-.23,0,0]),hands:[paddleGrip,[-.72,1.47,.12]],food:{paddleDough:1,mortarRice:0}});
  beat(.66,{stance:stance(.02),tools:moveTool('paddle',[-.035,1.03,.30],[-.10,0,0]),hands:[paddleGrip,[-.16,1.07,.28]],focus:board});
  beat(.31,{tools:moveTool('paddle',[-.02,.833,.25],[-.12,0,-.18]),hands:[paddleGrip,[-.13,.88,.31]],food:{paddleDough:0,boardDough:1}});
  beat(.26,{tools:moveTool('paddle',[.14,.936,.32]),hands:[paddleGrip,rest]});
  beat(.32,{tools:{paddle:PADDLE}});beat(.22,{hands:[rest,rest],lean:.07,effort:0});

  phase('shape',insideNames.length ? '四つに分け、'+insideNames.join('と')+'を包む' : '四つにちぎり、形を整える');
  function seasonPortion(i,placement) {
    const ingredients=draft.fillings.map((f,index)=>({f,index})).filter(item=>item.f.placement===placement);
    for(const [n,{index}] of ingredients.entries()){
      const dishX=-.175+index*.107;
      const steady=onPiece(i,[-.07,.047,.01]);
      beat(.28,{hands:[[dishX,.81,.05],steady],food:{pinchIndex:index,pinchPortion:i,pinch:1},effort:.14});
      beat(.22,{hands:[[dishX,.956,.15],steady]});
      beat(.30,{hands:[onPiece(i,[0,.078,0]),steady]});
      beat(.18,{food:{pinch:0},piece:{index:i,[placement==='inside'?'fill':'top']:(n+1)/ingredients.length}});
    }
  }
  for(let i=0;i<4;i++){
    const [x,y,z]=boardSlot(i);
    const h=.10;
    beat(.25,{hands:[[board[0]+.09,y+h,board[2]+.028],[board[0]-.09,y+h,board[2]+.028]],focus:board,lean:.16});
    beat(.32,{piece:{index:i,position:[x,y+.048,z],size:1},hands:[onPiece(i,[.071,.052,.014]),onPiece(i,[-.071,.052,.014])],
      food:{boardDough:(3-i)/4},effort:.34});
    seasonPortion(i,'inside');
    beat(.30,{piece:{index:i,position:[x,y+.032,z],shape:.55},hands:[onPiece(i,[.070,.03,.04]),onPiece(i,[-.061,.047,-.028])],lean:.195});
    beat(.32,{piece:{index:i,position:[x,y,z],shape:1},hands:[onPiece(i,[.070,.038,-.005]),onPiece(i,[-.068,.035,.012])],lean:.13,effort:.08});
    beat(.16,{hands:[[x+.11,y+.13,z+.06],[x-.12,y+.13,z+.05]]});
  }
  function carry(i,dest,bodyX,restAt,seconds) {
    const p=state.pieces[i].position;
    const hands=[onPiece(i,[.061,.037,.01]),onPiece(i,[-.061,.037,.01])];
    beat(.24,{hands,lean:.17,focus:p});
    const high=Math.max(p[1],dest[1])+restAt;
    beat(.27,{piece:{index:i,position:[p[0],high,p[2]+.06]},lean:.09});
    beat(seconds,{stance:stance(bodyX,1.20),piece:{index:i,position:[dest[0],high,dest[2]+.08]},focus:dest,lean:.105});
    beat(.27,{piece:{index:i,position:dest},lean:.17});
    beat(.18,{hands:[[dest[0]+.12,dest[1]+.16,dest[2]+.08],[dest[0]-.11,dest[1]+.14,dest[2]+.07]]});
  }
  const grilled=draft.finish==='grill';
  if(grilled) {
    phase('grill','炭火に並べ、返して焼く');
    for(let i=0;i<4;i++) {
      if(i) beat(.80,{stance:stance(.04),hands:[rest,rest],focus:board});
      carry(i,grillSlot(i),1.10,.385,.92);
    }
    beat(.63,{stance:stance(1.05,1.18),hands:[rest,rest],focus:[1.35,1.00,0]});
    // Turn with the blade underneath the hot rice, avoiding the live coals.
    beat(.75,{stance:stance(.05),hands:[paddleGrip,rest],focus:[.30,.88,.15]});
    beat(.87,{stance:stance(1.08),tools:moveTool('paddle',[1.27,1.22,.18]),focus:[1.34,1.02,.01]});
    for(let i=0;i<4;i++){
      const [x,y,z]=grillSlot(i);
      beat(.22,{tools:moveTool('paddle',[x,y+.013,z+.02],[-.20,0,0]),piece:{index:i,toast:.48},lean:.17});
      beat(.32,{tools:moveTool('paddle',[x,y+.16,z+.05],[-.4,0,-.40]),piece:{index:i,position:[x,y+.18,z],flip:1.48},lean:.09});
      beat(.30,{piece:{index:i,position:[x,y,z],flip:PI,toast:1},tools:moveTool('paddle',[x+.07,y+.055,z+.11]),lean:.15});sound('sizzle');
    }
    // Return each hot cake to the board on the same paddle. Only after it
    // leaves the charcoal does the cook handle the decorations and leaf.
    for(let i=0;i<4;i++){
      const [x,y,z]=grillSlot(i),[u,v,w]=boardSlot(i);
      if(i) beat(.91,{stance:stance(1.08),tools:moveTool('paddle',[x,1.26,z+.13]),focus:[x,y,z]});
      beat(.30,{tools:moveTool('paddle',[x,y+.001,z],[-.005,0,0]),lean:.17});
      beat(.31,{tools:moveTool('paddle',[x,1.40,z+.12]),piece:{index:i,position:[x,1.416,z+.12]},lean:.09});
      beat(1.02,{stance:stance(.02),tools:moveTool('paddle',[u,1.37,w+.04]),piece:{index:i,position:[u,1.386,w+.04]},focus:board});
      // Roll the cake across the paddle onto its base. The marked upper
      // shoulder is presented for the garnish and the fresh leaf.
      beat(.24,{tools:moveTool('paddle',[u,v+.18,w+.025],[-.10,0,.93]),
        piece:{index:i,position:[u+.028,v+.23,w],flip:PI*1.5},lean:.13});
      beat(.29,{tools:moveTool('paddle',[u,v+.001,w]),piece:{index:i,position:[u,v+.017,w],flip:2*PI},lean:.17});
      beat(.28,{tools:moveTool('paddle',[u,v+.03,w+.22]),piece:{index:i,position:[u,v,w]},lean:.12});
    }
    beat(.32,{tools:moveTool('paddle',[.12,1.02,.25])});
    beat(.28,{tools:{paddle:PADDLE}});beat(.23,{hands:[rest,rest]});
  }
  if(draft.fillings.some(f=>f.placement==='top')){
    phase('garnish','ひとつずつ、'+garnishNames.join('と')+'をのせる');
    for(let i=0;i<4;i++){
      beat(.24,{hands:[rest,rest],focus:state.pieces[i].position});
      seasonPortion(i,'top');
    }
  }
  if(draft.technique==='wrap'){
    phase('wrap','笹の葉を折り、ひとつずつ包む');
    for(let i=0;i<4;i++){
      const [x,y,z]=state.pieces[i].position;
      beat(.34,{stance:stance(.02),hands:[[x+.13,y+.043,z+.035],[x-.13,y+.045,z-.012]],focus:[x,y+.05,z]});
      beat(.28,{hands:[[x+.012,y+.099,z],[x-.11,y+.043,z]],piece:{index:i,wrap:.52},lean:.19});
      beat(.32,{hands:[[x+.01,y+.096,z],[x-.015,y+.10,z]],piece:{index:i,wrap:1},lean:.18});
      beat(.24,{hands:[[x+.13,y+.15,z+.085],[x-.10,y+.15,z+.075]],lean:.13});
    }
  }
  phase('plate','仕上げた餅をひとつずつ器に盛る');
  for(let i=0;i<4;i++){
    const p=state.pieces[i].position, sourceX=.02;
    beat(steer(sourceX,1.20),{stance:stance(sourceX,1.20),hands:[rest,rest],focus:p});
    carry(i,traySlot(i),-1.10,.53,.93);
    sound('plate');
  }
  phase('finish','四つの餅ができあがりました');
  beat(.62,{stance:stance(-.94,1.26,PI+.26),focus:[-1.35,1.02,.15],hands:[rest,rest],lean:.085,effort:0,food:{steam:.03}});
  beat(.94,{lean:.025});
  function sample(seconds) {
    const t=Math.max(0,Math.min(end,seconds));
    // Players may replay or skip. A sampled pose never accumulates state.
    let lo=0,hi=steps.length-1;
    while(lo<hi){const mid=(lo+hi)>>1;if(steps[mid].start+steps[mid].duration<=t)lo=mid+1;else hi=mid;}
    const s=steps[lo],{a,b}=s,u=clamp((t-s.start)/s.duration),f=s.curve==='fall'?u*u:ease(u);
    const x=mix(a.stance[0],b.stance[0],f),z=mix(a.stance[1],b.stance[1],f);
    const heading=unwrap(a.stance[2],b.stance[2],f);
    const span=Math.hypot(a.stance[0]-b.stance[0],a.stance[1]-b.stance[1]);
    const turn=Math.abs(angleTo(a.stance[2],b.stance[2]));
    // Alternate planted/swinging feet along the same route; end every reach
    // with both soles down, including after stepping sideways carrying a tray.
    const strides=Math.max(1,Math.ceil((span+.22*turn)/.62)),walk=span+.25*turn>.025;
    let bounce=0,footCentre=0;
    function footprint(q,side,lift) {
      const yaw=unwrap(a.stance[2],b.stance[2],q);
      const cx=mix(a.stance[0],b.stance[0],q), cz=mix(a.stance[1],b.stance[1],q);
      const dx=Math.cos(yaw)*side*.29+Math.sin(yaw)*.07, dz=-Math.sin(yaw)*side*.29+Math.cos(yaw)*.07;
      const floor=ground(cx,cz);
      let reach=1;
      // Draw the outward foot in on a narrow edge instead of dropping a leg
      // to ground level beside a half-metre-high tread.
      if(ground(cx+dx,cz+dz)<floor-.27) {
        let edge=1;
        reach=0;
        for(let i=0;i<6;i++) {
          const mid=(reach+edge)*.5;
          if(ground(cx+dx*mid,cz+dz*mid)>=floor-.27)reach=mid;
          else edge=mid;
        }
      }
      const tx=cx+dx*reach, tz=cz+dz*reach;
      return [tx,ground(tx,tz)+lift,tz];
    }
    const feet=[-1,1].map((side,i)=>{
      const cycle=Math.min(strides-1,Math.floor(f*strides));
      const frac=clamp((f*strides-cycle)*2-i), travel=(cycle+ease(frac))/strides;
      const lift=walk?Math.min(.105,.025+(span+.18*turn)/strides*.13)*Math.sin(PI*frac):0;
      bounce+=lift*.22;
      const foot=footprint(travel,side,0);
      // A raised wooden tread is a height discontinuity. Move the unweighted
      // foot between its two planted levels instead of snapping at the edge.
      const from=footprint(cycle/strides,side,0),to=footprint((cycle+1)/strides,side,0);
      const base=mix(from[1],to[1],ease(frac));
      const clearance=Math.abs(to[1]-from[1])*.69*Math.sin(PI*frac);
      foot[1]=base+lift+clearance;
      footCentre+=base*.5;
      return foot;
    });
    const tools={};
    for(const name of Object.keys(a.tools)){
      const first=a.tools[name],last=b.tools[name];
      tools[name]=still(blend(first.position,last.position,f),blend(first.rotation,last.rotation,f));
    }
    const pieces=a.pieces.map((v,i)=>{
      const w=b.pieces[i],p=still(blend(v.position,w.position,f),blend(v.rotation,w.rotation,f));
      for(const key of ['size','shape','fill','toast','flip','wrap','top'])p[key]=mix(v[key],w[key],f);
      p.visible=p.size>.001;return p;
    });
    function palm(target,i) {
      if(target?.tool)return at(tools[target.tool],target.offset);
      if(target?.index!==undefined)return at(pieces[target.index],target.offset);
      if(target)return target;
      const side=i?1:-1,flight=walk?.085*Math.sin(2*PI*f*strides)*side:0;
      const dx=side*.75,dz=.54+flight;
      return [x+dx*Math.cos(heading)+dz*Math.sin(heading),footCentre+.70+bounce,z-dx*Math.sin(heading)+dz*Math.cos(heading)];
    }
    const hands=a.hands.map((v,i)=>blend(palm(v,i),palm(b.hands[i],i),f));
    const food={};
    for(const k of Object.keys(a.food))food[k]=['prepIndex','pinchIndex','pinchPortion'].includes(k)?b.food[k]:mix(a.food[k],b.food[k],f);
    const ch=s.chapter;
    return {time:t,phase:ch.id,label:ch.label,progress:(t-ch.start)/(ch.end-ch.start),hero:[x,footCentre+bounce,z],heading,
      focus:blend(a.focus,b.focus,f),lean:mix(a.lean,b.lean,f),lift:mix(a.lift,b.lift,f),effort:mix(a.effort,b.effort,f),
      feet,hands,tools,pieces,food};
  }
  return {duration:end,chapters,cues,sample};
}
