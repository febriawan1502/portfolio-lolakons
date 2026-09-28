import * as THREE from 'three';
import { stations as stationData } from './data.js';

const C = {
  grass: 0x85bc61, grassLight: 0xa6d67b, grassDark: 0x6fa94e,
  dirt: 0xa78358, dirtDark: 0x896b48, stone: 0xa7bbc1,
  metal: 0x18769a, metalLight: 0x78c6dc, red: 0xe65c52,
  green: 0xffd500, gold: 0xffd500, water: 0x33b9dc
};
const boxGeo = new THREE.BoxGeometry(1, 1, 1);
const mat = (color, extra = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.82, ...extra });
const mats = Object.fromEntries(Object.entries(C).map(([k, v]) => [k, mat(v)]));

function box(parent, material, x, y, z, w, h, d, cast = true) {
  const mesh = new THREE.Mesh(boxGeo, material);
  mesh.position.set(x, y, z);
  mesh.scale.set(w, h, d);
  mesh.castShadow = cast;
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}

function seeded(n) {
  const value = Math.sin(n * 127.1 + 78.233) * 43758.5453;
  return value - Math.floor(value);
}

function makeTree(scene, x, z, size = 1) {
  const g = new THREE.Group();
  g.position.set(x, 0, z);
  scene.add(g);
  box(g, mat(0x866543), 0, 1.3 * size, 0, .55 * size, 2.6 * size, .55 * size);
  const green = [0x4d9c66, 0x5ead6d, 0x73bf78, 0x8dcc88];
  [[0, 2.65, 0, 2.5, 1.1, 2.5], [-.55, 3.3, .1, 1.6, .8, 1.8], [.5, 3.25, -.3, 1.7, .8, 1.6], [0, 3.8, 0, 1.4, .65, 1.4]].forEach((p, i) => {
    box(g, mat(green[(i + Math.floor(seeded(x * 4 + z) * 3)) % green.length]), p[0] * size, p[1] * size, p[2] * size, p[3] * size, p[4] * size, p[5] * size);
  });
}

function makePole(scene, x, z, height = 6) {
  const group = new THREE.Group();
  group.position.set(x, 0, z);
  scene.add(group);
  box(group, mats.metal, 0, height / 2, 0, .4, height, .4);
  box(group, mats.metalLight, 0, height - .45, 0, 2.7, .23, .3);
  box(group, mats.metal, 0, .45, 0, .8, .9, .8);
  [-1, 1].forEach(s => {
    box(group, mat(0xc7c7af), s * 1.02, height - .22, 0, .27, .3, .27);
    box(group, mats.metal, s * 1.02, height - .68, 0, .09, .7, .09);
  });
  return { x, z, height, group };
}

function wire(scene, a, b, offset = 0) {
  const curve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(a.x + offset, a.height - .22, a.z),
    new THREE.Vector3((a.x + b.x) / 2 + offset, Math.min(a.height, b.height) - 1.1, (a.z + b.z) / 2),
    new THREE.Vector3(b.x + offset, b.height - .22, b.z)
  ]);
  const cable = new THREE.Mesh(new THREE.TubeGeometry(curve, 24, .045, 5, false), mat(0x315d70));
  scene.add(cable);
  return curve;
}

function station(scene, info) {
  const group = new THREE.Group();
  group.position.set(info.x, 0, info.z);
  group.userData.stationId = info.id;
  scene.add(group);
  box(group, mats.stone, 0, .12, 0, 3.5, .24, 3.2);
  box(group, mats.metal, 0, 1.65, 0, 2.8, 2.8, 1.8);
  box(group, mats.metalLight, 0, 3.1, 0, 3.15, .25, 2.1);
  box(group, mat(0x0b5c7e), 0, 1.8, .94, 2.2, 1.65, .08);
  const screenMat = mat(0x174f68, { emissive: 0x47251b, emissiveIntensity: .28 });
  const screen = box(group, screenMat, 0, 1.96, 1.005, 1.7, 1.05, .035, false);
  box(group, mats.gold, 0, .82, 1.01, 1.55, .08, .07);
  [-1.18, 1.18].forEach(x => box(group, mats.metalLight, x, 1.52, 1.02, .14, 2.1, .12));
  const lampMat = mat(C.red, { emissive: C.red, emissiveIntensity: .55 });
  const lamp = box(group, lampMat, 0, 3.4, .55, .35, .3, .35, false);
  const lampLight = new THREE.PointLight(C.red, .65, 4);
  lampLight.position.set(0, 3.5, .5);
  group.add(lampLight);
  const sign = new THREE.Mesh(new THREE.PlaneGeometry(1.85, .48), new THREE.MeshBasicMaterial({ map: labelTexture(info.number, info.title), transparent: true, depthWrite: false }));
  sign.position.set(0, 2.73, 1.075);
  group.add(sign);
  const hitbox = box(group, new THREE.MeshBasicMaterial({ visible: false }), 0, 1.65, 0, 3.7, 3.3, 3.5, false);
  hitbox.userData.stationId = info.id;
  return { ...info, group, lamp, lampMat, lampLight, screen, screenMat, hitbox, repaired: false };
}

