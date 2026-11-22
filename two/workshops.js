import * as T from './vendor/three.module.min.js';
import { hipHeight } from './architecture.js';

export function hipRoof() {
  const pos = [], uv = [], index = [];
  // Each corner seam runs from a ridge end to the overhanging fascia.
  // Independent face normals retain the fold between adjacent thatch planes.
  for (let face = 0; face < 4; face++) {
    const offset = pos.length / 3;
    const side = face < 2 ? 1 : -1;
    const front = face % 2 === 0;
    for (let row = 0; row <= 9; row++) {
      const t = Math.min(row / 8, 1);
      for (let i = 0; i <= 12; i++) {
        const across = i / 6 - 1;
        const span = .46 + t * .54;
        const x = front ? across * span : side * span;
        const z = front ? side * t : across * t;
        pos.push(x / 2, hipHeight(x,z) - (row === 9 ? .09 : 0), z / 2);
        uv.push((across + 1) * (front ? span * 2 : t * 1.2), row / 6);
        if (row < 9 && i < 12) {
          const k = offset + row * 13 + i;
          index.push(k,k+1,k+13,k+1,k+14,k+13);
        }
      }
    }
  }
  const geometry = new T.BufferGeometry();
  geometry.setAttribute('position', new T.Float32BufferAttribute(pos,3));
  geometry.setAttribute('uv', new T.Float32BufferAttribute(uv,2));
  geometry.setIndex(index);
  geometry.computeVertexNormals();
  return geometry;
}

function surface(width, height, draw, tiled = true) {
  const el = document.createElement('canvas');
  el.width = width; el.height = height;
  const c = el.getContext('2d');
  draw(c, width, height);
  const map = new T.CanvasTexture(el);
  map.colorSpace = T.SRGBColorSpace;
  map.anisotropy = 4;
  if (tiled) map.wrapS = map.wrapT = T.RepeatWrapping;
  return new T.MeshLambertMaterial({ map, side: T.DoubleSide });
}

function pigment(c, w, h, base, seed) {
  c.fillStyle = base; c.fillRect(0,0,w,h);
  let state = seed;
  const random = () => ((state = (Math.imul(state,1664525) + 1013904223) >>> 0) / 4294967296);
  for (let i = 0; i < w*h/19; i++) {
    c.fillStyle = i%3 ? 'rgba(69,52,33,.10)' : 'rgba(255,248,224,.36)';
    c.fillRect(random()*w,random()*h,.6+random()*3,.7+random()*2);
  }
  return random;
}

