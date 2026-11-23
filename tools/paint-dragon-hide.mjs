import { dragonRings } from '../two/dragon-anatomy.js';

// Sumi on warm paper, laid out in the sculpt's cylindrical UVs. The first
// quarter-turn is the backbone, the third the belly. Each flank meets its
// neighbour at the extremities, including across the texture seam.
const width = 1024, height = 256;

function fillPath(g, color, draw) {
  g.fillStyle = color;
  g.beginPath();
  draw();
  g.closePath();
  g.fill();
}

// A loaded stroke swells at the wrist and ends in a dry, narrow point.
function stroke(g, color, x, y, cx, cy, ex, ey, pressure) {
  const length = Math.hypot(ex-x, ey-y) || 1;
  const nx = -(ey-y)/length * pressure, ny = (ex-x)/length * pressure;
  fillPath(g, color, () => {
    g.moveTo(x,y);
    g.quadraticCurveTo(cx+nx,cy+ny,ex,ey);
    g.quadraticCurveTo(cx-nx*.5,cy-ny*.5,x,y);
  });
}

function flank(g, paint, width) {
  for (const [origin, sign] of [[64,1],[64,-1],[320,-1]]) {
    g.save();
    g.translate(0,origin);
    g.scale(1,sign);
    g.beginPath();
    g.rect(0,0,width,128);
    g.clip();
    paint();
    g.restore();
  }
}

// A plate spans one angular row and about one and a half row heights along
// the spine. Put ink at that physical pitch on the arc-length UV, including
// the closely spaced, fine plates of the whiplash immediately before the tuft.
function plateColumns(width) {
  const last=dragonRings.at(-1), pixelsPerUnit=width/last.distance, columns=[];
  let ring=0;
  for (let x=0; x<width+48;) {
    const distance=Math.min(last.distance,x/pixelsPerUnit);
    while (ring<dragonRings.length-2 && dragonRings[ring+1].distance<distance) ring++;
    const a=dragonRings[ring], b=dragonRings[ring+1];
    const f=(distance-a.distance)/(b.distance-a.distance);
    const radius=(Math.hypot(a.rx,a.ry)*(1-f)+Math.hypot(b.rx,b.ry)*f)/Math.SQRT2;
    const rowHeight=2*Math.PI*radius*17/height;
    const step=Math.max(2.5,1.40*rowHeight*pixelsPerUnit);
    columns.push({x,step}); x+=step;
  }
  return columns;
}

