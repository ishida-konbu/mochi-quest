// The price slips slot into the front of the bamboo tray. The table keeps
// one ink sheet for all integer prices, including after a traveller reprices.
import * as T from './vendor/three.module.min.js';

const numerals='〇一二三四五六七八九';
const priceText=n=>(n<10?numerals[n]:(n>=20?numerals[Math.floor(n/10)]:'')+'十'+(n%10?numerals[n%10]:''))+'文';
let material;
function inkSheet() {
  if(material)return material;
  material=new T.MeshStandardMaterial({roughness:.95,vertexColors:true});
  if(typeof document==='undefined')return material;
  const canvas=document.createElement('canvas');
  canvas.width=1024;canvas.height=512;
  const ctx=canvas.getContext('2d');
  const w=canvas.width/10,h=canvas.height/10;
  ctx.fillStyle='#e3c79d';ctx.fillRect(0,0,canvas.width,canvas.height);
  for(let n=0;n<=99;n++){
    const x=(n%10)*w,y=Math.floor(n/10)*h;
    // Fine horizontal changes of colour follow the split bamboo.
    for(let j=0;j<7;j++){
      ctx.fillStyle=j%2?'#a7835c38':'#f4dfb760';
      ctx.fillRect(x,y+4+j*6+.65*Math.sin(j+n),w,.7);
    }
    if(!n)continue;
    const label=priceText(n);
    ctx.textAlign='center';ctx.textBaseline='middle';
    ctx.fillStyle='#38291f';
    ctx.font='600 '+(label.length===4?23:27)+'px "Hiragino Mincho ProN","Yu Mincho",serif';
    ctx.fillText(label,x+w*.50,y+h*.52,w*.87);
  }
  const map=new T.CanvasTexture(canvas);
  map.colorSpace=T.SRGBColorSpace;map.anisotropy=4;
  material.map=map;
  return material;
}
export function makePriceTag(price) {
  const half=.128, height=.110, bevel=.012, depth=.010;
  const rim=[[-half,bevel],[-half+bevel,0],[half-bevel,0],[half,bevel],
    [half,height-bevel],[half-bevel,height],[-half+bevel,height],[-half,height-bevel]];
  const pos=[],uv=[],colors=[],index=[];
  function face(points,lettering,tint) {
    const start=pos.length/3, tile=lettering?price:0;
    const col=tile%10,row=Math.floor(tile/10),color=new T.Color(tint);
    for(const [x,y,z] of points){
      pos.push(x,y,z);
      uv.push((col+.025+.95*(x/(2*half)+.5))/10,1-(row+.975-.95*y/height)/10);
      colors.push(color.r,color.g,color.b);
    }
    for(let i=1;i+1<points.length;i++)index.push(start,start+i,start+i+1);
  }
  const front=rim.map(([x,y])=>[x,y,depth]),back=rim.map(([x,y])=>[x,y,0]);
  face(front,true,'#ffefdf');face([...back].reverse(),false,'#cbb18b');
  for(let i=0;i<rim.length;i++){
    const j=(i+1)%rim.length;
    face([back[i],back[j],front[j],front[i]],false,'#aa8d66');
  }
  const geo=new T.BufferGeometry();
  geo.setAttribute('position',new T.Float32BufferAttribute(pos,3));
  geo.setAttribute('uv',new T.Float32BufferAttribute(uv,2));
  geo.setAttribute('color',new T.Float32BufferAttribute(colors,3));
  geo.setIndex(index);geo.computeVertexNormals();
  const tag=new T.Mesh(geo,inkSheet());
  tag.name=priceText(price)+'の値札';tag.rotation.x=-.36;
  tag.castShadow=tag.receiveShadow=true;
  return tag;
}
