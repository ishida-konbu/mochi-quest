import * as T from './vendor/three.module.min.js';

const {PI}=Math;
// Metres along the oka, the broad grinding land of the inkstone. Its angled
// shoulder would shear a flat decal. The birds, reeds and cuts instead turn
// with the actual contour and rise a few millimetres from the dressed slate.
export function carveSuzuriStone(art,sectionAt){
  const survey=[];
  let length=0,last;
  for(let i=0;i<=192;i++){
    const r=sectionAt((190+160*i/192)*PI/180);
    if(last)length+=Math.hypot(r.u-last.u,r.v-last.v);
    survey.push({length,r});last=r;
  }
  function surface(s,t,relief=0){
    let lo=0,hi=survey.length-1;
    while(hi-lo>1){
      const mid=(lo+hi)>>1;
      if(survey[mid].length<s)lo=mid;else hi=mid;
    }
    const a=survey[lo],b=survey[hi],f=Math.max(0,Math.min(1,(s-a.length)/(b.length-a.length)));
    const point=r=>[r.u+r.nx*t*r.width,r.top-.01*(r.top+.14)+relief,r.v+r.nz*t*r.width];
    const p=point(a.r),q=point(b.r);return p.map((val,i)=>val+(q[i]-val)*f);
  }
  // The footprint is outlined by the V-cut shadow. A softly bevelled lighter
  // relief rises inside the cut, like a bird carved out of another slate layer.
  function carving(shape,origin,across,scale,mirror,tint,depth=.022){
    function emboss(color,expand,base,height){
      const shapeGeometry=new T.ExtrudeGeometry(shape,{depth:height,
        steps:1,curveSegments:12,bevelEnabled:true,bevelSize:.008*expand,bevelThickness:.006,bevelSegments:2});
      const p=shapeGeometry.attributes.position;
      for(let i=0;i<p.count;i++){
        const [x,y,z]=surface(origin+p.getX(i)*scale*mirror*expand,across+p.getY(i)*scale*expand,base+p.getZ(i));
        p.setXYZ(i,x,y,z);
      }
      shapeGeometry.computeVertexNormals();art.add(shapeGeometry,color);
    }
    emboss('#343e40',1.035,.004,.010);emboss(tint,1,.017,depth);
  }
  function stroke(knots,wide,shade,raise=.026){
    const pts=knots.map(([s,t])=>surface(s,t,raise));
    art.stroke(shade,pts,wide,Math.max(10,knots.length*4));
  }
  function plover(origin,across,scale,mirror,banking){
    const wing=new T.Shape();
    wing.moveTo(-.59,-.084);
    if(banking){
      wing.bezierCurveTo(-.51,-.056,-.34,-.009,-.23,.042);
      wing.bezierCurveTo(-.35,.125,-.47,.195,-.52,.273);
      wing.bezierCurveTo(-.38,.254,-.23,.225,-.087,.163);
      wing.bezierCurveTo(.017,.143,.09,.103,.155,.061);
    }else{
      wing.bezierCurveTo(-.48,-.015,-.36,.025,-.26,.072);
      wing.bezierCurveTo(-.37,.115,-.443,.174,-.452,.248);
      wing.bezierCurveTo(-.292,.222,-.16,.166,-.06,.105);
      wing.bezierCurveTo(-.046,.233,-.005,.294,.066,.330);
      wing.bezierCurveTo(.088,.228,.111,.128,.168,.062);
    }
    wing.bezierCurveTo(.229,.037,.26,.103,.332,.100);
    wing.bezierCurveTo(.394,.104,.428,.072,.430,.036);
    wing.lineTo(.562,.008);wing.lineTo(.426,-.014);
    wing.bezierCurveTo(.359,-.087,.221,-.111,.067,-.115);
    if(banking){
      wing.bezierCurveTo(-.07,-.148,-.213,-.300,-.425,-.322);
      wing.bezierCurveTo(-.347,-.216,-.298,-.151,-.251,-.109);
    }else wing.bezierCurveTo(-.055,-.131,-.171,-.133,-.244,-.108);
    wing.lineTo(-.48,-.157);wing.lineTo(-.443,-.10);wing.closePath();
    const tone=banking?'#9b9e94':'#879591';
    carving(wing,origin,across,scale,mirror,tone);
    const path=points=>points.map(([x,t])=>[origin+x*scale*mirror,across+t*scale]);
    const feather=(pts,w=.011)=>stroke(path(pts),[.002,w,.003],'#58676a',.050);
    feather([[-.42,.222],[-.17,.142],[.042,.049]]);
    feather([[-.43,.170],[-.21,.100],[-.041,.039]],.008);
    feather([[-.43,-.085],[-.19,-.050],[.023,-.055]],.009);
    if(banking)feather([[-.36,-.261],[-.18,-.186],[.055,-.092]]);
    feather([[.168,.050],[.22,-.016],[.30,-.074]],.016);
    const eye=surface(origin+.37*scale*mirror,across+.042*scale,.056);
    art.ball('#364348',...eye,.013,.008,.013);
  }
  plover(6.80,.47,.92,1,true);
  plover(8.45,.47,.83,1,false);
  // Thin paired burin grooves, silver catching only the higher bank. Waves
  // disappear under the water dropper then return beneath the flight.
  function wave(s,t,len,bend){
    const path=[[s,t],[s+len*.19,t+bend*.34],[s+len*.36,t+bend],[s+len*.52,t+bend*.91],
      [s+len*.69,t-bend*.16],[s+len*.86,t-bend*.35],[s+len,t]];
    stroke(path,[.003,.017,.021,.018,.016,.011,.002],'#354346',.003);
    stroke(path.map(([d,n])=>[d,n-.018]),[.002,.010,.012,.010,.009,.005,.001],'#8a948e',.005);
  }
  for(const [s,t,n,b] of [[3.39,.35,1.02,.115],[3.70,.27,1.00,.087],[5.65,.26,1.02,.075],
    [6.76,.214,1.23,.076],[7.02,.177,.92,.059],[8.60,.235,1.33,.10],[8.83,.181,.91,.095]])
    wave(s,t,n,b);
  // Reeds lean away from the chiselled wave. The filled blades taper all
  // the way to their points; three seed heads carry a warm iron-brown patina.
  for(const [s,t,reach,rise] of [[2.86,.27,-.44,.37],[2.93,.24,.20,.48],[2.99,.23,.49,.42]]){
    const pts=[[s,t],[s+reach*.29,t+rise*.52],[s+reach*.68,t+rise*.89],[s+reach,t+rise]];
    stroke(pts,[.008,.012,.009,.003],'#a2977c');
    const tip=pts.at(-1),prev=pts.at(-2);
    stroke([[prev[0]*.48+tip[0]*.52,prev[1]*.48+tip[1]*.52],tip,[tip[0]+reach*.22,tip[1]+.016]],
      [.011,.034,.002],'#a79775',.027);
    for(const side of [-1,1]){
      const leaf=new T.Shape();
      leaf.moveTo(0,0);leaf.bezierCurveTo(.09,.068,.20,.15,.351,.168);
      leaf.bezierCurveTo(.227,.106,.154,.021,0,0);leaf.closePath();
      carving(leaf,s+.024,t+.081,side<0?.70:.96,side,'#7d8b7c',.009);
    }
  }
  // One narrow silver-grey fillet runs round the polished arris and fades
  // before the walk-in beach. The outer bevel carries the stone's warm layer.
  const trim=(from,to,across,color,radius,below)=>{
    const pts=Array.from({length:117},(_,i)=>{
      const r=sectionAt((from+(to-from)*i/116)*PI/180);
      return [r.u+r.nx*r.width*across,r.top+below,r.v+r.nz*r.width*across];
    });
    const radii=pts.map((_,i)=>Math.max(.001,radius*Math.min(1,i/4,(116-i)/4)));
    art.stroke(color,pts,radii,160);
  };
  trim(117,422,.028,'#a6ada3',.010,.001);
  trim(139,393,.799,'#8c826e',.009,.004);
}
