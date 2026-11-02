import test from 'node:test';import assert from 'node:assert/strict';import * as THREE from 'three';import {frameRadio} from '../src/camera-framing.js';
test('framing keeps all cabinet/control box corners in portrait and landscape viewports',()=>{
 const box=new THREE.Box3(new THREE.Vector3(-1.2,0,-.5),new THREE.Vector3(1.2,1.3,.9));
 for(const aspect of [.6,1,1.5,2.5]){
  const frame=frameRadio(box,aspect),camera=new THREE.PerspectiveCamera(frame.fov,aspect,.1,40);camera.position.copy(frame.position);camera.lookAt(frame.center);camera.updateMatrixWorld();
  for(const x of [box.min.x,box.max.x])for(const y of [box.min.y,box.max.y])for(const z of [box.min.z,box.max.z]){
   const projected=new THREE.Vector3(x,y,z).project(camera);assert.ok(Math.abs(projected.x)<1);assert.ok(Math.abs(projected.y)<1);
  }
 }
});
