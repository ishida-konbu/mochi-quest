import { worldDelta } from './game.js';

const TAU = Math.PI * 2;
const ink = '#382b24';
const pi = Math.PI;
const names = [
  'mochi-normal', 'mochi-kusa', 'mochi-kinako',
  'rabbit-porter', 'rabbit-wander', 'rabbit-sumo', 'frog-porter', 'frog-wander', 'frog-sumo',
  'turtle', 'bike', 'port', 'dock', 'onsen', 'ledge', 'manga', 'sake', 'ramen', 'haramaki'
];
const art = new Map();
export const actorArtReady = Promise.all(names.map(name => new Promise(resolve => {
  const image = new Image();
  image.onload = () => { art.set(name, image); resolve(); };
  image.onerror = resolve;
  image.src = new URL('./assets/actors/' + name + '.webp', import.meta.url).href;
})));

const paths = new Map();
function brush(ctx, shape, fill, stroke, weight = 1.5) {
  let path = paths.get(shape);
  if (!path) { path = new Path2D(shape); paths.set(shape, path); }
  if (fill) { ctx.fillStyle = fill; ctx.fill(path); }
  if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = weight; ctx.stroke(path); }
}
function oval(ctx, x, y, rx, ry, color, tilt = 0) {
  ctx.beginPath(); ctx.ellipse(x, y, rx, ry, tilt, 0, TAU);
  ctx.fillStyle = color; ctx.fill();
}
function asset(ctx, name, x, y, width, height) {
  const img = art.get(name);
  if (!img) return;
  height ??= width * img.height / img.width;
  ctx.drawImage(img, x - width / 2, y - height, width, height);
}
function blurShadow(ctx, x, y, radius, opacity, height = 7) {
  if (radius <= 0) return;
  ctx.save(); ctx.translate(x, y); ctx.scale(radius, height);
  const shade = ctx.createRadialGradient(0, 0, .08, 0, 0, 1);
  shade.addColorStop(0, 'rgba(56,43,25,' + opacity + ')');
  shade.addColorStop(.64, 'rgba(72,55,27,' + opacity * .65 + ')');
  shade.addColorStop(1, 'rgba(72,55,27,0)');
  oval(ctx, 0, 0, 1, 1, shade); ctx.restore();
}