export function workshopArt(p) {
  const clay = surface(384,256,(c,w,h) => {
    const rand = pigment(c,w,h,'#eee4c8',217);
    for (let i=0;i<76;i++) {
      const x=rand()*w, y=rand()*h;
      c.beginPath(); c.moveTo(x,y); c.quadraticCurveTo(x+2,y+2,x+5*rand(),y+7*rand());
      c.strokeStyle='rgba(118,97,68,.19)'; c.lineWidth=.7; c.stroke();
    }
  });
  const earth = surface(384,384,(c,w,h) => {
    const rand=pigment(c,w,h,'#d7c7a7',569);
    for(let i=0;i<1000;i++){
      const x=rand()*w,y=rand()*h;
      c.fillStyle=i%2?'rgba(96,83,64,.19)':'rgba(255,243,209,.23)';
      c.beginPath();c.ellipse(x,y,.7+rand()*3,.4+rand(),rand()*2,0,Math.PI*2);c.fill();
    }
  });
  const namako = surface(256,128,(c,w,h) => {
    pigment(c,w,h,'#696d6a',593);
    for (const sign of [-1,1]) for (let i=-3;i<6;i++) {
      c.beginPath(); c.moveTo(i*64,0); c.lineTo(i*64+sign*h,h);
      c.strokeStyle='#555956'; c.lineWidth=8; c.stroke();
      c.strokeStyle='#e4dcbd'; c.lineWidth=5; c.stroke();
      c.strokeStyle='#f2ead1'; c.lineWidth=1.4; c.stroke();
    }
  });
  const reed = surface(256,256,(c,w,h) => {
    const r=pigment(c,w,h,'#b8a078',633);
    for (let x=1;x<w;x+=6) {
      c.strokeStyle='rgba(63,54,40,.54)'; c.lineWidth=1; c.beginPath(); c.moveTo(x,0);
      c.quadraticCurveTo(x+2*r(),h*.6,x+r(),h); c.stroke();
      c.fillStyle='rgba(248,228,176,.47)'; c.fillRect(x+1,0,1.7,h);
    }
    for(let y=28;y<h;y+=64) {
      c.fillStyle='#645c47'; c.fillRect(0,y,w,2.8);
      for(let i=0;i<w;i+=12){c.fillStyle='#9f8c67';c.fillRect(i,y-1,4,1.7);}
    }
  });
  const indigo = surface(192,256,(c,w,h) => {
    const r=pigment(c,w,h,'#405965',427);
    for(let y=-10;y<310;y+=31) for(let x=-20;x<240;x+=37){
      c.save(); c.translate(x+(Math.round(y/31)%2)*18,y); c.rotate(Math.PI/4);
      c.strokeStyle='rgba(236,228,199,.75)'; c.lineWidth=2.5; c.strokeRect(-7,-7,14,14);
      for(let j=0;j<9;j++){c.fillStyle='rgba(236,228,199,.34)';c.fillRect(-8+r()*15,-8+r()*15,2,2);}
      c.restore();
    }
    for(let x=0;x<w;x+=3){c.fillStyle='rgba(252,238,218,.09)';c.fillRect(x,0,1,h);}
    c.fillStyle='#e3d5b6'; c.fillRect(0,h-11,w,3);
  });
  const landscape = surface(768,196,(c,w,h) => {
    const rand=pigment(c,w,h,'#e9dbb8',3454);
    const ridge=(base,amp,phase) => {
      c.beginPath();c.moveTo(0,h);
      for(let x=0;x<=w;x+=3) {
        const y=base+amp*(.47*Math.sin(x*.018+phase)+.26*Math.sin(x*.039+phase*2)+.12*Math.sin(x*.09+phase)) + rand()*2.1;
        c.lineTo(x,y);
      }
      c.lineTo(w,h); c.closePath(); return c;
    };
    for(const [base,amp,phase,color] of [[65,37,.7,'#c2c0a7'],[93,54,2,'#a6ad99'],[117,42,4,'#839684']]) {
      ridge(base,amp,phase);c.fillStyle=color;c.fill();
    }
    c.fillStyle='#dbd6b8';c.fillRect(0,129,w,h-129);
    for(let i=0;i<145;i++){
      const x=rand()*w,y=131+rand()*62;
      c.fillStyle=i%5?'rgba(100,118,109,.3)':'#ece3c5';c.fillRect(x,y,4+rand()*29,.7+rand());
    }
    for(const clump of [27,52,85,552,579,601,646,677,722]){
      const foot=154+rand()*35;
      c.strokeStyle='#565e50';
      for(let j=0;j<9;j++){const lean=(rand()-.5)*45, len=8+rand()*41;
        c.beginPath();c.moveTo(clump+j,foot);c.quadraticCurveTo(clump+lean*.3,foot-len*.6,clump+lean,foot-len);c.lineWidth=1+rand();c.stroke();
      }
    }
    for(let i=0;i<5;i++){
      const x=240+i*26,y=49+Math.sin(i*1.5)*6;
      c.beginPath();c.moveTo(x-7,y-2);c.quadraticCurveTo(x-2,y-4,x,y);c.quadraticCurveTo(x+4,y-6,x+9,y-5);
      c.lineWidth=1.6;c.strokeStyle='#5e645a';c.stroke();
    }
    c.fillStyle='#9d5946'; c.fillRect(w-34,h-31,14,17);
    c.strokeStyle='#dfb99c';c.strokeRect(w-31,h-28,8,11);
  }, false);
  const vatProfile=[[.08,0],[.32,.015],[.40,.18],[.51,.58],[.50,.69],[.45,.70],[.44,.62],[.35,.18],[.08,.16]];
  p.shapes.craftVat=new T.LatheGeometry(vatProfile.map(q=>new T.Vector2(...q)),32);
  p.shapes.craftHoop=new T.TorusGeometry(1,.044,5,48).rotateX(Math.PI/2);
  p.shapes.dyeCloth=new T.PlaneGeometry(1,1,22,7);
  const pos=p.shapes.dyeCloth.attributes.position;
  for(let i=0;i<pos.count;i++){
    const x=pos.getX(i),y=pos.getY(i),depth=.5-y;
    pos.setXYZ(i,x,y+.025*depth*Math.sin(x*7),(.044+.067*depth)*Math.sin(x*16+depth*.8));
  }
  p.shapes.dyeCloth.computeVertexNormals();
  const stripe = surface(128,256,(c,w,h)=>{
    pigment(c,w,h,'#c3c5ac',872);
    for (let x=1;x<w;x+=21) {
      c.fillStyle='#536d72'; c.fillRect(x,0,6,h);c.fillRect(x+8,0,2,h);
    }
    for(let y=0;y<h;y+=4) {c.fillStyle='rgba(253,240,206,.18)'; c.fillRect(0,y,w,1);}
    c.fillStyle='#eee4c6';c.fillRect(0,h-10,w,2);
  });
  const barrelLabel = surface(160,184,(c,w,h)=>{
    pigment(c,w,h,'#ddd0a9',5321);
    c.strokeStyle='#8e5446'; c.lineWidth=2.2;c.strokeRect(8,8,w-16,h-16);
    c.textAlign='center';c.textBaseline='middle'; c.fillStyle='#454736';
    c.font='bold 69px "Hiragino Mincho ProN","Yu Mincho",serif';c.fillText('清',w/2,55);c.fillText('酒',w/2,123);
    c.fillStyle='#9c5545'; c.fillRect(w-32,h-38,13,18);
  },false);
  // The drip ends carry a fired spiral and two concentric raised rims.
  p.shapes.tileEnd=new T.CircleGeometry(1,20);
  const tileEnd=surface(96,96,(c,w,h)=>{
    pigment(c,w,h,'#76817c',762);
    for(const [radius,tone,line] of [[45,'#4d5654',4],[40,'#a8ada0',3],[34,'#626c65',2]]){
      c.beginPath();c.arc(48,48,radius,0,Math.PI*2);c.strokeStyle=tone;c.lineWidth=line;c.stroke();
    }
    for(let k=0;k<3;k++){
      c.save();c.translate(48,48);c.rotate(k*Math.PI*2/3);
      c.beginPath();c.moveTo(-4,-25);c.bezierCurveTo(28,-25,24,-4,10,1);
      c.bezierCurveTo(17,-7,7,-18,-4,-25);c.fillStyle='#a5ab9e';c.fill();c.restore();
    }
  },false);
  return { clay, earth, namako, reed, indigo, landscape, stripe, barrelLabel, tileEnd };
}

