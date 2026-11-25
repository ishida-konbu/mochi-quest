import { CRAFT_OPTIONS } from './living-craft.js';
import { MALLET_RACK } from './living-layout.js';

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
const onPiece = offset => ({piece:true,offset});
const rest = null;
const LID = still([.50,1.166,.02]);
const BOWL = still([.045,.798,.31]);
const CLOTH = still([.50,.995,.02]);
// Within reach of the cook at the mortar, with its handle along the front edge.
const mortarPaddle=still([-.39,.773,.36],[0,-1.25,0]);
const rightLid=grip('lid',[.042,.028,0]);
const bowlHands=[grip('bowl',[.145,.072,.035]),grip('bowl',[-.145,.072,.035])];
const clothHands=[grip('cloth',[.145,.16,.035]),grip('cloth',[-.145,.16,.035])];
const malletHands=[grip('mallet',[.012,0,.87]),grip('mallet',[-.012,0,.61])];
const paddleGrip=grip('paddle',[0,.01,.18]);
const lidPark=still([.815,1.035,-.19],[0,.04,1.45]);
const malletRack=still(MALLET_RACK);
const receivingBowl=still([-.22,.763,-.28]);
const spentCloth=still([receivingBowl.position[0],.789,receivingBowl.position[2]]);
const board=[-.045,.798,.29], well=[-.68,1.187,.01];
// Leave the blade on the board beside the cake, turned handle-first to the cook.
const boardPaddle=still([board[0]+.181,board[1]+.009,board[2]+.016]);
const grill=[1.36,.949,0];
export const SERVING_POINT=[-1.48,.784,.10];
const unwrap=(a,b,f)=>a+angleTo(a,b)*f;

