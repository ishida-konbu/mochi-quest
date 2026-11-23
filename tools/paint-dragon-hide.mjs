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

function scales(g, random, width) {
  const wash = g.createLinearGradient(0,0,0,128);
  for (const [where, color] of [[0,'#424e4a'],[.15,'#657773'],[.47,'#9ca89b'],
    [.69,'#b4b6a1'],[.84,'#cfccb5'],[1,'#ece3ce']]) wash.addColorStop(where,color);
  g.fillStyle = wash;
  g.fillRect(0,0,width,128);

  // The rear lip of each scale overlaps the preceding column. Their size
  // grows into the shoulder and contracts round the slender tip of the tail.
  let x=-22;
  for (let col=0; x<width+40; col++) {
    const step=21+13*Math.sin(Math.PI*Math.max(0,x)/width*.82);
    for (let row=-1; row<6; row++) {
      const y=7+row*17+(col%2)*8.5+1.5*Math.sin(col*.82+row*.7);
      const a=x+(random()-.5)*2.8, tilt=1.5*Math.sin(col*.53);
      const tone=random();
      const pigment=tone>.79?'#a9b2a0':tone<.25?'#697b74':'#879a8c';
      g.globalAlpha=.30+tone*.16;
      fillPath(g,pigment,()=>{
        g.moveTo(a+step*.38,y-9);
        g.bezierCurveTo(a-1,y-5,a-step*.31,y+tilt-4,a-step*.29,y+tilt);
        g.bezierCurveTo(a-step*.29,y+tilt+4,a+step*.25,y+10,a+step*.42,y+10);
        g.quadraticCurveTo(a+step*.60,y,a+step*.38,y-9);
      });
      g.globalAlpha=.78+random()*.21;
      fillPath(g,tone<.21?'#4f5a51':'#35453f',()=>{
        g.moveTo(a+step*.39,y-8.7);
        g.bezierCurveTo(a+step*.08,y-7.8,a-step*.30,y-4.2+tilt,a-step*.31,y+tilt);
        g.bezierCurveTo(a-step*.30,y+3.8+tilt,a+step*.10,y+8.6,a+step*.38,y+9.4);
        g.bezierCurveTo(a+step*.07,y+6.7,a-step*.18,y+2.8+tilt,a-step*.21,y+tilt);
        g.quadraticCurveTo(a-step*.20,y-2.3+tilt,a+step*.39,y-8.7);
      });
      if(tone>.30) {
        g.globalAlpha=.58;
        stroke(g,'#e2ddc2',a-step*.12,y+tilt+1,a,y+4,a+step*.22,y+6,1.4);
      }
      if(tone>.79) {
        g.globalAlpha=.52;
        stroke(g,'#53665b',a+1,y-2,a+3,y-4,a+step*.22,y-4,.85);
      }
    }
    x+=step;
  }
  g.globalAlpha=1;

  // One pale run of articulated belly shields crosses both flanks. A narrow
  // double contour and the heavier, shorter creases read from the ground.
  const bellyY=x=>88+5*Math.sin(x*.010+.7)+2*Math.sin(x*.021);
  fillPath(g,wash,()=>{
    g.moveTo(-1,132);
    for(let x=-1;x<=width+4;x+=4) g.lineTo(x,bellyY(x));
    g.lineTo(width+4,132);
  });
  for(let x=-4;x<width;x+=48) {
    stroke(g,'#4a554b',x,bellyY(x),x+23,bellyY(x+23)-1.2,x+49,bellyY(x+49),3.5);
    stroke(g,'#e2d9bf',x,bellyY(x)+3,x+30,bellyY(x+30)+4,x+47,bellyY(x+47)+3,1.3);
  }
  for(let x=-26; x<width+25; x+=27+7*Math.sin(Math.PI*Math.max(0,x)/width)) {
    const y=bellyY(x);
    stroke(g,'#595a4c',x+8,y+.8,x-9,y+14,x-8,133,3.6);
    stroke(g,'#c4bd9f',x+11,y+2,x-6,y+20,x-5,130,3);
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
  const sheetWidth=part==='body' ? width*(1+2*.407) : width;
  g.scale(768/sheetWidth,384/height);
  flank(g,()=>{
    if(part==='face') face(g);
    else scales(g,seed(11037),sheetWidth);
  },sheetWidth);
  g.restore();
}