const cedar='#a78662', iron='#554f43', straw='#c9b682';
export function fitWorkshop(p, plan, part) {
  const {width:w,depth:d,floor,ceiling,craft,workbench:table}=plan;
  if(!table) return;
  const art=p.workshopArt;
  const {u,v,width,depth,height}=table;
  const top=floor+height;
  const at=(shape,x,y,z,sx,sy,sz,color,mat=p.wood) => part(shape,u+x,top+y,v+z,sx,sy,sz,color,mat);
  at('box',0,-.051,0,width,.102,depth,cedar,p.deck);
  for(const sx of [-1,1]) for(const sz of [-1,1])
    at('box',sx*(width/2-.08),-height/2,sz*(depth/2-.09),.11,height,.12,iron);
  const vat=(x,z,size,tint,contents) => {
    at('craftVat',x,0,z,size,size,size,tint,p.boarding);
    for(const [y,r] of [[.15,.40],[.55,.51]])
      at('craftHoop',x,y*size,z,r*size,.64*size,r*size,'#53594d',p.fine);
    at('round',x,size*.60,z,size*.443,.011,size*.443,contents,p.fine);
  };
  if(craft==='tea'||craft==='lodge') {
    at('box',0,.032,0,width*.81,.06,depth*.67,'#695b47',p.stone);
    at('box',0,.069,0,width*.64,.033,depth*.55,'#473e35',p.fine);
    at('ball',0,.34,0,.32,.23,.30,'#55584c',p.stone);
    at('round',0,.55,0,.24,.04,.24,'#444b43',p.fine);
    at('ball',0,.594,0,.048,.045,.048,'#878269',p.bronze);
    const rise=ceiling-top-.83;
    at('round',0,.67+rise/2,0,.019,rise,.019,iron,p.bronze);
    for(const side of [-1,1])at('craftVat',side<0 ? -width*.5+.15 : .27,0,depth*.26,.26,.24,.26,'#a89e7e',p.fine);
  } else if(craft==='dye'||craft==='brew') {
    vat(.09,-depth*.22,.94,craft==='brew'?'#b69467':'#9b8064',craft==='brew'?'#9a7543':'#273f51');
    vat(-width/2+.37,depth*.19,.75,'#bb9f72',craft==='brew'?'#8f6a45':'#414b57');
  } else if(craft==='ink') {
    for(let i=0;i<4;i++)
      at('box',.02,.033+i*.021,depth*.18,width*.59,.02,depth*.27,i%2?'#b9b195':'#e6d9b9',p.fine);
    at('box',-width*.15,.015,depth*.03,width*.67,.024,depth*.27,'#f1e2c1',p.fine);
    at('rock',.09,.08,-depth*.1,.12,.055,.21,'#4b514b',p.stone);
    for(let k=0;k<6;k++) at('box',-width*.39+k*.063,.034,depth*.03,.013,.01,.24+(k%3)*.041,iron,p.fine);
  } else if(craft==='rice') {
    for(const z of [-depth*.23,depth*.20]){
      at('craftVat',0,0,z,.85,.32,.88,straw,art.reed);
      at('ball',0,.16,z,.37,.095,.36,'#d9c38d',art.clay);
    }
  } else {
    // A net-maker's frame: opposed diagonals leave open diamond meshes.
    const rear=-depth*.42, front=depth*.42, high=.83;
    for(const z of [rear,front]) at('box',0,high/2,z,.06,high,.06,cedar);
    at('box',0,high,0,.067,.06,front-rear+.12,straw);
    for(let i=0;i<5;i++)
      at('craftHoop',-.13,.026+i*.022,depth*.16,.28,.35,.33,'#a38d67',p.fine);
    p.shapes.mendingNet ??= new T.PlaneGeometry(1,1).rotateY(Math.PI/2);
    p.netThread ??= surface(128,128,(c,w,h)=>{
      c.clearRect(0,0,w,h);c.strokeStyle='#b0a185';c.lineWidth=2.2;
      for(let i=-8;i<=12;i++)for(const side of [-1,1]){
        c.beginPath();c.moveTo(i*19,0);c.lineTo(i*19+side*h*.59,h);c.stroke();
      }
    },false);
    p.netThread.transparent=true; p.netThread.alphaTest=.21;
    at('mendingNet',0,.46,0,1,.67,front-rear,'#eee5ce',p.netThread);
  }
  const back=-d*.5+.33, backTop=ceiling-.54, midLeft=-w*.17;
  if(craft==='dye') {
    const rail=w*.58;
    // Bolt ends are rolled back over the pole, with weighted hems at
    // different heights. Broken resist diamonds sit beside striped kasuri.
    part('box',midLeft,backTop,back,rail+.32,.072,.083,cedar,p.wood);
    for(const sg of [-1,1])
      part('box',midLeft+sg*rail*.45,backTop+.19,back,.055,.41,.065,iron,p.wood);
    for(let j=0;j<4;j++) {
      const x=midLeft+(j-1.5)*rail*.241, length=1.42+.16*(j%3);
      part('dyeCloth',x,backTop-length*.5,back+.11,rail*.219,length,1,j===2?'#ddd4b9':'#fff7e6',j%2?art.stripe:art.indigo);
      part('box',x,backTop-length-.006,back+.10,rail*.216,.036,.049,'#9a896e',p.wood);
    }
  } else if(craft==='brew'||craft==='rice') {
    const rackWidth=w*.56;
    part('box',midLeft,floor+.11,back+.43,rackWidth,.16,.99,'#8b7151',p.deck);
    for(let j=0;j<4;j++) {
      const x=midLeft+(j-1.5)*rackWidth*.232, z=back+.41, base=floor+.20;
      if(craft==='brew') {
        for(let k=0;k<(j===1||j===2?2:1);k++){
          const tier=base+k*.83;
          part('craftVat',x,tier,z,1.13,1.15,1.08,'#b08f63',p.boarding);
          part('round',x,tier+.795,z,.54,.038,.52,'#b59d76',p.deck);
          for(const [height,diameter] of [[.19,.464],[.63,.57]])
            part('craftHoop',x,tier+height,z,diameter,.77,diameter*.95,'#6c6650',p.fine);
          part('plane',x,tier+.44,z+.547,.27,.32,1,'#fff8dd',art.barrelLabel);
        }
      } else {
        for(let k=0;k<(j===1||j===2?2:1);k++) {
          const tier=base+.34+k*.52;
          part('ball',x,tier,z,rackWidth*.119,.35,.388,'#bba16e',art.reed);
          for(const sg of [-1,1])part('box',x+sg*rackWidth*.047,tier+.335,z,.047,.029,.31,'#706548',p.wood);
        }
      }
    }
  } else if(craft==='net') {
    const rail=w*.54, level=backTop-.30;
    part('box',midLeft,level,back,rail,.07,.08,cedar,p.wood);
    // Square-mesh net on a drying pole; wooden floats mark the head-rope.
    part('plane',midLeft,level-.73,back+.048,rail*.97,1.40,1,'#ddd3b5',p.netThread);
    for(let j=-3;j<=3;j++)part('ball',midLeft+j*rail*.144,level-.13,back+.065,.085,.117,.067,'#a38761',p.wood);
    for(let k=0;k<4;k++)part('craftHoop',-w*.36,floor+.062+k*.036,back+.72,.45,.6,.52,'#b3a078',p.wood);
  } else if(craft==='tea') {
    const rack=w*.28, x=-w*.31;
    for(let row=0;row<2;row++) {
      const y=floor+.74+row*.57;
      part('box',x,y,back+.21,rack,.06,.40,'#926e4c',p.wood);
      for(let j=-1;j<=1;j++)
        part('craftVat',x+j*rack*.25,y+.033,back+.22,.29,.34,.28,j%2?'#91a497':'#b59e78',p.fine);
    }
    for(const sg of [-1,1])part('box',x+sg*rack*.46,floor+.79,back+.10,.067,1.52,.065,iron,p.wood);
  }
  // A horizontal landscape with a lacquered top and bottom rail, behind the
  // makers. Keep the approach and sight line to the tatami completely free.
  if(craft==='ink'||craft==='lodge') {
    part('plane',-w*.26,floor+(ceiling-floor)*.50,-d*.5+.19,w*.38,.79,1,'#fff9e8',art.landscape);
    for(const sign of [-1,1])part('box',-w*.26,floor+(ceiling-floor)*.50+sign*.408,-d*.5+.2,w*.39,.046,.068,iron,p.wood);
  }
}

