import * as THREE from 'three';

const cube = new THREE.BoxGeometry(1, 1, 1);
const material = (color, options = {}) => new THREE.MeshStandardMaterial({ color, roughness: .76, ...options });
const M = {
  concrete: material(0xb8b6a3), steel: material(0x426276), white: material(0xe9eee7),
  dark: material(0x203d51), blue: material(0x278db1), water: material(0x40bade, { transparent: true, opacity: .78 }),
  pipe: material(0xa86943), wood: material(0xa77a50)
};

function block(parent, mat, x, y, z, w, h, d) {
  const mesh = new THREE.Mesh(cube, mat);
  mesh.position.set(x, y, z);
  mesh.scale.set(w, h, d);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}

function cylinder(parent, mat, x, y, z, top, bottom, height, sides = 8) {
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(top, bottom, height, sides), mat);
  mesh.position.set(x, y, z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}

export function createPlant(scene, info, labelTexture) {
  const group = new THREE.Group();
  group.position.set(info.x, 0, info.z);
  scene.add(group);
  block(group, M.concrete, 0, .16, 0, 3.7, .32, 3.5);
  const motion = {};

  if (info.type === 'wind') {
    cylinder(group, M.white, 0, 2.2, -.35, .2, .43, 4.2, 8);
    block(group, M.steel, 0, 4.25, -.18, .75, .4, .8);
    const rotor = new THREE.Group();
    rotor.position.set(0, 4.25, .3);
    group.add(rotor);
    cylinder(rotor, M.steel, 0, 0, .05, .23, .23, .25).rotation.x = Math.PI / 2;
    for (let i = 0; i < 3; i++) {
      const blade = new THREE.Group();
      blade.rotation.z = i * Math.PI * 2 / 3;
      rotor.add(blade);
      block(blade, M.white, 0, 1.05, 0, .29, 1.85, .12).rotation.z = -.08;
      block(blade, M.blue, 0, 1.82, .01, .31, .13, .14);
    }
    motion.rotor = rotor;
  }

  if (info.type === 'solar') {
    for (const x of [-.85, .85]) {
      block(group, M.steel, x, .75, -.35, .13, .95, .13);
      const frame = new THREE.Group();
      frame.position.set(x, 1.25, -.25);
      frame.rotation.x = -.34;
      group.add(frame);
      block(frame, M.steel, 0, 0, 0, 1.53, .09, 2.25);
      block(frame, M.dark, 0, .06, 0, 1.4, .03, 2.1);
      for (const px of [-.34, .34]) for (const pz of [-.66, 0, .66]) {
        block(frame, material(0x235f85, { metalness: .45, roughness: .28 }), px, .08, pz, .61, .015, .61);
      }
      const glint = block(frame, material(0xcaf8ff, { emissive: 0x8de6ff, emissiveIntensity: 1, transparent: true, opacity: .75 }), -.67, .105, 0, .09, .018, 2.06);
      glint.visible = false;
      (motion.glints ??= []).push(glint);
    }
    block(group, M.steel, 0, .52, 1.25, 1.1, .8, .35);
  }

  if (info.type === 'hydro') {
    block(group, M.concrete, 0, 1.2, -.65, 3.3, 2.2, .7);
    block(group, M.water, 0, 2.23, -1.15, 2.7, .13, .7);
    block(group, M.steel, 0, .65, .15, 2.75, 1.1, 1.25);
    for (const x of [-1.1, 0, 1.1]) {
      block(group, M.dark, x, .72, .81, .62, .72, .07);
      for (let i = 0; i < 3; i++) {
        const stream = block(group, M.water, x, 1.4 - i * .45, .88 + i * .2, .43, .42, .12);
        stream.visible = false;
        (motion.streams ??= []).push({ mesh: stream, index: i, x });
      }
    }
    const wheel = new THREE.Group();
    wheel.position.set(0, .65, 1.15);
    group.add(wheel);
    cylinder(wheel, M.steel, 0, 0, 0, .5, .5, .2, 10).rotation.x = Math.PI / 2;
    for (let i = 0; i < 6; i++) {
      const vane = block(wheel, M.blue, 0, .52, 0, .17, .32, .22);
      vane.rotation.z = i * Math.PI / 3;
      vane.position.set(Math.sin(i * Math.PI / 3) * .52, Math.cos(i * Math.PI / 3) * .52, 0);
    }
    motion.wheel = wheel;
  }

  if (info.type === 'geothermal') {
    block(group, M.steel, 0, .65, -.2, 2.5, .95, 1.75);
    for (const x of [-.8, .8]) {
      cylinder(group, M.pipe, x, 1.65, -.4, .34, .4, 1.45, 8);
      cylinder(group, M.dark, x, 2.43, -.4, .43, .43, .16, 8);
      for (let i = 0; i < 4; i++) {
        const puff = new THREE.Mesh(new THREE.SphereGeometry(.25 + i * .055, 6, 5), material(0xf2eee1, { transparent: true, opacity: .38, depthWrite: false }));
        puff.position.set(x, 2.6 + i * .4, -.4);
        puff.visible = false;
        group.add(puff);
        (motion.smoke ??= []).push({ mesh: puff, index: i, x });
      }
    }
    block(group, M.pipe, 0, .5, 1.12, 2.5, .3, .35);
    for (const x of [-1.2, 1.2]) cylinder(group, M.pipe, x, .45, 1.08, .24, .24, .7);
  }

  const sign = new THREE.Mesh(new THREE.PlaneGeometry(2.75, .55), new THREE.MeshBasicMaterial({ map: labelTexture(info.number, info.title), transparent: true, depthWrite: false }));
  sign.position.set(0, .48, 1.79);
  group.add(sign);
  const lampMat = material(0xd45a47, { emissive: 0xb84131, emissiveIntensity: .5 });
  block(group, M.steel, 1.5, .72, 1.15, .25, .9, .25);
  block(group, lampMat, 1.5, 1.24, 1.15, .38, .25, .38);
  const lampLight = new THREE.PointLight(0xe15f4c, .3, 3);
  lampLight.position.set(1.5, 1.3, 1.15);
  group.add(lampLight);
  const hitbox = block(group, new THREE.MeshBasicMaterial({ visible: false }), 0, 2.1, 0, 3.8, 4.4, 3.7);
  hitbox.userData.stationId = info.id;
  return { ...info, group, motion, lampMat, lampLight, hitbox, repaired: false };
}

