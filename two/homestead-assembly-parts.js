// Each grip is a joint, rail, or free edge in the same metre coordinates as
// the finished building. The normal points towards the carpenter's footing.
import { Vector3, Triangle } from './vendor/three.module.min.js';
import { hokoraCarpentry } from './kaede-hokora-mesh.js';
import { bedLayoutKey, campMattress, campStaff } from './camp-bedding.js';
import { drawHomesteadModule, HUT_MODULES } from './homestead-carpentry.js';

import { foundationMembers, foundationJoint, drawFoundationMember } from './homestead-foundation.js';

const fore=[0,1], rear=[0,-1], left=[-1,0], right=[1,0];
const step=(id,label,method,grip,normal,pivot)=>({id,label,method,grip,normal,pivot});
function joints(kind,terrain,layout){
  switch(kind){
    case 'stand':return [
      step('left-bent','左の脚組を立てる','raise',[-.75,.69,.33],fore,[-.75,0,-.38]),
      step('right-bent','右の脚組を立てる','raise',[.75,.69,.33],fore,[.75,0,-.38]),
      step('counter','棚板を脚組にはめる','seat',[.34,.844,.39],fore),
      step('cashbox','銭箱を棚の奥へ据える','seat',[.70,1.00,-.21],right),
      step('tray','餅の並べ盆を置く','seat',[-.17,.917,.31],fore),
      step('rafters','日よけの支柱を棚のほぞ穴に差す','raise',[.69,1.99,.39],fore),
      {...step('fly','日よけ布を庇に張る','spread',[.83,2.013,.51],fore),unfurl:{axis:'x',sign:-1}},
      step('curtain','藍の暖簾を掛ける','hang',[.53,1.99,.537],fore)
    ];
    case 'camp':{
      const m=campMattress(layout),edge=m.x+m.width/2;
      const [heel,head,r]=campStaff[2],grip=heel.map((v,i)=>v+(head[i]-v)*.425);
      grip[0]-=r;
      return [
        step('bed','竹の寝台を据える','seat',[edge-.025,.078,m.foot-.42],right),
        {...step('mat','寝台にむしろを敷く','spread',[m.x+.32*m.width,.13,m.foot-.09],fore),unfurl:{axis:'z',sign:-1}},
        step('pillow','枕を寝床の端へ置く','seat',[m.x+m.pillowWidth/2,.266,m.pillowZ],right),
        ...(layout===true?[]:[step('staff','旅の旗を立てる','raise',grip,left,campStaff[0][0])])
      ];
    }
    case 'floor':return [
      step('rear-sill','奥の束を据える','seat',[1.43,.10,-1.23],right),
      step('joist','中央の根太を渡す','seat',[1.44,.125,0],right),
      step('fore-sill','手前の束を据える','seat',[1.43,.10,1.23],right),
      ...[.90,0,-.90].map((z,i)=>step('deck-'+(2-i),['手前','中央','奥'][i]+'の床板を納める','seat',[1.56,.17,z],right))
    ];
    case 'posts':return [
      step('rear-bent','奥の柱組を起こす','raise',[1.505,.88,-1.23],right,[0,.18,-1.23]),
      step('fore-bent','手前の柱組を起こす','raise',[1.505,.88,1.23],right,[0,.18,1.23]),
      step('right-plate','右の桁を柱頭に納める','seat',[1.509,2.28,.93],right),
      step('left-plate','左の桁を柱頭に納める','seat',[-1.509,2.28,.93],left)
    ];
    case 'wall':return [
      step('wainscot','腰板を溝に落とす','seat',[-.71,.90,-1.24],rear),
      step('screen','明かり障子をはめる','raise',[-.80,1.54,-1.24],rear,[-.80,.91,-1.24])
    ];
    case 'roof':{
      const ridge=terrain==='snow'?3.39:3.03;
      return [
        ...[-1.44,0,1.44].map((x,i)=>step('trestle-'+i,['左','中央','右'][i]+'の小屋梁と棟束を納める','raise',[x,2.27,-1.357],rear)),
        step('ridge','棟木を束に渡す','seat',[1.762,ridge-.10,0],right),
        ...[-1,1].flatMap(side=>[0,1,2].map((index)=>{
          const i=side===1?index:2-index;
          const edge=(side<0?'奥側':'手前側')+'の'+['左端','中央','右端'][i];
          return step((side<0?'back-':'front-')+i,edge+'に屋根板を引き上げる','seat',[(i-1)*1.24,2.23,side*1.62],side<0?rear:fore);
        })),
        step('ridge-cap','棟の押さえ竹を納める','seat',[1.839,ridge+.047,0],right)
      ];
    }
    case 'chest':return [
      step('base','櫃の台を据える','seat',[.39,.07,.24],fore),
      step('case','持ち手に手を掛け、櫃を台へ載せる','seat',[.586,.414,0],right),
      step('lid','蓋を納めて掛け緒を留める','seat',[0,.65,.35],fore)
    ];
    case 'fence':return [
      step('left-stake','左の親竹を立てる','raise',[-.84,.71,.038],fore,[-.84,0,0]),
      step('right-stake','右の親竹を立てる','raise',[.84,.71,.038],fore,[.84,0,0]),
      step('lattice','竹の組子を親竹へ寄せる','seat',[.51,.79,.05],fore),
      step('right-tie','右の縄を結び締める','lash',[.84,.79,.047],fore),
      step('left-tie','左の縄を結び締める','lash',[-.84,.79,.047],fore)
    ];
    default:throw new RangeError('Unknown construction module '+kind);
  }
}