const skinColors = { normal: ['#fffaf1','#ede3d3','#b3a087'], kusa: ['#c2d88a','#92a968','#627751'], kinako: ['#efd394','#d4a465','#a37647'] };
function rice(ctx, x, y, w, h, angle, mode) {
  const kind = mode === 'kusa' || mode === 'kinako' ? mode : 'normal';
  ctx.save(); ctx.translate(x, y); ctx.rotate(angle);
  const img = art.get('mochi-' + kind);
  if (img) ctx.drawImage(img, -w / 2, -h / 2, w, h);
  else {
    const grad = ctx.createRadialGradient(-w * .2, -h * .25, 1, 0, h * .1, w * .6);
    const [light,mid,dark] = skinColors[kind];
    grad.addColorStop(0,light); grad.addColorStop(.74,mid); grad.addColorStop(1,dark);
    ctx.beginPath(); ctx.ellipse(0,0,w / 2,h / 2,0,0,TAU);
    ctx.fillStyle = grad; ctx.fill();
    ctx.strokeStyle = '#76664f'; ctx.lineWidth = Math.max(.65, w / 125); ctx.stroke();
  }
  ctx.restore();
}
function blush(ctx, x, y, drunk) {
  ctx.save(); ctx.translate(x,y); ctx.scale(1,.65);
  const g = ctx.createRadialGradient(0,0,0,0,0,12);
  g.addColorStop(0,drunk ? '#d17b6e' : '#eea497'); g.addColorStop(1,'rgba(227,130,121,0)');
  oval(ctx,0,0,12,12,g);
  brush(ctx,'M-6 1 l2 -4 m2 6 l3 -6 m1 5 l2 -4',null,'rgba(165,81,71,.44)',.75);
  ctx.restore();
}
function face(ctx, mood, t, drunk, portrait) {
  ctx.save(); ctx.translate(5, -51);
  const quiet = mood === 'sleep' || mood === 'bath';
  const cheerful = mood === 'read' || mood === 'eat';
  const blink = !portrait && (t % 4.7 > 4.51 || (t % 11.3 > 11.12));
  blush(ctx,-23,5,drunk); blush(ctx,24,5,drunk);
  for (const right of [-1,1]) {
    ctx.save(); ctx.translate(right * 14,-2);
    if (quiet || cheerful || blink || mood === 'fall') {
      const curve = mood === 'fall' ? 'M-4 -4 L1 0 L-4 4' : cheerful ? 'M-4 1 Q0 -5 4 0' : 'M-4 -1 Q0 3 4 -1';
      if (mood === 'fall') ctx.scale(-right,1);
      brush(ctx,curve,null,ink,2.2);
    } else {
      oval(ctx,0,0,3.2,4.9,ink,-.05 * right);
      oval(ctx,.8,-1.9,1.05,1.28,'#fff7df');
      if (mood === 'throw') {
        ctx.scale(right,1); brush(ctx,'M-3 -6 Q-1 -6 4 -9',null,ink,1.4);
      }
    }
    ctx.restore();
  }
  if (quiet) brush(ctx,'M-2 7 Q1 9 4 6',null,ink,1.45);
  else if (mood === 'eat') {
    if (Math.sin(t*12) > .25) oval(ctx,1,8,2.7,2.2,ink);
    else brush(ctx,'M-4 7 Q-1 10 1 7 Q4 10 6 7',null,ink,1.6);
  } else if (mood === 'drink' || mood === 'fall') oval(ctx,1,8,3.2,4.4,'#634036');
  else {
    brush(ctx,'M-5 6 Q0 9 7 5 Q6 14 1 15 Q-3 15 -5 6 Z','#65392f',ink,1.2);
    brush(ctx,'M-2 12 Q1 9 5 11 Q3 15 1 14 Q-1 14 -2 12Z','#de9181');
  }
  ctx.restore();
}
function leaf(ctx) {
  brush(ctx,'M-4 -85 C-11 -94 -20 -96 -27 -94 Q-21 -78 -5 -79 Q-8 -88 -15 -91', '#88945c','#56603f',1.35);
  brush(ctx,'M-6 -82 C-9 -91 -5 -100 5 -104 Q9 -91 -4 -83 M-3 -86 L2 -98','#9bab65','#56603f',1.3);
}
function wing(ctx, side, flap) {
  ctx.save(); ctx.translate(side * 39, -43); ctx.scale(side,1); ctx.rotate(flap);
  brush(ctx,'M-4 6 C5 -1 16 -5 29 -25 Q36 -31 34 -20 Q32 -10 26 -4 Q33 -10 33 -4 Q32 1 23 8 Q30 4 28 10 Q21 22 6 20 Q-2 19 -4 6Z','#fff9e9','#817969',1.4);
  brush(ctx,'M3 11 Q15 8 25 -7 M8 14 Q14 15 21 10',null,'#b3aa94',.9); ctx.restore();
}
function sparkle(ctx,x,y,size,fill) {
  ctx.save(); ctx.translate(x,y); ctx.scale(size,size);
  brush(ctx,'M0 -1 Q.14 -.18 .81 0 Q.13 .16 0 1 Q-.15 .17 -.82 0 Q-.14 -.18 0 -1Z',fill);
  ctx.restore();
}
function steam(ctx,x,y,t,count=3) {
  for (let i=0;i<count;i++) {
    const a=(t*.33+i/count)%1;
    ctx.save(); ctx.translate(x+(i-(count-1)/2)*13+Math.sin(a*6+i)*3,y-a*31);
    ctx.globalAlpha *= Math.sin(a*pi)*.68;
    brush(ctx,'M0 5 C-5 0 4 -4 0 -10 C-3 -13 -2 -16 0 -18',null,'#fff9ed',2);
    ctx.restore();
  }
}
function speedMarks(ctx, t, speed, powdered) {
  if (speed < 10) return;
  const count = powdered ? 23 : 6;
  for (let i=0;i<count;i++) {
    const a = (t * (powdered ? .96 : 1.85) + i * .618034) % 1;
    const x = -32 - a * (powdered ? 104 : 74);
    const y = -6 - Math.sin(a*pi)* (5 + ((i*31)%27)) + Math.sin(i*7+a*5)*4;
    ctx.save(); ctx.globalAlpha *= (1-a)*.69;
    if (powdered) {
      oval(ctx,x,y,1.1+((i*7)%5),1+((i*3)%4),i%3===0?'#9d713b':'#d6b271');
    } else {
      ctx.translate(x,y); ctx.scale(1-a*.6, 1);
      brush(ctx,'M0 0 Q6 -1 13 0',null,'#a69070',1.1);
    }
    ctx.restore();
  }
}
function drawHaramaki(ctx) {
  brush(ctx,'M-45 -37 Q0 -29 45 -38 L41 -20 Q-1 -11 -41 -20 Z','#9b534c','#65453b',1.25);
  brush(ctx,'M-44 -34 Q0 -26 45 -35 M-41 -22 Q3 -15 42 -23',null,'#d4ae77',1.8);
  ctx.save();
  for (let i=-38;i<=38;i+=5) {
    const edge=Math.pow(i/42,2)*5;
    ctx.beginPath();ctx.moveTo(i,-30-edge);ctx.lineTo(i*.96,-19-edge);ctx.strokeStyle='#af7062';ctx.lineWidth=.8;ctx.stroke();
  }
  ctx.restore();
}
function drawHeldItem(ctx,mood,t) {
  if (mood === 'read') {
    ctx.save();ctx.translate(7, -15 + Math.sin(t*3));ctx.rotate(Math.sin(t*2)*.035);
    asset(ctx,'manga',0,0,49,32);ctx.restore();
  } else if (mood === 'drink') {
    const tilt = (1+Math.sin(t*4))*.5;
    ctx.save();ctx.translate(14,-32-tilt*6);ctx.rotate(-tilt*.5);
    brush(ctx,'M-9 -4 Q-8 5 -3 7 Q0 9 4 7 Q8 5 10 -4Z','#ecdeb8','#6e6251',1.05);
    oval(ctx,.4,-4.1,9.2,2.7,'#697e88');
    oval(ctx,.4,-4.3,7.6,1.5,'#d1c398');
    brush(ctx,'M-6 1 Q-1 6 7 1 M-4 3 L-2 2 M1 5 L3 3',null,'#677a83',1);
    ctx.restore();
  } else if (mood === 'eat') {
    asset(ctx,'ramen',9,-10,43,31);
    ctx.save();ctx.translate(18,-37+Math.sin(t*7)*2);
    brush(ctx,'M-5 0 L13 -8 M-4 1 L14 -6',null,'#785843',1.6);
    oval(ctx,-4,0,1.8,2,'#b88853');ctx.restore();
  }
}
const portraitPlayer = {mode:'normal',buffs:{},grounded:true,activity:null,mount:null,facing:1,vx:0,h:0,stretch:0,throwTime:0};
const rotations = new WeakMap();
function rollAngle(player) {
  const previous=rotations.get(player);
  const traveled=previous ? worldDelta(player.x,previous.x) : 0;
  const angle=previous && Math.abs(traveled)<1200 ? (previous.angle+traveled/43)%TAU : 0;
  rotations.set(player,{x:player.x,angle});
  return angle*player.facing;
}

