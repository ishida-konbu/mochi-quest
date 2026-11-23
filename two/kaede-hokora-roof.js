import * as T from './vendor/three.module.min.js';
import { DRAGON_ROOF as roof, dragonRoofHeight } from './kaede-dragon-layout.js';

const barkTints = ['#c3b9a9', '#c5bcad', '#c9bead', '#cec3b3', '#cabfaf', '#c7bbab'];
const oak = '#d8cabb', heartwood = '#c7b7a7', cutWood = '#e2d2bc', shadowWood = '#a99d8e';
const patina = '#918f7c';

function roofPoint(side, slope, along, lift = 0) {
  const flare = slope * Math.abs(along) ** 3;
  return [
    side * roof.width / 2 * slope,
    dragonRoofHeight(Math.min(1, slope)) + .067 * flare + lift,
    roof.z + along * roof.depth / 2 * (.928 + .072 * slope),
  ];
}

function noise(seed) {
  const n = Math.sin(seed * 78.233 + 11.13) * 43758.5453;
  return n - Math.floor(n);
}

// The weather side has thin, overlapping pieces of bark. Their short edges
// break at different places in each course. Their long fibres run downhill.
function laidBark(b, side) {
  const courses = 26;
  for (let j = 0; j < courses; j++) {
    const id = (side + 1) * 300 + j * 19;
    const cuts = [-1];
    for (let joint = -1 + .08 + .15 * noise(id); joint < .94; joint += .22 + .13 * noise(id + cuts.length)) {
      cuts.push(joint);
    }
    cuts.push(1);
    const bottom = (j + 1) / courses;
    const top = Math.max(0, j / courses - .004);
    for (let k = 1; k < cuts.length; k++) {
      const seed = id + k, a = cuts[k - 1], c = cuts[k], mid = (a + c) / 2;
      const tint = barkTints[Math.floor(noise(seed + .12) * barkTints.length)];
      const seam = t => .003 * Math.sin(8 * t + j * .83) + .0011 * Math.cos(29 * t - j);
      const offset = .0048 + .002 * noise(seed + .3);
      const uv = (p, t) => [p * 1.05 + noise(seed + 2.2), t * 1.53 + noise(seed + 7.9)];
      // The surface flares near the gable. Its middle is almost straight.
      const spans = Math.abs(mid) > .57 ? [[a, mid], [mid, c]] : [[a,c]];
      for (const [u, v] of spans) {
        const su = bottom + seam(u), sv = bottom + seam(v);
        const pu = roofPoint(side, su, u, offset), pv = roofPoint(side, sv, v, offset);
        const points = [roofPoint(side, top, u), roofPoint(side, top, v), pv, pu];
        const uvs = [uv(top,u), uv(top,v), uv(sv,v), uv(su,u)];
        b.face('bark', tint, side === 1 ? points : points.reverse(),
          {uvs:side === 1 ? uvs : uvs.reverse()});
        const edge = [pu, pv, roofPoint(side,sv,v,-.001), roofPoint(side,su,u,-.001)];
        const edgeUV = [uv(su,u),uv(sv,v),uv(sv+.009,v),uv(su+.009,u)];
        b.face('bark', '#afa28e', side === 1 ? edge : edge.reverse(),
          {uvs:side === 1 ? edgeUV : edgeUV.reverse()});
      }
    }
  }
}

function bargePoint(side, slope, end, inset, down) {
  const p = roofPoint(side, slope, end);
  p[1] -= down;
  p[2] -= end * inset;
  return p;
}