export function updatePlant(station, time, reducedMotion) {
  if (!station.repaired) return;
  const { motion } = station;
  if (motion.rotor && !reducedMotion) motion.rotor.rotation.z -= .055;
  if (motion.glints) motion.glints.forEach((glint, i) => {
    glint.visible = true;
    glint.position.x = reducedMotion ? 0 : - .67 + ((time * .7 + i * .35) % 1) * 1.34;
  });
  if (motion.streams) motion.streams.forEach(({ mesh, index, x }) => {
    mesh.visible = true;
    if (!reducedMotion) {
      const phase = (time * 1.3 + index / 3) % 1;
      mesh.position.set(x, 1.48 - phase * 1.14, .86 + phase * .65);
    }
  });
  if (motion.wheel && !reducedMotion) motion.wheel.rotation.z -= .03;
  if (motion.smoke) motion.smoke.forEach(({ mesh, index, x }) => {
    mesh.visible = true;
    const phase = reducedMotion ? index / 4 : (time * .38 + index / 4) % 1;
    mesh.position.set(x + Math.sin(time * 1.5 + index) * (reducedMotion ? 0 : .13), 2.6 + phase * 2, -.4);
    mesh.material.opacity = .42 * (1 - phase);
    mesh.scale.setScalar(.8 + phase * 1.15);
  });
}