// Find a real bearing for each hand. On a narrow upright the two hands
// wrap around the shaft at different heights, not either side of empty air.
function handContacts(spec,geometry){
  const {normal,grip}=spec;
  const tangent=[-normal[1],normal[0]],triangle=new Triangle(),nearest=new Vector3();
  const ix=geometry.index.array,vertices=geometry.attributes.position;
  function contact(side,height){
    const target=new Vector3(grip[0]+side*.16*tangent[0],grip[1]+side*height,grip[2]+side*.16*tangent[1]);
    let gap=Infinity;
    const best=new Vector3();
    for(let k=0;k<ix.length;k+=3){
      triangle.setFromAttributeAndIndices(vertices,ix[k],ix[k+1],ix[k+2]);
      triangle.closestPointToPoint(target,nearest);
      const distance=nearest.distanceToSquared(target);
      if(distance<gap){gap=distance;best.copy(nearest);}
    }
    return best;
  }
  let a=contact(-1,0),b=contact(1,0);
  if(a.distanceTo(b)<.15){a=contact(-1,.13);b=contact(1,.13);}
  return [a.toArray(),b.toArray()];
}

function measuredPart(id,spec,geometry){
  geometry.computeBoundingBox();
  const {min,max}=geometry.boundingBox;
  return {...spec,id,bounds:{min:min.toArray(),max:max.toArray()},handholds:handContacts(spec,geometry),geometry};
}

const cached=new Map();
function moduleParts(kind,terrain,layout=false){
  const key=kind+(kind==='roof' && terrain==='snow'?'-snow':layout?'-'+layout:'');
  if(cached.has(key))return cached.get(key);
  const specs=joints(kind,terrain,layout);
  const writers=new Map(specs.map(s=>[s.id,hokoraCarpentry()]));
  drawHomesteadModule(kind,terrain,id=>writers.get(id),layout);
  const parts=specs.map(spec=>{
    return measuredPart(kind+'.'+spec.id,spec,writers.get(spec.id).finish());
  });
  cached.set(key,parts);
  return parts;
}

export function assemblyParts(kind,terrain='plain',site){
  let parts;
  if(kind==='hut'){
    const key=terrain==='snow'?'hut-snow':'hut';
    if(!cached.has(key))cached.set(key,HUT_MODULES.flatMap(k=>moduleParts(k,terrain)));
    parts=cached.get(key);
  }else parts=moduleParts(kind,terrain,kind==='camp' && site?bedLayoutKey(site):false);
  const foundation=foundationMembers(kind,site);
  if(!foundation.length)return parts;
  const cut=foundation.map(member=>{
    const b=hokoraCarpentry();
    drawFoundationMember(b,member);
    return measuredPart('foundation.'+member.id,{...foundationJoint(member),siteGeometry:true},b.finish());
  });
  const bearings=cut.filter(s=>s.id.includes('.pier-')||s.id.endsWith('.sill')||s.id.endsWith('-girder'));
  const braces=cut.filter(s=>s.id.includes('brace'));
  const entry=cut.filter(s=>s.id.endsWith('.entry-treads'));
  // Shoulders and braces need something to pin to. Once the load-bearing
  // sills are seated, fit the braces before closing up the floor above them.
  const afterSill=kind==='floor'||kind==='hut'?3:kind==='camp'||kind==='chest'?1:0;
  return [...bearings,...parts.slice(0,afterSill),...braces,...entry,...parts.slice(afterSill)];
}
// Uses the same measured bounds for motion-only planners and the WebGL view.
// Only members cut specifically for this plot have scene-owned geometry.
export const assemblySteps=assemblyParts;
