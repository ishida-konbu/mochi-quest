import { CanvasTexture, SRGBColorSpace } from './vendor/three.module.min.js';

const width=512, height=216;
// The highlight on each middle crest is the spot that catches the sole.
const crest=[217/width, 1-47/height];

// Each bank has a different silhouette and a different turn of the wind. The
// slits in the skirts are bare sky between two streams of vapour.
const clouds=[
  {
    bank:'M12 145 C49 152 83 141 110 120 C125 108 141 99 158 104 C147 96 142 93 128 96 C146 77 173 73 190 81 C184 64 196 47 217 47 C235 47 246 59 247 73 C266 57 290 59 302 75 C319 72 332 80 340 91 C366 64 408 75 415 96 C438 90 451 104 457 112 C472 116 486 109 500 104 C483 128 460 137 433 134 C421 151 397 157 370 149 C341 175 294 166 273 155 C245 162 222 191 171 179 C143 173 123 172 100 180 C120 164 148 159 177 168 C198 174 217 165 231 156 C209 163 195 163 174 157 C133 144 106 174 72 169 C88 164 101 158 111 149 C80 157 41 165 12 145Z',
    shade:'M15 148 Q81 155 119 130 C147 112 159 122 173 133 C196 153 220 137 239 125 C262 111 279 128 291 139 C305 148 326 148 343 141 C373 129 375 118 373 112 C388 126 406 129 425 121 C453 110 459 124 500 104 L515 201 L0 201Z',
    rim:[[[23,148],[55,150],[89,140],[113,122],[136,110],[151,108]],
      [[159,94],[175,84],[190,84],[189,69],[197,55],[212,48],[228,50],[240,61],[245,73]],
      [[249,72],[267,65],[285,66],[301,78],[322,79],[334,87]],
      [[339,94],[357,82],[378,78],[398,82],[410,93]],
      [[276,156],[298,162],[323,165],[347,161],[369,149]]],
    rolls:[[[87,147],[112,136],[140,117],[158,114],[173,121],[180,134],[194,139],[210,133],[217,122],[215,112],[206,108],[199,113],[201,118]],
      [[241,106],[255,91],[274,85],[291,91],[299,105],[304,114],[318,117],[331,112],[338,103],[336,96],[330,94]],
      [[354,134],[376,121],[389,108],[406,106],[423,115],[438,118],[452,115]],
      [[103,178],[133,169],[155,168],[180,175],[202,175],[225,166],[245,153],[262,147]]],
    blooms:[[168,130,55,21],[297,128,64,28],[397,116,44,20]],
    vapour:[[[15,157],[38,161],[60,160],[80,155]],[[328,172],[352,166],[378,160],[402,161],[426,153]]],
  },
  {
    bank:'M13 129 C54 140 77 130 108 114 C128 104 153 111 171 91 C155 95 145 95 134 92 C159 88 179 74 185 64 C193 52 202 47 217 47 C236 47 251 62 251 78 C265 64 291 68 300 81 C320 49 350 48 369 61 C384 70 390 84 388 95 C412 86 432 94 438 111 C458 124 477 119 499 107 C487 126 466 140 438 139 C427 154 404 167 378 156 C349 171 323 163 301 152 C273 151 251 176 223 177 C199 180 179 162 152 168 C124 172 111 187 80 182 C103 177 118 161 143 155 C111 155 88 169 56 166 C77 158 90 143 112 139 C73 150 44 154 13 129Z',
    shade:'M12 134 C73 151 106 121 142 122 C161 123 177 132 186 141 C207 157 224 141 245 122 C265 104 284 112 299 130 C313 148 344 148 359 130 C372 114 383 111 398 119 C419 133 439 124 455 120 L512 106 L512 207 L0 206Z',
    rim:[[[19,133],[49,140],[75,137],[104,122],[133,114]],
      [[159,91],[179,78],[187,65],[201,51],[217,47],[236,54],[247,67],[251,78]],
      [[302,76],[317,61],[336,56],[356,57],[374,68],[384,83]],
      [[390,97],[405,92],[421,95],[432,105]],
      [[297,153],[322,161],[347,163],[365,160],[379,155]]],
    rolls:[[[63,151],[91,141],[117,128],[147,121],[165,118],[178,108],[182,96],[190,86],[203,84],[213,92],[211,102],[205,104]],
      [[157,145],[177,141],[195,145],[214,154],[229,152],[247,137],[266,127],[280,126]],
      [[268,105],[289,97],[306,101],[322,114],[339,114],[352,105],[353,96],[347,90],[341,91],[338,96]],
      [[378,146],[399,138],[413,126],[428,123],[444,127],[461,127],[478,120]]],
    blooms:[[175,133,76,24],[282,126,60,27],[378,127,49,22]],
    vapour:[[[24,151],[47,154],[72,151]],[[112,185],[136,174],[158,171],[181,175]],[[394,166],[417,160],[434,150],[448,146]]],
  },
  {
    bank:'M12 153 C55 152 81 135 105 122 C124 111 145 107 163 112 C146 105 134 106 122 108 C137 92 152 86 169 91 C166 78 177 65 190 65 C196 53 203 47 217 47 C236 46 253 58 254 74 C274 57 299 66 307 81 C329 75 348 84 355 98 C368 79 390 77 403 87 C415 96 418 104 417 111 C439 97 454 112 464 116 C478 119 485 108 499 101 C492 125 464 140 435 134 C412 156 389 151 371 146 C356 166 327 171 300 158 C279 158 260 184 225 180 C202 177 193 169 173 169 C147 166 128 183 109 181 C122 175 139 163 159 158 C118 162 92 169 62 163 C83 161 102 150 116 146 C76 152 49 172 12 153Z',
    shade:'M16 155 C64 156 100 136 133 132 C154 130 161 145 186 146 C212 146 223 129 237 119 C248 112 260 114 274 128 C295 148 320 154 342 137 C358 123 372 115 385 121 C409 131 428 121 447 118 L514 113 L514 206 L0 206Z',
    rim:[[[17,155],[48,155],[80,144],[106,127],[134,117],[152,117]],
      [[145,97],[161,93],[171,95],[171,80],[179,69],[190,66],[201,52],[217,47],[235,51],[248,62],[253,73]],
      [[255,75],[274,67],[290,70],[305,82],[320,81],[336,86]],
      [[354,101],[369,85],[387,82],[401,89],[412,102]],
      [[300,157],[322,164],[345,161],[360,153],[370,147]]],
    rolls:[[[76,155],[101,146],[130,137],[153,138],[174,143],[190,140],[201,128],[202,117],[195,110],[186,112],[183,119]],
      [[209,105],[225,91],[240,91],[255,103],[272,109],[286,107],[299,96]],
      [[270,143],[292,137],[311,123],[325,111],[341,111],[353,122],[370,125],[384,117],[389,109],[386,102],[380,102]],
      [[132,174],[152,167],[174,166],[199,171],[222,175],[243,171],[264,157]]],
    blooms:[[161,134,60,24],[262,129,48,23],[363,132,67,24]],
    vapour:[[[21,164],[42,167],[65,163]],[[308,171],[334,171],[357,162]],[[404,153],[423,146],[441,142],[457,143],[474,137]]],
  },
];

