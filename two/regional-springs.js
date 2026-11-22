// Surveyed in world metres. Positive local Z is the unobstructed walk from
// the road, so a pool can follow the contours independently of its compass bearing.
export const REGIONAL_SPRINGS = [
  // Ferry, shrine, market, old mountain baths and farming hamlets.
  ['river-hanabira', '花筏の湯', 'river', 'sakura', 'lotus', 32.75,46.50,-.3511, 5.00,3.60],
  ['shrine-sasafune', '笹舟の湯', 'shrine', 'bamboo', 'leaf', -140.25,-132.25,-1.0872, 4.50,3.15],
  ['market-tsuboyu', '蔵町の甕湯', 'market', 'earthen', 'gourd', 40.31,-123.63,-1.0014, 4.72,3.30],
  ['pass-yunohana', '湯の花の岩棚', 'spring', 'sulfur', 'cleft', 172.25,-156.75,-.2673, 5.20,3.65],
  ['paddy-azemichi', '畦映しの湯', 'terraces', 'paddy', 'terrace', 95.37,67.87,-.1813, 5.34,3.20],
  ['coast-kaigara', '松浜の貝湯', 'coast', 'shore', 'shell', -174.25,80,.2338, 5.00,3.60],
  ['snow-usugori', '薄氷の湯', 'snow', 'snow', 'pebble', -18.98,-259.98,3.4241, 5.47,3.49],
  ['autumn-kaedeba', '楓葉の湯', 'autumn', 'maple', 'leaf', 326.34,-56.09,-1.7547, 4.96,3.61],
  ['moon-yumihari', '弓張月の湯', 'moon', 'susuki', 'oxbow', -31.57,275.90,-2.6966, 5.40,3.34],
  ['dawn-akatsuki', '暁の扇湯', 'dawn', 'dawn', 'fan', 306.50,145.75,-.1526, 5.00,3.60],
  // The city outskirts, orchard, pilgrimage precincts and working ports.
  ['capital-suzuri', '花京の硯湯', 'kyo', 'capital', 'inkstone', 121,-911.75,1.4790, 4.92,3.42],
  ['peach-hanamomo', '花桃の瓢湯', 'peach', 'peach', 'gourd', -778.75,-172.75,-2.3003, 3.95,2.72],
  ['temple-hasu', '蓮弁の湯', 'todaiji', 'temple', 'lotus', 380.62,854.25,1.9306, 5.23,3.79],
  ['inari-magari', '稲荷山の曲り湯', 'inari', 'inari', 'oxbow', 390.05,-404.15,-3.7099, 4.75,3.17],
  ['tsuruga-shiomachi', '船溜りの湯', 'tsuruga', 'tsuruga', 'shell', 360.75,-1420.25,-1.6201, 5.12,3.27],
  ['sakai-tsuboguchi', '堺の壺口湯', 'sakai', 'sakai', 'inkstone', -165.25,-594.50,2.5147, 4.80,3.05],
  // Longer journeys have intermediate stops beyond the settled centres.
  ['snow-nagoriyuki', '峠の名残雪', 'snow', 'snow', 'cleft', 36.08,-328.20,4.0083, 4.53,3.68],
  ['peach-iwakubo', '桃峡の岩窪湯', 'peach', 'peach', 'cleft', -471.25,-134,.7537, 4.70,3.00],
  ['temple-kongoseki', '参詣道の金剛石湯', 'todaiji', 'temple', 'terrace', 272.54,636.24,2.6673, 5.40,3.61],
  ['inari-kitsunebi', '狐火の湯', 'inari', 'inari', 'leaf', 509,-601.25,1.5070, 4.65,3.25],
  ['tsuruga-funami', '敦賀峠の船見湯', 'tsuruga', 'tsuruga', 'fan', 453,-1338.25,-1.7269, 4.20,2.78],
  ['capital-shigure', '北山時雨の湯', 'kyo', 'capital', 'pebble', 375.25,-972.75,-1.2928, 4.97,3.47],
].map(([id,name,region,kind,shape,x,z,yaw,rx,rz])=>({id,name,region,kind,shape,x,z,yaw,rx,rz,regional:true}));

// Radius from the centre, measured in units of each basin's two semi-axes.
// Each outline is single-valued round the centre so the mesh, water tests,
// carved bank and individually fitted edge stones can follow the same shore.
export function regionalSpringLip(shape,a) {
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
