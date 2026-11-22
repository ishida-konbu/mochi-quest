import * as THREE from './vendor/three.module.min.js';
import { PALACE_POOL } from './ryugu-layout.js';

// A still tidal basin inside the air bell: the ink of the reflected pillars
// breaks into curls while the wet treads remain visible beneath the surface.
export function palacePoolSurface(clock) {
  const plane=new THREE.PlaneGeometry(PALACE_POOL.d,PALACE_POOL.w);
  plane.rotateX(-Math.PI/2);
  const material=new THREE.ShaderMaterial({
    side:THREE.DoubleSide,transparent:true,depthWrite:false,uniforms:{clock},
    vertexShader:`varying vec2 basin;varying vec3 eyeDir;
      void main(){basin=position.xz;vec4 ws=modelMatrix*vec4(position,1.);
        eyeDir=cameraPosition-ws.xyz;gl_Position=projectionMatrix*viewMatrix*ws;}`,
    fragmentShader:`uniform float clock;varying vec2 basin;varying vec3 eyeDir;
      void main(){
        float a=.065*sin(3.1*basin.x+basin.y*.7+clock*.81)
          +.047*sin(basin.x*2.33-basin.y*2.28-clock*1.05);
        float b=basin.y+a+.075*sin(basin.x*1.7+clock*.71);
        float fresnel=pow(1.-abs(normalize(eyeDir).y),2.);
        float reflection=smoothstep(.72,1.,cos(basin.x*1.33+a*4.1));
        vec3 light=mix(vec3(.097,.26,.235),vec3(.36,.37,.26),reflection*.47+fresnel*.26);
        float edge=4.20-abs(basin.y);
        float thread=1.-smoothstep(.007,.038+fwidth(b),abs(abs(b)-4.09));
        float curl=sin(b*3.7+sin(2.9*basin.x+clock*.7)*.48-clock*.60);
        float shimmer=smoothstep(.94,.997,curl)*smoothstep(.10,.93,sin(basin.x*2.2-basin.y+clock*.44));
        light+=vec3(.20,.25,.18)*(thread+shimmer*.52);
        gl_FragColor=vec4(light,.38+.36*fresnel+.15*max(thread,shimmer)+.12*(1.-smoothstep(0.,.4,edge)));
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`
  });
  const mesh=new THREE.Mesh(plane,material);mesh.name='潮入の間の水面';mesh.renderOrder=2;return mesh;
}
