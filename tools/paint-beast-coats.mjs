// Paint the original emaki pigment maps in a browser, then export to WebP.
// X follows the spine towards the nose. Y is one revolution around the pelt,
// with the left and right flanks meeting the spine at 1/4 of a revolution.
import { seeded } from '../two/terrain.js';
const TAU=Math.PI*2;
const pigment={monkey:'#87664e',bird:'#e6e0cc',fox:'#bd6d3f',tiger:'#c08640',dragon:'#547c74',kirin:'#8a9f86'};

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

function fill(g,color,draw) {
  g.fillStyle=color;g.beginPath();draw();g.closePath();g.fill();
}
function stroke(g,color,x,y,a,b,c,d,width) {
  g.strokeStyle=color;g.lineWidth=width;g.beginPath();g.moveTo(x,y);g.quadraticCurveTo(a,b,c,d);g.stroke();
}
function flick(g,x,y,length,fall,width,color) {
  fill(g,color,()=>{
    g.moveTo(x,y);
    g.bezierCurveTo(x+length*.31,y-width,x+length*.65,y+fall-.7*width,x+length,y+fall);
    g.bezierCurveTo(x+length*.66,y+fall+width*.42,x+length*.28,y+width*.59,x,y);
  });
}
// Reflect a wash through the spine and repeat across the wrap seam. The two
// flanks read consistently when an animal wheels round in the procession.
function flanks(g,paint) {
  for(const [origin,dir] of [[96,1],[96,-1],[480,-1]]) {
    g.save();g.translate(0,origin);g.scale(1,dir);
    g.beginPath();g.rect(-30,0,835,192);g.clip();paint();g.restore();
  }
}
function tiger(g) {
  flanks(g,()=>{
    const tawny=g.createLinearGradient(0,0,0,190);
    tawny.addColorStop(0,'#a46936');tawny.addColorStop(.26,'#bd803b');
    tawny.addColorStop(.59,'#dca458');tawny.addColorStop(.77,'#dfbb7b');
    tawny.addColorStop(.94,'#f0d7aa');
    g.fillStyle=tawny;g.fillRect(0,0,768,192);
    const bands=[[17,65,12],[80,104,16],[131,88,13],[192,129,19],
      [247,86,14],[308,119,18],[379,95,18],[458,138,19],[518,91,13],
      [574,132,21],[654,114,17],[707,90,15],[764,112,17]];
    for(const [x,depth,w] of bands) {
      const bend=Math.sin(x*.019)*25;
      fill(g,'#43392e',()=>{
        g.moveTo(x-w,-2);
        g.bezierCurveTo(x-w*.8,depth*.32,x+bend-w,depth*.41,x+bend-3,depth*.66);
        g.quadraticCurveTo(x+bend+20,depth*.88,x+bend+7,depth+8);
        g.bezierCurveTo(x+bend+33,depth*.80,x+bend+8,depth*.53,x+8,depth*.4);
        g.quadraticCurveTo(x+24,depth*.23,x+w,-2);
      });
      if(w>15) {
        fill(g,'#43392e',()=>{
          g.moveTo(x+bend-1,depth*.54);g.quadraticCurveTo(x-32,depth*.61,x-27,depth*.96);
          g.quadraticCurveTo(x-21,depth*.71,x+bend+8,depth*.64);
        });
        flick(g,x-25,depth+18,19,-15,2.7,'#8f6038');
      }
    }
    stroke(g,'#826036',8,158,158,185,244,151,2.1);
    stroke(g,'#976c42',548,160,585,152,635,113,2.5);
  });
}
function fox(g) {
  flanks(g,()=>{
    const grad=g.createLinearGradient(0,0,0,192);
    for(const [y,c] of [[0,'#87482e'],[.25,'#b96634'],[.57,'#cf854c'],[.83,'#dbad74'],[1,'#eee1bf']])grad.addColorStop(y,c);
    g.fillStyle=grad;g.fillRect(0,0,768,192);
    fill(g,'#ead9b3',()=>{
      g.moveTo(0,160);g.bezierCurveTo(119,154,158,144,204,146);
      g.lineTo(174,149);g.quadraticCurveTo(334,138,487,151);g.lineTo(459,156);
      g.quadraticCurveTo(603,136,702,95);g.lineTo(679,110);g.lineTo(768,81);
      g.lineTo(768,194);g.lineTo(0,194);
    });
    for(let i=0;i<18;i++) {
      const x=65+i*37, y=22+14*Math.sin(i*.48);
      flick(g,x,y,-34-(i%3)*6,10,2.5,'#965431');
      flick(g,x+5,y+8,-25,9,1.7,'#db9b59');
    }
    for(let i=0;i<16;i++)flick(g,492+i*14,120-i*.9,-20,13,1.5,'#a7794f');
  });
}
function scales(g,kind) {
  const kirin=kind==='kirin';
  flanks(g,()=>{
    const base=g.createLinearGradient(0,0,0,192);
    for(const [n,c] of kirin?[[0,'#6e7562'],[.35,'#74998c'],[.67,'#a9af83'],[.84,'#d7bd80'],[1,'#ead09a']]:
      [[0,'#385951'],[.33,'#557a72'],[.68,'#89a995'],[.79,'#bcba8a'],[1,'#e3c392']])base.addColorStop(n,c);
    g.fillStyle=base;g.fillRect(0,0,768,192);
    const dx=kirin?40:23,dy=kirin?27:22;
    for(let j=0;j<Math.ceil(140/dy);j++)for(let k=-1;k<Math.ceil(768/dx)+1;k++) {
      const x=k*dx+(j%2)*dx*.49,y=j*dy+5;
      const fade=kirin?.62:.72;
      g.globalAlpha=fade;
      fill(g,j%3===0?(kirin?'#7e9983':'#668577'):(kirin?'#a0b398':'#708e79'),()=>{
        g.moveTo(x-dx*.48,y);g.quadraticCurveTo(x,y+dy*.6,x+dx*.52,y);
        g.bezierCurveTo(x+dx*.35,y+dy*.66,x+dx*.28,y+dy*.90,x,y+dy);
        g.quadraticCurveTo(x-dx*.36,y+dy*.77,x-dx*.48,y);
      });
      g.globalAlpha=1;
      stroke(g,kirin?'#796740':'#435e53',x-dx*.47,y,x-dx*.27,y+dy*.8,x,y+dy,2.1);
      stroke(g,kirin?'#796740':'#435e53',x,y+dy,x+dx*.37,y+dy*.72,x+dx*.51,y,1.8);
      stroke(g,kirin?'#e0c886':'#b2c4a3',x-dx*.33,y+3,x-dx*.26,y+dy*.51,x-dx*.04,y+dy*.73,2.6);
    }
    if(!kirin)for(let i=-1;i<45;i++){
      const x=i*22;stroke(g,'#9c8e6c',x,143,x-7,166,x-13,191,2.4);
    }
  });
}
function tail(g,rng) {
  g.fillStyle='#bd7444';g.fillRect(0,0,768,384);
  fill(g,'#eadcba',()=>{
    g.moveTo(816,-8);g.lineTo(445,-8);
    for(let i=0;i<=72;i++){const y=i*384/72;g.lineTo(449+27*Math.sin(y*TAU/192)+20*Math.cos(i*2.9),y);}
    g.lineTo(800,396);
  });
  for(let i=0;i<1400;i++){
    const x=rng()*768,y=rng()*384,len=6+rng()*28;
    flick(g,x,y,len,2+4*Math.sin(y*TAU/384),.6+rng()*1.5,x>457?'#c3b08d':i%3?'#9d5b38':'#deb682');
  }
}
function down(g,rng) {
  flanks(g,()=>{
    for(let i=0;i<170;i++){
      const x=32+rng()*740,y=rng()*144;
      flick(g,x,y,-12-rng()*35,4+rng()*9,1.6,'#b0a998');
      flick(g,x+2,y+3,-11-rng()*24,5,1.7,'#f2ecda');
    }
  });
}