function drawHero(ctx, p, t, portrait=false) {
  const mode = p.mode;
  const buffs=p.buffs||{};
  const speed=Math.abs(p.vx||0);
  const cycle=t* (speed>15 ? (mode==='dango'?10:8) : 3.3);
  const stride=portrait || p.activity || p.mount ? 0 : Math.sin(cycle);
  const walk=p.grounded && !portrait && !p.activity && !p.mount;
  const bodyBob=walk ? (speed>15?2.5:1.1)*(1-Math.cos(cycle*2)) : 0;
  const isDango=mode==='dango';
  const size=buffs.full>0 ? 1.28 : 1;
  ctx.save();ctx.lineJoin='round';ctx.lineCap='round';ctx.scale(p.facing||1,1);
  if (!portrait) {
    if (p.mount==='bike') {asset(ctx,'bike',9,0,138,90);ctx.translate(-13,-65);}
    else if (p.mount==='turtle') {asset(ctx,'turtle',0,0,121,61);ctx.translate(-7,-46);}
    if (mode==='kinako' || mode==='dango' || p.mount || buffs.swift>0) speedMarks(ctx,t,speed,mode==='kinako');
  }
  ctx.scale(size,size);
  ctx.translate(0,-bodyBob);
  if (p.activity==='fall') {ctx.translate(0,8);ctx.rotate(-.78*Math.sin(Math.min(1,(p.activityTime||.1)/.68)*pi));}
  if (p.activity==='sleep') {ctx.translate(-4,-4);ctx.scale(1.1,.82);ctx.rotate(-.12);}
  if (buffs.drunk>0) ctx.rotate(Math.sin(t*5)*.115);
  if (p.activity==='bath') ctx.translate(0,21);
  const stretch = p.stretch>0 ? Math.sin((p.stretch/(isDango?.58:.2))*pi) : 0;
  const elastic=stretch*(isDango ? .44 : .12);
  let squash = !portrait && !p.activity ? Math.cos(cycle*2)*.019 : 0;
  if (p.activity==='sleep') squash+=Math.sin(t*2.1)*.019;
  ctx.scale(1+squash-elastic*.41,1-squash+elastic);
  if (mode==='kusa' && !portrait) ctx.globalAlpha*=.86;
  const mood=p.activity || (p.throwTime>0?'throw':'');
  if (mode==='habutae') {
    const f=portrait?-.37:Math.sin(t*(p.grounded?5:13))*.42-.15;
    wing(ctx,-1,f);wing(ctx,1,f);
  }
  if (isDango && !portrait && !p.activity) {
    const angle=rollAngle(p);
    if (!p.stretch) {ctx.translate(0,-45);ctx.rotate(angle);ctx.translate(0,45);}
  } else if (!portrait) rotations.delete(p);
  const held=['read','drink','eat'].includes(mood);
  const footLift = walk ? Math.max(0,stride)*4.4 : 0;
  if (!isDango) {
    rice(ctx,-22-stride*6,-7-footLift,25,15,-.16-stride*.15,mode);
    rice(ctx,22+stride*6,-7-Math.max(0,-stride)*4.4,26,16,.18-stride*.14,mode);
    rice(ctx,-40,-39-stride*4,17,24,-.65-stride*.19,mode);
  }
  rice(ctx,0,isDango?-46:-49,isDango?88:96,isDango?87:85,0,mode);
  if (mode==='kusa') leaf(ctx);
  if (mode==='kinako') {
    for(let i=0;i<26;i++){
      const a=i*2.4, r=Math.sqrt(i/26);
      const x=Math.cos(a)*38*r, y=-51+Math.sin(a)*31*r;
      if(Math.abs(x)>23 || y< -66 || y> -28) oval(ctx,x,y,.65+(i%2)*.3,.7,'rgba(138,94,44,.50)');
    }
  }
  if (isDango && portrait) {
    ctx.save();ctx.translate(-20,-73);ctx.rotate(-.36);
    brush(ctx,'M0 -18 L0 13',null,'#8b633c',2);
    oval(ctx,0,-13,4.5,4.8,'#abbd79');oval(ctx,0,-6,4.5,4.7,'#ffebc9');oval(ctx,0,1,4.6,4.7,'#e3a69b');ctx.restore();
  }
  if (buffs.wrap>0) drawHaramaki(ctx);
  face(ctx,mood,t,buffs.drunk>0,portrait);
  if (!isDango && mode!=='habutae') {
    if (held) {
      drawHeldItem(ctx,mood,t);
      rice(ctx,-22,-29,13,16,-.85,mode);rice(ctx,30,-27,14,16,.65,mode);
    } else {
      const thrown=p.throwTime>0 ? Math.sin(p.throwTime/.28*pi)*10 : 0;
      rice(ctx,39+thrown*.6,-37-stride*3-thrown,17,21,.68+stride*.23+thrown*.06,mode);
    }
  } else if(held) drawHeldItem(ctx,mood,t);
  if(!portrait){
    if(buffs.warm>0 || mood==='bath') steam(ctx,4,-81,t,3);
    if(mood==='sleep'){
      ctx.save();ctx.fillStyle='#5e6c61';ctx.font='italic bold 13px Georgia, serif';
      for (let i=0;i<3;i++) {
        const a=(t*.44+i/3)%1; ctx.globalAlpha=Math.sin(a*pi)*.9;
        ctx.fillText('z',36+a*24,-65-a*32);
      }ctx.restore();
    }
  }
  ctx.restore();
}

