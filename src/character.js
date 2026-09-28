import * as THREE from 'three';

const cube = new THREE.BoxGeometry(1, 1, 1);
const material = (color, options = {}) => new THREE.MeshStandardMaterial({ color, roughness: .86, ...options });
const navy = material(0x23394b);
const boot = material(0x1c292e);
const skin = material(0xc28d68);
const vest = material(0x236889);
const stripe = material(0xf1d776, { emissive: 0x514515, emissiveIntensity: .35 });
const white = material(0xf1f1e5);

function block(group, mat, x, y, z, w, h, d) {
  const mesh = new THREE.Mesh(cube, mat);
  mesh.position.set(x, y, z);
  mesh.scale.set(w, h, d);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  group.add(mesh);
  return mesh;
}

function logoTexture() {
  const c = document.createElement('canvas'); c.width = 128; c.height = 128;
  const g = c.getContext('2d');
  g.fillStyle = '#f4d74b'; g.fillRect(0, 0, 128, 128);
  g.fillStyle = '#d74339';
  g.beginPath(); g.moveTo(73, 10); g.lineTo(46, 61); g.lineTo(71, 61); g.lineTo(54, 96); g.lineTo(91, 47); g.lineTo(66, 47); g.closePath(); g.fill();
  g.strokeStyle = '#2273a9'; g.lineWidth = 8;
  for (let i = 0; i < 3; i++) { g.beginPath(); g.moveTo(13, 86 + i * 12); g.bezierCurveTo(33, 75 + i * 12, 46, 97 + i * 12, 65, 86 + i * 12); g.bezierCurveTo(82, 76 + i * 12, 100, 97 + i * 12, 116, 86 + i * 12); g.stroke(); }
  const texture = new THREE.CanvasTexture(c); texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export function createCharacter(scene) {
  const root = new THREE.Group();
  root.position.set(0, 0, 2.5);
  scene.add(root);
  const body = new THREE.Group(); root.add(body);
  block(body, navy, 0, 1.6, 0, .9, 1.05, .48);
  block(body, vest, 0, 1.65, .28, .82, .93, .08);
  block(body, vest, 0, 1.65, -.28, .82, .93, .08);
  block(body, stripe, 0, 1.44, .333, .78, .11, .035);
  block(body, stripe, 0, 1.44, -.333, .78, .11, .035);
  [-.28, .28].forEach(x => {
    block(body, stripe, x, 1.84, .333, .095, .54, .035);
    block(body, stripe, x, 1.84, -.333, .095, .54, .035);
  });
  const logo = new THREE.Mesh(new THREE.PlaneGeometry(.25, .25), new THREE.MeshBasicMaterial({ map: logoTexture(), side: THREE.DoubleSide }));
  logo.position.set(.18, 1.79, .344); body.add(logo);
  const backLogo = logo.clone(); backLogo.scale.set(1.8, 1.8, 1); backLogo.position.set(0, 1.72, -.345); backLogo.rotation.y = Math.PI; body.add(backLogo);
  block(body, skin, 0, 2.48, 0, .56, .64, .54);
  block(body, white, 0, 2.88, 0, .76, .26, .69);
  block(body, white, 0, 2.78, .21, .87, .11, .52);
  block(body, material(0xc9d2d0), 0, 2.91, 0, .8, .05, .73);
  const face = material(0x27383c);
  [-.16, .16].forEach(x => block(body, face, x, 2.49, .282, .065, .065, .018));
  const limbs = {};
  for (const side of [-1, 1]) {
    const arm = new THREE.Group(); arm.position.set(side * .6, 2.03, 0); body.add(arm);
    block(arm, vest, 0, -.26, 0, .32, .55, .42);
    block(arm, stripe, 0, -.37, .224, .33, .1, .025);
    block(arm, skin, 0, -.66, 0, .27, .24, .33);
    limbs[side < 0 ? 'leftArm' : 'rightArm'] = arm;
    const leg = new THREE.Group(); leg.position.set(side * .24, 1.12, 0); body.add(leg);
    block(leg, navy, 0, -.39, 0, .35, .8, .43);
    block(leg, boot, 0, -.84, .06, .39, .25, .57);
    limbs[side < 0 ? 'leftLeg' : 'rightLeg'] = leg;
  }
  return { root, body, limbs, velocityY: 0, grounded: true, walkTime: 0, facing: 0, repairing: 0 };
}

export function updateCharacter(character, input, cameraYaw, delta, elapsed, paused) {
  const { root, body, limbs } = character;
  const dx = paused ? 0 : input.x;
  const dz = paused ? 0 : input.y;
  const length = Math.hypot(dx, dz);
  const moving = length > .08;
  if (moving && character.repairing <= 0) {
    const forward = new THREE.Vector3(-Math.sin(cameraYaw), 0, -Math.cos(cameraYaw));
    const right = new THREE.Vector3(Math.cos(cameraYaw), 0, -Math.sin(cameraYaw));
    const direction = forward.multiplyScalar(-dz).add(right.multiplyScalar(dx)).normalize();
    const speed = input.run ? 6.2 : 4.4;
    root.position.addScaledVector(direction, speed * delta);
    root.position.x = THREE.MathUtils.clamp(root.position.x, -11.5, 11.5);
    root.position.z = THREE.MathUtils.clamp(root.position.z, -9.5, 9.5);
    const target = Math.atan2(direction.x, direction.z);
    let angle = target - character.facing;
    angle = Math.atan2(Math.sin(angle), Math.cos(angle));
    character.facing += angle * Math.min(1, delta * 11);
    root.rotation.y = character.facing;
    character.walkTime += delta * speed * 2.7;
  }
  if (input.jump && character.grounded && !paused && character.repairing <= 0) {
    character.velocityY = 7.2;
    character.grounded = false;
  }
  character.velocityY -= 18 * delta;
  root.position.y += character.velocityY * delta;
  if (root.position.y <= 0) { root.position.y = 0; character.velocityY = 0; character.grounded = true; }
  const swing = moving && character.grounded && !paused && character.repairing <= 0 ? Math.sin(character.walkTime) * .65 : 0;
  const ease = Math.min(1, delta * 12);
  limbs.leftLeg.rotation.x = THREE.MathUtils.lerp(limbs.leftLeg.rotation.x, swing, ease);
  limbs.rightLeg.rotation.x = THREE.MathUtils.lerp(limbs.rightLeg.rotation.x, -swing, ease);
  limbs.leftArm.rotation.x = THREE.MathUtils.lerp(limbs.leftArm.rotation.x, -swing * .8, ease);
  limbs.rightArm.rotation.x = THREE.MathUtils.lerp(limbs.rightArm.rotation.x, swing * .8, ease);
  body.position.y = moving && character.grounded && !paused ? Math.abs(Math.sin(character.walkTime)) * .055 : 0;
  if (character.repairing > 0) {
    character.repairing -= delta;
    limbs.rightArm.rotation.x = -1.2 + Math.sin(elapsed * 24) * .25;
    limbs.leftArm.rotation.x = -.9 + Math.sin(elapsed * 18) * .2;
    body.rotation.z = Math.sin(elapsed * 16) * .035;
  } else body.rotation.z = THREE.MathUtils.lerp(body.rotation.z, 0, ease);
}
