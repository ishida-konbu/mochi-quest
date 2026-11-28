import { Euler, Matrix4, Quaternion, Vector3 } from './vendor/three.module.min.js';
import { CRAFT_OPTIONS } from './living-craft.js';
import { BENCH_YAW, benchLocal, benchPoint, COOKING_BENCH, COOKING_PIVOT, HAND_WATER, groundCookware, MARKET_GRILL_TOP, MARKET_GRILL_X, MARKET_GRILL_Z, LID_SEAT, STEAMER_HANDLE } from './living-layout.js';
import { restWorkGrip } from './working-grips.js';

// Each station is authored facing its own surface. The score returns metres
// in the kitchen frame so carried tools turn around the same planted feet.
// A hand locked to a tool follows its rotating grip throughout a stroke.
const PI = Math.PI;
const clamp = x => Math.max(0, Math.min(1, x));
const ease = x => x*x*(3-2*x);
const mix = (a,b,f) => a+(b-a)*f;
const blend = (a,b,f) => a.map((v,i)=>mix(v,b[i],f));
const angleTo = (a,b) => Math.atan2(Math.sin(b-a),Math.cos(b-a));
const still = (position,rotation=[0,0,0]) => ({position,rotation});
const grip = (tool,offset) => ({tool,offset});
const onPiece = ([x,y,z]) => ({piece:true,offset:[x+Math.sign(x)*.009,y+.012,z]});
const rest = null;
const offsetPoint=(p,x,y,z)=>[p[0]+x,p[1]+y,p[2]+z];
const rimGrips=(tool,x,y,z)=>[grip(tool,[x,y,z]),grip(tool,[-x,y,z])];
// The right pad closes over the middle of the narrow wooden strip and
// follows the same point on its round section until the lid is set down.
const lidSide=-.30;
const lidSupport=[lidSide,Math.sqrt(1-lidSide**2),0];
const lidHandle=grip('lid',[STEAMER_HANDLE.radius*lidSupport[0],
  STEAMER_HANDLE.height+STEAMER_HANDLE.radius*lidSupport[1],0]);
const bowlHands=rimGrips('bowl',.154,.110,.075);
const clothHands=rimGrips('cloth',.133,.216,.075);
// Opposite sides of the same shaft, one pad near the head and one near the butt.
const malletHands=[grip('mallet',[.020,-.013,.642]),grip('mallet',[-.020,-.013,.932])];
const malletMiddle=blend(malletHands[0].offset,malletHands[1].offset,.5);
const paddleGrip=grip('paddle',[0,.01,.18]);
const paddleEnd=grip('paddle',[0,.011,.228]);
// Fixed supports in the worktop frame, shared by every cook and recipe.
export const FORMING_POINT=[-.045,COOKING_BENCH.top+.038,.29];
export const SERVING_POINT=[-.57,COOKING_BENCH.top+.030,.30];
export const LID_REST=[-.505,-.19];
const grill=[MARKET_GRILL_X,MARKET_GRILL_TOP,MARKET_GRILL_Z];
// The blade rests on the board while the handle points along its right edge.
const boardPaddle=still(offsetPoint(FORMING_POINT,.181,.009,.016),[0,.73,0]);
const onBoard=([x,rise,z])=>[x,FORMING_POINT[1]+rise,z];
export function cookingDishPoint(index){
  return [-.115+.115*index,COOKING_BENCH.top,.068];
}
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
const signed=n=>Math.max(-1,Math.min(1,n));
function palmContact(target,side,tools,piece,food,effort,velocity){
  if(!target)return null;
  const name=target.tool,r=name?tools[name].rotation:piece.rotation;
  const contact=(normal,curl,pressure)=>({normal:rotateXYZ(normal,r),curl:rotateXYZ(curl,r),pressure});
  if(name==='mallet'){
    const load=Math.max(0,r[0]);
    return contact([0,1,0],[.16*load,0,signed(.88*r[0]-.67*food.compression)],
      .30+.25*load+.60*food.compression);
  }
  if(name==='bowl' || name==='cloth'){
    // Cups and cloth have weight under the pads. The wrists roll around
    // their opposite rims as the contents pour out.
    const cloth=name==='cloth',load=cloth?food.clothRice:food.bowlRice,tip=Math.sin(r[0]);
    return contact(cloth?[side*.82,.20,.54]:[side*.94,-.20,.28],
      [side*(.14+.25*(cloth?food.gather:tip)),-.24*load,-.49*tip],.28+.36*load+.13*Number(cloth)*food.gather);
  }
  if(name==='paddle'){
    const [dy,dz]=velocity(name);
    // Roll the grip at a turnover, dip the nose to scoop, ease the wrist
    // on the way out from under the cake. A motionless handle stays quiet.
    return contact([.46,.888,0],[.48*Math.sin(r[2]),0,signed(.66*Math.sin(r[0])-.35*dy+.22*dz)],
      .29+.25*effort+.13*food.paddleDough);
  }
  if(name==='lid'){
    const [dy,dz]=velocity(name);
    return {normal:rotateXYZ(lidSupport,r),curl:[0,0,.40*dy+.15*dz],
      pressure:.31+.13*Math.abs(dy),wristRoll:.10+.27*Math.sin(r[0])**2};
  }
  if(target.piece){
    const [x,y,z]=target.offset,length=Math.hypot(x,y*.72,z)||1;
    return contact([x/length,y*.72/length,z/length],[side*(.16+.18*effort),0,-.22*effort],.25+.39*effort);
  }
  // Bare pads spread on a work surface; a hand in transit carries very
  // little load. The opposite hand can keep holding the paddle or cake.
  return {normal:[0,1,0],curl:[side*.07,0,.11*effort],pressure:target[1]<.94?.31+.19*effort:.13};
}
function betweenContacts(a,b,f){
  if(!a || !b)return a??b;
  const normal=blend(a.normal,b.normal,f),length=Math.hypot(...normal);
  return {normal:length>.001?normal.map(n=>n/length):(f<.5?a.normal:b.normal),
    curl:blend(a.curl,b.curl,f),pressure:mix(a.pressure,b.pressure,f)};
}
function makeState(start,board,tools,focus) {
  const piece={...still(board),size:0,shape:0,fill:0,toast:0,flip:0,wrap:0,top:0};
  return {stance:start,hands:[rest,rest],focus,lean:0,lift:0,effort:0,twist:0,
    tools,piece,
    food:{bowlRice:1,steamerRice:0,clothRice:0,mortarRice:0,steam:0,doneness:0,smooth:0,compression:0,
      mixed:0,boardDough:0,paddleDough:0,prep:0,prepIndex:0,prepCarry:0,mixLoad:0,pinch:0,pinchIndex:-1,gather:0,stretch:0,pourRice:0,tipRice:0}};
}

