import { rockForm, rockParts } from './rock-forms.js';
import { tintedSurface } from './pigments.js';

export function dressOutcrops(p,rocks,height) {
  const pigment=tintedSurface(p.stone.map,.34,.93,.032);
  pigment.vertexColors=true;
  for(let i=0;i<4;i++) {
    p.shapes['bedrock'+i]=rockForm(i);
    p.shapes['winterReef'+i]=rockForm(i,true);
  }
  for(const rock of rocks){
    for (const part of rockParts(rock,height(rock.x,rock.z))) {
      const {form,x,y,z,sx,sy,sz,tint,yaw} = part;
      if (form === 'round') p.part('rock',x,y,z,sx,sy,sz,tint,yaw);
      else p.part((rock.winterReef?'winterReef':'bedrock')+form,x,y,z,sx,sy,sz,tint,yaw,0,0,pigment,true,true);
    }
  }
}