function scales(g, random, width, columns) {
  const wash = g.createLinearGradient(0,0,0,128);
  for (const [where, color] of [[0,'#424e4a'],[.15,'#657773'],[.47,'#9ca89b'],
    [.69,'#b4b6a1'],[.84,'#cfccb5'],[1,'#ece3ce']]) wash.addColorStop(where,color);
  g.fillStyle = wash;
  g.fillRect(0,0,width,128);

  // Follow the overlapping lips from the tail toward the neck. Each outlined
  // shell has a darker root and a broken, reserved-paper highlight near its rim.
  for (const [col,{x,step}] of columns.entries()) {
    g.save();g.translate(x,0);g.scale(step/24,1);
    for (let row=-1;row<6;row++) {
      const y=7+row*17+(col%2)*8.5+1.3*Math.sin(col*.82+row*.7);
      const a=(random()-.5)*1.8, tilt=1.2*Math.sin(col*.53);
      const tone=random();
      g.globalAlpha=.30+tone*.16;
      fillPath(g,tone>.79?'#b2b9a6':tone<.25?'#66796e':'#879a8c',()=>{
        g.moveTo(a+9,y-9);
        g.bezierCurveTo(a+4,y-7,a-8,y-3+tilt,a-7.5,y+tilt);
        g.bezierCurveTo(a-7.6,y+4+tilt,a+6,y+10,a+10,y+10);
        g.quadraticCurveTo(a+14,y,a+9,y-9);
      });
      g.globalAlpha=.78+random()*.21;
      fillPath(g,tone<.21?'#50604f':'#35453f',()=>{
        g.moveTo(a+9.4,y-8.7);
        g.bezierCurveTo(a+1.9,y-7.8,a-7.2,y-4.2+tilt,a-7.5,y+tilt);
        g.bezierCurveTo(a-7.2,y+3.8+tilt,a+2.4,y+8.6,a+9.2,y+9.4);
        g.bezierCurveTo(a+1.7,y+6.5,a-4.4,y+2.9+tilt,a-4.9,y+tilt);
        g.quadraticCurveTo(a-4.8,y-2.4+tilt,a+9.4,y-8.7);
      });
      if(tone>.30) {
        g.globalAlpha=.62;
        stroke(g,'#e2ddc2',a-3,y+tilt+1,a,y+4,a+5.3,y+6,1.4);
      }
      if(tone>.75) {
        g.globalAlpha=.48;
        stroke(g,'#50665a',a+.4,y-1.4,a+2.7,y-3.4,a+6.4,y-4,.9);
      }
    }
    g.restore();
  }
  g.globalAlpha=1;

  // The creases of the wide abdominal scutes pivot toward the midline. They
  // close in at the same cadence as the flank plates and meet under the tail.
  const bellyY=x=>89+3.1*Math.sin(x/width*28+.7)+1.3*Math.sin(x/width*59);
  fillPath(g,wash,()=>{
    g.moveTo(-1,132);
    for(let x=-1;x<=width+4;x+=4) g.lineTo(x,bellyY(x));
    g.lineTo(width+4,132);
  });
  for (const {x,step} of columns) {
    const y=bellyY(x);
    g.save();g.translate(x,0);g.scale(step/24,1);
    stroke(g,'#4a554b',-1,y,12,bellyY(x+step*.5)-1.1,24.8,bellyY(x+step),3.2);
    stroke(g,'#e2d9bf',.4,y+2.6,12,bellyY(x+step*.5)+3.8,22.5,bellyY(x+step)+2.8,1.2);
    stroke(g,'#585c50',7.1,y+.6,-5.9,y+13,-6.7,131,3.2);
    stroke(g,'#c1bda5',9.1,y+2,-3.2,y+18,-4,130,2.6);
    g.restore();
  }
}

function face(g) {
  const wash=g.createLinearGradient(0,0,0,128);
  for(const [pos,color] of [[0,'#68796e'],[.21,'#9ba895'],[.51,'#bfc1a7'],[.75,'#d8d0b6'],[1,'#e4d9bf']]) wash.addColorStop(pos,color);
  g.fillStyle=wash; g.fillRect(0,0,width,128);
  // Over the temples the markings follow the eye socket as the cheek turns
  // under the jaw. The bone of the muzzle remains reserved paper.
  const strokes = [
    [24,27,165,53,256,37,10], [62,12,160,31,264,25,6],
    [103,74,233,60,311,35,9], [120,84,269,66,330,43,3.5],
    [155,103,278,90,350,64,8], [190,115,289,106,353,83,3],
    [287,19,345,12,394,28,7], [311,25,355,20,393,32,3],
    [425,26,482,10,566,15,5], [448,33,486,22,534,23,2.4],
    [428,63,496,80,573,56,8], [474,68,537,73,598,52,3],
    [536,92,657,75,786,81,5], [556,99,672,84,729,87,2.4],
    [763,34,817,30,858,36,4], [796,42,839,40,868,46,2.5],
  ];
  for(const [x,y,cx,cy,ex,ey,w] of strokes) {
    stroke(g,'#d6d1b4',x,y+3,cx,cy+3,ex,ey+2,w*1.2);
    stroke(g,'#46574c',x,y,cx,cy,ex,ey,w);
  }
  // Broken crescent marks over the nose and along the lip.
  for(const [x,y,r] of [[707,70,4],[746,67,3],[773,72,4.1],[807,70,2.8],[842,66,3.4],[864,73,2.7],[891,68,3.4]]) {
    stroke(g,'#596458',x-r,y,x,y-r*1.5,x+r,y+.2,r*.95);
  }
}

export function paintDragonHide(g, part, seed) {
  // The generic painter uses a 768×384 drawing area. Give the long body
  // twice its resolution in the longitudinal direction.
  g.save();
  const sheetWidth=part==='body' ? 2048 : width;
  const columns=part==='body' ? plateColumns(sheetWidth) : null;
  g.scale(768/sheetWidth,384/height);
  flank(g,()=>{
    if(part==='face') face(g);
    else scales(g,seed(11037),sheetWidth,columns);
  },sheetWidth);
  g.restore();
}
