import * as T from './vendor/three.module.min.js';
import { sculpture } from './pilgrimage-pigment.js';
import { surfaceGrain, brushWash } from './scroll-sculpt.js';

// A sea fan grows in a plane; its adjacent stems meet and enclose windows.
// The holdfast and the dark-to-pale taper survive the distant underwater haze.
export function reefFans(p) {
  const {sin,cos}=Math;
  for(let variant=0;variant<3;variant++) {
    const form=sculpture();
    form.ball('#897562',0,.10,0,.32,.16,.24);
    const ribs=variant===1?9:13;
    function point(i,t){
      const a=(i/(ribs-1)-.5)*(variant===1?1.95:2.55),l=(1.53+.28*cos(3*a)+.19*sin(i*2.4+variant))*t;
      return [sin(a)*l*(1+t*.11)+.065*t*sin(t*8+i),.09+cos(a)*l+.11*t*t,.24*l*sin(2*a+variant)+.07*t*sin(9*t+i)];
    }
    for(let i=0;i<ribs;i++){
      const q=Array.from({length:7},(_,j)=>point(i,j/6));
      const tint=i%3?'#b3846e':'#bc9479';
      form.stroke(tint,q,[.086,.061,.047,.031,.027,.014,.003],13);
      for(let j=2;j<=5;j++){
        const t=j/6,a=q[j],b=q[j+1],s=i%2?-1:1;
        const twig=[b[0]+s*(.15-.011*j),b[1]+.094,b[2]+.037];
        form.stroke('#cda58b',[a,[(a[0]+twig[0])*.5,(a[1]+twig[1])*.5+.036,twig[2]],twig],
          [.024,.019,.003],6);
        if(i && (i+2*j+variant)%4!==0){
          const neigh=point(i-1,t+.053);
          form.stroke('#bd967c',[a,[(a[0]+neigh[0])*.5,Math.min(a[1],neigh[1])+.047,a[2]+.026],neigh],
            [.015,.013,.01],5);
        }
      }
    }
    p.shapes['reefFan'+variant]=form.finish();
  }
  return surfaceGrain(brushWash(new T.MeshLambertMaterial({side:T.DoubleSide,vertexColors:true}),.22),1.7);
}