function rotateXYZ(p,r) {
  const [x,y,z]=p,[rx,ry,rz]=r;
  const ax=x*Math.cos(rz)-y*Math.sin(rz), ay=x*Math.sin(rz)+y*Math.cos(rz);
  const bx=ax*Math.cos(ry)+z*Math.sin(ry), bz=z*Math.cos(ry)-ax*Math.sin(ry);
  return [bx,ay*Math.cos(rx)-bz*Math.sin(rx),ay*Math.sin(rx)+bz*Math.cos(rx)];
}
function at(object,offset) {
  const local=object.scale ? offset.map((v,i)=>v*object.scale[i]) : offset;
  const d=rotateXYZ(local,object.rotation);
  return object.position.map((v,i)=>v+d[i]);
}
function makeState(start) {
  const piece={...still(board),size:0,shape:0,fill:0,toast:0,flip:0,wrap:0,top:0};
  return {stance:start,hands:[rest,rest],focus:[0,.98,.12],lean:0,lift:0,effort:0,
    tools:{lid:LID,bowl:BOWL,cloth:CLOTH,mallet:malletRack,paddle:mortarPaddle},piece,
    food:{bowlRice:1,steamerRice:0,clothRice:0,mortarRice:0,steam:0,doneness:0,smooth:0,compression:0,
      mixed:0,boardDough:0,paddleDough:0,prep:0,prepIndex:0,prepCarry:0,mixLoad:0,pinch:0,pinchIndex:-1,gather:0,stretch:0,pourRice:0,tipRice:0}};
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
    const next={...state,...change,food:{...state.food,...change.food},tools:{...state.tools,...change.tools},
      piece:change.piece ? {...state.piece,...change.piece} : state.piece};
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
  beat(.42,{tools:{bowl:receivingBowl},lean:.20});
  beat(.32,{hands:[rightLid,rest],focus:lidPark.position});
  beat(.38,{tools:moveTool('lid',[.50,1.52,.02],[-.12,0,0]),lean:.09});
  beat(.38,{tools:{lid:LID},food:{steam:.18}});sound('lid');
  beat(.28,{hands:[rest,rest],lean:.06});

  phase('prep',fillingNames.length ? '米を蒸す間に、'+fillingNames.join('と')+'の下ごしらえをする' : '米を蒸す間に、手を水で湿らせる');
  const prepHands=[rest,[.11,.846,.34]];
  if(draft.fillings.length) {
    beat(.57,{stance:stance(.035,1.15),hands:prepHands,focus:[.02,.84,.28],food:{steam:.45}});
    const needsPaddle=f=>f && f.id!=='sakura' && f.id!=='herb';
    let prepRight=rest;
    for(const [i,f] of draft.fillings.entries()) {
      const pluck=!needsPaddle(f);
      const prepEnd=i/draft.fillings.length;
      const dishX=-.175+i*.107;
      beat(.29,{hands:[prepRight,[dishX,.807,.05]],food:{prepIndex:i,prep:prepEnd,prepCarry:0},lean:.16});
      beat(.32,{hands:[prepRight,[.015,.82,.27]],food:{prepCarry:1}});
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
      // Keep the tool in the working hand if the next ingredient needs it too.
      prepRight=!pluck && needsPaddle(draft.fillings[i+1]) ? paddleGrip : rest;
      if(!pluck) {
        beat(.28,{tools:moveTool('paddle',[-.14,.987,.32]),lean:.10});
        if(!prepRight)beat(.30,{tools:{paddle:mortarPaddle}});
      }
      beat(.22,{hands:[prepRight,[.015,.82,.27]],effort:0});
      beat(.34,{hands:[prepRight,[dishX,.807,.05]],food:{prepCarry:0}});
      beat(.22,{hands:[prepRight,rest]});
    }
  }else{
    beat(.47,{stance:stance(.66,1.18),hands:[[1.02,.90,.17],rest],focus:[1.02,.90,.17],lean:.16,food:{steam:.5}});
    beat(.50,{hands:[[.71,1.04,.43],[.62,1.02,.45]],lean:.10,food:{steam:.88,prep:1}});
    sound('water');beat(.38,{hands:[rest,rest]});
  }
  beat(.58,{stance:stance(.50),hands:[rest,rest],focus:[.50,1.21,.02],food:{steam:1,doneness:1},effort:0});

  phase('transfer','蒸した米を布ごと持ち上げ、臼に移す');
  openLid();
  beat(.46,{hands:clothHands,lean:.19,food:{gather:1}});
  beat(.43,{tools:moveTool('cloth',[.50,1.235,.045]),food:{steamerRice:0,clothRice:1,steam:.75},lean:.11});
  beat(.45,{tools:moveTool('cloth',[.34,1.345,.19]),stance:stance(.29)});
  beat(.88,{tools:moveTool('cloth',[-.54,1.46,.16]),stance:stance(-.49),focus:[-.57,1.32,.05]});
  beat(.56,{tools:moveTool('cloth',[-.63,1.405,.105],[1.30,0,-.06]),lean:.16,food:{clothRice:.43,mortarRice:.57,tipRice:1}});
  beat(.35,{food:{clothRice:0,mortarRice:1,tipRice:0}});sound('grain');
  // Leave the spent linen in the rice bowl beside the mortar, then reach
  // for the waiting mallet without leaving the rice.
  beat(.44,{tools:moveTool('cloth',[-.22,1.44,-.23]),stance:stance(-.66),focus:receivingBowl.position,lean:.09});
  beat(.45,{tools:{cloth:spentCloth},stance:stance(-.82),lean:.18});
  beat(.28,{hands:[rest,rest],food:{steam:.32,gather:0},lean:.09});

  phase('pound',draft.technique==='half'?'杵で軽くつき、米粒を残す':'杵で米をつぶし、粘りが出るまでつく');
  // Leave space on the steps for the belly and both rounded mitts while the
  // long handle sweeps back. A full traveller works from the lower tread.
  const stepBack=entry.full ? .29 : 0;
  const atRack=stance(-.70,1.34+stepBack);
  const aboveRack=still([MALLET_RACK[0],1.65,MALLET_RACK[2]]);
  const atMortar=stance(-1.27,1.34+stepBack,PI-.13);
  beat(.46,{stance:atRack,hands:malletHands,focus:malletRack.position,lean:.21});
  beat(.38,{tools:{mallet:aboveRack},lean:.11});
  beat(.61,{stance:atMortar,tools:moveTool('mallet',[-.68,1.55,.01],[-.12,.36,-1.48]),focus:well,lean:.08});
  // Press the grains first. A long downstroke before they cohere scatters rice.
  for(let i=0;i<2;i++){
    beat(.31,{tools:moveTool('mallet',[-.70+i*.045,1.287,.005],[-.49,.36,-1.50]),lean:.20,effort:.55,
      food:{compression:.45,smooth:.055+.06*i}});
    beat(.27,{tools:moveTool('mallet',[-.66,1.46,.048],[-.16,.36,-1.49]),lean:.12,effort:.12,food:{compression:0}});
  }
  const strikes=draft.technique==='half'?3:5;
  const finalSmooth=draft.technique==='half'?.57:1;
  for(let i=0;i<strikes;i++){
    const force=.84+.16*Math.sin((i+1)*1.7), sway=.025*Math.cos(i*1.6);
    beat(.48,{tools:moveTool('mallet',[-.66+sway,1.98+.08*force,.245],[.97,.36,-1.33]),lean:-.035,lift:.065,effort:.45,food:{compression:0}});
    beat(.12,{tools:moveTool('mallet',[-.68+sway,2.04,.26],[1.09,.36,-1.36]),lift:.068});
    beat(.26,{tools:moveTool('mallet',[-.68+sway,1.308,.0],[-.35,.36,-1.51]),lean:.23,lift:-.035,effort:1,
      food:{compression:1,smooth:.12+(finalSmooth-.12)*(i+1)/strikes}},'fall');sound('pound');
    beat(.17,{tools:moveTool('mallet',[-.67+sway,1.397,.018],[-.30,.36,-1.50]),lean:.18,lift:-.014,effort:.52,food:{compression:.36,stretch:.7}});
    beat(.19,{tools:moveTool('mallet',[-.67,1.49,.044],[-.17,.36,-1.49]),lean:.11,lift:0,effort:.19,food:{compression:0,stretch:0}});
  }
  beat(.39,{tools:moveTool('mallet',[-.71,1.66,.05],[-.08,.36,-.64]),lean:.12});
  // Lift clear of the rim and rotate the handle forward onto its cleat.
  beat(.58,{tools:{mallet:aboveRack},stance:atRack,focus:malletRack.position,lean:.10});
  beat(.35,{tools:{mallet:malletRack},lean:.21});
  beat(.28,{hands:[rest,rest],lean:.075,effort:0});

  phase('knead',mixedNames.length ? '餅を折り返し、'+mixedNames.join('と')+'を練り込む' : '餅を折り返して生地を整える');
  beat(.43,{stance:stance(-.80,1.14),hands:[paddleGrip,rest],focus:mortarPaddle.position,lean:.15});
  const mixed=draft.fillings.some(f=>f.placement==='mixed')||draft.seasoning!=='none';
  if(mixed) {
    beat(.38,{tools:moveTool('paddle',[-.20,.99,.30],[-.10,-.45,0]),stance:stance(-.55,1.12),lean:.10});
    beat(.30,{tools:moveTool('paddle',[-.070,.809,.09],[-.08,0,0]),hands:[paddleGrip,[-.13,.826,.05]],food:{mixLoad:1},lean:.18});
    beat(.39,{tools:moveTool('paddle',[-.21,1.41,.14]),hands:[paddleGrip,rest],focus:well,lean:.10});
    beat(.39,{tools:moveTool('paddle',[-.55,1.42,.13],[.03,.1,0])});
    beat(.36,{tools:moveTool('paddle',[-.65,1.296,.022],[-.26,.09,.71]),food:{mixed:.27,mixLoad:0}});
  }else{
    beat(.42,{tools:moveTool('paddle',[-.36,1.40,.42],[-.20,-.42,0]),lean:.09});
  }
  beat(.57,{tools:moveTool('paddle',[-.65,1.385,.13],[-.64,.11,0]),stance:stance(-.55,1.12),focus:well,hands:[paddleGrip,[-.87,1.30,.195]],lean:.13});
  for(let n=0;n<3;n++){
    beat(.28,{tools:moveTool('paddle',[-.73,1.177,.06],[-.82,.27,-.13]),lean:.22,effort:.56,food:{compression:.60}});
    beat(.32,{tools:moveTool('paddle',[-.605,1.32,.12],[-.68,-.20,.20]),lean:.13,effort:.16,
      food:{compression:0,mixed:mixed?(n+1)/3:0}});sound('knead');
  }
  beat(.29,{tools:moveTool('paddle',[-.66,1.19,.034],[-.70,0,0]),hands:[paddleGrip,[-.81,1.24,.10]]});
  beat(.46,{tools:moveTool('paddle',[-.58,1.41,.15],[-.23,0,0]),hands:[paddleGrip,[-.72,1.47,.12]],food:{paddleDough:1,mortarRice:0}});
  // Clear the thick wooden rim before lowering the loaded paddle to the board.
  beat(.47,{stance:stance(-.19),tools:moveTool('paddle',[-.19,1.40,.32],[-.13,0,0]),hands:[paddleGrip,[-.33,1.45,.27]],focus:board});
  beat(.36,{stance:stance(.02),tools:moveTool('paddle',[-.035,1.03,.30],[-.10,0,0]),hands:[paddleGrip,[-.16,1.07,.28]],focus:board});
  beat(.31,{tools:moveTool('paddle',[-.02,.833,.25],[-.12,0,-.18]),hands:[paddleGrip,[-.13,.88,.31]],food:{paddleDough:0,boardDough:1}});
  beat(.26,{tools:moveTool('paddle',[.14,.936,.32]),hands:[paddleGrip,rest]});
  beat(.32,{tools:{paddle:boardPaddle}});beat(.22,{hands:[rest,rest],lean:.07,effort:0});

  // Follow one cake from the forming board to the dish for every batch size.
  const [bx,by,bz]=board;
  phase('shape',insideNames.length ? '生地を広げ、'+insideNames.join('と')+'を包む' : '生地を手に取り、形を整える');
  function addFilling(placement) {
    const ingredients=draft.fillings.map((f,index)=>({f,index})).filter(item=>item.f.placement===placement);
    for(const [n,{index}] of ingredients.entries()){
      const dishX=-.175+index*.107;
      const steady=onPiece([-.07,.047,.01]);
      beat(.28,{hands:[[dishX,.81,.05],steady],food:{pinchIndex:index,pinch:1},effort:.14});
      beat(.22,{hands:[[dishX,.956,.15],steady]});
      beat(.30,{hands:[onPiece([0,.078,0]),steady]});
      beat(.18,{food:{pinch:0},piece:{[placement==='inside'?'fill':'top']:(n+1)/ingredients.length}});
    }
  }
  beat(.25,{hands:[[bx+.09,by+.10,bz+.028],[bx-.09,by+.10,bz+.028]],focus:board,lean:.16});
  beat(.38,{piece:{size:1},hands:[onPiece([.071,.038,.014]),onPiece([-.071,.038,.014])],
    food:{boardDough:0},effort:.34});
  addFilling('inside');
  beat(.34,{piece:{position:[bx,by+.032,bz],shape:.55},hands:[onPiece([.070,.03,.04]),onPiece([-.061,.047,-.028])],lean:.195});
  beat(.36,{piece:{position:board,shape:1},hands:[onPiece([.070,.038,-.005]),onPiece([-.068,.035,.012])],lean:.13,effort:.08});
  beat(.19,{hands:[[bx+.11,by+.13,bz+.06],[bx-.12,by+.13,bz+.05]]});

  function carry(dest,bodyX,clearance,seconds) {
    const p=state.piece.position;
    const hands=[onPiece([.061,.037,.01]),onPiece([-.061,.037,.01])];
    beat(.24,{hands,lean:.17,focus:p});
    const high=Math.max(p[1],dest[1])+clearance;
    beat(.27,{piece:{position:[p[0],high,p[2]+.06]},lean:.09});
    beat(seconds,{stance:stance(bodyX,1.20),piece:{position:[dest[0],high,dest[2]+.08]},focus:dest,lean:.105});
    beat(.27,{piece:{position:dest},lean:.17});
    beat(.18,{hands:[[dest[0]+.12,dest[1]+.16,dest[2]+.08],[dest[0]-.11,dest[1]+.14,dest[2]+.07]]});
  }
  const paddleHands=[paddleGrip,rest];
  // A long grip keeps the cook's rounded knuckles outside the hot grate.
  const handleEnd=[grip('paddle',[0,.011,.228]),rest];
  const grilled=draft.finish==='grill', boardFinish=garnishNames.length>0 || draft.technique==='wrap';
  // Slide the blade under the near edge before lifting. The left hand is
  // clear of the grate and the wooden handle stays in the right palm.
  function graspBesideCake() {
    beat(.25,{hands:paddleHands,focus:board,lean:.15});
    beat(.19,{tools:moveTool('paddle',[bx+.18,by+.075,bz+.19]),lean:.12});
  }
  function scoop(point) {
    const [x,y,z]=point;
    beat(.20,{tools:moveTool('paddle',[x,y+.078,z+.26],[-.16,0,0]),focus:point,lean:.13});
    beat(.16,{tools:moveTool('paddle',[x,y+.012,z+.206],[-.16,0,0]),lean:.16});
    // The leading bevel meets the near shoulder from the side. Let the
    // shoulder climb the blade as it advances, then level the cook's wrist.
    beat(.12,{tools:moveTool('paddle',[x,y+.014,z+.158],[-.21,0,0]),piece:{position:[x,y+.019,z]},lean:.17});
    beat(.13,{tools:moveTool('paddle',[x,y+.014,z+.066],[-.19,0,0]),piece:{position:[x,y+.026,z]}});
    beat(.18,{tools:moveTool('paddle',[x,y+.008,z]),piece:{position:[x,y+.0205,z]}});
  }
  function carryOnPaddle(dest,bodyX,seconds) {
    const [x,,z]=state.tools.paddle.position;
    // Both crossings clear the steamer, the water pot and the mortar.
    // Keep the distance from cake to blade constant throughout the walk.
    const loaded=p=>({tools:moveTool('paddle',p),piece:{position:[p[0],p[1]+.0125,p[2]]}});
    beat(.34,{...loaded([x,1.405,z+.10]),hands:paddleHands,lean:.085});
    beat(seconds,{...loaded([dest[0],1.405,dest[2]+.09]),stance:stance(bodyX,1.20),focus:dest,lean:.10});
  }
  function turnOnto(dest) {
    const [x,y,z]=dest,from=state.piece.flip;
    // Lift both together first, then roll off the left lip. The blade
    // clears the far shoulder sideways before the cake lands.
    beat(.19,{tools:moveTool('paddle',[x,y+.092,z]),piece:{position:[x,y+.1045,z]},lean:.10});
    beat(.17,{tools:moveTool('paddle',[x+.036,y+.142,z+.006],[0,0,.67]),
      piece:{position:[x-.006,y+.155,z],flip:from+.64},lean:.10});
    beat(.17,{tools:moveTool('paddle',[x+.111,y+.14,z+.02],[0,0,1.21]),
      piece:{position:[x-.021,y+.132,z],flip:from+1.58},lean:.12});
    beat(.25,{tools:moveTool('paddle',[x+.165,y+.12,z+.10],[-.12,0,.40]),
      piece:{position:dest,flip:from+PI},lean:.16});
  }
  function slideOff(dest) {
    const [x,y,z]=dest;
    // Keep the blade above the dish lip; the last short drop begins only
    // as the nose clears the cake and lets it settle into the well.
    const pass=y+(dest===SERVING_POINT ? .026 : 0);
    beat(.27,{tools:moveTool('paddle',[x,pass+.010,z]),piece:{position:[x,pass+.0225,z]},hands:handleEnd,lean:.17});
    // Draw out the tapered tip along the surface. The cake settles when its
    // weight transfers to the board, grate or dish, before the blade rises.
    beat(.19,{tools:moveTool('paddle',[x,pass+.013,z+.074],[-.16,0,0]),piece:{position:[x,pass+.027,z]},lean:.16});
    beat(.12,{tools:moveTool('paddle',[x,pass+.015,z+.155],[-.22,0,0]),piece:{position:[x,pass+.025,z]},lean:.15});
    beat(.12,{tools:moveTool('paddle',[x,pass+.019,z+.205],[-.24,0,0]),piece:{position:[x,pass,z]},lean:.14});
    beat(.15,{tools:moveTool('paddle',[x,pass+.078,z+.24],[-.23,0,0]),piece:{position:dest},lean:.13});
  }
  if(grilled) {
    phase('grill','炭火にのせ、返して両面を焼く');
    graspBesideCake();
    scoop(board);
    carryOnPaddle(grill,1.08,1.04);
    slideOff(grill);
    const [x,y,z]=grill;
    // The cake browns on the grate. Keep the blade just off the fire.
    beat(.81,{tools:moveTool('paddle',[x+.055,y+.16,z+.24],[-.12,.09,0]),piece:{toast:.45},lean:.09});
    scoop(grill);
    turnOnto(grill);sound('sizzle');
    beat(.85,{tools:moveTool('paddle',[x+.071,y+.15,z+.23],[-.12,.09,0]),piece:{toast:1},lean:.10});
    scoop(grill);
    if(boardFinish) {
      carryOnPaddle(board,.02,1.04);
      turnOnto(board);
      // Rest the paddle on the clear edge of the board while both hands
      // dress the cake. Its handle is already beside the next lift.
      beat(.24,{tools:{paddle:boardPaddle},lean:.13});
      beat(.19,{hands:[rest,rest],lean:.08});
    }
  }
  if(garnishNames.length){
    phase('garnish',garnishNames.join('と')+'をのせる');
    beat(.24,{hands:[rest,rest],focus:board});
    addFilling('top');
  }
  if(draft.technique==='wrap'){
    phase('wrap','笹の葉を折って餅を包む');
    beat(.34,{stance:stance(.02),hands:[[bx+.13,by+.043,bz+.035],[bx-.13,by+.045,bz-.012]],focus:[bx,by+.05,bz]});
    beat(.28,{hands:[[bx+.012,by+.099,bz],[bx-.11,by+.043,bz]],piece:{wrap:.52},lean:.19});
    beat(.32,{hands:[[bx+.01,by+.096,bz],[bx-.015,by+.10,bz]],piece:{wrap:1},lean:.18});
    beat(.24,{hands:[[bx+.13,by+.15,bz+.085],[bx-.10,by+.15,bz+.075]],lean:.13});
  }
  phase('plate','仕上げた餅を器に盛る');
  if(grilled) {
    if(boardFinish) {
      graspBesideCake();
      scoop(board);
    }
    carryOnPaddle(SERVING_POINT,-1.10,boardFinish?1.06:1.96);
    if(boardFinish) slideOff(SERVING_POINT);
    else turnOnto(SERVING_POINT);
  } else {
    carry(SERVING_POINT,-1.10,.53,.93);
  }
  sound('plate');
  phase('finish','盛り付けが整いました');
  if(grilled) {
    // Lay the tool beside the dish on the same shelf.
    const [x,,z]=SERVING_POINT;
    beat(.27,{tools:moveTool('paddle',[x,.872,z+.267],[0,PI/2,0]),lean:.13});
    beat(.21,{tools:moveTool('paddle',[x,.767,z+.267],[0,PI/2,0]),lean:.17});
  }
  beat(.62,{stance:stance(-.94,1.26,PI+.26),focus:[SERVING_POINT[0],SERVING_POINT[1]+.06,SERVING_POINT[2]],hands:[rest,rest],lean:.085,effort:0,food:{steam:.03}});
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
    // The wet linen settles inside the empty rice bowl. Its corners and the
    // hands holding them follow the same folds as the bottom comes to rest.
    const [cx,cy,cz]=tools.cloth.position,[qx,qy,qz]=tools.bowl.position;
    const overBowl=ease(clamp((.18-Math.hypot(cx-qx,cz-qz))/.10));
    const settle=qy<.80 ? overBowl*ease(clamp((qy+.18-cy)/.154)) : 0;
    tools.cloth.scale=[1-.38*settle,1-.43*settle,1-.38*settle];
    const piece=still(blend(a.piece.position,b.piece.position,f),blend(a.piece.rotation,b.piece.rotation,f));
    for(const key of ['size','shape','fill','toast','flip','wrap','top'])piece[key]=mix(a.piece[key],b.piece[key],f);
    piece.visible=piece.size>.001;
    function palm(target,i) {
      if(target?.tool)return at(tools[target.tool],target.offset);
      if(target?.piece)return at(piece,target.offset);
      if(target)return target;
      const side=i?1:-1,flight=walk?.085*Math.sin(2*PI*f*strides)*side:0;
      const dx=side*.75,dz=.54+flight;
      return [x+dx*Math.cos(heading)+dz*Math.sin(heading),footCentre+.70+bounce,z-dx*Math.sin(heading)+dz*Math.cos(heading)];
    }
    const restHands=[palm(rest,0),palm(rest,1)];
    const handWork=a.hands.map((v,i)=>mix(Number(v!==rest),Number(b.hands[i]!==rest),f));
    const hands=a.hands.map((v,i)=>blend(v?palm(v,i):restHands[i],b.hands[i]?palm(b.hands[i],i):restHands[i],f));
    const food={};
    for(const k of Object.keys(a.food))food[k]=(k==='prepIndex'||k==='pinchIndex')?b.food[k]:mix(a.food[k],b.food[k],f);
    const ch=s.chapter;
    return {time:t,phase:ch.id,label:ch.label,progress:(t-ch.start)/(ch.end-ch.start),hero:[x,footCentre+bounce,z],heading,
      focus:blend(a.focus,b.focus,f),lean:mix(a.lean,b.lean,f),lift:mix(a.lift,b.lift,f),effort:mix(a.effort,b.effort,f),
      feet,hands,restHands,handWork,tools,piece,food};
  }
  return {duration:end,chapters,cues,sample};
}