export function drawMochiPortrait(ctx,x,y,size,mode='normal') {
  ctx.save();ctx.translate(x,y+size*.39);ctx.scale(size/116,size/116);
  drawHero(ctx,{...portraitPlayer,mode},0,true);ctx.restore();
}

function drawNotice(ctx, age, facing=1) {
  ctx.save();ctx.scale(facing,1);
  if (age>0) {
    ctx.save();ctx.globalAlpha*=.58;
    brush(ctx,'M-33 0 Q-24 -2 -16 -1 M-26 5 Q-20 4 -13 4',null,'#8a7153',1.1);
    ctx.restore();
    ctx.scale(1, .73+.22*Math.cos(age*11));
  }
  ctx.rotate(age*18-.14);
  brush(ctx,'M-13 -8 L13 -7 L12 8 L-13 7 Z','#fff8dc','#796748',1.15);
  brush(ctx,'M-10 -5 L1 0 L11 -5 M-12 6 L-4 0 M12 7 L5 1',null,'#ab9b77',.85);
  brush(ctx,'M5 .5 L10 .8 L9.7 5.5 L5 5 Z','#b84c37');
  brush(ctx,'M6.2 2 L8.8 2 M7 2 L7 4 M8 2.9 L8.8 3.8',null,'#eed6ae',.53);
  brush(ctx,'M-10 -4 L-5 -4',null,'#987e5e',.9);
  ctx.restore();
}

