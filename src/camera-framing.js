import * as THREE from 'three';
// Fit the cabinet and every control, rather than the decorative telescoping aerial.
export function frameRadio(box, aspect) {
  const fov = THREE.MathUtils.clamp(38 + (1-aspect)*6, 32, 48);
  const direction = new THREE.Vector3(0,0.17,1).normalize();
  const right = new THREE.Vector3(1,0,0), up = new THREE.Vector3().crossVectors(direction,right).normalize();
  const center = box.getCenter(new THREE.Vector3());
  const tanV = Math.tan(THREE.MathUtils.degToRad(fov/2)), tanH = tanV * Math.max(.1,aspect);
  let distance=0;
  for(const x of [box.min.x,box.max.x]) for(const y of [box.min.y,box.max.y]) for(const z of [box.min.z,box.max.z]) {
    const offset=new THREE.Vector3(x,y,z).sub(center);
    distance=Math.max(distance,Math.abs(offset.dot(right))/tanH+offset.dot(direction),Math.abs(offset.dot(up))/tanV+offset.dot(direction));
  }
  return { fov, center, position:center.clone().addScaledVector(direction,distance*1.13) };
}
