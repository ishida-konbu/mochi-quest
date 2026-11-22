// Run in a browser on the served project's origin. A developer changing a
// crown model can save (await bakeForest()).toBlob(cb, 'image/webp', .9).
import * as THREE from '../two/vendor/three.module.min.js';
import { TREE_FORM_COUNT } from '../two/forest-forms.js';
import { forestGeometry, forestMaterial, forestTexture } from '../two/forest-mesh.js';

export async function bakeForest() {
  const texture = await new THREE.TextureLoader().loadAsync(forestTexture('forest-sprays'));
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  const material = forestMaterial(texture);
  const renderer = new THREE.WebGLRenderer({alpha:true,antialias:true,preserveDrawingBuffer:true,premultipliedAlpha:false});
  const size = 256, output = document.createElement('canvas');
  output.width = size*16;
  output.height = size*8;
  const context = output.getContext('2d');
  renderer.setClearColor(0,0);
  renderer.setSize(size,size,false);

  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-.90,.90,.75,-.75,.01,10);
  scene.add(new THREE.HemisphereLight(0xfff9eb,0xc9c3b3,1.86));
  const sun = new THREE.DirectionalLight(0xfff4e4,1.45);
  sun.position.set(-2,3,2);
  scene.add(sun);
  // The spare last four cells carry the same moso fans with their culms
  // omitted. They sit over the real jointed stalks on the western slopes.
  for (let i=0; i<TREE_FORM_COUNT+4; i++) {
    const crownOnly=i>=TREE_FORM_COUNT, form=crownOnly?i-4:i;
    const geometry=forestGeometry(form,false,crownOnly), tree=new THREE.Mesh(geometry,material);
    scene.add(tree);
    for (let view=0; view<2; view++) {
      const angle=view*Math.PI/2;
      camera.position.set(Math.sin(angle)*3,.62,Math.cos(angle)*3);
      camera.lookAt(0,.58,0);
      camera.updateProjectionMatrix();
      renderer.render(scene,camera);
      context.drawImage(renderer.domElement,(i%8+8*view)*size,Math.floor(i/8)*size);
    }
    scene.remove(tree);
    geometry.dispose();
  }
  renderer.dispose();
  material.dispose();
  texture.dispose();
  return output;
}