function npcArt(ctx,n,t) {
  const frog=n.type==='frog';
  const sumo=n.role==='sumo';
  const step=t*(sumo?3.1:2.9)+n.phase;
  const key=n.type==='turtle'?'turtle':n.type+'-'+n.role;
  const img=art.get(key);
  if(!img) return;
  const h=n.type==='turtle'?43:sumo?(frog?81:110):n.role==='wander'?(frog?117:114):(frog?104:119);
  const w=h*img.width/img.height;
  const movement=n.role==='rest' ? 0 : Math.min(1,n.speed*.055);
  const bend=sumo?Math.sin(step):Math.sin(step)*movement;
  ctx.save();ctx.scale(n.facing||1,1);
  if(sumo){
    // Anchor their outstretched palms at the centre of the bout.
    ctx.translate(-w*.26,0);
    ctx.translate(0,2);ctx.transform(1,0,.055*bend,1-.033*(1+bend),0,0);
  } else {
    ctx.translate(0,-Math.abs(bend)*1.8);ctx.rotate(bend*.026);
  }
  // Bend the ankles separately from the torso as the illustrated figure steps.
  const slices=8;
  for(let i=0;i<slices;i++){
    const srcY=Math.floor(img.height*i/slices), end=i===slices-1?img.height:Math.floor(img.height*(i+1)/slices);
    const hSlice=(end-srcY)*h/img.height;
    const y=i/slices;
    const lower=Math.max(0,(y-.60)/.4);
    const dx=bend*lower*(sumo?1.8:3.7);
    ctx.drawImage(img,0,srcY,img.width,end-srcY,-w/2+dx,-h+srcY*h/img.height,w,hSlice+(i===slices-1?0:.45));
  }
  if(n.flash>0){
    const f=1-n.flash/.58;
    ctx.globalAlpha*=1-f;
    for(let i=0;i<4;i++){
      const a=i*1.4-2.4;
      sparkle(ctx,Math.cos(a)*(17+f*18),-h*.79+Math.sin(a)*(14+f*15),3-f,'#b98b39');
    }
  }
  ctx.restore();
}
function drawObject(ctx,o,t,scale) {
  if(o.type==='ledge'){
    const top=o.h/scale;
    const width=o.width/scale;
    asset(ctx,'ledge',0,2,width+12,top+12);
  } else if(o.type==='onsen'){
    asset(ctx,'onsen',0,18,200,120);
    steam(ctx,14,-6,t,3);
  } else if(o.type==='port'){
    if(o.bikes>1) {
      ctx.save();ctx.globalAlpha*=.87;asset(ctx,'bike',-23,-8,102,69);ctx.restore();
    }
    if(o.bikes>0) asset(ctx,'port',2,4,153,84);
    else asset(ctx,'dock',54,3,32,83);
  } else {
    const w={manga:45,sake:32,ramen:45,haramaki:36}[o.type];
    const a=t*2.1+o.x*.013;
    asset(ctx,o.type,0,-8-Math.sin(a)*2.2,w);
    sparkle(ctx, w*.47,-37+Math.sin(a)*3,2+Math.sin(a*2)*.9,'#ab7e36');
  }
}
function ground(z) {return 504+96*z;}
function depth(z) {return .84+z*.27;}

