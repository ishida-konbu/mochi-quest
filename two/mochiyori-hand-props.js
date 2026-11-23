import * as T from './vendor/three.module.min.js';
const vec=(x,y,z)=>new T.Vector3(x,y,z);

export function makeSteam(){
  const g=new T.Group(), curve=new T.CatmullRomCurve3([vec(0,0,0),vec(.025,.044,0),vec(-.014,.105,.008),vec(.018,.17,.012)]);
  const geometry=new T.TubeGeometry(curve,12,.008,4,false);
  for(let i=0;i<3;i++)g.add(new T.Mesh(geometry,new T.MeshBasicMaterial({color:0xfff4dc,transparent:true,depthWrite:false})));
  return g;
}

export function makeAccessories(group){
  function mesh(geo,color,parent,metal=0){
    const m=new T.Mesh(geo,new T.MeshStandardMaterial({color,roughness:.84,metalness:metal}));
    parent.add(m);return m;
  }
  const brush=new T.Group();group.add(brush);
  const barrel=mesh(new T.CylinderGeometry(.009,.012,.207,12),0xb58950,brush);barrel.position.y=.155;
  const binding=mesh(new T.CylinderGeometry(.013,.012,.031,14),0x534735,brush);binding.position.y=.057;
  const bristles=mesh(new T.LatheGeometry([[.001,0],[.006,.012],[.010,.023],[.011,.043]].map(([x,y])=>new T.Vector2(x,y)),12),0x352e24,brush);
  bristles.rotation.z=-.07;
  const inkMark=mesh(new T.SphereGeometry(.5,12,6),0x514b3a,group);inkMark.geometry.scale(1,.006,1);
  const cord=mesh(new T.TorusGeometry(1,.048,7,42),0x9c7652,group);cord.geometry.rotateX(Math.PI/2);
  const stream=mesh(new T.CylinderGeometry(.009,.005,.25,9),0xab9975,group);stream.geometry.translate(0,-.125,0);
  return {brush,inkMark,cord,stream};
}