// Each entry is a physical transition. Props stay precisely where they were
// put down; a later reach starts with the hand open and the tool stationary.
export function createCookingScore(draft,layout={},entry={}) {
  const ground = layout.floor || (()=>0);
  const stacked=entry.mode==='kagami';
  const size=entry.full?1.28:1;
  const native=[0,1].map(i=>restWorkGrip(entry.mode,i,size));
  const innerPads=[0,1].map(i=>restWorkGrip(entry.mode,i,size,0,'inside'));
  const board=FORMING_POINT,serving=SERVING_POINT;
  const cookware=layout.groundCookware??groundCookware();
  const px=COOKING_PIVOT[0]-(entry.full?.29:0);
  const pz=COOKING_PIVOT[1]+(entry.full?.23:stacked?.12:.15);
  const face=p=>Math.atan2(p[0]-px,p[2]-pz);
  const faceWithRight=p=>face(p)+Math.atan2(.31*size,Math.hypot(p[0]-px,p[2]-pz));
  // Feet arrive through the open end of the kitchen. All work that follows
  // uses this same patch of ground, including the largest cook.
  const benchEdge=COOKING_BENCH.front+.95*size;
  const matSolids=[[cookware.mortar,.365],[cookware.stove,.26],[cookware.bowlRest,.185]];
  const waistRadius=.89*size;
  function matFront(x){
    let front=.68;
    for(const [[cx,,cz],r] of matSolids){
      const reach=(r+waistRadius)**2-(x-cx)**2;
      if(reach>0)front=Math.max(front,cz+Math.sqrt(reach));
    }
    return front;
  }
  const onStove=(x,y,z)=>offsetPoint(cookware.stove,x,y,z);
  const inMortar=(x,y,z)=>offsetPoint(cookware.mortar,x,y,z);
  const LID=still(onStove(0,.416,0)),lidPark=still(onStove(LID_REST[0],LID_SEAT+.272,LID_REST[1]),[1.51,0,0]);
  const lidAbove=still(onStove(0,.59,0)),lidSlide=still(onStove(LID_REST[0]*.75,.78,LID_REST[1]*.75),[.36,0,0]);
  const lidTurn=still(onStove(LID_REST[0],.51,LID_REST[1]),lidPark.rotation);
  // Lay the linen diagonally so the right corner lifts clear of the parked lid.
  const CLOTH=still(onStove(0,.235,0),[0,-.70,0]),well=inMortar(0,.427,.01);
  const bowl=still(cookware.bowlRest),spentCloth=still(offsetPoint(bowl.position,0,.026,0));
  // Rest the blade on the far rim of the rice tub, clear of the mortar.
  const mortarPaddle=still(offsetPoint(bowl.position,.11,.009,-.10),[0,.72,0]);
  const malletRack=still(cookware.malletRack,[0,cookware.malletYaw,0]);
  const servingPaddle=still([serving[0]-.047,COOKING_BENCH.top+.014,serving[2]-.210],[0,PI/2,0]);
  // The tools and poses on each surface are authored facing that surface.
  // Map their marks to one kitchen frame where the cook can turn between them.
  const turnBench=new Matrix4().makeRotationY(BENCH_YAW);
  function benchPose(pose){
    const matrix=turnBench.clone().multiply(new Matrix4().makeRotationFromEuler(new Euler(...pose.rotation)));
    return {...pose,position:benchPoint(pose.position),rotation:new Euler().setFromRotationMatrix(matrix).toArray().slice(0,3)};
  }
  const worktops=[board,grill,serving].map(benchPoint);
  const restingPlaces={lid:[LID,lidPark],bowl:[bowl],cloth:[CLOTH,spentCloth],
    paddle:[mortarPaddle,benchPose(boardPaddle),benchPose(servingPaddle)],mallet:[malletRack]};
  const stoveMark=[px,pz,face(LID.position)+(entry.full?.44:.39)];
  const origin=entry.start || [px,0,pz];
  const start=[origin[0],origin[2],Number.isFinite(entry.heading)?entry.heading:stoveMark[2]];
  const [,,entryV]=benchLocal(origin);
  const startFocus=[start[0],ground(start[0],start[1])+.72*size,start[1]-.26*size];
  const chopsWithPaddle=f=>f.id!=='sakura' && f.id!=='herb';
  const prepNeedsPaddle=draft.seasoning!=='none' || draft.fillings.some(f=>chopsWithPaddle(f) || f.placement==='mixed');
  const firstPaddle=prepNeedsPaddle?boardPaddle:mortarPaddle;
  let state=makeState(start,board,{lid:LID,bowl,cloth:CLOTH,mallet:malletRack,paddle:firstPaddle},startFocus), end=0, chapter;
  state.paddleOnBench=prepNeedsPaddle;
  const steps=[], chapters=[], cues=[];
  function phase(id,label) {
    chapter={id,label,start:end,end};chapters.push(chapter);
  }
  function beat(seconds,change={},curve='soft') {
    const station='station' in change?change.station:state.station;
    const next={...state,...change,station,focusOnBench:change.focus?Boolean(station):state.focusOnBench,
      paddleOnBench:change.tools?.paddle?Boolean(station):state.paddleOnBench,food:{...state.food,...change.food},tools:{...state.tools,...change.tools},
      piece:change.piece ? {...state.piece,...change.piece} : state.piece};
    next.footMark=change.footMark;
    steps.push({start:end,duration:seconds,a:state,b:next,curve,chapter});
    end+=seconds;chapter.end=end;state=next;
  }
  function sound(name){cues.push({time:end,name});}
  const moveTool=(name,p,r=[0,0,0])=>({[name]:still(p,r)});
  const aisleZ=2.10;
  function openLid() {
    beat(.43,{hands:[lidHandle,rest],focus:LID.position,lean:.16});
    beat(.36,{tools:{lid:lidAbove},lean:.09});
    beat(.30,{tools:{lid:lidSlide}});
    beat(.34,{tools:{lid:lidTurn}});
    beat(.34,{tools:{lid:lidPark},lean:.18});
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
  phase('approach','筵のかまどへ向かう');
  // Face both the steamer and its lid stand from one patch of the mat.
  function walk(mark,focus){
    const [x,z]=mark;
    beat(.28,{stance:mark,footMark:mark,
      hands:[rest,rest],focus:focus??[x,ground(x,z)+.72*size,z-.26*size]});
  }
  if(start[1]<.65 && start[0]<cookware.stove[0]){
    const lane=cookware.malletRack[0]-1.7;
    walk([lane,Math.min(-1.4,start[1]),0]);
    walk([lane,aisleZ,Math.atan2(stoveMark[0]-lane,stoveMark[1]-aisleZ)]);
  }else if(entryV<COOKING_BENCH.front){
    // Visitors coming round the back of the bench use its open far end.
    const u=COOKING_BENCH.right+1.25*size;
    for(const v of [entryV,benchEdge]){
      const [x,,z]=benchPoint([u,0,v]);walk([x,z,0]);
    }
  }else if(layout.market){
    // From the street, pass the open end of the charcoal hearth before
    // turning inward. Its brickwork projects past the corner of the bench.
    const [gx,,gz]=worktops[1];
    if(start[1]>gz && start[0]>px+.10){
      const cornerZ=Math.min(start[1],gz+.76);
      walk([Math.min(px,gx-.285-waistRadius),cornerZ,0]);
    }
  }
  walk(stoveMark);

  phase('steam','水に浸しておいた'+(draft.base === 'brownRice' ? '玄もち米' : 'もち米')+'を蒸す');
  openLid();
  beat(.43,{hands:bowlHands,focus:bowl.position,lean:.15});
  beat(.45,{tools:moveTool('bowl',offsetPoint(bowl.position,.08,.15,.06)),lean:.09});
  // Lead with one lip over the steamer so the near side of the tipped
  // bowl stays beyond the belly, with both palms still on the clay ears.
  beat(.37,{tools:moveTool('bowl',onStove(-.17,.66,.10),[.30,-.09,-.05]),focus:LID.position});
  beat(.53,{tools:moveTool('bowl',onStove(-.17,.68,.09),[1.48,-.30,.07]),food:{bowlRice:.45,steamerRice:.55,pourRice:1}});
  sound('grain');
  beat(.36,{food:{bowlRice:0,steamerRice:1,pourRice:0}});
  beat(.35,{tools:moveTool('bowl',onStove(-.17,.71,.14)),lean:.09});
  beat(.38,{tools:moveTool('bowl',offsetPoint(bowl.position,.06,.17,.05))});
  beat(.42,{tools:{bowl},lean:.20});
  beat(.23,{hands:[rest,rest],lean:.09});
  beat(.32,{hands:[lidHandle,rest],focus:lidPark.position});
  beat(.34,{tools:{lid:lidTurn},lean:.09});
  beat(.30,{tools:{lid:lidSlide}});
  beat(.34,{tools:{lid:lidAbove}});
  beat(.38,{tools:{lid:LID},food:{steam:.18}});sound('lid');
  beat(.28,{hands:[rest,rest],lean:.06});

  phase('prep',fillingNames.length ? '米を蒸す間に、'+fillingNames.join('と')+'の下ごしらえをする' : '米を蒸す間に、手を水で湿らせる');
  const [bx,by,bz]=board;
  const brace=[bx-.216,by+.037,bz+.060];
  const prepHands=[onBoard([.11,.048,.34]),brace];
  // The cook steadies the board's back-left edge while the right mitt
  // takes a pinch. The two palms have separate lanes down to the cake.
  const dishBrace=dish=>[brace[0],by+.038,dish[2]+.080];
  const dishHands=dish=>[[dish[0]+.022,dish[1]+.074,dish[2]-.008],dishBrace(dish)];
  if(draft.fillings.length) {
    beat(.57,{station:'board',hands:prepHands,focus:board,food:{steam:.45}});
    for(const [i,f] of draft.fillings.entries()) {
      const pluck=!chopsWithPaddle(f);
      const prepEnd=i/draft.fillings.length;
      const dish=cookingDishPoint(i);
      beat(.29,{hands:dishHands(dish),food:{prepIndex:i,prep:prepEnd,prepCarry:0},lean:.16});
      beat(.32,{hands:[onBoard([.015,.044,.27]),brace],food:{prepCarry:1}});
      beat(.34,{hands:pluck?[onBoard([.12,.112,.27]),brace]:[paddleGrip,rest],lean:.13});
      const times=pluck?2:3;
      for(let n=0;n<times;n++) {
        const x=.03+.065*Math.sin(n*1.6+i),z=.252+.039*Math.cos(n*1.9);
        beat(.24,{hands:[pluck?onBoard([x,.188,z]):paddleGrip,brace],
          tools:pluck?{}:moveTool('paddle',onBoard([x+.04,.196,z]),[.20,.28,0]),lean:.085,food:{steam:.8}});
        beat(.21,{hands:[pluck?onBoard([x-.059,.051,z+.034]):paddleGrip,brace],
          tools:pluck?{}:moveTool('paddle',onBoard([x,.017,z]),[-.28,.25,.08]),lean:.17,effort:.27,
          food:{prep:(i+(n+1)/times)/draft.fillings.length}});
        if(!pluck)sound('chop');
      }
      // Set the paddle down. This same hand returns the prepared ingredient
      // while the other pad steadies the board.
      if(!pluck) {
        beat(.28,{hands:[paddleGrip,rest],tools:moveTool('paddle',onBoard([-.14,.189,.32])),lean:.10});
        beat(.30,{tools:{paddle:boardPaddle}});
      }
      beat(.22,{hands:[onBoard([.015,.044,.27]),brace],effort:0});
      beat(.34,{hands:dishHands(dish),food:{prepCarry:0}});
      beat(.22,{hands:[rest,rest]});
    }
  }else{
    // Touch the water one mitt at a time. The waiting hand stays above the
    // near side while the lowest point of the dipping pad takes the water.
    const dip=side=>offsetPoint(HAND_WATER,side*.055,.118,-.025);
    const drySide=side=>offsetPoint(HAND_WATER,side*.31,.205,.42);
    beat(.40,{station:'water',hands:[dip(1),drySide(-1)],focus:HAND_WATER,lean:.16,food:{steam:.5}});
    beat(.24,{hands:[drySide(1),drySide(-1)],lean:.10});
    beat(.40,{hands:[drySide(1),dip(-1)],lean:.16,food:{steam:.88,prep:1}});
    sound('water');beat(.38,{hands:[rest,rest]});
  }
  const mixed=mixedNames.length>0;
  if(prepNeedsPaddle){
    // The paddle goes back to the mat with the cook when it was used on
    // the board. Otherwise it is ready beside the mortar from the start.
    beat(.35,{station:'board',hands:[paddleGrip,brace],tools:{paddle:boardPaddle},focus:boardPaddle.position});
    if(mixed)beat(.36,{tools:moveTool('paddle',onBoard([-.025,.012,.13]),[-.12,.28,0]),food:{mixLoad:1}});
    beat(.36,{tools:moveTool('paddle',onBoard([.13,.222,.52])),hands:[paddleEnd,rest],lean:.08});
    beat(.42,{station:null,tools:moveTool('paddle',offsetPoint(mortarPaddle.position,0,.14,.15)),hands:[paddleEnd,rest],focus:well});
    beat(.32,{tools:{paddle:mortarPaddle}});
  }
  // Face the stove before reaching for the lid, with both hands free.
  beat(.36,{station:null,footMark:stoveMark,hands:[rest,rest],focus:LID.position,food:{steam:1,doneness:1},effort:0});

  phase('transfer','蒸した米を布ごと持ち上げ、臼に移す');
  openLid();
  beat(.46,{hands:clothHands,lean:.19,food:{gather:1}});
  beat(.43,{tools:moveTool('cloth',onStove(0,.67,.03),CLOTH.rotation),food:{steamerRice:0,clothRice:1,steam:.75},lean:.11});
  beat(.45,{tools:moveTool('cloth',onStove(-.12,.70,-.02))});
  beat(.88,{tools:moveTool('cloth',inMortar(.12,.555,.20)),focus:well});
  beat(.56,{tools:moveTool('cloth',inMortar(.03,.68,.10),[1.30,0,-.06]),lean:.16,food:{clothRice:.43,mortarRice:.57,tipRice:1}});
  beat(.35,{food:{clothRice:0,mortarRice:1,tipRice:0}});sound('grain');
  beat(.29,{tools:moveTool('cloth',inMortar(.05,.67,.16)),lean:.10});
  beat(.44,{tools:moveTool('cloth',offsetPoint(bowl.position,0,.19,.09)),focus:bowl.position,lean:.09});
  beat(.45,{tools:{cloth:spentCloth},lean:.18});
  beat(.28,{hands:[rest,rest],food:{steam:.32,gather:0},lean:.09});

  phase('pound',draft.technique==='half'?'両手で杵を軽く下ろし、米粒を残す':'両手で杵を振り上げ、臼の米をつく');
  // Aim the shaft across the front of the body. The squared striking face
  // points down, perpendicular to that shaft, at the bottom of the stroke.
  function shaftAngles(up,lead){
    const shaft=new Vector3(-Math.sqrt(1-up*up-lead*lead),up,lead);
    const face=new Vector3(0,-1,0).addScaledVector(shaft,up).normalize();
    const cross=new Vector3().crossVectors(shaft,face);
    return new Euler().setFromRotationMatrix(new Matrix4().makeBasis(face,cross,shaft)).toArray().slice(0,3);
  }
  const footHeight=ground(px,pz);
  const wristHeight=footHeight+(innerPads[0][1]+innerPads[1][1])*.5+.14*size;
  // Raising the butt lets a taller cook strike the same rice. Solve for
  // shaft elevation with the lower end face on the compressed portion.
  const firstSurface=cookware.mortar[1]+.337+.129*.70*.52;
  let lo=.105,hi=.83;
  for(let i=0;i<12;i++){
    const up=(lo+hi)*.5;
    if(firstSurface+.165*Math.sqrt(1-up*up)+malletMiddle[2]*up<wristHeight)lo=up;
    else hi=up;
  }
  // Draw the shaft towards the cook as well as across the body, leaving
  // room for the head to rise in front of the cheek.
  const shaftLead=.51;
  const impactAngle=shaftAngles((lo+hi)*.5,shaftLead);
  function impact(smooth){
    const riceTop=.337+.129*(.67+.33*smooth)*.52;
    const tip=rotateXYZ([.165,0,0],impactAngle);
    return still(inMortar(-tip[0],riceTop-tip[1],-tip[2]),impactAngle);
  }
  const centre=at(impact(0),malletMiddle);
  const poundMark=[px,pz,face(centre)];
  function liftMallet(height,tilt,draw){
    const grip=offsetPoint(centre,0,height,draw),angles=shaftAngles(-tilt,shaftLead);
    const v=rotateXYZ(malletMiddle,angles);
    return still(grip.map((n,i)=>n-v[i]),angles);
  }
  const aboveRack=still(offsetPoint(malletRack.position,0,.31,.04),malletRack.rotation);
  const rackMark=[px,pz,face(at(malletRack,malletMiddle))];
  beat(.42,{footMark:rackMark,hands:malletHands,focus:malletRack.position,lean:.11});
  beat(.40,{footMark:rackMark,tools:{mallet:aboveRack},lean:.08});
  beat(.63,{footMark:poundMark,tools:{mallet:liftMallet(.09,.08,.05)},focus:well,lean:.08});
  const strikes=draft.technique==='half'?3:5,finalSmooth=draft.technique==='half'?.57:1;
  for(let i=0;i<strikes;i++){
    const rise=.218+.010*Math.sin((i+1)*1.7);
    const raised=liftMallet(rise,.28,.09);
    beat(.44,{footMark:poundMark,tools:{mallet:raised},lean:.02,lift:.045,effort:.35,
      food:{compression:0,stretch:0}});
    beat(.15,{footMark:poundMark,tools:{mallet:liftMallet(rise+.015,.32,.10)}});
    beat(.29,{footMark:poundMark,tools:{mallet:impact(finalSmooth*(i+1)/strikes)},lean:.16,lift:-.025,effort:1,
      food:{compression:1,smooth:finalSmooth*(i+1)/strikes}},'strike');sound('pound');
    beat(.16,{footMark:poundMark,tools:{mallet:liftMallet(.043,.01,.023)},lean:.12,lift:0,effort:.42,
      food:{compression:.26,stretch:.64}});
    beat(.16,{footMark:poundMark,tools:{mallet:liftMallet(.075,.14,.06)},lean:.09,effort:.18,
      food:{compression:0,stretch:0}});
  }
  beat(.49,{footMark:rackMark,tools:{mallet:still(offsetPoint(aboveRack.position,0,.15,0),malletRack.rotation)},focus:malletRack.position});
  beat(.40,{footMark:rackMark,tools:{mallet:aboveRack},lean:.09,focus:malletRack.position});
  beat(.35,{footMark:rackMark,tools:{mallet:malletRack},lean:.15});
  beat(.28,{hands:[rest,rest],lean:.075,effort:0});

  phase('knead',mixedNames.length?'餅を折り返し、'+mixedNames.join('と')+'を練り込む':'餅を折り返して生地を整える');
  const mortarRim=inMortar(-.334,.547,.029);
  beat(.43,{hands:[paddleGrip,rest],focus:mortarPaddle.position,lean:.15});
  beat(.37,{tools:moveTool('paddle',offsetPoint(mortarPaddle.position,0,.14,.08)),lean:.09});
  if(mixed){
    beat(.38,{tools:moveTool('paddle',inMortar(.08,.68,.16)),hands:[paddleGrip,mortarRim],focus:well});
    beat(.36,{tools:moveTool('paddle',inMortar(.03,.536,.022),[-.26,.09,.71]),food:{mixed:.27,mixLoad:0}});
  }
  beat(.57,{tools:moveTool('paddle',inMortar(.03,.625,.13),[-.64,.11,0]),focus:well,hands:[paddleGrip,mortarRim],lean:.13});
  for(let n=0;n<3;n++){
    beat(.28,{tools:moveTool('paddle',inMortar(-.05,.417,.06),[-.82,.27,-.13]),lean:.22,effort:.56,food:{compression:.60}});
    beat(.32,{tools:moveTool('paddle',inMortar(.075,.56,.12),[-.68,-.20,.20]),lean:.13,effort:.16,
      food:{compression:0,mixed:mixed?(n+1)/3:0}});sound('knead');
  }
  beat(.29,{tools:moveTool('paddle',inMortar(.02,.43,.034),[-.70,0,0]),hands:[paddleGrip,mortarRim]});
  beat(.46,{tools:moveTool('paddle',inMortar(.10,.65,.15),[-.23,0,0]),hands:[paddleGrip,rest],food:{paddleDough:1,mortarRice:0}});
  // Clear the thick wooden rim before lowering the loaded paddle to the board.
  beat(.36,{station:'board',tools:moveTool('paddle',onBoard([-.035,.232,.30]),[-.10,0,0]),hands:[paddleGrip,rest],focus:board});
  beat(.31,{tools:moveTool('paddle',onBoard([-.02,.035,.25]),[-.12,0,-.18]),hands:[paddleGrip,rest],food:{paddleDough:0,boardDough:1}});
  beat(.26,{tools:moveTool('paddle',onBoard([.14,.138,.32])),hands:[paddleGrip,rest]});
  beat(.32,{tools:{paddle:boardPaddle}});beat(.22,{hands:[rest,rest],lean:.07,effort:0});

  // Follow one cake from the forming board to the dish for every batch size.
  // Cup the cake between both pads, gathering the left and right edges in turn.
  phase('shape',insideNames.length ? '生地を広げ、'+insideNames.join('と')+'を包む' : '生地を手に取り、形を整える');
  function addFilling(placement) {
    const ingredients=draft.fillings.map((f,index)=>({f,index})).filter(item=>item.f.placement===placement);
    for(const [n,{index}] of ingredients.entries()){
      const dish=cookingDishPoint(index);
      beat(.28,{hands:dishHands(dish),food:{pinchIndex:index,pinch:1},effort:.14});
      beat(.22,{hands:[[dish[0]+.022,dish[1]+.13,dish[2]+.10],dishBrace(dish)]});
      beat(.30,{hands:[onPiece([.026,.078,0]),brace]});
      beat(.18,{food:{pinch:0},piece:{[placement==='inside'?'fill':'top']:(n+1)/ingredients.length}});
    }
  }
  beat(.25,{hands:[[bx+.09,by+.10,bz+.028],brace],focus:board,lean:.16});
  beat(.38,{piece:{size:1},hands:[onPiece([.071,.038,.014]),onPiece([-.086,.024,.029])],
    food:{boardDough:0},effort:.34});
  addFilling('inside');
  beat(.34,{piece:{position:[bx,by+.032,bz],shape:.55},hands:[onPiece([.080,.021,.013]),onPiece([-.066,.049,-.013])],lean:.195});
  beat(.36,{piece:{position:board,shape:1},hands:[onPiece([.070,.038,-.005]),onPiece([-.082,.026,.032])],lean:.13,effort:.08});
  beat(.19,{hands:stacked?[rest,rest]:[[bx+.11,by+.13,bz+.06],rest]});

  function carry(dest,seconds) {
    const p=state.piece.position;
    const hands=[onPiece([.072,.033,.015]),onPiece([-.072,.033,.015])];
    beat(.24,{hands,lean:.17,focus:p});
    const high=Math.max(native[0][1]+.035,p[1]+.085,dest[1]+.085);
    beat(.27,{piece:{position:[p[0],high,p[2]+.06]},lean:.09});
    beat(seconds,{station:'serving',piece:{position:[dest[0],high,dest[2]+.08]},focus:dest,lean:.105});
    beat(.27,{piece:{position:dest},lean:.17});
    beat(.18,{hands:[[dest[0]+.12,dest[1]+.16,dest[2]+.08],rest]});
  }
  const paddleHands=[paddleGrip,rest];
  // A long grip keeps the cook's rounded knuckles outside the hot grate.
  const handleEnd=[paddleEnd,rest];
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
  function carryOnPaddle(dest,seconds) {
    const [x,y,z]=state.tools.paddle.position;
    // Carry over the open strip at the front of the worktop.
    // Keep the distance from cake to blade constant throughout the turn.
    const loaded=p=>({tools:moveTool('paddle',p),piece:{position:[p[0],p[1]+.0125,p[2]]}});
    const height=Math.max(native[0][1]+.055,y+.095,dest[1]+.105);
    beat(.34,{...loaded([x,height,z+.10]),hands:paddleHands,lean:.085});
    beat(seconds,{station:dest===grill?'grill':dest===serving?'serving':'board',...loaded([dest[0],height,dest[2]+.09]),focus:dest,lean:.10});
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
    const pass=y+(dest===serving ? .026 : 0);
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
    carryOnPaddle(grill,1.04);
    slideOff(grill);
    const [x,y,z]=grill;
    // The cake browns on the grate. Keep the blade just off the fire.
    beat(.81,{tools:moveTool('paddle',[x+.055,y+.16,z+.24],[-.12,.09,0]),piece:{toast:.45},lean:.09});
    scoop(grill);
    turnOnto(grill);sound('sizzle');
    beat(.85,{tools:moveTool('paddle',[x+.071,y+.15,z+.23],[-.12,.09,0]),piece:{toast:1},lean:.10});
    scoop(grill);
    if(boardFinish) {
      carryOnPaddle(board,1.04);
      turnOnto(board);
      // Rest the paddle beside the board to free the working hand for garnish.
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
    beat(.34,{hands:[[bx+.13,by+.043,bz+.035],[bx-.13,by+.043,bz+.035]],focus:[bx,by+.05,bz]});
    beat(.28,{hands:[[bx+.157,by+.044,bz+.02],[bx-.065,by+.088,bz+.008]],piece:{wrap:.52},lean:.19});
    beat(.32,{hands:[[bx+.064,by+.096,bz],[bx-.154,by+.055,bz+.01]],piece:{wrap:1},lean:.18});
    beat(.24,{hands:[[bx+.13,by+.15,bz+.085],rest],lean:.13});
  }
  phase('plate','仕上げた餅を器に盛る');
  if(grilled) {
    if(boardFinish) {
      graspBesideCake();
      scoop(board);
    }
    carryOnPaddle(serving,boardFinish?1.06:1.96);
    if(boardFinish) slideOff(serving);
    else turnOnto(serving);
  } else {
    carry(serving,.93);
  }
  sound('plate');
  phase('finish','盛り付けが整いました');
  if(grilled) {
    // Rest the blade on the tabletop behind the dish.
    const [x,y,z]=serving;
    beat(.27,{tools:moveTool('paddle',[x-.047,y+.088,z-.210],[0,PI/2,0]),hands:[paddleGrip,[x-.27,COOKING_BENCH.top+.012,z+.14]],lean:.13});
    beat(.21,{tools:{paddle:servingPaddle},lean:.17});
  }
  beat(.62,{focus:[serving[0],serving[1]+.06,serving[2]],hands:[rest,rest],lean:.085,effort:0,food:{steam:.03}});
  beat(.94,{lean:.025});
  // Resolve all contacts in the kitchen frame before aiming the shoulders.
  // Grip offsets remain in tool space so the palms stay on the same wood.
  const poseCache=new Map();
  function onBench(pose){
    if(!poseCache.has(pose))poseCache.set(pose,benchPose(pose));
    return poseCache.get(pose);
  }
  for(const key of [steps[0].a,...steps.map(step=>step.b)]){
    if(key.station)key.hands=key.hands.map(p=>Array.isArray(p)?benchPoint(p):p);
    if(key.focusOnBench)key.focus=benchPoint(key.focus);
    key.piece=onBench(key.piece);
    if(key.paddleOnBench)key.tools={...key.tools,paddle:onBench(key.tools.paddle)};
  }
  const benchHeadings={board:PI+BENCH_YAW,grill:face(worktops[1]),serving:face(worktops[2]),water:face(benchPoint(HAND_WATER))};
  for(const step of steps){
    const key=step.b,requested=key.hands[0],phase=step.chapter.id;
    const contact=target=>target?.tool?at(key.tools[target.tool],target.offset):
      target?.piece?at(key.piece,target.offset):target;
    const atHand=contact(requested),left=contact(key.hands[1]);
    const atBench=Boolean(key.station);
    const forming=['shape','wrap','garnish'].includes(phase);
    key.benchWork=Number(atBench);
    // The inside pads cup the cake and turn the paddle at the worktop.
    // A lid or flat board touches the underside of the rounded mitt. The
    // lower inside edge cups the cake, cloth or vessel without burying the
    // rest of the hand in the work surface. Wrap the shaft from its sides.
    function palmFace(target){
      if(target===lidHandle || key.station==='water' && Array.isArray(target))return 'tangent';
      if((forming || phase==='prep' || phase==='plate') && Array.isArray(target) && atBench)return 'underside';
      if(target?.tool==='mallet' || target?.tool==='bowl')return 'inside';
      if(target?.piece || target?.tool==='cloth' || target?.tool==='lid')return 'underside';
      return 'bottom';
    }
    step.faces=key.hands.map((target,i)=>(target??step.a.hands[i])?palmFace(target??step.a.hands[i]):undefined);
    if(phase==='approach')continue;
    let yaw=step.a.stance[2];
    if(key.footMark)yaw=key.footMark[2];
    else if(atBench)yaw=benchHeadings[key.station];
    else if(requested===lidHandle)yaw=stoveMark[2];
    else if(requested?.tool==='cloth' || requested?.tool==='bowl')yaw=face(blend(atHand,left,.5));
    else if(requested?.tool==='paddle')yaw=left?face(well):faceWithRight(atHand);
    key.stance=[px,pz,yaw];
    if(atHand){
      const c=Math.cos(yaw),s=Math.sin(yaw);
      const socketTurn=(p,i)=>{
        const dx=p[0]-px,dz=p[2]-pz,sign=i?1:-1;
        const localX=dx*c-dz*s,localZ=dx*s+dz*c;
        if(phase==='pound' || requested.tool==='cloth' || key.benchWork || !left){
          // The body supplies fore/aft reach. Aim the socket from its
          // lateral position on the target regardless of that extension.
          let near=0,far=.95;
          for(let j=0;j<9;j++){
            const turn=(near+far)*.5;
            if(sign*restWorkGrip(entry.mode,i,size,turn,step.faces[i])[0]>sign*localX)near=turn;
            else far=turn;
          }
          return (near+far)*.5;
        }
        const pad=restWorkGrip(entry.mode,i,size,0,step.faces[i]);
        return Math.max(0,Math.min(.95,Math.atan2(sign*pad[0],pad[2])-Math.atan2(sign*localX,localZ)));
      };
      key.socketAngle=socketTurn(atHand,0);
      if(left)key.braceAngle=socketTurn(left,1);
    }
  }
  // Allow enough time to turn with a load, or face a new surface before a
  // free hand descends to it. Chapter boundaries and sound stay on the beat.
  const timing=new Map([[0,0]]);let elapsed=0;
  for(const step of steps){
    const oldEnd=step.start+step.duration;
    // Cross the bench corner along the shortest rotation of the blade.
    // Interpolating XYZ angles in the kitchen frame can flip it at 90°.
    if((step.a.paddleOnBench || step.b.paddleOnBench) && step.a.tools.paddle!==step.b.tools.paddle){
      step.paddleArc=[step.a,step.b].map(key=>new Quaternion().setFromEuler(new Euler(...key.tools.paddle.rotation)));
    }
    const a=step.a.stance,b=step.b.stance;
    const travel=Math.hypot(b[0]-a[0],b[1]-a[1]),turn=Math.abs(angleTo(a[2],b[2]));
    // Only begin working once both feet have arrived. A lifted load stays
    // in front of the turning shoulders during the whole trip.
    const from=step.a.hands[0],to=step.b.hands[0];
    const carried=from?.tool && from.tool===to?.tool?from.tool:from?.piece && to?.piece?'piece':null;
    const crossing=travel>.008 && (!from || !to || carried && carried!=='lid');
    if(crossing){
      // A shallow arc follows the open edge of the workshop. The cook can
      // pass the rice tub and table corner without steering its face away
      // from its footsteps. A short change of workstation needs less room.
      const dx=b[0]-a[0],dz=b[1]-a[1];
      let detour=0;
      if(a[1]>=.65 && b[1]>=.65 && Math.abs(dx)>.30){
        // A visitor can already stand inside the preferred clearance of the
        // rice tub. Open that clearance gradually from the actual start.
        const startInset=Math.max(0,matFront(a[0])-a[1]);
        const endInset=Math.max(0,matFront(b[0])-b[1]);
        for(let i=1;i<32;i++){
          const q=i/32,x=mix(a[0],b[0],q),arc=4*q*(1-q);
          const front=matFront(x)-mix(startInset,endInset,q);
          const margin=Math.min(.28*size,Math.abs(dx)*.15)*arc;
          detour=Math.max(detour,(front+margin-mix(a[1],b[1],q))/arc);
        }
      }
      const direction=q=>Math.atan2(dx,dz+4*(1-2*q)*detour);
      const depart=Math.abs(angleTo(a[2],direction(0)))/3.35;
      const arrive=Math.abs(angleTo(direction(1),b[2]))/3.35;
      const pickup=!from && to ? .32 : 0,release=from && !to ? .28 : 0;
      const stride=Math.max(.32,travel/1.45);
      step.trip={direction,detour,depart,arrive,stride,pickup,release,carried};
      step.duration=release+depart+stride+arrive+pickup;
    }else if(turn>.09){
      if(carried){
        step.carried=carried;
        step.duration=Math.max(step.duration,turn/1.95);
      }else if(!from && to || from && !to){
        step.turnTime=turn/2.40;
        step.turnFirst=!from;
        step.duration+=step.turnTime;
      }else step.duration=Math.max(step.duration,turn/2.2);
    }
    step.start=elapsed;
    elapsed+=step.duration;timing.set(oldEnd,elapsed);
  }
  for(const ch of chapters){ch.start=timing.get(ch.start);ch.end=timing.get(ch.end);}
  for(const cue of cues)cue.time=timing.get(cue.time);
  end=elapsed;
  function sample(seconds) {
    const t=Math.max(0,Math.min(end,seconds));
    // Players may replay or skip. A sampled pose never accumulates state.
    let lo=0,hi=steps.length-1;
    while(lo<hi){const mid=(lo+hi)>>1;if(steps[mid].start+steps[mid].duration<=t)lo=mid+1;else hi=mid;}
    const s=steps[lo],{a,b}=s,u=clamp((t-s.start)/s.duration),f=s.curve==='strike'?u*u:ease(u);
    // Walk around the curved wall and rice tub between two safe stations.
    // A straight chord can pass through the vessels, especially for a
    // full-sized lower kagami tier. Feet follow the same path as the hips.
    function pathZ(q,x){
      const z=mix(a.stance[1],b.stance[1],q);
      if(s.trip)return z+4*q*(1-q)*s.trip.detour;
      return z;
    }
    const trip=s.trip,dt=u*s.duration;
    let pace=f,work=f,grasp=f,yawA=a.stance[2],yawB=b.stance[2],start=0,finish=1;
    if(trip){
      const {direction,depart,arrive,stride,release,pickup}=trip;
      const walking=dt-release-depart,landing=walking-stride;
      work=ease(clamp(walking/stride));
      grasp=pickup?ease(clamp((landing-arrive)/pickup)):release?ease(clamp(dt/release)):work;
      // Each pivot has its own little steps. In the travelling segment the
      // planted sole stays in the world while its partner overtakes it.
      if(walking<0){
        pace=depart?ease(clamp((dt-release)/depart)):0;
        start=finish=0;yawB=direction(0);
      }else if(landing<0){
        pace=work;yawA=direction(0);yawB=direction(1);
      }else{
        pace=arrive?ease(clamp(landing/arrive)):1;
        start=finish=1;yawA=direction(1);
      }
    }
    if(s.turnTime){
      const reachTime=s.duration-s.turnTime;
      pace=ease(clamp((dt-(s.turnFirst?0:reachTime))/s.turnTime));
      grasp=ease(clamp((dt-(s.turnFirst?s.turnTime:0))/reachTime));
    }
    function place(q){
      const distance=mix(start,finish,q),x=mix(a.stance[0],b.stance[0],distance);
      return [x,pathZ(distance,x),trip && finish>start?trip.direction(q):unwrap(yawA,yawB,q)];
    }
    const [x,z,heading]=place(pace);
    const span=(finish-start)*Math.hypot(a.stance[0]-b.stance[0],a.stance[1]-b.stance[1]);
    const turn=Math.abs(angleTo(yawA,yawB));
    const strides=Math.max(1,Math.ceil((span+.56*size*turn)/.42)),walk=span+.25*turn>.025;
    let bounce=0,footCentre=0;
    function footprint(q,side){
      const [cx,cz,yaw]=place(q);
      const tx=cx+Math.cos(yaw)*side*.30*size+Math.sin(yaw)*.06*size;
      const tz=cz-Math.sin(yaw)*side*.30*size+Math.cos(yaw)*.06*size;
      return [tx,ground(tx,tz),tz];
    }
    const feet=[-1,1].map((side,i)=>{
      const cycle=Math.min(strides-1,Math.floor(pace*strides));
      const frac=clamp((pace*strides-cycle)*2-i),travel=(cycle+ease(frac))/strides;
      const lift=walk?Math.min(.083,.021+(span+.18*turn)/strides*.105)*Math.sin(PI*frac):0;
      const foot=footprint(travel,side);
      footCentre+=foot[1]*.5;
      bounce+=lift*.22;
      foot[1]+=lift;
      return foot;
    });
    // On the edge of the mat the trailing sole can still be on the lower
    // soil. Keep the body above the surface under its standing centre.
    footCentre=Math.max(footCentre,ground(x,z));
    const tools={};
    for(const name of Object.keys(a.tools)){
      const first=a.tools[name],last=b.tools[name];
      let turn;
      if(name==='paddle' && s.paddleArc){
        const [from,to]=s.paddleArc;
        turn=new Euler().setFromQuaternion(new Quaternion().slerpQuaternions(from,to,work)).toArray().slice(0,3);
      }else turn=blend(first.rotation,last.rotation,work);
      tools[name]=still(blend(first.position,last.position,work),turn);
    }
    if(s.curve==='strike'){
      // A swinging head describes an arc about the travelling palm. Working
      // from that grip keeps the last part of the arc inside the mortar rim.
      const palm=blend(at(a.tools.mallet,malletMiddle),at(b.tools.mallet,malletMiddle),f);
      const gripOffset=rotateXYZ(malletMiddle,tools.mallet.rotation);
      tools.mallet.position=palm.map((n,i)=>n-gripOffset[i]);
    }
    const piece=still(blend(a.piece.position,b.piece.position,work),blend(a.piece.rotation,b.piece.rotation,work));
    let focus=blend(a.focus,b.focus,work);
    if(s.carried){
      // Interpolate the load in the frame of the turning cook. This keeps
      // it out in front throughout a turn from one rim to the next.
      function carryAround(object,first,last){
        function relative(pose,stance){
          const dx=pose.position[0]-stance[0],dz=pose.position[2]-stance[1];
          const c=Math.cos(stance[2]),sn=Math.sin(stance[2]);
          return [dx*c-dz*sn,dx*sn+dz*c];
        }
        const [side,lead]=blend(relative(first,a.stance),relative(last,b.stance),work);
        const c=Math.cos(heading),sn=Math.sin(heading);
        const lift=.12*Math.sin(PI*work)*Math.min(turn,1);
        object.position=[x+c*side+sn*lead,object.position[1]+lift,z-sn*side+c*lead];
      }
      const name=s.carried,cargo=name==='piece'?piece:tools[name];
      carryAround(cargo,name==='piece'?a.piece:a.tools[name],name==='piece'?b.piece:b.tools[name]);
      if(name==='paddle' && a.piece.size && b.piece.size && a.piece.position!==b.piece.position)carryAround(piece,a.piece,b.piece);
      const subject=name==='mallet'?at(cargo,malletMiddle):cargo.position;
      focus=blend(focus,subject,Math.sin(PI*work));
    }
    // The wet linen settles inside the empty rice bowl. Its corners and the
    // hands holding them follow the same folds as the bottom comes to rest.
    const [cx,cy,cz]=tools.cloth.position,[qx,qy,qz]=tools.bowl.position;
    const overBowl=ease(clamp((.18-Math.hypot(cx-qx,cz-qz))/.10));
    const settle=overBowl*ease(clamp((qy+.18-cy)/.154));
    tools.cloth.scale=[1-.38*settle,1-.43*settle,1-.38*settle];
    for(const key of ['size','shape','fill','toast','flip','wrap','top'])piece[key]=mix(a.piece[key],b.piece[key],f);
    piece.visible=piece.size>.001;
    function palm(target,i) {
      if(target?.tool)return at(tools[target.tool],target.offset);
      if(target?.piece)return at(piece,target.offset);
      if(target)return target;
      const side=i?1:-1;
      const flight=walk?Math.min(.085,span*.25+.016*turn)*Math.sin(2*PI*pace*strides)*side:0;
      const [dx,,forward]=native[i],dz=forward+flight;
      return [x+dx*Math.cos(heading)+dz*Math.sin(heading),footCentre+native[i][1]+bounce,z-dx*Math.sin(heading)+dz*Math.cos(heading)];
    }
    const restHands=[palm(rest,0),palm(rest,1)];
    const handWork=a.hands.map((v,i)=>mix(Number(v!==rest),Number(b.hands[i]!==rest),grasp));
    const hands=a.hands.map((from,i)=>{
      const to=b.hands[i],start=from?palm(from,i):restHands[i],end=to?palm(to,i):restHands[i];
      const hand=blend(start,end,grasp);
      // Lift a free hand before crossing a board edge or a vessel rim.
      // A hand already on the utensil follows that utensil's own path.
      if(from!==to && !(from?.tool && from.tool===to?.tool) && !(from?.piece && to?.piece)){
        const distance=Math.hypot(end[0]-start[0],end[2]-start[2]);
        const lift=4*grasp*(1-grasp);
        hand[1]+=Math.min(.14,.37*distance)*lift;
        // Approach the bowl's ears from the near side before closing around
        // them. The far mitt would cut across the rolled lip during this turn.
        if(from?.tool==='bowl' || to?.tool==='bowl')hand[2]+=.08*lift;
      }
      return hand;
    });
    const food={};
    for(const k of Object.keys(a.food))food[k]=(k==='prepIndex'||k==='pinchIndex')?b.food[k]:mix(a.food[k],b.food[k],f);
    const ch=s.chapter;
    const effort=mix(a.effort,b.effort,f);
    const velocity=name=>{
      const from=a.tools[name].position,to=b.tools[name].position;
      const speed=(s.curve==='strike'?2*u:6*u*(1-u))/s.duration;
      return [signed((to[1]-from[1])*speed),signed((to[2]-from[2])*speed)];
    };
    const palms=a.hands.map((from,i)=>{
      if(!handWork[i])return null;
      const to=b.hands[i],pose=hold=>palmContact(hold,i?-1:1,tools,piece,food,effort,velocity);
      return from===to?pose(from):betweenContacts(pose(from),pose(to),grasp);
    });
    const held=name=>mix(Number(a.hands[0]?.tool===name),Number(b.hands[0]?.tool===name),grasp);
    const heft=held('bowl')*food.bowlRice+held('cloth')*food.clothRice,mallet=held('mallet');
    const wind=mallet*Math.max(0,tools.mallet.rotation[0]),strike=mallet*food.compression;
    const weightShift=[-.060*wind+.026*strike,.047*strike-.028*wind+.025*heft];
    return {time:t,sampleAt:sample,phase:ch.id,label:ch.label,progress:(t-ch.start)/(ch.end-ch.start),hero:[x,footCentre+bounce,z],heading,poundHeading:poundMark[2],
      benchWork:mix(a.benchWork??0,b.benchWork??0,f),
      bodyHeight:(entry.mode==='kagami'?1.36:1.68)*size,bodyRadius:.86*size,
      focus,lean:mix(a.lean,b.lean,f),lift:mix(a.lift,b.lift,f),effort,twist:mix(a.twist,b.twist,f),
      feet,hands,restHands,handWork,palms,weightShift,gripFace:s.faces,
      socketTurn:[mix(a.socketAngle??0,b.socketAngle??0,grasp)*handWork[0],
        mix(a.braceAngle??0,b.braceAngle??0,grasp)*handWork[1]],
      contact:[a.hands[0],b.hands[0],grasp],supportContact:[a.hands[1],b.hands[1]],worktops,restingPlaces,tools,piece,food};
  }
  return {duration:end,chapters,cues,sample,cookware};
}
