import { mainBathLip } from './main-bath-outlines.js';

// Surveyed in world metres. Positive local Z is the unobstructed walk from
// the road, so a pool can follow the contours independently of its compass bearing.
export const REGIONAL_SPRINGS = [
  // Ferry, shrine, market, old mountain baths and farming hamlets.
  ['river-hanabira', '花筏の湯', 'river', 'sakura', 'petalRaft', 29,77,2.8204, 5.00,3.60],
  ['shrine-sasafune', '笹舟の湯', 'shrine', 'bamboo', 'bambooBoat', -140.25,-132.25,-1.0872, 4.50,3.15],
  ['market-tsuboyu', '蔵町の甕湯', 'market', 'earthen', 'kilnJar', 38,-106,-1.2764, 4.72,3.30],
  ['pass-yunohana', '湯の花の岩棚', 'spring', 'sulfur', 'sinterShelf', 170,-144,.6750, 5.20,3.65],
  ['paddy-azemichi', '畦映しの湯', 'terraces', 'paddy', 'riceField', 95.37,67.87,-.1813, 5.34,3.20],
  ['coast-kaigara', '松浜の貝湯', 'coast', 'shore', 'scallop', -174.25,80,.2338, 5.00,3.60],
  ['moon-kusatsuyu', '草露の小湯', 'moon', 'susuki', 'pebble', 47,356,2.9783, 3.23,2.51,'sub'],
  ['autumn-kaedeba', '楓葉の湯', 'autumn', 'maple', 'mapleLeaf', 326.34,-56.09,-1.7547, 4.96,3.61],
  ['moon-yumihari', '弓張月の湯', 'moon', 'susuki', 'crescent', -31.57,275.90,-2.6966, 5.40,3.34],
  ['dawn-akatsuki', '暁の扇湯', 'dawn', 'dawn', 'foldingFan', 306.50,145.75,-.1526, 5.00,3.60],
  // The Kyoto crossroads, orchard, pilgrimage precincts and working ports.
  ['capital-suzuri', '花京の硯湯', 'kyo', 'capital', 'suzuri', 228.5,-838.65,Math.PI, 5.03,3.05],
  ['peach-hanamomo', '花桃の瓢湯', 'peach', 'peach', 'calabash', -783,-193,.0469, 4.50,3.20],
  ['temple-hasu', '蓮弁の湯', 'todaiji', 'temple', 'lotusThrone', 380.62,854.25,1.9306, 5.23,3.79],
  ['inari-magari', '稲荷山の曲り湯', 'inari', 'inari', 'foxTail', 378,-592,-.0422, 4.75,3.17],
  ['tsuruga-shiomachi', '船溜りの湯', 'tsuruga', 'tsuruga', 'shipBasin', 353,-1413,-.5404, 5.12,3.27],
  ['sakai-tsuboguchi', '堺の壺口湯', 'sakai', 'sakai', 'jarMouth', -176,-554,-1.5708, 4.80,3.05],
  // Longer journeys have intermediate stops beyond the settled centres.
  ['snow-nagoriyuki', '峠の名残雪', 'snow', 'snow', 'cleft', 646,-1105,.24, 3.18,2.51,'sub'],
  ['sakai-akane', '堺街道の茜湯', 'sakai', 'sakai', 'terrace', -49,-722,.5880, 3.28,2.57,'sub'],
  ['peach-yamamomo', '山桃の小湯', 'peach', 'peach', 'leaf', -485,-79,3.0991, 3.24,2.54,'sub'],
  ['tsuruga-funami', '敦賀峠の船見湯', 'tsuruga', 'tsuruga', 'fan', 519,-1250,-1.3494, 3.26,2.51,'sub'],
  ['capital-shigure', '北山時雨の湯', 'kyo', 'capital', 'pebble', 375.25,-972.75,-1.2928, 3.19,2.52,'sub'],
].map(([id,name,region,kind,shape,x,z,yaw,rx,rz,rank='main'])=>({id,name,region,kind,shape,x,z,yaw,rx,rz,rank,regional:true}));

// Radius from the centre, measured in units of each basin's two semi-axes.
// Each outline is single-valued round the centre so the mesh, water tests,
// carved bank and individually fitted edge stones can follow the same shore.
export function regionalSpringLip(shape,a) {
  const named=mainBathLip(shape,a);
  if(named!==undefined)return named;
  const c=Math.cos(a),s=Math.sin(a);
  switch(shape) {
    case 'gourd':
      return 1+.16*Math.cos(2*a)-.16*Math.cos(4*a)+.065*c;
    case 'oxbow': {
      const notch=Math.max(0,Math.cos(a-.32));
      return 1.02-.34*notch**7+.095*Math.sin(2*a+.27)+.045*Math.cos(3*a-.12);
    }
    case 'inkstone':
      return (Math.abs(c)**4.5+Math.abs(s)**4.5)**(-1/4.5)*(1+.027*Math.cos(3*a-.3));
    case 'terrace':
      return (Math.abs(c)**3.4+Math.abs(s)**3.4)**(-1/3.4)*(1+.088*Math.sin(3*a+.35));
    case 'fan':
      return 1+.18*s-.12*Math.cos(2*a)+.055*Math.cos(5*a+.3);
    case 'lotus':
      return 1+.091*Math.sin(5*a-.65)+.042*Math.cos(3*a+.22);
    case 'leaf':
      return 1+.12*Math.cos(2*a)-.07*Math.sin(3*a-.48)+.03*Math.cos(5*a+.32);
    case 'shell':
      return 1+.11*s-.085*Math.cos(2*a)+.062*Math.sin(6*a+.31)*(.63+.37*s);
    case 'cleft':
      return 1+.096*Math.sin(3*a+.45)-.21*Math.max(0,Math.cos(a+1.12))**6+.039*Math.cos(5*a);
    default:
      return 1+.092*Math.cos(3*a-.38)+.046*Math.sin(2*a+.6);
  }
}

// The elongated faces of dressed coping and irregular stones both follow
// the tangent. This keeps the lobes and the gourd's waist legible from shore.
export function regionalRimStones(site) {
  const {rx,rz,index,shape}=site;
  const count=Math.round(2*Math.PI*Math.hypot(rx,rz)/Math.SQRT2/1.08);
  const points=Array.from({length:count},(_,i)=>{
    const a=i*2*Math.PI/count,r=regionalSpringLip(shape,a);
    return {u:rx*r*Math.cos(a),v:rz*r*Math.sin(a)};
  });
  return points.map(({u,v},i)=>{
    const prev=points[(i+count-1)%count],next=points[(i+1)%count];
    const size=.88+.13*Math.sin(i*3.83+index)+.08*Math.cos(i*2.51);
    const width=.265*(Math.hypot(u-prev.u,v-prev.v)+Math.hypot(next.u-u,next.v-v));
    return {u,v,w:width*(1+.04*Math.sin(i*1.72)),h:size*(.46+.16*Math.cos(i*2.23)),
      d:size*.70,angle:Math.atan2(prev.v-next.v,next.u-prev.u)+.055*Math.sin(i*7.3+index),
      i,scanned:i%3===0};
  }).filter(q=>q.v<=0 || Math.abs(q.u)>2.08);
}
