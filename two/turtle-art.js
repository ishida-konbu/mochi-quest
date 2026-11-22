// The dorsal and ventral shields meet at a narrow, slightly scalloped bridge.
// The pigment follows the entire shell, including the plates seen from below.
import * as T from './vendor/three.module.min.js';
import { brushContour, brushWash, inkVolume, surfaceGrain } from './scroll-sculpt.js';

const ink = '#4d483c', olive = '#a29a7b', straw = '#cdbd95';
let shellPaint, skinPaint;

function carapace(parent) {
  if (!shellPaint) {
    const map = new T.TextureLoader().load(new URL('./assets/bestiary/turtle-shell.webp', import.meta.url).href);
    map.colorSpace = T.SRGBColorSpace;
    map.anisotropy = 4;
    shellPaint = brushWash(new T.MeshStandardMaterial({ map, roughness: 1 }), .60);
  }
  const xyz = [], uv = [], indices = [], rows = 56, sides = 64;
  for (let j = 0; j <= rows; j++) {
    const t = j / rows, bow = Math.sin(t * Math.PI);
    const z = -.055 - .514 * Math.cos(t * Math.PI);
    for (let i = 0; i <= sides; i++) {
      const v = i / sides, a = v * 2 * Math.PI;
      const crown = Math.sin(a);
      const scallop = 1 - .017 * Math.cos(t * 19 * Math.PI) * Math.exp(-18 * crown * crown);
      const span = .398 * bow * (1.03 - .12 * t) * scallop;
      const x = Math.cos(a) * span;
      const bridge = .214 + .037 * t;
      const y = bridge + bow * (crown > 0 ? .347 * crown ** .83 : -.102 * (-crown) ** .71);
      xyz.push(x, y, z); uv.push(t, 1-v);
      if (j < rows && i < sides) {
        const k = j * (sides + 1) + i;
        indices.push(k, k + 1, k + sides + 1, k + 1, k + sides + 2, k + sides + 1);
      }
    }
  }
  const geo = new T.BufferGeometry();
  geo.setAttribute('position', new T.Float32BufferAttribute(xyz,3));
  geo.setAttribute('uv', new T.Float32BufferAttribute(uv,2));
  geo.setIndex(indices); geo.computeVertexNormals();
  const n = geo.attributes.normal, axis = new T.Vector3(), twin = new T.Vector3();
  for (let j=0;j<=rows;j++) {
    const i=j*(sides+1);
    axis.fromBufferAttribute(n,i).add(twin.fromBufferAttribute(n,i+sides)).normalize();
    n.setXYZ(i,axis.x,axis.y,axis.z);n.setXYZ(i+sides,axis.x,axis.y,axis.z);
  }
  const shell = new T.Mesh(geo,shellPaint);
  shell.name = '亀甲と腹甲'; shell.castShadow = shell.receiveShadow = true;
  parent.add(shell); brushContour(shell);
}

export function buildTurtle(parent,{group,batch}) {
  carapace(parent);
  batch(parent,b=>{
    inkVolume(b,[[0,.206,-.40,.093,.068],[0,.182,-.495,.065,.044],
      [.012,.152,-.57,.041,.032],[.027,.134,-.635,.022,.016],[.035,.139,-.679,.002,.002]],olive);
  });
  for (const side of [-1,1]) for(const front of [-1,1]) {
    const joint=group(parent,'turtleFoot'+side+','+front,side*.235,.178,front*.226);
    joint.userData.stride=side*front;
    batch(joint,b=>{
      inkVolume(b,[[0,.018,-.017,.068,.067],[side*.067,-.009,-.043,.078,.079],
        [side*.116,-.054,-.038,.063,.064],[side*.147,-.086,.007,.054,.059],
        [side*.169,-.105,.059,.067,.049],[side*.180,-.130,.09,.058,.027]],olive);
      for(let i=-2;i<=2;i++) {
        const x=side*.17+i*.024,z=.12-.012*Math.abs(i);
        inkVolume(b,[[x,-.12,.048,.025,.027],[x+i*.003,-.135,z-.008,.022,.018],
          [x+i*.007,-.146,z+.022,.016,.012]],straw,10);
        inkVolume(b,[[x+i*.005,-.142,z+.012,.012,.012],
          [x+i*.008,-.148,z+.029,.011,.011],[x+i*.011,-.155,z+.052,.001,.002]],ink,10);
      }
      // Keratin shields overlap down the leading edge of the forearm.
      for(let k=0;k<4;k++) {
        const x=side*(.089+k*.023),y=-.007-k*.023,z=-.028+k*.019;
        b.stroke([[x-side*.02,y+.016,z-.017],[x,y+.023,z+.004],
          [x+side*.021,y+.008,z+.029]],.0038,ink,7);
        b.stroke([[x-side*.019,y+.022,z-.017],[x,y+.028,z+.002],
          [x+side*.012,y+.019,z+.015]],.0037,straw,6);
      }
    });
  }
  const head=group(parent,'turtleNeck');
  batch(head,b=>{
    inkVolume(b,[[0,.203,.246,.098,.084],[0,.235,.332,.090,.084],[0,.295,.429,.079,.073],
      [0,.355,.512,.071,.077],[0,.397,.585,.091,.089],[0,.417,.656,.104,.087],
      [0,.427,.720,.085,.066],[0,.414,.758,.042,.037],[0,.399,.775,.004,.009]],olive,30);
    inkVolume(b,[[0,.386,.627,.066,.037],[0,.390,.696,.081,.032],[0,.389,.742,.056,.025],
      [0,.398,.772,.022,.016]],straw,14);
    for (const s of [-1,1]) {
      b.ball(s*.083,.447,.670,.013,.024,.026,ink,[0,s*.19,s*-.3]);
      b.ball(s*.092,.447,.674,.012,.016,.017,'#ac985d');
      b.ball(s*.101,.45,.673,.007,.012,.010,ink);
      b.ball(s*.107,.455,.677,.003,.003,.003,'#f3ead0');
      b.stroke([[s*.067,.458,.699],[s*.091,.474,.668],[s*.082,.465,.627]],.0045,ink,9);
      b.stroke([[s*.04,.406,.756],[s*.079,.400,.721],[s*.094,.408,.679]],.0038,ink,10);
      b.ball(s*.026,.430,.758,.005,.004,.007,ink);
      for (const [offset,tone,width] of [[0,ink,.007],[.009,straw,.006],[-.024,straw,.004]]) {
        b.stroke([[s*.071,.256+offset,.355],[s*.077,.304+offset,.44],
          [s*.074,.362+offset,.523],[s*.087,.408+offset,.597],[s*.098,.421+offset,.648]],width,tone,17);
      }
    }
  });
  parent.traverse(part=>{
    if (!part.isMesh || !part.material.vertexColors) return;
    if(!skinPaint) {
      skinPaint=part.material.clone();skinPaint.onBeforeCompile=part.material.onBeforeCompile;
      skinPaint.customProgramCacheKey=part.material.customProgramCacheKey;
      surfaceGrain(brushWash(skinPaint,.56),2.9);
    }
    part.material=skinPaint;
  });

}
