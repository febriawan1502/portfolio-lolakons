import * as THREE from 'three';
import { stations as stationData } from './data.js';
import { createPlant, createHouse, powerAppliance, updatePlant, updateHouse } from './powerPlants.js';

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

function labelTexture(number, title) {
  const canvas = document.createElement('canvas');
  canvas.width = 512; canvas.height = 128;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#ffdf33'; ctx.fillRect(0, 0, 512, 128);
  ctx.fillStyle = '#124a66'; ctx.font = 'bold 58px monospace'; ctx.fillText(number, 18, 84);
  ctx.fillRect(112, 22, 3, 84);
  ctx.font = 'bold 33px monospace'; ctx.fillText(title.toUpperCase(), 137, 79);
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

  const stationObjects = stationData.map(info => createPlant(scene, info, labelTexture));
  const house = createHouse(scene);
  const curves = stationObjects.map(station => {
    const start = new THREE.Vector3(station.x, .19, station.z);
    const end = new THREE.Vector3(Math.sign(station.x) * 2.55, .19, Math.sign(station.z) * 1.7);
    const curve = new THREE.CatmullRomCurve3([start, new THREE.Vector3((start.x + end.x) / 2, .2, (start.z + end.z) / 2), end]);
    scene.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 22, .065, 5, false), mat(0x38677b)));
    return { curve, id: station.id };
  });
  const clickTargets = [...stationObjects.map(s => s.hitbox), house.hitbox];
  const blockers = [terrain, ...stationObjects.map(s => s.group)];
  return { stations: stationObjects, curves, clickTargets, blockers, house, water };
}

export function setStationPower(world, station, on) {
  station.repaired = on;
  station.lampMat.color.setHex(on ? C.green : C.red);
  station.lampMat.emissive.setHex(on ? C.green : C.red);
  station.lampMat.emissiveIntensity = on ? 1 : .5;
  station.lampLight.color.setHex(on ? C.green : C.red);
  station.lampLight.intensity = on ? .9 : .3;
  if (on) powerAppliance(world.house, station.appliance);
}

export function updateWorld(world, time) {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  for (const station of world.stations) {
    if (!station.repaired) {
      const pulse = .5 + .5 * Math.sin(time * 4 + Number(station.number));
      station.lampLight.intensity = .15 + pulse * .25;
      station.lampMat.emissiveIntensity = .25 + pulse * .45;
    }
    updatePlant(station, time, reducedMotion);
  }
  updateHouse(world.house, reducedMotion);
}
