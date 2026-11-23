const {sin,cos}=Math;

export function peachStrokes(s,rng){
  const sprays=[];
  const drift=(rng()-.46)*.91, tilt=(rng()-.5)*.49;
  const trunk=[[.03,-.34,0],[-.10,.34,.064],[drift+.13,.98,tilt],[drift*.38,1.69,.105],[drift*.4+.16,2.34,-.11]];
  s.stroke('#614f45',trunk,[.39,.35,.25,.223,.066],18);
  s.stroke('#a19078',trunk.map(([x,y,z],i)=>[x-.075,y,z+[.23,.28,.23,.16,.05][i]]),
    [.014,.038,.053,.026,.002],16);
  for(let i=0;i<4;i++){
    const a=i*1.57+rng()*.63;
    const c=cos(a),d=sin(a);
    s.stroke('#6f5c4b',[[.04,.41,0],[.28*c,.16,.28*d],[.64*c,-.09,.64*d],
      [.76*c,-.32,.76*d],[.67*c,-.76,.67*d],[.72*c,-1.36,.72*d]],
      [.17,.19,.09,.061,.035,.008],10);
  }
  for(let i=0;i<6;i++){
    const a=i*2.39+rng()*.93, bend=(rng()-.5)*1.12, reach=1.1+rng()*1.32;
    const root=trunk[2+(i%3)], h=root[1]+.65+rng()*.73;
    const elbow=[root[0]+(.45+rng()*.40)*cos(a+bend),h,root[2]+.49*sin(a+bend)];
    const tip=[root[0]+reach*cos(a),h+.52+rng()*.62,root[2]+reach*sin(a)];
    const wood=[root,elbow,[.66*tip[0]+.34*elbow[0],elbow[1]-.15+.4*rng(),.66*tip[2]+.34*elbow[2]],tip];
    s.stroke(i%2?'#725d4e':'#755e55',wood,[.145,.123,.076,.018],11);
    const midway=wood[2];
    const spur=[midway[0]+.57*cos(a+bend+.87),midway[1]+.58,midway[2]+.57*sin(a+bend+.87)];
    s.stroke('#796252',[elbow,midway,spur],[.064,.059,.019],6);
    sprays.push({q:tip,a,length:1.22+rng()*.67,pitch:.18+rng()*.53},
      {q:spur,a:a+.91,length:1.16+rng()*.49,pitch:.39+rng()*.27},
      {q:tip,a:a-.85,length:.98+rng()*.67,pitch:-.29+rng()*.39});
  }
  return sprays;
}
export function cliffStrokes(s,i,canopy){
  const spin=i*1.23, sign=i%2?-1:1;
  const wood=[[0,-.4,0],[.08,.35,.03],[.50,1.32,.14],[-.14,2.33,.13],
    [sign*.50,3.35,.26],[sign*1.19,4.12,.15],[sign*1.42,4.96,.10]];
  s.stroke('#565344',wood,[.32,.28,.24,.19,.134,.076,.028],16);
  for(let k=0;k<8;k++){
    const a=k*2.39+spin, start=wood[2+Math.floor(k*.55)],h=start[1]+(k%2?.74:.32);
    const len=(2.05-k*.139)*(.88+.31*cos(a)),x=start[0]+cos(a)*len,z=start[2]+sin(a)*len;
    s.stroke('#585746',[start,[start[0]+.62*cos(a),start[1]-.20,start[2]+.61*sin(a)],
      [x,h-.22,z],[x+.16*cos(a),h,z+.16*sin(a)]],[.112,.091,.062,.018],8);
    canopy?.(x,h,z,a);
  }
}
