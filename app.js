import * as THREE from '/vendor/three.module.js';

const host = document.querySelector('#scene');
const status = document.querySelector('#status');
try {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#d5eaf2');
  scene.fog = new THREE.Fog('#d5eaf2', 16, 35);
  const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 60);
  camera.position.set(6, 5, 9);
  camera.lookAt(0, 1, 0);
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  host.append(renderer.domElement);
  scene.add(new THREE.HemisphereLight(0xffffff, 0x8caabd, 3));
  const sun = new THREE.DirectionalLight(0xffffff, 3);
  sun.position.set(4, 8, 5);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  Object.assign(sun.shadow.camera, { left: -9, right: 9, top: 9, bottom: -9 });
  scene.add(sun);
  const snow = new THREE.MeshStandardMaterial({ color: '#f6fcff', roughness: 0.85 });
  const floor = new THREE.Mesh(new THREE.CylinderGeometry(5.6, 5.9, 0.35, 96), snow);
  floor.position.y = -0.2;
  floor.receiveShadow = true;
  scene.add(floor);
  const penguin = new THREE.Group();
  scene.add(penguin);
  const black = new THREE.MeshStandardMaterial({ color: '#203341', roughness: 0.5 });
  const white = new THREE.MeshStandardMaterial({ color: '#fff9eb', roughness: 0.7 });
  const orange = new THREE.MeshStandardMaterial({ color: '#f4a044', roughness: 0.6 });
  function oval(parent, material, position, scale) {
    const mesh = new THREE.Mesh(new THREE.SphereGeometry(1, 40, 28), material);
    mesh.position.set(...position);
    mesh.scale.set(...scale);
    mesh.castShadow = true;
    parent.add(mesh);
    return mesh;
  }
  oval(penguin, black, [0, 1.2, 0], [0.7, 1.05, 0.59]);
  oval(penguin, white, [0, 1.12, 0.43], [0.53, 0.78, 0.23]);
  oval(penguin, black, [0, 2.06, 0.02], [0.61, 0.62, 0.56]);
  for (const x of [-1, 1]) {
    oval(penguin, white, [x * 0.235, 2.12, 0.48], [0.25, 0.29, 0.13]);
    oval(penguin, black, [x * 0.225, 2.17, 0.595], [0.072, 0.09, 0.045]);
    oval(penguin, white, [x * 0.225 - 0.018, 2.2, 0.63], [0.022, 0.026, 0.015]);
    oval(penguin, orange, [x * 0.34, 0.12, 0.24], [0.26, 0.13, 0.42]);
  }
  const beak = new THREE.Mesh(new THREE.ConeGeometry(0.17, 0.4, 32), orange);
  beak.rotation.x = Math.PI / 2;
  beak.position.set(0, 1.96, 0.72);
  penguin.add(beak);
  const wings = [-1, 1].map(sign => {
    const wing = oval(penguin, black, [sign * 0.71, 1.3, 0], [0.17, 0.65, 0.28]);
    wing.rotation.z = sign * 0.3;
    return wing;
  });
  for (const [x, z, size] of [[-3, -2, 0.6], [3, -2.5, 0.4], [-3.7, 1.5, 0.3]]) {
    oval(scene, snow, [x, 0, z], [size, size * 0.6, size]);
  }
  const keys = new Set();
  const directions = { ArrowUp: 'up', w: 'up', ArrowDown: 'down', s: 'down', ArrowLeft: 'left', a: 'left', ArrowRight: 'right', d: 'right' };
  window.addEventListener('keydown', event => {
    const direction = directions[event.key] || directions[event.key.toLowerCase()];
    if (direction && !['INPUT', 'TEXTAREA'].includes(event.target.tagName)) {
      event.preventDefault(); keys.add(direction);
    }
  });
  window.addEventListener('keyup', event => keys.delete(directions[event.key] || directions[event.key.toLowerCase()]));
  window.addEventListener('blur', () => keys.clear());
  document.querySelectorAll('[data-move]').forEach(button => {
    button.addEventListener('pointerdown', event => {
      button.setPointerCapture(event.pointerId); keys.add(button.dataset.move);
    });
    for (const type of ['pointerup', 'pointercancel', 'lostpointercapture']) button.addEventListener(type, () => keys.delete(button.dataset.move));
  });
  let drag;
  host.addEventListener('pointerdown', event => { host.focus(); host.setPointerCapture(event.pointerId); drag = event.clientX; });
  host.addEventListener('pointermove', event => {
    if (drag !== undefined) { penguin.rotation.y += (event.clientX - drag) * 0.015; drag = event.clientX; }
  });
  for (const type of ['pointerup', 'pointercancel', 'lostpointercapture']) host.addEventListener(type, () => { drag = undefined; });
  document.querySelector('#reset').addEventListener('click', () => {
    keys.clear(); penguin.position.set(0, 0, 0); penguin.rotation.set(0, 0, 0);
  });
  new ResizeObserver(() => {
    camera.aspect = host.clientWidth / host.clientHeight;
    camera.updateProjectionMatrix(); renderer.setSize(host.clientWidth, host.clientHeight);
  }).observe(host);
  const clock = new THREE.Clock();
  let elapsed = 0;
  renderer.setAnimationLoop(() => {
    const dt = Math.min(clock.getDelta(), 0.05); elapsed += dt;
    const x = Number(keys.has('right')) - Number(keys.has('left'));
    const z = Number(keys.has('down')) - Number(keys.has('up'));
    const moving = x !== 0 || z !== 0;
    if (moving) {
      const length = Math.hypot(x, z);
      penguin.position.x += x / length * dt * 2;
      penguin.position.z += z / length * dt * 2;
      const distance = Math.hypot(penguin.position.x, penguin.position.z);
      if (distance > 4.4) { penguin.position.x *= 4.4 / distance; penguin.position.z *= 4.4 / distance; }
      penguin.rotation.y = Math.atan2(x, z);
    }
    penguin.rotation.z = moving ? Math.sin(elapsed * 13) * 0.09 : 0;
    penguin.position.y = moving ? Math.abs(Math.sin(elapsed * 13)) * 0.07 : 0;
    wings.forEach((wing, i) => { wing.rotation.z = (i ? 1 : -1) * (0.3 + (moving ? Math.sin(elapsed * 13) * 0.16 : 0)); });
    renderer.render(scene, camera);
  });
} catch (error) {
  status.textContent = 'The 3D playground needs a browser with WebGL enabled.';
  console.error(error);
}
