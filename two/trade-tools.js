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
const tools = {
  fan:[fan], lantern:[lantern], scribe:[scribe,letter], tea:[tea], rake:[b=>fieldTool(b,false)],
  broom:[b=>fieldTool(b,true)], fisher:[fisher,basket], flute:[flute],
  drum:[b=>b.rod([-.084,-.07,0],[.112,.138,0],.012,cane,.022),littleDrum], flowers:[flowers,basket]
};
export function dressArtisan(limbs, role, model, batch) {
  tools[role].forEach((draw,index)=>{
    const prop=model('craft-'+role+index,root=>batch(root,draw));
    prop.position.fromArray(index ? [-.045,-.15,.19] : [.24,-.105,.262]);
    limbs[index?'arm-1':'arm1'].add(prop);
  });
}
// Gestures have a held pose as well as a rhythm. A tray remains level, while
// a drummer strikes, a calligrapher writes and a dancer opens the fan outward.
const poses = {
  flute: [-.78,-1.03,-.28,.026,.035], fan:[-.45,-.08,.25,.54,.21],
  lantern:[-.07,.09,.12,.16,.09], scribe:[-.23,-.14,.40,.11,.21],
  tea:[-.09,.02,.03,.017,.025], rake:[.04,-.24,-.30,.36,.34],
  fisher:[-.29,-.08,.06,.07,.14], drum:[-.27,-.14,-.46,.40,.30],
  flowers:[-.32,-.06,.06,.13,.12], broom:[.13,-.12,-.21,.40,.35]
};
export function poseArtisan(limbs,n,t) {
  const [raise,rest,reach,swing,lean]=poses[n.role];
  const phase=t*(n.role==='drum'?4.1:n.role==='fan'?2.0:1.33)+n.phase;
  const beat=Math.sin(phase), turn=Math.cos(phase);
  const hand=limbs.arm1, other=limbs['arm-1'];
  hand.rotation.set(raise+swing*beat, reach+lean*.25*turn, .06+swing*.42*turn);
  other.rotation.set(rest-.06*beat, -.18-.085*turn, -.09);
  limbs.torso.rotation.x+=lean*(.19+.21*beat);
  limbs.torso.rotation.y=lean*.29*turn;
  limbs.head.rotation.y-=lean*.48*turn;
}