// Lay a brush on its side, increasing the width under pressure and letting
// the unloaded tip run to nothing. The line remains legible in the mipmaps.
function brush(g,knots,ink,weight) {
  const points=[];
  for(let j=0;j<knots.length-1;j++) {
    const a=knots[Math.max(0,j-1)], b=knots[j], c=knots[j+1], d=knots[Math.min(knots.length-1,j+2)];
    for(let i=0;i<7;i++) {
      const t=i/7,t2=t*t,t3=t*t2;
      points.push(b.map((v,k)=>.5*((2*v)+(-a[k]+c[k])*t+(2*a[k]-5*v+4*c[k]-d[k])*t2+(-a[k]+3*v-3*c[k]+d[k])*t3)));
    }
  }
  points.push(knots.at(-1));
  const edge=[],other=[];
  for(let i=0;i<points.length;i++) {
    const u=i/(points.length-1),prev=points[Math.max(0,i-1)],next=points[Math.min(points.length-1,i+1)];
    const dx=next[0]-prev[0],dy=next[1]-prev[1];
    const w=weight*Math.sin(Math.PI*u**.78)**.66*(.80+.19*Math.sin(7.9*u-.4))/Math.max(.01,Math.hypot(dx,dy));
    edge.push([points[i][0]-dy*w,points[i][1]+dx*w]);
    other.push([points[i][0]+dy*w,points[i][1]-dx*w]);
  }
  g.beginPath();
  for(const [x,y] of edge.concat(other.reverse()))g.lineTo(x,y);
  g.closePath();g.fillStyle=ink;g.fill();
}