export function paintBeastCoat(type,part) {
  const canvas=document.createElement('canvas');canvas.width=1024;canvas.height=512;
  const g=canvas.getContext('2d');g.scale(4/3,4/3);g.lineCap=g.lineJoin='round';
  const rng=seeded(318+type.charCodeAt(2)*103+part.charCodeAt(0));
  g.fillStyle=pigment[type];g.fillRect(0,0,768,384);
  if(part==='wing')vanes(g,rng);
  else if(part==='leg')legs(g,type);
  else if(part==='face')paintMask(g,type);
  else if(part==='brush')tail(g,rng);
  else if(type==='tiger')tiger(g);
  else if(type==='fox')fox(g);
  else if(type==='kirin'||type==='dragon')scales(g,type);
  else if(type==='bird')down(g,rng);
  else {
    flanks(g,()=>{
      for(let i=0;i<550;i++) {
        const x=rng()*768,y=rng()*192;
        flick(g,x,y,-9-rng()*17,3+rng()*6,1.5,i%4?'#75533f':'#b69c7c');
      }
    });
  }
  // Broken fibres and blooms are layered last so the deposits continue over
  // the mask, stripes and shell markings instead of showing a tiled noise field.
  for(let i=0;i<13000;i++){
    const x=rng()*768,y=rng()*384;
    stroke(g,i%3?'rgba(61,43,32,.065)':'rgba(255,242,208,.17)',x,y,x+2,y-.4,x+1+rng()*6,y+rng()*.8,.5+rng());
  }
  return canvas;
}

