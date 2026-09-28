import * as THREE from 'three';
import { gsap } from 'gsap';
import { createWorld, setStationPower, updateWorld } from './world.js';
import { createCharacter, updateCharacter } from './character.js';
import { createEffects } from './effects.js';
import { createUI } from './ui.js';
import backgroundMusicUrl from './harumachimusic-beautiful-natural-spring-loop-111876.mp3?url';
import './style.css';

const canvas = document.querySelector('#world');
const loadingScreen = document.querySelector('#loading-screen');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.15;
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(48, window.innerWidth / window.innerHeight, .1, 160);
const world = createWorld(scene);
const character = createCharacter(scene);
const effects = createEffects(scene, world.curves);
const ui = createUI(() => { playing = true; });
const clock = new THREE.Clock();
const compassArrow = document.querySelector('#compass-arrow');
const raycaster = new THREE.Raycaster();
const cameraRay = new THREE.Raycaster();
const pointer = new THREE.Vector2();
const keys = new Set();
const stick = { x: 0, y: 0 };
let playing = false;
let repairing = false;
let powerCount = 0;
const poweredPlants = new Set();
const houseTarget = { kind: 'house', id: 'house', title: 'House', x: 0, z: 0, poweredCount: 0 };
let yaw = .55;
let pitch = .56;
let distance = window.innerWidth < 700 ? 15 : 18;
let pointerDown = null;
let activeStick = null;
let jumpPressed = false;
let audioEnabled = true;
const backgroundMusic = new Audio(backgroundMusicUrl);
backgroundMusic.loop = true;
backgroundMusic.volume = .32;
let audioContext;
let firstFrameRendered = false;

function sound(freq = 640) {
  if (!audioEnabled) return;
  audioContext ??= new (window.AudioContext || window.webkitAudioContext)();
  if (audioContext.state === 'suspended') audioContext.resume();
  const oscillator = audioContext.createOscillator();
  const gain = audioContext.createGain();
  oscillator.type = 'square';
  oscillator.frequency.setValueAtTime(freq, audioContext.currentTime);
  oscillator.frequency.exponentialRampToValueAtTime(freq * 1.7, audioContext.currentTime + .24);
  gain.gain.setValueAtTime(.045, audioContext.currentTime);
  gain.gain.exponentialRampToValueAtTime(.001, audioContext.currentTime + .3);
  oscillator.connect(gain).connect(audioContext.destination);
  oscillator.start(); oscillator.stop(audioContext.currentTime + .31);
}

function nearestStation() {
  let result = null;
  let nearest = 4.1;
  world.stations.forEach(station => {
    const distance = character.root.position.distanceTo(new THREE.Vector3(station.x, 0, station.z));
    if (distance < nearest) { nearest = distance; result = station; }
  });
  return result;
}

function nearestTarget() {
  if (Math.hypot(character.root.position.x, character.root.position.z) <= 4.3) return houseTarget;
  return nearestStation();
}

function openOverview() {
  if (powerCount !== 4 || repairing || ui.isOpen()) return;
  playing = false;
  ui.openOverview();
}

function interact(station = nearestTarget()) {
  if (!playing || repairing || ui.isOpen()) return;
  if (station?.kind === 'house') {
    if (Math.hypot(character.root.position.x, character.root.position.z) > 4.3) { ui.toast('Move closer to the house'); return; }
    if (powerCount !== 4) {
      ui.toast(`Repair all 4 power plants, then return here. ${powerCount}/4 online.`, 4500);
      return;
    }
    openOverview();
    return;
  }
  if (!station) { ui.toast(powerCount === 4 ? 'Return to the house for the full portfolio' : 'Move closer to a power plant'); return; }
  const distance = character.root.position.distanceTo(new THREE.Vector3(station.x, 0, station.z));
  if (distance > 4.1) { ui.toast('Move closer to repair this power plant'); return; }
  if (station.repaired) { playing = false; ui.open(station); return; }
  repairing = true;
  character.repairing = 1.1;
  const facing = Math.atan2(station.x - character.root.position.x, station.z - character.root.position.z);
  gsap.to(character.root.rotation, { y: facing, duration: .25 });
  sound(380);
  ui.prompt(null);
  setTimeout(() => {
    station.appliance = ['lamp', 'tv', 'laptop', 'fan'][powerCount];
    setStationPower(world, station, true);
    powerCount++;
    houseTarget.poweredCount = powerCount;
    poweredPlants.add(station.id);
    effects.burst(station.group.position);
    sound(780);
    ui.progress(powerCount, station);
    ui.toast(powerCount === 4 ? 'House overview unlocked. Return to the house!'  : `${station.title} online · ${station.appliance.toUpperCase()} on`);
    setTimeout(() => { repairing = false; playing = false; ui.open(station); }, 450);
  }, 820);
}

document.querySelector('#start-button').addEventListener('click', () => {
  const intro = document.querySelector('#intro');
  // start the game immediately: never gate gameplay on an animation frame callback
  intro.style.pointerEvents = 'none';
  playing = true;
  if (audioEnabled) backgroundMusic.play().catch(() => ui.toast('Music could not play. Tap Sound to retry.'));
  gsap.to(intro, { opacity: 0, duration: .45, onComplete: () => { intro.hidden = true; } });
});
document.querySelector('#overview-button').addEventListener('click', openOverview);
document.querySelector('#sound-toggle').addEventListener('click', event => {
  audioEnabled = !audioEnabled;
  event.currentTarget.textContent = audioEnabled ? 'SOUND ON' : 'SOUND OFF';
  event.currentTarget.setAttribute('aria-pressed', String(audioEnabled));
  if (audioEnabled) {
    backgroundMusic.play().catch(() => ui.toast('Music could not play in this browser.'));
    sound(520);
  } else {
    backgroundMusic.pause();
    audioContext?.suspend();
  }
});