export function tradeFacade(p,b,plan,part) {
  const {width:w,depth:d,craft,door,ceiling}=plan, art=p.workshopArt;
  const panel=(w-door)/2;
  const x=(w+door)/4, z=d/2+.125, top=ceiling-.19;
  if(craft==='dye'){
    const across=w*.22, left=-x;
    part('box',left,top,z+.21,across*1.18,.075,.075,cedar,p.wood);
    for(let j=0;j<3;j++)part('dyeCloth',left+(j-1)*across*.333,top-.77,z+.22,across*.31,1.5,1,
      j===1?'#f4e1c3':'#fff8e8',art.indigo);
  } else if(craft==='brew') {
    for(const side of [-1,1]){
      part('box',side*x,.91,z,panel,.85,.067,'#f4ebd4',art.namako);
      part('box',side*x,1.36,z+.02,panel+.04,.055,.12,iron,p.wood);
    }
    part('ball',-x,top-.65,z+.34,.37,.39,.36,'#78794e',p.thatch);
    part('round',-x,top-.19,z+.32,.017,.21,.017,straw,p.wood);
  } else if(craft==='rice'||craft==='net'||craft==='tea') {
    part('box',-x,top-.70,z,panel*.84,1.33,.07,craft==='net'?'#ada482':'#d3ba8a',art.reed);
    for(const y of [-1.38,-.03])part('box',-x,top+y,z+.02,panel*.94,.08,.10,cedar,p.wood);
  } else if(craft==='ink'||craft==='lodge'){
    // Carved transom with staggered lozenges, open between the timbers.
    const dz=d/2+.14, wid=door*.95;
    for (const h of [top-.31,top])part('box',0,h,dz,wid,.048,.085,iron,p.wood);
    for(let j=-5;j<=5;j++)part('box',j*wid/11,top-.15,dz,.052,.32,.074,cedar,p.wood);
  }
}