function labelTexture(number, title) {
  const canvas = document.createElement('canvas');
  canvas.width = 512; canvas.height = 128;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#ffdf33'; ctx.fillRect(0, 0, 512, 128);
  ctx.fillStyle = '#124a66'; ctx.font = 'bold 58px monospace'; ctx.fillText(number, 18, 84);
  ctx.fillRect(112, 22, 3, 84);
  ctx.font = 'bold 43px monospace'; ctx.fillText(title.toUpperCase(), 137, 81);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export function createWorld(scene) {
  scene.background = new THREE.Color(0x9bdff4);
  scene.fog = new THREE.Fog(0x9bdff4, 35, 90);
  scene.add(new THREE.HemisphereLight(0xffffff, 0x75b6c3, 1.5));
  const sun = new THREE.DirectionalLight(0xfff2ca, 2.45);
  sun.position.set(-15, 25, 18);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.camera.left = -25; sun.shadow.camera.right = 25;
  sun.shadow.camera.top = 25; sun.shadow.camera.bottom = -25;
  sun.shadow.normalBias = .03;
  scene.add(sun);

  const water = new THREE.Mesh(new THREE.PlaneGeometry(150, 150), mat(C.water, { metalness: .12, roughness: .45 }));
  water.rotation.x = -Math.PI / 2;
  water.position.y = -2.2;
  water.receiveShadow = true;
  scene.add(water);
  const waveMat = new THREE.MeshBasicMaterial({ color: 0xe7fbff, transparent: true, opacity: .32 });
  for (let i = 0; i < 52; i++) {
    const x = (seeded(i + 19) - .5) * 85;
    const z = (seeded(i + 119) - .5) * 85;
    if (Math.abs(x) < 18 && Math.abs(z) < 16) continue;
    const wave = new THREE.Mesh(new THREE.PlaneGeometry(1 + seeded(i + 219) * 2, .06), waveMat);
    wave.rotation.x = -Math.PI / 2;
    wave.position.set(x, -2.18, z);
    scene.add(wave);
  }

  const terrain = new THREE.Group(); scene.add(terrain);
  const cube = new THREE.BoxGeometry(1, 1, 1);
  const positions = [];
  for (let x = -13; x <= 13; x++) for (let z = -11; z <= 11; z++) {
    if ((x / 14) ** 4 + (z / 12) ** 4 + seeded(x * 71 + z * 13) * .11 > 1.05) continue;
    positions.push([x, z]);
  }
  // face order is +x, -x, +y, -y, +z, -z: green on the sides, brighter green on top, dirt underneath
  const grass = new THREE.InstancedMesh(cube, [mats.grass, mats.grass, mats.grassLight, mats.dirt, mats.grass, mats.grass], positions.length);
  const dirt = new THREE.InstancedMesh(cube, mats.dirt, positions.length);
  const dummy = new THREE.Object3D();
  positions.forEach(([x, z], i) => {
    dummy.position.set(x, -.25, z); dummy.scale.set(1, .5, 1); dummy.updateMatrix(); grass.setMatrixAt(i, dummy.matrix);
    const variation = new THREE.Color().setHSL(.27 + seeded(i + 88) * .025, .34, .55 + seeded(i + 66) * .08);
    grass.setColorAt(i, variation);
    dummy.position.set(x, -1.2, z); dummy.scale.set(1, 1.4, 1); dummy.updateMatrix(); dirt.setMatrixAt(i, dummy.matrix);
  });
  grass.receiveShadow = true; dirt.receiveShadow = true;
  terrain.add(grass, dirt);

  const pathMat = mat(0xe7d19c);
  for (let z = -8; z <= 8; z++) for (let x = -1; x <= 1; x++) {
    if (seeded(x * 14 + z * 42) > .2) box(scene, pathMat, x + (seeded(z * 8 + x) - .5) * .15, .035, z, .88, .07, .88, false);
  }
  for (let x = -8; x <= 8; x++) for (const z of [-5, 6]) {
    if (Math.abs(x) < 2 || seeded(x * z) > .28) box(scene, pathMat, x, .037, z, .84, .07, .8, false);
  }

  [[-11,-9],[-5,-9],[3,-9],[11,-9],[-12,-1],[12,0],[-11,10],[-4,10],[3,10],[11,10]].forEach(([x,z],i) => makeTree(scene,x,z,.78 + seeded(i) * .3));
  const flowerColors = [0xffd500, 0xf6a8a1, 0xf7f1db];
  for (let i = 0; i < 68; i++) {
    const x = (seeded(i * 31) - .5) * 24;
    const z = (seeded(i * 73) - .5) * 20;
    if (Math.abs(x) < 2 || (Math.abs(x) > 5.7 && Math.abs(x) < 10 && (Math.abs(z + 5) < 2 || Math.abs(z - 6) < 2))) continue;
    box(scene, mat(flowerColors[i % 3]), x, .13, z, .12, .24, .12, false);
  }

  const poles = [makePole(scene,-5.5,-4.5), makePole(scene,0,-5.5,6.8), makePole(scene,5,-5.5), makePole(scene,-5.5,6), makePole(scene,0,6,6.8), makePole(scene,5.5,6)];
  const curves = [];
  [[0,1],[1,2],[3,4],[4,5],[1,4]].forEach(([a,b]) => { curves.push(wire(scene,poles[a],poles[b],-.95)); curves.push(wire(scene,poles[a],poles[b],.95)); });
  const stationObjects = stationData.map(info => station(scene,info));

  const core = new THREE.Group(); scene.add(core);
  box(core, mats.stone, 0, .18, 0, 3.2, .36, 3.2);
  box(core, mats.metal, 0, 1.15, 0, 1.7, 1.7, 1.7);
  box(core, mats.metalLight, 0, 2.1, 0, 2.1, .25, 2.1);
  const coreLightMat = mat(0x16789e, { emissive: 0x008fc7, emissiveIntensity: .25 });
  const coreLight = box(core, coreLightMat, 0, 1.22, .88, 1.15, .9, .07, false);
  const coreBeacon = new THREE.PointLight(0xffd500, .2, 8); coreBeacon.position.set(0, 2.4, 0); core.add(coreBeacon);

  const clickTargets = stationObjects.map(s => s.hitbox);
  const blockers = [terrain, ...stationObjects.map(s => s.group), ...poles.map(p => p.group)];
  return { stations: stationObjects, curves, clickTargets, blockers, coreLight, coreLightMat, coreBeacon, water };
}

export function setStationPower(station, on) {
  station.repaired = on;
  station.lampMat.color.setHex(on ? C.green : C.red);
  station.lampMat.emissive.setHex(on ? C.green : C.red);
  station.lampLight.color.setHex(on ? C.green : C.red);
  station.lampLight.intensity = on ? 1.2 : .65;
  station.lampMat.emissiveIntensity = on ? .75 : .55;
  station.screenMat.emissive.setHex(on ? 0x008fc7 : 0x47251b);
  station.screenMat.emissiveIntensity = on ? 1.1 : .5;
}

export function updateWorld(world, time, powerCount) {
  for (const s of world.stations) if (!s.repaired) {
    const pulse = .5 + .5 * Math.sin(time * 4 + Number(s.number));
    s.lampLight.intensity = .28 + pulse * .5;
    s.lampMat.emissiveIntensity = .3 + pulse * .65;
  }
  world.coreBeacon.intensity = .2 + powerCount * .35;
  world.coreLightMat.emissiveIntensity = .25 + powerCount * .24;
}