const movementKeys = ['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ArrowUp', 'ArrowLeft', 'ArrowDown', 'ArrowRight', 'Space'];
window.addEventListener('keydown', event => {
  if (movementKeys.includes(event.code)) event.preventDefault();
  keys.add(event.code);
  if (event.code === 'KeyE' && !event.repeat) interact();
  if (event.code === 'Space' && !event.repeat) jumpPressed = true;
});
window.addEventListener('keyup', event => keys.delete(event.code));
window.addEventListener('blur', () => keys.clear());

canvas.addEventListener('pointerdown', event => {
  pointerDown = { x: event.clientX, y: event.clientY, moved: false };
  canvas.setPointerCapture(event.pointerId);
});
canvas.addEventListener('pointermove', event => {
  if (!pointerDown) return;
  const dx = event.clientX - pointerDown.x;
  const dy = event.clientY - pointerDown.y;
  if (Math.abs(dx) + Math.abs(dy) > 3) pointerDown.moved = true;
  yaw -= dx * .005;
  pitch = THREE.MathUtils.clamp(pitch + dy * .004, .22, 1.15);
  pointerDown.x = event.clientX; pointerDown.y = event.clientY;
});
canvas.addEventListener('pointerup', event => {
  if (pointerDown && !pointerDown.moved) {
    pointer.set(event.clientX / window.innerWidth * 2 - 1, -(event.clientY / window.innerHeight) * 2 + 1);
    raycaster.setFromCamera(pointer, camera);
    const hits = raycaster.intersectObjects(world.clickTargets);
    if (hits.length) interact(hits[0].object.userData.house ? houseTarget : world.stations.find(s => s.id === hits[0].object.userData.stationId));
  }
  pointerDown = null;
});
canvas.addEventListener('pointercancel', () => { pointerDown = null; });
canvas.addEventListener('wheel', event => { distance = THREE.MathUtils.clamp(distance + Math.sign(event.deltaY) * 1.1, 8, 25); }, { passive: true });

const joystick = document.querySelector('#joystick');
const knob = document.querySelector('#joystick-knob');
function moveStick(event) {
  const rect = joystick.getBoundingClientRect();
  const x = event.clientX - (rect.left + rect.width / 2);
  const y = event.clientY - (rect.top + rect.height / 2);
  const max = rect.width * .32;
  const length = Math.max(1, Math.hypot(x, y));
  const scale = Math.min(1, max / length);
  stick.x = x * scale / max;
  stick.y = y * scale / max;
  knob.style.transform = `translate(${x * scale}px, ${y * scale}px)`;
}
joystick.addEventListener('pointerdown', event => { activeStick = event.pointerId; joystick.setPointerCapture(event.pointerId); moveStick(event); });
joystick.addEventListener('pointermove', event => { if (event.pointerId === activeStick) moveStick(event); });
function resetStick(event) { if (event.pointerId !== activeStick) return; activeStick = null; stick.x = 0; stick.y = 0; knob.style.transform = ''; }
joystick.addEventListener('pointerup', resetStick);
joystick.addEventListener('pointercancel', resetStick);
document.querySelector('#mobile-jump').addEventListener('pointerdown', event => { event.preventDefault(); jumpPressed = true; });
document.querySelector('#mobile-interact').addEventListener('pointerdown', event => { event.preventDefault(); interact(); });

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});

function animate() {
  requestAnimationFrame(animate);
  const delta = Math.min(clock.getDelta(), .05);
  const elapsed = clock.elapsedTime;
  const input = {
    x: Number(keys.has('KeyD') || keys.has('ArrowRight')) - Number(keys.has('KeyA') || keys.has('ArrowLeft')) + stick.x,
    y: Number(keys.has('KeyS') || keys.has('ArrowDown')) - Number(keys.has('KeyW') || keys.has('ArrowUp')) + stick.y,
    jump: jumpPressed || keys.has('Space'),
    run: keys.has('ShiftLeft') || keys.has('ShiftRight')
  };
  jumpPressed = false;
  updateCharacter(character, input, yaw, delta, elapsed, !playing || repairing);
  const target = character.root.position.clone().add(new THREE.Vector3(0, 1.6, 0));
  const offset = new THREE.Vector3(Math.sin(yaw) * Math.cos(pitch) * distance, Math.sin(pitch) * distance, Math.cos(yaw) * Math.cos(pitch) * distance);
  const desired = target.clone().add(offset);
  // pull the camera in when terrain or structures would block the view
  const toCamera = desired.clone().sub(target);
  const wanted = toCamera.length();
  toCamera.divideScalar(wanted);
  cameraRay.set(target, toCamera);
  cameraRay.far = wanted;
  const blockers = cameraRay.intersectObjects(world.blockers, true);
  if (blockers.length) desired.copy(target).addScaledVector(toCamera, Math.max(2.5, blockers[0].distance - .4));
  if (camera.position.lengthSq() === 0) camera.position.copy(desired);
  camera.position.lerp(desired, 1 - Math.exp(-delta * 4));
  camera.lookAt(target);
  compassArrow.style.transform = `rotate(${-yaw}rad)`;
  updateWorld(world, elapsed);
  effects.update(elapsed, delta, poweredPlants);
  ui.prompt(playing && !repairing ? nearestTarget() : null);
  renderer.render(scene, camera);
  if (!firstFrameRendered) {
    firstFrameRendered = true;
    requestAnimationFrame(() => {
      clearTimeout(window.portfolioLoadingTimeout);
      loadingScreen.classList.add('is-ready');
      setTimeout(() => loadingScreen.remove(), 500);
    });
  }
}
animate();