export function createHouse(scene) {
  const house = new THREE.Group();
  scene.add(house);
  const wall = material(0xf5e8c9);
  const roof = material(0xc66d4e);
  block(house, M.concrete, 0, .15, 0, 5.3, .3, 4.1);
  block(house, M.wood, 0, .34, 0, 4.85, .1, 3.65);
  block(house, wall, 0, 1.45, -1.85, 5.1, 2.3, .28);
  block(house, wall, -2.42, 1.45, -.2, .28, 2.3, 3.6);
  block(house, wall, 2.42, 1.45, -.2, .28, 2.3, 3.6);
  block(house, roof, 0, 2.68, -1.82, 5.6, .22, .35);
  block(house, roof, 0, 2.68, 1.65, 5.6, .22, .35);
  block(house, roof, -2.34, 2.56, 1.26, .35, .2, 2.2);
  block(house, roof, 2.34, 2.56, 1.26, .35, .2, 2.2);
  const readyMat = material(0x6b7770, { emissive: 0xffd500, emissiveIntensity: 0 });
  block(house, readyMat, 0, 2.94, 1.65, .55, .33, .28);
  const hitbox = block(house, new THREE.MeshBasicMaterial({ visible: false }), 0, 1.5, 0, 5.4, 3, 4.2);
  hitbox.userData.house = true;
  const lampMat = material(0x77776b, { emissive: 0xffdf76, emissiveIntensity: 0 });
  block(house, M.dark, -1.55, 2.14, .56, .07, .55, .07);
  block(house, material(0xf2e3a6), -1.55, 1.83, .56, .64, .2, .64);
  block(house, lampMat, -1.55, 1.66, .56, .38, .17, .38);
  const lampLight = new THREE.PointLight(0xffd97a, 0, 6);
  lampLight.position.set(-1.55, 1.6, .56); house.add(lampLight);

  block(house, M.dark, -.45, 1.5, -1.62, 1.65, 1.05, .13);
  const tvMat = material(0x182b31, { emissive: 0x58c9e0, emissiveIntensity: 0 });
  block(house, tvMat, -.45, 1.5, -1.53, 1.43, .83, .025);
  block(house, M.wood, -.45, .63, -1.37, 1.9, .75, .6);

  block(house, M.wood, .92, .84, .63, 1.65, .15, .8);
  for (const x of [.25, 1.6]) block(house, M.wood, x, .48, .63, .12, .7, .12);
  block(house, M.dark, .86, 1.14, .29, .78, .57, .08);
  const laptopMat = material(0x1d343d, { emissive: 0x8debd3, emissiveIntensity: 0 });
  block(house, laptopMat, .86, 1.14, .34, .67, .46, .02);
  block(house, M.steel, .86, .95, .69, .87, .06, .5);

  block(house, M.steel, 1.8, .72, 1.2, .09, .83, .09);
  block(house, M.dark, 1.8, .32, 1.2, .65, .1, .65);
  const fanRotor = new THREE.Group();
  fanRotor.position.set(1.8, 1.24, 1.2);
  house.add(fanRotor);
  for (let i = 0; i < 4; i++) {
    const blade = block(fanRotor, M.blue, 0, .34, 0, .23, .57, .07);
    blade.rotation.z = i * Math.PI / 2;
    blade.position.set(-Math.sin(i * Math.PI / 2) * .34, Math.cos(i * Math.PI / 2) * .34, 0);
  }
  cylinder(fanRotor, M.steel, 0, 0, .08, .14, .14, .16).rotation.x = Math.PI / 2;
  const fanMat = material(0x354552, { emissive: 0x6edacb, emissiveIntensity: 0 });
  block(house, fanMat, 1.8, 1.24, 1.31, .25, .25, .04);
  return { hitbox, readyMat, lampMat, lampLight, tvMat, laptopMat, fanMat, fanRotor, powered: { lamp: false, tv: false, laptop: false, fan: false } };
}

export function powerAppliance(house, appliance) {
  house.powered[appliance] = true;
  if (appliance === 'lamp') { house.lampMat.color.setHex(0xffe48d); house.lampMat.emissiveIntensity = 1.8; house.lampLight.intensity = 2.5; }
  if (appliance === 'tv') { house.tvMat.color.setHex(0x6cd6e8); house.tvMat.emissiveIntensity = 1.1; }
  if (appliance === 'laptop') { house.laptopMat.color.setHex(0x8debd3); house.laptopMat.emissiveIntensity = 1.2; }
  if (appliance === 'fan') { house.fanMat.color.setHex(0x70ddce); house.fanMat.emissiveIntensity = .9; }
  if (Object.values(house.powered).every(Boolean)) {
    house.readyMat.color.setHex(0xffd500);
    house.readyMat.emissiveIntensity = 1.2;
  }
}

export function updateHouse(house, reducedMotion) {
  if (house.powered.fan && !reducedMotion) house.fanRotor.rotation.z -= .09;
}
