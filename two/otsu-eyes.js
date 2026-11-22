// Ink is laid down in each sculpt's own surface coordinates. All layers follow
// the turning cheek and are merged into the head's existing instanced mesh.
import * as T from './vendor/three.module.min.js';
import { surface } from './ryugu-ink.js';
import { pen } from './otsu-hide.js';

const origin=[0,0,0], unit=[1,1,1], wetInk='#392e29';

function socket(form,skin,side,station,angle,length,height,tilt) {
  // x runs toward the nose. y lifts the mark from cheek to brow. The small
  // convex rise is shared by iris, pupil and lids, so none pierces the other.
  function point(x,y,layer) {
    const bulge=.012*Math.exp(-1.25*(x*x+y*y));
    return skin(station+x*length,side*(angle-y*height-x*tilt),.004+bulge+layer);
  }
  function wash(knots,color,layer) {
    const outline=new T.SplineCurve([...knots,knots[0]].map(([x,y])=>new T.Vector2(x,y)));
    const centre=knots.reduce(([x,y],p)=>[x+p[0]/knots.length,y+p[1]/knots.length],[0,0]);
    const positions=[],uv=[],indices=[],steps=36,rings=4;
    positions.push(...point(...centre,layer));uv.push(.5,.5);
    for(let j=1;j<=rings;j++){
      const t=j/rings;
      for(let k=0;k<steps;k++){
        const edge=outline.getPoint(k/steps);
        const x=T.MathUtils.lerp(centre[0],edge.x,t),y=T.MathUtils.lerp(centre[1],edge.y,t);
        positions.push(...point(x,y,layer));uv.push(.5+.22*x,.5+.22*y);
        const a=1+(j-1)*steps+k,b=1+(j-1)*steps+(k+1)%steps;
        if(j===1)indices.push(0,b,a);
        else indices.push(a-steps,b-steps,b,a-steps,b,a);
      }
    }
    form.draw(surface(positions,indices,uv),origin,unit,color,origin,'paper');
  }
  function stroke(knots,radii,color=wetInk,layer=.004){
    pen(form,knots.map(([x,y])=>point(x,y,layer)),radii,color);
  }
  return {wash,stroke};
}

export function elephantEye(f,skin,side) {
  const {wash,stroke}=socket(f,skin,side,.676,1.41,.080,.173,.047);
  // The small dark opening disappears under a padded, descending upper lid.
  // The longer broken folds belong to the hide, beyond the corner of the eye.
  wash([[-.85,-.10],[-.52,.19],[.08,.32],[.54,.25],[.87,.03],[.45,-.21],[-.19,-.28],[-.63,-.21]],'#5b493b',.001);
  wash([[-.34,.12],[.03,.21],[.36,.11],[.32,-.14],[-.03,-.22],[-.26,-.13]],'#322d28',.004);
  stroke([[-1.07,-.19],[-.70,.15],[-.28,.31],[.17,.36],[.60,.26],[.91,.055]],
    [.0009,.008,.011,.010,.006,.0014]);
  stroke([[-.66,-.27],[-.30,-.41],[.14,-.44],[.52,-.30],[.77,-.13]],
    [.001,.003,.004,.003,.0008],'#796a55');
  stroke([[-1.18,.05],[-.83,.53],[-.32,.82],[.26,.88],[.78,.60],[1.06,.20]],
    [.0007,.003,.005,.005,.003,.0007],'#887a65',.002);
  stroke([[-1.24,-.24],[-1.55,-.35],[-1.90,-.69],[-2.06,-.73]],
    [.003,.004,.0025,.0007],'#807361',.001);
  stroke([[-.97,-.50],[-1.15,-.77],[-1.56,-.98]], [.001,.003,.0007],'#897b68',.001);
  stroke([[.07,.11],[.18,.10]],[.0026,.001], '#d7c9ad',.008);
}

export function oxEye(f,skin,side) {
  const {wash,stroke}=socket(f,skin,side,.471,1.33,.094,.220,.16);
  // A broad chestnut iris fills the open ox eye. A horizontal pupil, a
  // moist inner corner and a few long lashes are visible from the cart path.
  wash([[-1.18,.03],[-.84,.56],[-.36,.87],[.22,.84],[.72,.53],[1.10,-.04],[.77,-.31],[.22,-.67],[-.44,-.61],[-.92,-.25]],'#47382f',.001);
  wash([[-.90,.02],[-.67,.46],[-.27,.70],[.20,.70],[.63,.42],[.79,-.03],[.56,-.38],[.07,-.54],[-.50,-.44]],'#99724c',.004);
  wash([[-.79,-.12],[-.59,.08],[-.16,.15],[.40,.22],[.66,.19],[.61,.00],[.22,-.12],[-.36,-.25],[-.66,-.27]],'#302a24',.007);
  stroke([[-1.20,-.05],[-.92,.39],[-.48,.77],[.03,.87],[.58,.64],[.94,.22],[1.16,-.05]],
    [.001,.008,.012,.012,.009,.006,.001],wetInk,.005);
  stroke([[.92,-.09],[.64,-.38],[.15,-.62],[-.39,-.57],[-.82,-.34]], [.001,.0035,.004,.003,.0008],'#b69775',.005);
  stroke([[.92,.12],[1.09,-.05],[1.29,-.24]], [.003,.004,.0008],'#876756',.004);
  for(const lash of [[-.89,.40,-1.17,.87],[-.67,.62,-.91,1.20],[-.40,.74,-.54,1.25]]){
    const [x,y,tipX,tipY]=lash;
    stroke([[x,y],[x-.04,y+.22],[tipX,tipY]], [.0038,.0025,.00065],wetInk,.009);
  }
  stroke([[.12,.43],[.27,.48],[.37,.47]], [.002,.004,.0014],'#f1e5c8',.012);
}

export function bakuEye(f,skin,side) {
  const {wash,stroke}=socket(f,skin,side,.632,1.28,.094,.304,.065);
  // The round, staring eye turns toward the nose inside a hooked socket, as
  // in the scroll's fantastical beasts. Leave the paper open around its bead.
  wash([[-1.12,.37],[-.65,.76],[-.10,.96],[.50,.81],[.84,.41],[.93,-.16],[.62,-.62],[.05,-.84],[-.55,-.70],[-.87,-.27]],'#695945',.001);
  wash([[-.86,.31],[-.54,.67],[-.07,.82],[.41,.72],[.71,.35],[.75,-.13],[.48,-.52],[.04,-.67],[-.46,-.54],[-.73,-.22]],'#f7eacc',.004);
  wash([[-.23,.17],[-.03,.43],[.26,.45],[.49,.24],[.51,-.02],[.35,-.24],[.08,-.31],[-.18,-.16]],'#3d3228',.007);
  stroke([[-1.48,.84],[-1.40,.54],[-1.12,.45],[-.70,.69],[-.23,.97],[.28,.95],[.67,.71],[.91,.38]],
    [.001,.006,.010,.014,.015,.012,.007,.0015],wetInk,.005);
  stroke([[.88,.23],[.96,-.16],[.69,-.62],[.16,-.84],[-.29,-.82]], [.0014,.006,.009,.006,.0012],wetInk,.004);
  stroke([[.19,.30],[.28,.31]],[.0034,.0015],'#f8ead2',.013);
}
