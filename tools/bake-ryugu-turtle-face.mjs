// Repaint the sea turtle's face with node tools/bake-ryugu-turtle-face.mjs.
// cwebp encodes the finished RGB drawing. The game only loads the WebP.
import { execFileSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';

const size=1024, tau=2*Math.PI;
const paper=Buffer.alloc(size*size*3), tooth=new Float32Array(size*size);
const clamp=(v,low=0,high=1)=>Math.max(low,Math.min(v,high));
const mix=(a,b,t)=>a+(b-a)*t;
const smooth=t=>t*t*(3-2*t);

function noise(x,y,seed) {
  let h=Math.imul(x+241,374761393)+Math.imul(y+seed,668265263);
  h=Math.imul(h^(h>>>13),1274126177);
  return ((h^(h>>>16))>>>0)/4294967296;
}
function wash(x,y,step,seed) {
  const u=x/step,v=y/step,i=Math.floor(u),j=Math.floor(v),repeat=size/step;
  const a=j%repeat,b=(j+1)%repeat,t=smooth(u-i);
  return mix(mix(noise(i,a,seed),noise(i+1,a,seed),t),
    mix(noise(i,b,seed),noise(i+1,b,seed),t),smooth(v-j))-.5;
}
function blend(index,c,amount) {
  for(let k=0;k<3;k++)paper[3*index+k]=Math.round(mix(paper[3*index+k],c[k],clamp(amount)));
}
for(let y=0;y<size;y++)for(let x=0;x<size;x++){
  const i=y*size+x,a=tau*(y+.5)/size;
  const neck=1-smooth(clamp((x-290)/320));
  const mottling=wash(x,y,64,61)*5.5+wash(x,y,16,17)*4.5;
  const grain=noise(x,y,73)-.5, fibre=wash(x/2.8,y,4,97);
  tooth[i]=grain*.60+fibre*.40;
  const light=smooth(clamp((1-Math.cos(a))*.52+.035*Math.sin(x/118)*Math.sin(a)));
  const crown=[175,174,149],ivory=[231,221,195];
  const tone=mottling+grain*6.8+fibre*4.4+neck*(wash(x,y,128,124)*5-1);
  for(let c=0;c<3;c++)paper[3*i+c]=clamp(Math.round(mix(crown[c],ivory[c],light)+tone),0,255);
}

// Diffuse pigment settles in the shallow lids, bill and the loose throat.
function stain(x,y,w,h,colour,opacity,slant=0) {
  const r=Math.ceil(3*Math.max(w,h));
  for(let py=Math.max(0,Math.floor(y-r));py<Math.min(size,y+r);py++)for(let px=Math.max(0,Math.floor(x-r));px<Math.min(size,x+r);px++){
    const dx=px-x,dy=py-y-dx*slant,d=(dx/w)**2+(dy/h)**2;
    if(d>7)continue;
    const index=py*size+px;
    blend(index,colour,opacity*Math.exp(-d)*(1+.23*wash(px,py,16,22)+.14*tooth[index]));
  }
}

// A brush load makes one pressure-shaped mark. Its local mask is deposited
// once, so ink density follows the paper even where the handle doubled back.
function stroke(points,colour,opacity=1,dry=0) {
  const r=2+Math.ceil(Math.max(...points.map(p=>p[2])));
  const x0=Math.max(0,Math.floor(Math.min(...points.map(p=>p[0])))-r);
  const y0=Math.max(0,Math.floor(Math.min(...points.map(p=>p[1])))-r);
  const x1=Math.min(size,Math.ceil(Math.max(...points.map(p=>p[0])))+r);
  const y1=Math.min(size,Math.ceil(Math.max(...points.map(p=>p[1])))+r);
  if(x1<=x0 || y1<=y0)return;
  const width=x1-x0,mask=new Float32Array(width*(y1-y0));
  for(let j=0;j<points.length-1;j++) {
    const b=points[j],c=points[j+1],a=points[Math.max(0,j-1)],d=points[Math.min(points.length-1,j+2)];
    const count=Math.ceil(Math.hypot(c[0]-b[0],c[1]-b[1])*1.5);
    for(let k=0;k<=count;k++){
      const t=k/count,q=t*t,t3=q*t;
      const [x,y,radius]=b.map((v,i)=>.5*(2*v+(-a[i]+c[i])*t+
        (2*a[i]-5*v+4*c[i]-d[i])*q+(-a[i]+3*v-3*c[i]+d[i])*t3));
      const half=Math.max(.15,radius);
      for(let py=Math.max(y0,Math.floor(y-half-1));py<Math.min(y1,y+half+1);py++)
        for(let px=Math.max(x0,Math.floor(x-half-1));px<Math.min(x1,x+half+1);px++){
          const index=py*size+px,edge=half+.55-Math.hypot(px+.5-x,py+.5-y);
          const cover=clamp(edge+tooth[index]*Math.min(1,half*.40));
          const at=(py-y0)*width+px-x0;
          if(cover>mask[at])mask[at]=cover;
        }
    }
  }
  for(let y=y0;y<y1;y++)for(let x=x0;x<x1;x++){
    const m=mask[(y-y0)*width+x-x0];
    if(!m)continue;
    const index=y*size+x,skips=dry*clamp((tooth[index]-.10)*2.5);
    blend(index,colour,opacity*m*(1-skips));
  }
}

const soot=[51,49,42],tea=[110,101,78],sage=[137,130,104],bone=[229,219,191];
function flank(sign){
  const ym=y=>sign===1?y:size-y;
  const dx=sign===1?0:-6,dy=sign===1?0:3;
  function brush(points,colour=tea,opacity=.82,dry=.17){
    stroke(points.map(([x,y,w])=>[x,ym(y),w]),colour,opacity,dry);
  }
  function tint(x,y,w,h,c,o,tilt=0){stain(x,ym(y),w,h,c,o,sign*tilt);}
  // Broad reserved cheek and a slightly cooler upper bill.
  tint(702,248,155,78,bone,.38,-.12);
  tint(876,121,106,58,[136,141,116],.24,.12);
  tint(916,271,89,39,[187,179,143],.22,-.13);
  tint(798,320,160,30,[230,216,182],.34,.065);
  tint(357,319,194,48,[227,215,185],.24,-.34);
  // Pools of diluted ink lie just under two raised plate corners; their
  // edges disperse into the scroll fibre before the next shield begins.
  tint(sign===1?566:557,137,24,18,[119,116,89],.28,.38);
  tint(sign===1?846:842,96,29,11,[117,118,89],.30,.46);
  // The neck folds open on the turn of the neck. Alternate their lengths;
  // the lighter edge of each crease appears only where the skin bunches.
  const folds=sign===1?[
    [[132,152,.15],[117,176,1.1],[110,196,1.45],[112,216,.38]],
    [[135,244,.18],[143,270,1.2],[164,296,.79],[173,309,.18]],
    [[231,143,.2],[216,166,1.0],[211,181,1.4],[209,195,.25]],
    [[215,229,.22],[218,251,1.6],[230,272,2.2],[250,291,.45],[260,296,.12]],
    [[280,157,.16],[269,177,.73],[266,188,.91],[265,196,.12]],
    [[291,259,.15],[299,271,.77],[311,282,.69],[320,287,.10]],
  ]:[
    [[125,148,.14],[113,166,.82],[103,189,1.57],[102,211,.21]],
    [[119,238,.25],[129,258,1.39],[148,282,1.02],[160,296,.18]],
    [[203,150,.16],[194,168,.95],[186,187,1.22],[186,193,.15]],
    [[199,226,.24],[204,250,1.14],[220,269,2.0],[237,279,.55],[242,282,.15]],
    [[261,160,.2],[251,181,1.1],[248,196,.28]],
    [[268,256,.15],[281,277,.93],[301,290,.18]],
  ];
  for(const [i,line] of folds.entries()){
    const loaded=i===1||i===3;
    brush(line.map(([x,y,w])=>[x,y,w*(loaded?1.65:1.12)]),
      loaded?[70,67,53]:[109,107,86],loaded?.86:.57,.32);
    if(i===1 || i===3)brush(line.map(([x,y,w])=>[x+3.7,y+1,.88*w]),bone,.62,.30);
  }
  // Broken posterior scale margins. Each turn originates in the scale
  // before it and dies away into the unpainted cheek.
  const scales=sign===1?[
    [[536,99,.16],[553,107,1.36],[571,121,1.9],[580,141,.18]],
    [[579,142,.13],[565,159,1.28],[563,171,.2]],
    [[582,136,.20],[607,127,1.45],[626,126,.8],[637,132,.14]],
    [[610,186,.14],[603,200,1.04],[604,214,1.46],[614,228,.17]],
    [[557,219,.12],[563,235,1.18],[584,246,1.53],[597,248,.15]],
  ]:[
    [[529,109,.16],[550,117,1.36],[565,132,1.83],[568,145,.17]],
    [[568,146,.12],[552,160,1.1],[548,176,.19]],
    [[570,144,.22],[597,133,1.24],[620,136,.19]],
    [[615,181,.17],[604,198,1.36],[610,218,1.75],[617,226,.15]],
    [[554,220,.15],[557,236,1.1],[579,250,1.28],[597,254,.12]],
  ];
  for(const [i,line] of scales.entries()){
    const loaded=i===0 || i===3;
    brush(line.map(([x,y,w])=>[x,y,w*(loaded?1.74:1.15)]),
      loaded?[83,76,57]:tea,loaded?.86:.67,.30);
    if(i===0 || i===4)brush(line.slice(0,3).map(([x,y,w])=>[x-1,y+2.6,w*.74]),bone,.50);
  }
  // Several dry, hairline strokes feather the temporal scales and throat.
  const hatches=[[570,113,17,8],[573,110,11,6],[607,219,9,12],[611,216,8,10],
    [593,243,12,4],[596,241,8,2],[230,276,13,13],[235,276,9,7],[180,298,9,5],
    [839,362,16,-2],[838,366,10,-1]];
  for(const [x,y,w,h] of hatches){
    const shift=sign===1?0:Math.sin(x)*8;
    brush([[x+shift,y,.09],[x+shift+w*.45,y+h*.39,.60],[x+shift+w,y+h,.13]],sage,.64,.52);
  }

  // Trace the crease around a turning, tilted eye. Sparse colour in the
  // trailing corner is the animal's iris. At the nose the pupil runs into
  // the lower lid in a single dark pool, with just one softer upper return.
  const ex=765+dx,ey=191+dy;
  tint(ex-2,ey+2,42,23,[130,123,97],.26,-.21);
  const exy=(points,c,o,d=0)=>brush(points.map(([x,y,w])=>[ex+x,ey+y,w]),c,o,d);
  const margins=[
    [-33,8,8],[-29,2,10],[-22,-7,13],[-14,-12,16],[-4,-16,16],
    [6,-18,13],[15,-17,9],[22,-15,3],[29,-12,-3],[33,-11,-10],
  ];
  for(let x=-33;x<=33;x++) {
    const k=margins.findIndex(row=>row[0]>=x),a=margins[Math.max(0,k-1)],b=margins[k];
    const t=k===0?0:(x-a[0])/(b[0]-a[0]);
    const upper=mix(a[1],b[1],t), lower=mix(a[2],b[2],t);
    for(let y=Math.floor(upper);y<=Math.ceil(lower);y++){
      const index=(ym(ey+y))*size+ex+x;
      const edge=clamp(Math.min(y-upper,lower-y)+.55+tooth[index]*.72);
      const iris=clamp(.07+(x+22)/60+.12*(y-upper)/Math.max(1,lower-upper));
      const fibres=wash(ex+x,ym(ey+y),4,33)*5+tooth[index]*8;
      const colour=[197,187,153].map((light,c)=>Math.round(mix(light,[81,78,59][c],iris)+fibres));
      blend(index,colour,edge);
    }
  }
  // Subdued paper showing through the dry, shaded rear of the opening.
  exy([[-29,7,.16],[-24,4,2.6],[-20,1,4.05],[-15,-3,4.35],[-10,-6,3.67],[-3,-10,.40]],
    [210,201,168],.90,.31);
  // A heavily loaded brush turns forward and down. The edge at the back
  // of the pupil is deliberately soft; there is no free-standing catchlight.
  exy([[-9,6,.32],[-4,4,4.5],[2,1.5,8.1],[7,-2,11.2],
    [15,-5,9.4],[21,-8,5.8],[28,-9,2.5],[33,-11,.48]],[79,76,58],.95,.18);
  exy([[-7,8,.18],[-1,5,4.1],[6,1.6,8.6],[13,-1.8,8.1],[19,-5,5.9],
    [25,-7.9,3.75],[32,-10.3,1.55],[35,-12,.20]],soot,.98,.085);
  exy([[2,9,.15],[7,6,3.1],[13,.9,4.55],[19,-4.2,3.5],[27,-8.7,2.7],
    [34,-11.8,.32]],[39,41,35],.94,.12);
  exy([[-33,7,.24],[-29,1,1.05],[-24,-6,2.34],[-12,-14,3.10],
    [-4,-17,1.3],[3,-18.1,.16]],soot,.86,.25);
  exy([[14,-17.9,.1],[21,-15.6,.69],[26,-13.9,.23]],tea,.64,.42);
  exy([[-30,10,.14],[-21,15,.93],[-11,16,.73],[-7,16,.17]],tea,.67,.32);
  exy([[-2,16,.25],[7,13.4,1.09],[16,8.5,2.75],[23,2.4,3.32],
    [30,-5.8,2.11],[35,-11.9,.25]],soot,.96,.20);

  // At the back the plate turns away from the cheek into the narrow neck.
  // Only the turning corners carry a full charge of ink.
  const jawX=sign===1?0:6;
  brush([[638+jawX,238,.17],[634+jawX,248,1.16],[636+jawX,259,2.52],[646+jawX,270,3.25],
    [660+jawX,275,1.53],[666+jawX,276,.16]],[69,65,50],.88,.22);
  brush([[668+jawX,280,.17],[672+jawX,286,1.69],[681+jawX,290,1.42],[690+jawX,292,.15]],tea,.78,.27);
  brush([[651+jawX,289,.12],[655+jawX,295,1.14],[665+jawX,301,.30]],sage,.69,.36);
  // A pair of uneven cranial shields leads the eye toward the hooked bill.
  const px=sign===1?0:-5;
  brush([[825+px,64,.2],[839+px,72,1.64],[846+px,86,2.86],[851+px,101,2.02],
    [866+px,112,.56],[871+px,114,.16]],[82,78,58],.91,.22);
  brush([[871+px,116,.18],[887+px,111,1.52],[899+px,112,2.34],[907+px,118,2.65],
    [914+px,132,.76],[917+px,139,.17]],[98,91,68],.90,.23);
  brush([[870+px,120,.14],[879+px,133,.74],[883+px,144,.19]],tea,.72,.32);

  // Nostrils are narrow lenticular inlets with a single darker lip.
  const nx=sign===1?966:963,ny=sign===1?157:161;
  tint(nx-1,ny+2,13,9,[142,132,104],.24);
  brush([[nx-13,ny+7,.22],[nx-8,ny+2,2.6],[nx-1,ny-3,5.7],[nx+6,ny-3.5,4.3],
    [nx+11,ny-5,1.63],[nx+13,ny-6,.35]],[44,44,37],.98,.075);
  brush([[nx-6,ny+7,.18],[nx+1,ny+5,.8],[nx+8,ny,.19]],bone,.72);

  // The line of the cutting edge is held almost horizontal in space.
  // Its reflected end lands at the same height on both halves of the bill.
  const corner=sign===1?716:722;
  const rear=[[corner,311+dy,.14],[corner+5,315+dy,1.55],[corner+14,321+dy,2.0],
    [759,325+dy,1.3],[791,328+dy,.95],[821,329+dy,.29]];
  const bill=[[817,329+dy,.12],[845,329+dy*.8,1.20],[873,326+dy*.8,1.83],
    [912,320+dy*.5,2.45],[941,315.2,3.55],[962,312.5,4.95],[977,311.2,4.14],[991,309.5,2.25],[1003,308.8,2.8],[1014,308.5,4.35],[1023,312,1.45]];
  for(const line of [rear,bill]){
    brush(line.map(([x,y,w])=>[x,y+2.2,w*1.34]),[143,129,98],.37,.40);
    brush(line,soot,.94,.19);
  }
  brush([[corner-5,315+dy,.12],[corner+1,318+dy,1.12],[corner+9,326+dy,.35],[corner+14,329+dy,.14]],tea,.66,.30);
  brush([[837,336,.14],[866,334.5,1.10],[911,327,.77],[929,324,.12]],bone,.83,.18);
  // A broken tendon descends from the turn of the mandible into the
  // collar. Its heaviest loaded section belongs beneath the hinge, leaving
  // the plane between the eye and mouth free for the ground wash.
  const turn=sign===1?0:9;
  const jaw=[
    [[814,377,.16],[785,382,.79],[753,381,1.53],[726,376,1.62],[707,369,.33]],
    [[693,365,.12],[676,357,1.45],[651,349,2.72],[619,346,3.62],[588,349,2.49],
      [558,355,1.23],[530,365,.22]],
    [[501,375,.16],[483,382,1.23],[457,391,1.99],[425,393,1.33],[396,391,.18]],
  ];
  for(const [i,line] of jaw.entries()){
    const path=line.map(([x,y,w])=>[x+turn,y+(sign===1?0:3*Math.sin(x*.02)),w]);
    brush(path,i===1?[76,73,58]:[108,100,76],i===1?.88:.70,.27);
    if(i===1)brush(path.slice(1,-1).map(([x,y,w])=>[x,y+3.2,w*.74]),[224,213,178],.60,.44);
  }
  for(const [x,y,d] of [[643,355,19],[632,357,21],[622,358,15]]){
    brush([[x+turn,y,.12],[x+turn-d*.46,y+4.2,.96],[x+turn-d,y+7,.20]],
      [109,104,80],.76,.49);
  }
  brush([[987,316,.12],[1006,314,1.35],[1017,313,.26]],[217,206,170],.88,.25);
}
flank(1);flank(-1);

const destination=fileURLToPath(new URL('../two/assets/bestiary/ryugu-turtle-face.webp',import.meta.url));
const source=Buffer.concat([Buffer.from('P6\n1024 1024\n255\n'),paper]);
const stage=mkdtempSync(join(tmpdir(),'ryugu-turtle-'));
try {
  const ppm=join(stage,'paper.ppm');
  writeFileSync(ppm,source);
  execFileSync('cwebp',['-quiet','-q','92','-m','6',ppm,'-o',destination]);
} finally {
  rmSync(stage,{recursive:true,force:true});
}