// The cut edges of the laminated bark sit proud of the carved timber verge.
// The thinner line below the cut edge is the projecting weathering moulding.
function bargeboard(b, side, end) {
  const barkLip = .039, slices = 16;
  const profiles = [
    ['bark', '#b4a491', 0, 0, 0, barkLip],
    ['wood', '#9f9181', 0, barkLip, .015, barkLip + .005],
    ['wood', cutWood, .015, barkLip + .005, .018, .053],
    ['wood', oak, .018, .053, .018, .10],
    ['wood', '#b4a38e', .018, .10, .057, .104],
  ];
  for (let i = 0; i < slices; i++) {
    const a = i / slices, c = (i+1) / slices;
    for (const [kind, tint, insetA, h1, insetB, h2] of profiles) {
      // The bargeboard tapers towards the tip; its bottom edge is worked
      // to a gentle reverse curve as it runs out past the structural gable.
      const h = (t, depth) => depth + Math.max(0, depth - .053) * (.72 - 1.03 * t + .48 * Math.sin(t * Math.PI));
      const points = [
        bargePoint(side,a,end,insetA,h(a,h1)), bargePoint(side,c,end,insetA,h(c,h1)),
        bargePoint(side,c,end,insetB,h(c,h2)), bargePoint(side,a,end,insetB,h(a,h2)),
      ];
      const uvs = [[a*1.12,h1*2.4],[c*1.12,h1*2.4],[c*1.12,h2*2.4],[a*1.12,h2*2.4]];
      b.face(kind,tint,side * end < 0 ? points : points.reverse(),
        {uvs:side * end < 0 ? uvs : uvs.reverse()});
    }
  }
}

function eaveAndSoffit(b, side) {
  const spans = 12;
  for (let k = 0; k < spans; k++) {
    const za = 2 * k / spans - 1, zb = 2 * (k+1) / spans - 1;
    // The starter stack exposes dozens of bark edges at the drip. A few
    // broader groups of leaves break up the shadow under the cropped nose.
    for (const [outer, upper, inner, lower, kind, tint] of [
      [1,0,1,-.032,'bark','#c1af96'],
      [1,-.032,.998,-.039,'bark','#ac9a82'],
      [.998,-.039,.997,-.048,'bark','#bcaa93'],
      [.997,-.048,.969,-.052,'metal',patina],
      [.969,-.052,.969,-.076,'wood',cutWood],
    ]) {
      const points = [roofPoint(side,outer,za,upper),roofPoint(side,outer,zb,upper),
        roofPoint(side,inner,zb,lower),roofPoint(side,inner,za,lower)];
      const uvs = [[za*.84,-upper*4],[zb*.84,-upper*4],[zb*.84,-lower*4],[za*.84,-lower*4]];
      b.face(kind,tint,side === 1 ? points : points.reverse(),{uvs:side === 1 ? uvs : uvs.reverse()});
    }
    for (let i = 0; i < 8; i++) {
      const a = .969 * i/8, c = .969 * (i+1)/8;
      const p = [roofPoint(side,a,za,-.076),roofPoint(side,c,za,-.076),
        roofPoint(side,c,zb,-.076),roofPoint(side,a,zb,-.076)];
      const uvs = [[za*.82,a],[za*.82,c],[zb*.82,c],[zb*.82,a]];
      b.face('wood', i % 3 === 0 ? heartwood : oak, side === 1 ? p : p.reverse(),
        {uvs:side === 1 ? uvs : uvs.reverse()});
    }
  }
  // Each rafter lands on the wall plate and carries the projecting eave.
  for (let k = -5; k <= 5; k++) {
    const along = k * .177, start = roofPoint(side,.57,along,-.097);
    const bend = roofPoint(side,.77,along,-.108), tip = roofPoint(side,.953,along,-.096);
    b.beam('wood',heartwood,start,bend,.043,.040,{seed:k+24});
    b.beam('wood',oak,bend,tip,.043,.040,{seed:k+24});
  }
}