export function drawActors(ctx,view,state) {
  const entries=[];
  function add(entity,kind) {
    const dx=worldDelta(entity.x,view.cameraX);
    if(Math.abs(dx)>view.w/2+175) return;
    const tie=kind==='object' ? (entity.type==='ledge'?-.002:-.001) : kind==='hero'? .001:0;
    entries.push({entity,kind,x:view.w/2+dx,order:entity.z+tie});
  }
  for(const o of state.objects) if(o.active) add(o,'object');
  for(const n of state.npcs) if(!n.mounted) add(n,'npc');
  for(const s of state.shots) add(s,'shot');
  add(state.player,'hero');
  entries.sort((a,b)=>a.order-b.order);
  const t=state.time;
  for(const {entity:e,kind,x} of entries){
    const base=ground(e.z), s=depth(e.z);
    ctx.save();ctx.translate(x,base);ctx.lineJoin='round';ctx.lineCap='round';
    if(kind==='object'){
      const radius=({onsen:94,port:75,ledge:70})[e.type] || 23;
      blurShadow(ctx,0,2,radius*s,.22,6*s);
      ctx.scale(s,s);drawObject(ctx,e,t,s);
    } else if(kind==='shot'){
      ctx.translate(0,-e.h);ctx.scale(s,s);drawNotice(ctx,e.age,e.facing);
    } else {
      const high=e.h||0;
      const radius=kind==='hero' ? (e.mount?56:39)*(e.buffs.full>0?1.27:1) : e.type==='turtle'?31:27;
      blurShadow(ctx,0,1,radius*s*Math.max(.38,1-high*.002),.31*Math.max(.23,1-high*.003),6*s);
      ctx.translate(0,-high);ctx.scale(s,s);
      if(kind==='hero'){
        if(e.activity==='bath'){
          ctx.save();ctx.beginPath();ctx.rect(-90,-260,180,247);ctx.clip();drawHero(ctx,e,t);ctx.restore();
          for(let j=0;j<3;j++){
            const a=(t*.38+j/3)%1; ctx.save();ctx.globalAlpha*=Math.sin(a*pi)*.55;
            ctx.beginPath();ctx.ellipse(0,-12,23+a*27,3+a*4,0,0,pi);ctx.lineWidth=1;ctx.strokeStyle='#faf3cb';ctx.stroke();ctx.restore();
          }
        } else drawHero(ctx,e,t);
      } else npcArt(ctx,e,t);
    }
    ctx.restore();
  }
}
