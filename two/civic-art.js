import * as T from './vendor/three.module.min.js';
import { sitePoint } from './retreat-layout.js';

export function workshopFrame(p,site,base) {
  const at=(u,y,v)=>{
    const [x,z]=sitePoint(site,u,v);
    return new T.Vector3(x,base+y,z);
  };
  return {
    at,
    put(shape,u,y,v,sx,sy,sz,tint,mat=p.wood,yaw=0,pitch=0,roll=0){
      const pos=at(u,y,v);
      p.part(shape,pos.x,pos.y,pos.z,sx,sy,sz,tint,site.yaw+yaw,pitch,roll,mat,true,true);
    },
    bar(a,b,r,tint,mat=p.wood,square=false) {
      p.link(at(...a),at(...b),r,tint,square,true,true,mat);
    },
  };
}
export function inscriptionMaterial(label,{ground='#343c37',ink='#ead9a8',cloth=false,square=false}={}) {
  const c=document.createElement('canvas');c.width=cloth?224:square?208:640;c.height=cloth?288:192;
  const g=c.getContext('2d');
  g.fillStyle=ground;g.fillRect(0,0,c.width,c.height);
  for(let j=0;j<c.height;j+=2){
    g.fillStyle=j%6?'rgba(244,230,195,.046)':'rgba(37,32,23,.12)';
    g.fillRect(0,j,c.width,1);
  }
  g.strokeStyle=ink;
  for(const [edge,weight] of [[9,2],[16,1]]){
    g.lineWidth=weight;
    if(cloth){g.fillStyle=ink;g.fillRect(0,c.height-edge,c.width,weight);}
    else g.strokeRect(edge,edge,c.width-2*edge,c.height-2*edge);
  }
  g.fillStyle=ink;g.textAlign='center';g.textBaseline='middle';
  g.font=(cloth?'150px':square && label.length===1?'bold 140px':'bold 108px')+' "Hiragino Mincho ProN","Yu Mincho",serif';
  if(cloth && label==='♨'){
    // Steam above an open pool, printed as unbroken strokes in the dyed hemp.
    g.strokeStyle=ink;g.lineWidth=6;g.lineCap='round';
    for(const x of [79,109,139]){
      g.beginPath();g.moveTo(x,157);g.bezierCurveTo(x+20,133,x-19,115,x+3,94);g.stroke();
    }
    g.beginPath();g.ellipse(c.width/2,174,64,16,0,-.63,Math.PI+.63);g.stroke();
  } else g.fillText(label,c.width/2,c.height*.52,c.width*.88);
  const map=new T.CanvasTexture(c);map.colorSpace=T.SRGBColorSpace;map.anisotropy=4;
  return new T.MeshLambertMaterial({map,side:T.DoubleSide});
}
export function coveredGable(p) {
  // A cusped bargeboard carved as one continuous swept surface. Reversals of
  // curvature distinguish the karahafu from the straight rafters behind it.
  const shape=new T.Shape();
  function y(x){return .09+.83*Math.exp(-x*x*7.4)+.13*x*x;}
  shape.moveTo(-1,y(-1));
  for(let i=1;i<=56;i++){const x=i/28-1;shape.lineTo(x,y(x));}
  for(let i=56;i>=0;i--){const x=i/28-1;shape.lineTo(x,y(x)-.165+.029*x*x);}
  shape.closePath();
  p.shapes.courtBarge=new T.ExtrudeGeometry(shape,{depth:1,bevelEnabled:false});
}
export function courtLantern(p,f,u,v) {
  const q=f.at(u,0,v);
  p.lamps.stoneLantern(q.x,q.y,q.z);
}