function gable(b, end) {
  const front = roof.z + end * .438, sill = 1.40, halfWidth = .515;
  const peak = t => dragonRoofHeight(Math.abs(t) / (roof.width/2)) - .084;
  // Close the gable with individual fitted boards, behind the ties and post.
  for (let i = 0; i < 12; i++) {
    const x1 = (i/6-1)*halfWidth+.0007, x2 = ((i+1)/6-1)*halfWidth-.0007;
    b.face('wood', i%3 === 0 ? shadowWood : heartwood,
      [[x1,sill,front],[x2,sill,front],[x2,peak(x2),front],[x1,peak(x1),front]],{grain:'y',seed:i+31});
  }
  const face = front + end * .024;
  b.box('wood',oak,[0,sill+.018,face],[1.13,.055,.067],{grain:'x',bevel:.004,seed:30});
  b.box('wood',oak,[0,1.61,face],[.066,.41,.072],{grain:'y',bevel:.003,seed:12});
  b.box('wood',cutWood,[0,1.679,face],[.47,.042,.079],{grain:'x',bevel:.002,seed:51});
  for (const side of [-1,1]) {
    b.beam('wood',oak,[side*.433,sill+.038,face],[side*.19,1.673,face],.045,.05,{seed:48});
    // Purlin ends advance into the shadow behind the front verge.
    for (const t of [.36,.68]) {
      const z = roofPoint(side,t,end)[2] - end * .066;
      b.box('wood',heartwood,[side*t*roof.width/2,dragonRoofHeight(t)-.11,(z+front)/2],
        [.048,.056,Math.abs(z-front)],{grain:'z',bevel:.002,seed:25});
    }
  }

  // A plain, cusped gegyo protects the meeting ends of the bargeboards.
  // The small boss is a cast nail cover. All of the profile is cut timber.
  const tip = roofPoint(1,0,end), z = tip[2] - end * .010;
  const apron = new T.Shape();
  apron.moveTo(-.093,-.045); apron.lineTo(0,.012); apron.lineTo(.093,-.045);
  apron.quadraticCurveTo(.082,-.072,.050,-.075);
  apron.quadraticCurveTo(.062,-.096,.049,-.111);
  apron.quadraticCurveTo(.031,-.088,.025,-.113);
  apron.quadraticCurveTo(.026,-.143,0,-.166);
  apron.quadraticCurveTo(-.026,-.143,-.025,-.113);
  apron.quadraticCurveTo(-.031,-.088,-.049,-.111);
  apron.quadraticCurveTo(-.062,-.096,-.050,-.075);
  apron.quadraticCurveTo(-.082,-.072,-.093,-.045);
  const board = new T.ExtrudeGeometry(apron,{depth:.016,bevelEnabled:true,bevelThickness:.0015,bevelSize:.0015,bevelSegments:1,curveSegments:4});
  board.translate(0,roof.ridge-.036,z + (end < 0 ? -.016 : 0));
  b.add('wood',cutWood,board,{grain:'y',seed:17});
  const pin = new T.CylinderGeometry(.014,.017,.006,6);
  pin.rotateX(Math.PI/2);
  pin.translate(0,roof.ridge-.099,z+end*.019);
  b.add('metal',patina,pin);
}

function ridgeCap(b) {
  // A peaked timber cap sheds water on both faces. The sheet copper wraps
  // the exposed end grain, with two narrow straps holding down the cap.
  const half = roof.depth*.482;
  const profile = [[-.060,-.015],[-.060,.026],[0,.058],[.060,.026],[.060,-.015]];
  function cover(kind, tint, a, c, outset) {
    const p = (i,z) => [profile[i][0]*(1+outset*13),roof.ridge+profile[i][1]+outset,roof.z+z];
    for (let i=0;i<profile.length-1;i++)
      b.face(kind,tint,[p(i,a),p(i,c),p(i+1,c),p(i+1,a)],{grain:'z',seed:70});
  }
  cover('wood',heartwood,-half,half,0);
  for (const end of [-1,1]) {
    cover('metal',patina,end*(half-.053),end*(half+.003),.0025);
    cover('metal','#a19c85',end*.404,end*.426,.002);
    const p = profile.map(([x,y])=>[x*1.0325,roof.ridge+y+.0025,roof.z+end*(half+.003)]);
    b.face('metal',patina,[p[0],p[1],p[3],p[4]]);
    b.face('metal',patina,[p[1],p[2],p[3]]);
  }
}

export function buildHokoraRoof(b) {
  for (const side of [-1,1]) {
    laidBark(b,side);
    eaveAndSoffit(b,side);
    for (const end of [-1,1]) bargeboard(b,side,end);
  }
  for (const end of [-1,1]) gable(b,end);
  ridgeCap(b);
}
