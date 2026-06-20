import * as THREE from 'https://unpkg.com/three@0.152.0/build/three.module.js';
import { WORLD, getBlockType, getRandomSpawnPoint } from './world.js';
import { PLAYER, INPUT, updatePlayerState, setHotbarSlot } from './player.js';

const PASSWORD = "JAKE";

const homeScreen = document.getElementById("home-screen");
const gameScreen = document.getElementById("game-screen");
const loadingScreen = document.getElementById("loading-screen");
const loadingMessage = document.getElementById("loading-message");
const loginBtn = document.getElementById("login-btn");
const passwordInput = document.getElementById("password-input");
const loginError = document.getElementById("login-error");

function setLoading(active, message = "Loading world...") {
  if (!loadingScreen) return;
  loadingMessage.textContent = message;
  loadingScreen.classList.toggle("hidden", !active);
}

// ---------------------------------------------------------
//  ENGINE START
// ---------------------------------------------------------
function play3D() {
  
  const canvas = document.getElementById('game-canvas');
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setClearColor(0x87ceeb);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x87ceeb);
  scene.fog = new THREE.Fog(0x87ceeb, 30, 150);

  const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 500);

  const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
  scene.add(ambientLight);
  const sunLight = new THREE.DirectionalLight(0xffffff, 1.0);
  sunLight.position.set(40, 80, 40);
  scene.add(sunLight);

  const blockGeometry = new THREE.BoxGeometry(1, 1, 1);
  const itemGeometry = new THREE.BoxGeometry(0.3, 0.3, 0.3);
  const blockMeshes = [];
  const droppedItems = [];
  const materialCache = {};

  WORLD.blockTypes.forEach(type => {
    materialCache[type.id] = new THREE.MeshLambertMaterial({ color: type.color });
  });

  const selectionBox = new THREE.LineSegments(
    new THREE.EdgesGeometry(new THREE.BoxGeometry(1.002, 1.002, 1.002)),
    new THREE.LineBasicMaterial({ color: 0x000000 })
  );
  selectionBox.visible = false;
  scene.add(selectionBox);

  // Helper Functions
  const updateHotbarUI = () => {
    const container = document.getElementById('hotbar-ui');
    if (!container) return;
    container.innerHTML = '';
    PLAYER.hotbar.forEach((slot, i) => {
      const div = document.createElement('div');
      div.className = `hotbar-slot ${PLAYER.activeSlot === i ? 'active' : ''}`;
      if (slot && slot.count > 0) {
        const type = getBlockType(slot.id);
        div.innerHTML = `<span class="slot-emoji">${type.emoji}</span><span class="slot-count">${slot.count}</span>`;
      }
      container.appendChild(div);
    });
  };

  const addBlockMesh = (x, y, z, id) => {
    const mesh = new THREE.Mesh(blockGeometry, materialCache[id]);
    mesh.position.set(x, z, y);
    mesh.userData = { id, x, y, z };
    scene.add(mesh);
    blockMeshes.push(mesh);
  };

  const spawnItemDrop = (x, y, z, id) => {
    const mesh = new THREE.Mesh(itemGeometry, materialCache[id]);
    mesh.position.set(x, y, z);
    mesh.userData = { id, vY: 0.1, time: Date.now() };
    scene.add(mesh);
    droppedItems.push(mesh);
  };

  // Build initial world
  for (let x = 0; x < WORLD.width; x++) {
    for (let y = 0; y < WORLD.depth; y++) {
      for (let z = 0; z < WORLD.height; z++) {
        if (WORLD.blocks[x][y][z]) addBlockMesh(x, y, z, WORLD.blocks[x][y][z]);
      }
    }
  }

  const spawn = getRandomSpawnPoint();
  PLAYER.position.x = spawn.x;
  PLAYER.position.y = spawn.y;
  PLAYER.position.z = spawn.z;

  // Listeners
  canvas.addEventListener('click', () => canvas.requestPointerLock());
  document.addEventListener('pointerlockchange', () => INPUT.pointerLocked = document.pointerLockElement === canvas);
  document.addEventListener('mousemove', (e) => {
    if (!INPUT.pointerLocked) return;
    PLAYER.yaw -= e.movementX * 0.002;
    PLAYER.pitch = Math.max(-1.5, Math.min(1.5, PLAYER.pitch - e.movementY * 0.002));
  });

  const raycaster = new THREE.Raycaster();
  canvas.addEventListener('mousedown', (e) => {
    if (!INPUT.pointerLocked) return;
    
    const dir = new THREE.Vector3();
    camera.getWorldDirection(dir);
    raycaster.set(camera.position, dir);
    
    const intersects = raycaster.intersectObjects(blockMeshes);
    const hit = intersects[0];

    // FIX: Only allow interaction if the block is within 8 units
    if (hit && hit.distance <= 8) { 
      if (e.button === 0) { // Break (Left Click)
        const { x, y, z, id } = hit.object.userData;
        WORLD.blocks[x][y][z] = null;
        spawnItemDrop(hit.object.position.x, hit.object.position.y, hit.object.position.z, id);
        scene.remove(hit.object);
        blockMeshes.splice(blockMeshes.indexOf(hit.object), 1);
      } else if (e.button === 2) { // Place (Right Click)
        const held = PLAYER.hotbar[PLAYER.activeSlot];
        if (held) {
          const pos = hit.point.clone().add(hit.face.normal.multiplyScalar(0.5));
          const bx = Math.round(pos.x), by = Math.round(pos.z), bz = Math.round(pos.y);
          
          // Ensure we aren't placing a block inside the player's 2-block tall body
          const playerFeetX = Math.floor(PLAYER.position.x);
          const playerFeetZ = Math.floor(PLAYER.position.z);
          const playerFeetY = Math.floor(PLAYER.position.y);
          const isPlayerInWay = bx === playerFeetX && by === playerFeetZ && 
                               (bz === playerFeetY || bz === playerFeetY + 1);

          if (WORLD.blocks[bx]?.[by] && !WORLD.blocks[bx][by][bz] && !isPlayerInWay) {
            WORLD.blocks[bx][by][bz] = held.id;
            addBlockMesh(bx, by, bz, held.id);
            PLAYER.removeSelectedItem();
            updateHotbarUI();
          }
        }
      }
    }
  });

  // Game Loop
  let lastTime = 0;
  let firstFrame = true;
  function gameLoop(timestamp) {
    const dt = Math.min((timestamp - lastTime) / 16, 2);
    lastTime = timestamp;

    updatePlayerState(dt, WORLD);

    const dir = new THREE.Vector3(
      Math.sin(PLAYER.yaw) * Math.cos(PLAYER.pitch),
      Math.sin(PLAYER.pitch),
      Math.cos(PLAYER.yaw) * Math.cos(PLAYER.pitch)
    );
    camera.position.set(PLAYER.position.x, PLAYER.position.y + 1.3, PLAYER.position.z);
    camera.lookAt(new THREE.Vector3().copy(camera.position).add(dir));

    // Outline
    raycaster.set(camera.position, dir);
    const intersects = raycaster.intersectObjects(blockMeshes);
    if (intersects[0]) {
      selectionBox.visible = true;
      selectionBox.position.copy(intersects[0].object.position);
    } else {
      selectionBox.visible = false;
    }

    // Drops
    for (let i = droppedItems.length - 1; i >= 0; i--) {
      const item = droppedItems[i];
      item.rotation.y += 0.05;
      if (item.position.distanceTo(camera.position) < 1.5 && Date.now() - item.userData.time > 500) {
        if (PLAYER.addItem(item.userData.id)) {
          scene.remove(item);
          droppedItems.splice(i, 1);
          updateHotbarUI();
        }
      }
    }

    renderer.render(scene, camera);
    if (firstFrame) { setLoading(false); firstFrame = false; }
    requestAnimationFrame(gameLoop);
  }

  updateHotbarUI();
  requestAnimationFrame(gameLoop);
}