function legs(g,kind) {
  const gradient=g.createLinearGradient(0,0,768,0);
  const colors=kind==='tiger'?[[0,'#b48445'],[.41,'#c59450'],[.72,'#bd8749'],[1,'#c49760']]:
    kind==='fox'?[[0,'#bf7946'],[.43,'#ba7546'],[.63,'#975c3c'],[.81,'#66503e'],[1,'#5d493d']]:
      [[0,'#b8a875'],[.43,'#c9ae73'],[.74,'#c9ad76'],[1,'#8a795c']];
  for(const [t,c] of colors)gradient.addColorStop(t,c);
  g.fillStyle=gradient;g.fillRect(0,0,768,384);
  flanks(g,()=>{
    if(kind==='tiger'){
      for(const [x,y,depth] of [[92,28,76],[170,5,92],[248,26,76],[332,13,80],[424,27,64],[540,34,47]]){
        fill(g,'#554533',()=>{g.moveTo(x-23,y-29);g.quadraticCurveTo(x+18,y+27,x-8,y+depth);
          g.bezierCurveTo(x+47,y+47,x+19,y+8,x+10,y-26);});
      }
    }else for(let i=0;i<110;i++){
      const x=(i*53)%768,y=(i*31)%192;
      flick(g,x,y,19,3+7*Math.sin(i),1.2,kind==='fox'?x<460?'#aa7049':'#755840':'#b69a65');
    }
  });
}

// A feather's barbs all fan from the rachis towards the trailing edge.
// Four pigment deposits occupy guarded horizontal strips for the merged wing.
function vanes(g,rng) {
  const swatches=[
    ['#e7e0cd','#d4cbb4','#eee8d6','#bab098','#f1ebd9'],
    ['#d6d0be','#c2bca8','#e2ddcb','#a99f8a','#e7e0ca'],
    ['#929184','#74786c','#a2a197','#64695d','#beb9a3'],
    ['#50534d','#444741','#62655a','#393f39','#898a79']
  ];
  swatches.forEach(([base,edge,light,ink,shaft],i)=>{
    g.save();g.translate(0,i*96);
    g.beginPath();g.rect(0,0,768,96);g.clip();
    const gradient=g.createLinearGradient(0,0,0,96);
    for(const [t,c] of [[0,edge],[.29,base],[.48,light],[.51,edge],[.83,base],[1,edge]])gradient.addColorStop(t,c);
    g.fillStyle=gradient;g.fillRect(0,0,768,96);
    for(let j=0;j<90;j++)for(const s of [-1,1]) {
      const x=j*9-30+4*rng(),w=.55+rng()*.85,reach=18+35*rng();
      g.globalAlpha=.32+.32*rng();
      stroke(g,j%4?light:ink,x,48+s*2,x+8,48+s*13,x+reach,48+s*(35+14*rng()),w);
    }
    g.globalAlpha=1;flick(g,0,49,765,-1.5,1.5,ink);flick(g,0,47.8,743,-.3,1.8,shaft);
    g.restore();
  });
}