function paint(g,art) {
  const bank=new Path2D(art.bank),shade=new Path2D(art.shade);
  const paper=g.createLinearGradient(0,45,0,182);
  paper.addColorStop(0,'rgba(252,246,225,.83)');
  paper.addColorStop(.43,'rgba(243,236,212,.72)');
  paper.addColorStop(.72,'rgba(225,219,198,.63)');
  paper.addColorStop(1,'rgba(160,166,150,.56)');
  g.save();
  g.fillStyle=paper;
  // A pale capillary rim around the denser pigment softens its wet edge.
  g.shadowBlur=4;g.shadowColor='rgba(203,201,179,.34)';g.fill(bank);g.restore();
  g.save();g.clip(bank);
  const pool=g.createLinearGradient(0,101,0,183);
  pool.addColorStop(0,'rgba(119,128,117,.03)');
  pool.addColorStop(.52,'rgba(110,123,113,.29)');
  pool.addColorStop(.85,'rgba(88,104,98,.49)');
  pool.addColorStop(1,'rgba(111,124,114,.14)');
  g.fillStyle=pool;g.filter='blur(3px)';g.fill(shade);g.filter='none';
  // Backruns spread the dilute ink unevenly around the lower side of each
  // lobe. Painting through the same bank mask keeps the lifted margins airy.
  for(const [x,y,rx,ry] of art.blooms) {
    g.save();g.translate(x,y);g.scale(rx,ry);
    const backrun=g.createRadialGradient(-.18,-.12,.04,0,0,1);
    backrun.addColorStop(0,'rgba(108,123,120,.15)');
    backrun.addColorStop(.48,'rgba(105,119,113,.35)');
    backrun.addColorStop(.68,'rgba(117,130,121,.31)');
    backrun.addColorStop(1,'rgba(146,151,136,0)');
    g.fillStyle=backrun;g.fillRect(-1,-1,2,2);g.restore();
  }
  g.restore();
  // The dark underside of a coil and the pale, exposed upper lip of the
  // preceding plane meet on only part of a turn.
  for(const p of art.rolls) {
    g.save();g.translate(0,2.8);brush(g,p,'rgba(119,130,119,.28)',3.4);g.restore();
    g.save();g.translate(0,-1.8);brush(g,p,'rgba(255,249,227,.68)',2.15);g.restore();
    brush(g,p,'rgba(72,81,71,.81)',2.05);
  }
  for(const p of art.rim)brush(g,p,'rgba(78,85,73,.80)',2.30);
  for(const p of art.vapour) {
    g.save();g.translate(0,1);brush(g,p,'rgba(247,239,214,.59)',2.7);g.restore();
    brush(g,p,'rgba(106,119,106,.56)',1.30);
  }
}

// Deterministic flecks in the wash and tiny pinholes where the brush ran dry.
// The world shows through the paint itself, including along the ragged edges.
function dryInk(canvas) {
  const g=canvas.getContext('2d',{willReadFrequently:true});
  const image=g.getImageData(0,0,canvas.width,canvas.height), p=image.data;
  const stride=Math.ceil(canvas.width/9)+1;
  const tide=new Float32Array(stride*(Math.ceil(canvas.height/6)+1));
  let seed=8581;
  function pigment() {
    seed=(Math.imul(seed,1664525)+1013904223)>>>0;
    return (seed>>>20)/4096;
  }
  for(let i=0;i<tide.length;i++)tide[i]=pigment();
  for(let k=0;k<p.length;k+=4) {
    if(!p[k+3])continue;
    const grain=pigment(),n=k/4,x=n%canvas.width,y=Math.floor(n/canvas.width);
    const cell=Math.floor(y/6)*stride+Math.floor(x/9),u=(x%9)/9,v=(y%6)/6;
    const wet=(1-v)*((1-u)*tide[cell]+u*tide[cell+1])+v*((1-u)*tide[cell+stride]+u*tide[cell+stride+1]);
    const alpha=p[k+3],fleck=grain>.970-.035*wet;
    p[k+3]=alpha*(fleck?.66:.89+.06*grain+.05*wet);
    const wash=grain*6-3+(wet-.5)*17+(fleck?7:0);
    p[k]+=wash;p[k+1]+=wash;p[k+2]+=wash*.82;
  }
  g.putImageData(image,0,0);
}

export function kirinCloudBrush() {
  const paper=document.createElement('canvas');paper.width=width*clouds.length;paper.height=height;
  const g=paper.getContext('2d',{willReadFrequently:true});
  clouds.forEach((art,i)=>{
    g.save();g.translate(width*i,0);paint(g,art);g.restore();
  });
  dryInk(paper);
  const texture=new CanvasTexture(paper);texture.colorSpace=SRGBColorSpace;
  return {texture,crests:clouds.map(()=>crest)};
}
