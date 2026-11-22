import { regionalSpringLip } from './regional-springs.js';

export const VILLAGE_WATER_HEIGHT = .189;

// The old village tubs stand above ground. Their cloth rails and fountain stay
// in the original spots, while the foot, water and stone ring share this lip.
const tubs=[
  ['river','桜川の湯','oxbow',2.08,1.48,'#975d65','#ae9c8a','桜'],
  ['shrine','竹陰の湯','leaf',1.92,1.54,'#65745e','#8e997d','竹'],
  ['market','蔵町の朝湯','inkstone',1.83,1.47,'#565f6a','#a1876c','市'],
  ['spring','峠の湯元','cleft',1.99,1.57,'#956648','#b5ac8a','峠'],
  ['terraces','畦の湯','terrace',1.88,1.46,'#958354','#a59a77','稲'],
  ['coast','松原の浜湯','shell',2.06,1.48,'#53716f','#98a29c','浜'],
  ['snow','雪灯りの小湯','lotus',1.91,1.64,'#707b8b','#c6c8bd','雪'],
];
export const VILLAGE_BATHS=Object.fromEntries(tubs.map(([region,name,shape,rx,rz,dye,bank,crest])=>[
  region,{region,name,shape,rx,rz,dye,bank,crest,lip:a=>regionalSpringLip(shape,a)},
]));