// ---------------------------------------------------------
//  LOGIN BUTTON
// ---------------------------------------------------------
loginBtn.addEventListener("click", () => {
  if (passwordInput.value === PASSWORD) {
    homeScreen.style.display = "none";
    gameScreen.classList.add("active");
    gameScreen.style.display = "flex";
    setLoading(true, "Initializing...");
    setTimeout(play3D, 100);
  } else {
    loginError.textContent = "Incorrect password";
  }
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'w' || e.key === 'W') INPUT.forward = true;
  if (e.key === 's' || e.key === 'S') INPUT.backward = true;
  if (e.key === 'a' || e.key === 'A') INPUT.right = true;
  if (e.key === 'd' || e.key === 'D') INPUT.left = true;
  if (e.key === ' ') INPUT.jump = true;
  if (/^[1-9]$/.test(e.key)) setHotbarSlot(Number(e.key) - 1);
});

document.addEventListener('keyup', (e) => {
  if (e.key === 'w' || e.key === 'W') INPUT.forward = false;
  if (e.key === 's' || e.key === 'S') INPUT.backward = false;
  if (e.key === 'a' || e.key === 'A') INPUT.right = false;
  if (e.key === 'd' || e.key === 'D') INPUT.left = false;
  if (e.key === ' ') INPUT.jump = false;
});