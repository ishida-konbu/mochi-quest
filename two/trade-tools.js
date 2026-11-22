// Coordinates are relative to the gripping paw. These single-batch props
// follow the wrists when a musician plays or a gardener sweeps.
const cane='#a7875c', binding='#665442', reed='#c9b17b', ink='#514940';
function fan(b) {
  b.rod([0,-.04,0],[0,.13,0],.014,binding);
  const rim=[];
  for(let i=0;i<=12;i++){
    const a=(i/12-.5)*2.12, x=Math.sin(a)*.31, y=Math.cos(a)*.31+.05;
    const z=i%2 ? .01 : -.012;
    rim.push([x,y,z]);
    b.rod([0,.055,0],[x,y,z],.007,reed);
    if(i===0) continue;
    const prev=rim[i-1], shade=i%2?'#b96552':'#d78668';
    // Overlapping tapered paper leaves retain the pleated edge.
    const mid=[(x+prev[0])*.5,(y+prev[1])*.5,z];
    const angle=Math.atan2(-mid[0],mid[1]-.05);
    b.box(mid[0]*.67,.05+(mid[1]-.05)*.67,z, .048,.205,.013,shade,[0,0,angle]);
    b.rod(prev,[x,y,z],.009,'#efe0b7');
  }
}
function lantern(b) {
  b.stroke([[0,.02,0],[.04,-.01,0],[.11,-.11,0],[.13,-.15,0]],.012,binding);
  b.ball(.13,-.29,0,.147,.174,.133,'#eac581');
  for(let i=-3;i<=3;i++){
    const y=i*.041, f=Math.sqrt(1-(y/.18)**2);
    b.loop(.13,-.29+y,0,.147*f,.135*f,.039,'#a56b4e');
  }
  for(const s of [-1,1]) b.rod([.13,-.29+s*.159,0],[.13,-.29+s*.183,0],.073,binding);
  b.rod([.13,-.467,0],[.137,-.54,0],.01,'#994d46');
}
function scribe(b) {
  b.rod([-.016,-.055,0],[.048,.28,0],.014,cane);
  b.rod([-.016,-.055,0],[-.027,-.135,0],.023,ink,.002);
}
function letter(b) {
  b.box(0,.06,0,.255,.239,.012,'#eaddb9',[-.38,0,0]);
  for(const s of [-1,1]) b.rod([s*.139,-.055,.043],[s*.139,.18,-.046],.024,cane);
  for(let i=0;i<4;i++) for(let j=0;j<3;j++) {
    const y=.117-.023*j;
    b.box(.061-.045*i,y,-.38*(y-.06)+.012,.009,.014,.003,ink,[0,0,(i-j)*.18]);
  }
}
function tea(b) {
  b.rod([0,.008,0],[0,.036,0],.212,'#975b40');
  for(const [x,z] of [[-.105,.04],[.07,.07]]) {
    b.rod([x,.034,z],[x,.108,z],.039,'#d0c2a5',.052);
    b.rod([x,.108,z],[x,.111,z],.045,'#878a54');
  }
  b.ball(.013,.111,-.068,.07,.07,.062,'#73847b');
  b.rod([.013,.167,-.068],[.013,.187,-.068],.044,'#65796e');
  b.rod([-.034,.122,-.074],[-.091,.146,-.062],.023,'#687a71',.015);
  b.stroke([[.062,.138,-.068],[.101,.154,-.068],[.102,.096,-.068],[.06,.092,-.065]],.009,'#596a65');
}
function fieldTool(b,broom) {
  b.rod([-.1,-.51,.11],[.092,.48,-.074],.016,cane);
  if(broom) {
    for(let i=0;i<17;i++) {
      const dx=(i-8)*.016;
      b.rod([-.102+dx*.18,-.47,.098],[-.144+dx,-.751+Math.cos(i*2)*.014,.153+Math.sin(i)*.029],.012,i%3?reed:cane,.007);
    }
    b.rod([-.144,-.511,.115],[-.074,-.516,.119],.015,binding);
  } else {
    b.rod([-.27,-.516,.116],[.06,-.516,.116],.021,binding);
    for(let i=0;i<7;i++) b.rod([-.254+i*.049,-.516,.116],[-.255+i*.049,-.603,.169],.013,reed,.007);
  }
}
function fisher(b) {
  b.stroke([[-.05,-.17,0],[0,0,0],[.19,.72,-.04],[.38,1.10,-.012],[.52,1.19,.05]],.012,cane,12);
  b.stroke([[.52,1.19,.05],[.558,.53,.09],[.56,-.21,.101]],.003,'#806f59',6,3);
  b.ball(.56,-.24,.101,.018,.047,.019,'#b36346');
}
function basket(b) {
  b.rod([0,-.23,0],[0,-.067,0],.106,cane,.14);
  for(let i=0;i<5;i++) b.loop(0,-.218+i*.031,0,.11+.006*i,.11+.006*i,.042,binding);
  b.stroke([[-.116,-.073,0],[-.103,.007,0],[0,.048,0],[.107,.013,0],[.122,-.073,0]],.012,reed);
}
function flute(b) {
  b.rod([-.59,.21,.064],[.14,-.045,-.012],.018,reed);
  for(let i=0;i<5;i++) b.ball(-.37+i*.077,.151-i*.027,.052-i*.008,.01,.005,.009,ink);
  b.rod([.115,-.036,-.01],[.147,-.047,-.013],.019,binding);
}
function littleDrum(b) {
  for(const s of [-1,1]){
    const z=s*.1;
    b.rod([0,.017,z-.013],[0,.017,z+.013],.134,'#d4bf95');
  }
  b.rod([0,.017,-.096],[0,.017,.096],.121,'#925645');
  for(let i=0;i<10;i++){
    const a=i*Math.PI/5,c=(i+.5)*Math.PI/5;
    b.rod([Math.cos(a)*.13,.017+Math.sin(a)*.13,-.09],[Math.cos(c)*.13,.017+Math.sin(c)*.13,.09],.008,reed);
  }
}
function flowers(b) {
  for(let i=0;i<7;i++) {
    const a=i*2.4,x=Math.cos(a)*.101,z=Math.sin(a)*.074,y=.19+(i%3)*.043;
    b.rod([0,-.09,0],[x,y,z],.006,'#6d815a');
    b.ball(x*.6+.019,y*.56,z*.6,.031,.054,.012,'#84936a',[0,a,-.62]);
    for(let j=0;j<5;j++) {
      const u=j*1.257;
      b.ball(x+Math.cos(u)*.024,y+Math.sin(u)*.022,z,.031,.019,.014,i%2?'#d89694':'#e6ce9d',[0,a*.12,u]);
    }
    b.ball(x,y,z+.013,.015,.014,.009,reed);
  }
  b.rod([0,-.027,0],[0,-.056,0],.025,'#b36f58');
}
// Implements used inside the village workshops. A shuttle carries a hank of
// indigo thread, the winnow has split bamboo ribs, and the net has knotted mesh.
function shuttle(b) {
  b.stroke([[-.20,0,0],[-.10,.027,0],[.11,.027,0],[.20,0,0],[.11,-.027,0],[-.10,-.027,0],[-.20,0,0]],.011,cane);
  for(let i=0;i<8;i++) b.rod([-.096+i*.025,-.024,0],[-.083+i*.025,.024,0],.012,'#637e81');
}
function hank(b) {
  b.rod([0,.005,-.08],[.003,.035,.29],.014,cane);
  for(let i=0;i<5;i++) b.stroke([[0,.04+i*.004,.27],[-.075,-.04,.26],[-.078,-.22,.27],[.03,-.27,.28],[.09,-.12,.27],[0,.04+i*.004,.27]],.009,i%2?'#526b75':'#81999a',12);
  b.rod([-.06,-.12,.27],[.076,-.14,.27],.018,reed);
}
function winnow(b) {
  for(let i=-7;i<=7;i++) {
    const x=.034*i, length=.16*Math.sqrt(1-(i/8)**2);
    b.stroke([[x,.056,-length],[x,0,0],[x,.036,length]],.018,i%2?cane:reed);
  }
  for(let i=0;i<22;i++) {
    const a=i*2.40, r=.033*Math.sqrt(i);
    b.ball(Math.sin(a)*r,.036+.01*Math.cos(a),Math.cos(a)*r*.68,.018,.01,.012,'#dfca87');
  }
}
function ladle(b) {
  b.rod([0,-.01,-.055],[.04,.056,.32],.012,cane);
  b.rod([.043,.038,.333],[.043,.093,.333],.075,'#bd9b64',.084);
  b.rod([.043,.093,.333],[.043,.096,.333],.068,'#7e6a47');
}
function bowl(b) {
  b.rod([0,0,0],[0,.086,0],.062,'#9d6c51',.118);
  b.rod([0,.086,0],[0,.09,0],.106,'#635644');
}
function fishnet(b) {
  for(let i=0;i<=4;i++) {
    const x=i*.046-.092;
    for(const sign of [-1,1]) b.stroke([[x,0,0],[x+sign*.023,-.08,.016],[x,-.16,.023],[x+sign*.018,-.235,.027]],.004,reed);
  }
  b.rod([-.11,0,0],[.11,0,0],.011,binding);
}
const tools = {
  loom:[hank,shuttle], winnow:[winnow], ladle:[ladle,bowl], mend:[shuttle,fishnet],
  fan:[fan], lantern:[lantern], scribe:[scribe,letter], tea:[tea], rake:[b=>fieldTool(b,false)],
  broom:[b=>fieldTool(b,true)], fisher:[fisher,basket], flute:[flute],
  drum:[b=>b.rod([-.084,-.07,0],[.112,.138,0],.012,cane,.022),littleDrum], flowers:[flowers,basket]
};
export function dressArtisan(limbs, role, model, batch) {
  tools[role].forEach((draw,index)=>{
    const prop=model('craft-'+role+index,root=>batch(root,draw));
    prop.position.fromArray(index ? [-.045,-.15,.19] : [.24,-.105,.262]);
    limbs[index?'arm-1':'arm1'].add(prop);
    if(role==='tea') limbs.teaTray=prop;
  });
}
// The two hands describe different parts of a task. The free hand catches
// the falling grain, holds the letter for the brush or steadies the tea tray.
export const WORKSHOP_TOOLS=['loom','winnow','ladle','mend'];
const rhythms = {
  flute:2.15, fan:2.28, lantern:1.5, scribe:2.85, tea:1.4, rake:1.95, fisher:1.18,
  drum:4.15, flowers:1.75, broom:2.38, loom:2.88, winnow:2.15, ladle:1.7, mend:2.55,
  porter:4.45, wander:4.45, sumo:.82
};
export const workRate = craft => rhythms[craft];
export function poseArtisan(limbs,n,t) {
  const craft=n.craft || n.role, phase=t*workRate(craft)+n.phase;
  const beat=Math.sin(phase), turn=Math.cos(phase), rise=(1+beat)/2;
  const hand=limbs.arm1.rotation, other=limbs['arm-1'].rotation;
  const head=limbs.head.rotation, body=limbs.torso.rotation;
  body.set(.05,0,.025*turn);
  head.set(.03,-.06*turn,0);
  other.set(-.22,-.12,.02);
  switch(craft) {
    case 'broom':
    case 'rake':
      // Reach out, lay down the bristles, draw them across the front foot.
      hand.set(-.28+.38*turn, -.49+.84*beat,.13+.25*turn);
      other.set(-.55+.31*turn,.47+.52*beat,.18);
      body.set(.16+.17*turn,.34*beat,.09*beat);
      head.x=.20+.11*turn;
      break;
    case 'scribe':
      // Work from the hips so the brush actually descends to the writing
      // surface and lifts between strokes. Keep the other sleeve clear.
      hand.set(.62+.18*turn,-.27+.27*beat,.09+.15*Math.sin(phase*2));
      other.set(.46-.08*turn,.38,-.08);
      limbs.torso.position.y-=n.type==='rabbit'?.18:.07;
      body.set(.32+.07*turn,.11*beat,-.035);
      head.set(.28+.09*turn,.14*beat,-.08);
      break;
    case 'mend':
      hand.set(-.48+.27*turn, -.65+.43*beat,.13+.24*Math.sin(phase*2));
      other.set(-.54-.075*turn,.52-.12*beat,-.15);
      body.x=.16+.08*turn;
      head.set(.25+.10*turn,.09+.16*beat,-.08);
      break;
    case 'loom':
      hand.set((n.type==='frog'?-.76:-.54)+.47*beat,-.19+.25*turn,.08+.12*turn);
      other.set(-.31+.16*turn,.42,-.16);
      body.x=.16+.16*rise;head.set(.10+.18*rise,.14*turn,-.07);
      break;
    case 'drum':
      hand.set(-.52-.65*rise,-.44+.23*turn,.13+.19*turn);
      other.set(-.43+.07*turn,.35,-.14);
      body.z=.10*beat;head.x=.13*turn;
      break;
    case 'fan':
      hand.set(-.65-.67*beat,.21+.69*turn,.38+.54*beat);
      other.set(-.36+.38*beat,-.24-.33*turn,-.24-.29*beat);
      body.set(.07,.36*turn,.18*beat);head.y=-.31*turn;
      break;
    case 'fisher':
      hand.set(-.70-.67*beat,.23+.22*turn,.05+.17*turn);
      other.set(-.35+.21*turn,-.08,-.17);
      body.set(.09+.17*turn,.09*beat,.09*turn);head.x=-.20*beat;
      break;
    case 'flute':
      hand.set(-.90-.15*turn,-.50+.09*beat,.13);
      other.set(-1.0+.12*beat,.37+.09*turn,-.08);
      head.z=.12*beat;body.z=.11*beat;
      break;
    case 'tea':
      hand.set(.12+.32*rise,-.20-.18*beat,.03);
      other.set(.06+.26*rise,.25+.19*beat,-.04);
      body.x=.10+.25*rise;head.x=.20*rise;
      // Present the cups on a level tray, even through a deep serving bow.
      limbs.teaTray.quaternion.multiplyQuaternions(limbs.torso.quaternion,limbs.arm1.quaternion).invert();
      break;
    case 'lantern':
      hand.set(-.65-.53*beat,.15+.41*turn,.18+.25*turn);
      other.set(-.12+.32*beat,.06,-.06);
      head.set(-.09-.14*beat,.29*turn,-.06);
      break;
    case 'flowers':
      hand.set(-.81-.43*rise,-.43+.23*turn,.11+.22*turn);
      other.set(-.42+.13*turn,.16-.16*beat,-.13);
      head.set(.22-.16*beat,.24*turn,-.09);body.x=.17+.10*turn;
      break;
    case 'winnow':
      hand.set(-.54-.49*beat,-.49+.09*turn,.09);
      other.set(-.52-.40*beat,.49-.09*turn,-.06);
      body.x=.14+.14*turn;head.x=.15-.17*beat;
      break;
    case 'ladle':
      hand.set((n.type==='frog'?-.49:-.26)+.50*beat,-.18+.20*turn,.08+.12*beat);
      other.set(-.43,.32,-.10);body.x=.13+.16*rise;head.x=.13+.14*rise;
      break;
  }
}
