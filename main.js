import { WORLD, getBlockType, getRandomSpawnPoint } from './world.js';
import { PLAYER, INPUT, updatePlayerState, setHotbarSlot } from './player.js';





const PASSWORD = "minecraft"; // change this to whatever you want

const homeScreen = document.getElementById("home-screen");
const gameScreen = document.getElementById("game-screen");
const loginBtn = document.getElementById("login-btn");
const passwordInput = document.getElementById("password-input");
const loginError = document.getElementById("login-error");

loginBtn.addEventListener("click", () => {
  if (passwordInput.value === PASSWORD) {
    homeScreen.classList.remove("active");
    gameScreen.classList.add("active");
    
inIt3D();

  } else {
    loginError.textContent = "Incorrect password";
  }
});

function inIt3D() {
  const canvas = document.getElementById('game-canvas');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0a0f18);

const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  500
);

const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
scene.add(ambientLight);

const sunLight = new THREE.DirectionalLight(0xffffff, 0.9);
sunLight.position.set(40, 80, 40);
scene.add(sunLight);

const blockGeometry = new THREE.BoxGeometry(1, 1, 1);
const blockMeshes = [];

function hexToColor(hex) {
  return new THREE.Color(hex);
}

function addBlockMesh(x, y, z, id) {
  const blockType = getBlockType(id);
  if (!blockType) return;

  const material = new THREE.MeshStandardMaterial({
    color: hexToColor(blockType.color),
    roughness: 0.8,
    metalness: 0.0
  });

  const mesh = new THREE.Mesh(blockGeometry, material);
  mesh.position.set(x, z, y);
  mesh.userData = { id, x, y, z };
  scene.add(mesh);
  blockMeshes.push(mesh);
}

function buildWorld() {
  for (let x = 0; x < WORLD.width; x++) {
    for (let y = 0; y < WORLD.depth; y++) {
      for (let z = 0; z < WORLD.height; z++) {
        const id = WORLD.blocks[x][y][z];
        if (!id) continue;
        addBlockMesh(x, y, z, id);
      }
    }
  }
}

buildWorld();

const spawn = getRandomSpawnPoint();
PLAYER.position.x = spawn.x;
PLAYER.position.z = spawn.z;
PLAYER.position.y = 12;

camera.position.set(PLAYER.position.x, PLAYER.position.y, PLAYER.position.z + 5);
camera.lookAt(PLAYER.position.x, PLAYER.position.y, PLAYER.position.z);

window.addEventListener('resize', () => {
  renderer.setSize(window.innerWidth, window.innerHeight);
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'w' || event.key === 'W') INPUT.forward = true;
  if (event.key === 's' || event.key === 'S') INPUT.backward = true;
  if (event.key === 'a' || event.key === 'A') INPUT.left = true;
  if (event.key === 'd' || event.key === 'D') INPUT.right = true;
  if (event.key === ' ') INPUT.jump = true;
  if (/^[1-9]$/.test(event.key)) setHotbarSlot(Number(event.key) - 1);
});

document.addEventListener('keyup', (event) => {
  if (event.key === 'w' || event.key === 'W') INPUT.forward = false;
  if (event.key === 's' || event.key === 'S') INPUT.backward = false;
  if (event.key === 'a' || event.key === 'A') INPUT.left = false;
  if (event.key === 'd' || event.key === 'D') INPUT.right = false;
  if (event.key === ' ') INPUT.jump = false;
});

canvas.addEventListener('click', () => {
  canvas.requestPointerLock();
});

document.addEventListener('pointerlockchange', () => {
  INPUT.pointerLocked = document.pointerLockElement === canvas;
});

document.addEventListener('mousemove', (e) => {
  if (!INPUT.pointerLocked) return;
  PLAYER.yaw += e.movementX * 0.002;
  PLAYER.pitch = Math.max(-1.2, Math.min(1.2, PLAYER.pitch - e.movementY * 0.002));
});

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

function getCameraDirection() {
  const dir = new THREE.Vector3();
  camera.getWorldDirection(dir);
  return dir;
}

function raycastBlock() {
  const origin = new THREE.Vector3(
    PLAYER.position.x,
    PLAYER.position.y,
    PLAYER.position.z
  );
  const dir = getCameraDirection();
  raycaster.set(origin, dir);
  const intersects = raycaster.intersectObjects(blockMeshes);
  return intersects[0] || null;
}

document.addEventListener('contextmenu', (e) => {
  e.preventDefault();
  const hit = raycastBlock();
  if (!hit) return;

  const item = PLAYER.selectedItem();
  if (!item) return;

  const normal = hit.face.normal.clone();
  const pos = hit.point.clone().add(normal.multiplyScalar(0.5));

  const bx = Math.round(pos.x);
  const by = Math.round(pos.z);
  const bz = Math.round(pos.y);

  if (!WORLD.blocks[bx]?.[by]) return;
  if (WORLD.blocks[bx][by][bz]) return;

  WORLD.blocks[bx][by][bz] = item.id;
  addBlockMesh(bx, by, bz, item.id);
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'q' || e.key === 'Q') {
    const hit = raycastBlock();
    if (!hit) return;
    const mesh = hit.object;
    const { x, y, z } = mesh.userData;
    WORLD.blocks[x][y][z] = null;
    scene.remove(mesh);
    const idx = blockMeshes.indexOf(mesh);
    if (idx >= 0) blockMeshes.splice(idx, 1);
  }
});

let lastTime = 0;

function gameLoop(timestamp) {
  const dt = Math.min((timestamp - lastTime) / 16, 2);
  lastTime = timestamp;

  updatePlayerState(dt, WORLD);

  const dir = new THREE.Vector3(
    Math.sin(PLAYER.yaw) * Math.cos(PLAYER.pitch),
    Math.sin(PLAYER.pitch),
    Math.cos(PLAYER.yaw) * Math.cos(PLAYER.pitch)
  );

  camera.position.set(
    PLAYER.position.x,
    PLAYER.position.y + 0.6,
    PLAYER.position.z
  );

  const target = new THREE.Vector3().copy(camera.position).add(dir);
  camera.lookAt(target);

  renderer.render(scene, camera);
  requestAnimationFrame(gameLoop);
}

requestAnimationFrame(gameLoop);

}