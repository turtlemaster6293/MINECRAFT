// main.js
import * as THREE from 'https://unpkg.com/three@0.152.0/build/three.module.js';
import { WORLD } from './world.js';
import { PLAYER, INPUT, updatePlayer, updateUI } from './player.js';

const renderDistance = 3;
const activeChunks = new Map();
const materialCache = {};
const droppedItems = [];
const blockGeo = new THREE.BoxGeometry(1, 1, 1);
const edgeGeo = new THREE.EdgesGeometry(blockGeo);
const edgeMat = new THREE.LineBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.2 });

WORLD.blockTypes.forEach(t => materialCache[t.id] = new THREE.MeshLambertMaterial({ color: t.color }));

function buildChunkMesh(cx, cz, scene) {
  const group = new THREE.Group();
  const data = WORLD.getChunk(cx, cz);
  const dict = {};
  for (let x = 0; x < 16; x++) {
    for (let z = 0; z < 16; z++) {
      for (let y = 0; y < 32; y++) {
        const id = data[x][z][y];
        if (!id) continue;
        const gx = cx * 16 + x, gy = y, gz = cz * 16 + z;
        if (!WORLD.getBlock(gx,gy+1,gz) || !WORLD.getBlock(gx+1,gy,gz) || !WORLD.getBlock(gx-1,gy,gz) || !WORLD.getBlock(gx,gy,gz+1) || !WORLD.getBlock(gx,gy,gz-1) || (y>0 && !WORLD.getBlock(gx,gy-1,gz))) {
          if (!dict[id]) dict[id] = [];
          dict[id].push({x: gx, y: gy, z: gz});
        }
      }
    }
  }
  Object.keys(dict).forEach(id => {
    const arr = dict[id];
    const im = new THREE.InstancedMesh(blockGeo, materialCache[id], arr.length);
    const em = new THREE.InstancedMesh(edgeGeo, edgeMat, arr.length);
    const dummy = new THREE.Object3D();
    arr.forEach((p, i) => {
      dummy.position.set(p.x, p.y, p.z); dummy.updateMatrix();
      im.setMatrixAt(i, dummy.matrix); em.setMatrixAt(i, dummy.matrix);
    });
    group.add(im, em);
  });
  return group;
}

function spawnDrop(x, y, z, id, scene) {
  if (!id || id === 'bedrock') return;
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.3, 0.3), materialCache[id]);
  mesh.position.set(x, y, z);
  mesh.userData = { id, createdAt: Date.now() };
  scene.add(mesh); droppedItems.push(mesh);
}

function play3D() {
  const canvas = document.getElementById('game-canvas');
  const renderer = new THREE.WebGLRenderer({ canvas });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setClearColor(0x87ceeb);
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x87ceeb);
  scene.fog = new THREE.Fog(0x87ceeb, 15, 50);
  const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.rotation.order = 'YXZ';
  scene.add(new THREE.AmbientLight(0xffffff, 0.6));
  const sun = new THREE.DirectionalLight(0xffffff, 0.8); sun.position.set(5, 20, 10); scene.add(sun);

  const selectionBox = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(1.005, 1.005, 1.005)), new THREE.LineBasicMaterial({ color: 0x000000 }));
  scene.add(selectionBox);

  canvas.addEventListener('mousedown', (e) => {
    if (document.pointerLockElement !== canvas) { canvas.requestPointerLock(); return; }
    const raycaster = new THREE.Raycaster();
    raycaster.set(camera.position, camera.getWorldDirection(new THREE.Vector3()));
    const hits = raycaster.intersectObjects(scene.children, true);
    const hit = hits.find(h => h.object instanceof THREE.InstancedMesh);
    if (hit && hit.distance < 8) {
      const pos = e.button === 0 ? hit.point.clone().sub(hit.face.normal.multiplyScalar(0.5)) : hit.point.clone().add(hit.face.normal.multiplyScalar(0.5));
      const bx = Math.round(pos.x), by = Math.round(pos.y), bz = Math.round(pos.z);
      if (e.button === 0) {
        const tid = WORLD.getBlock(bx, by, bz);
        if (WORLD.setBlock(bx, by, bz, null)) spawnDrop(bx, by, bz, tid, scene);
      } else {
        const slot = PLAYER.hotbar[PLAYER.activeSlot];
        if (slot && slot.count > 0 && WORLD.setBlock(bx, by, bz, slot.id)) { slot.count--; updateUI(); }
      }
      for(let dx=-1;dx<=1;dx++) for(let dz=-1;dz<=1;dz++){
        const key = `${Math.floor((bx+dx*8)/16)},${Math.floor((bz+dz*8)/16)}`;
        if(activeChunks.has(key)) { scene.remove(activeChunks.get(key)); activeChunks.delete(key); }
      }
    }
  });

  document.addEventListener('mousemove', (e) => {
    if (document.pointerLockElement === canvas) {
      PLAYER.yaw -= e.movementX * 0.003;
      PLAYER.pitch = Math.max(-1.5, Math.min(1.5, PLAYER.pitch - e.movementY * 0.003));
    }
  });

  let lastTime = performance.now();
  function gameLoop() {
    const dt = Math.min((performance.now() - lastTime) / 16.6, 3);
    lastTime = performance.now();
    updatePlayer(WORLD, dt);
    const pcx = Math.floor(PLAYER.position.x / 16), pcz = Math.floor(PLAYER.position.z / 16);
    for (let x = -renderDistance; x <= renderDistance; x++) {
      for (let z = -renderDistance; z <= renderDistance; z++) {
        const key = `${pcx+x},${pcz+z}`;
        if (!activeChunks.has(key)) {
          const m = buildChunkMesh(pcx+x, pcz+z, scene);
          scene.add(m); activeChunks.set(key, m);
        }
      }
    }
    const ray = new THREE.Raycaster(); ray.set(camera.position, camera.getWorldDirection(new THREE.Vector3()));
    const hits = ray.intersectObjects(scene.children, true);
    const hit = hits.find(h => h.object instanceof THREE.InstancedMesh);
    if (hit && hit.distance < 8) {
      const p = hit.point.clone().sub(hit.face.normal.multiplyScalar(0.5));
      selectionBox.position.set(Math.round(p.x), Math.round(p.y), Math.round(p.z));
      selectionBox.visible = true;
    } else selectionBox.visible = false;

    for (let i = droppedItems.length - 1; i >= 0; i--) {
      droppedItems[i].rotation.y += 0.05;
      if (droppedItems[i].position.distanceTo(camera.position) < 1.5) {
        PLAYER.addItem(droppedItems[i].userData.id);
        scene.remove(droppedItems[i]); droppedItems.splice(i, 1);
      }
    }
    camera.position.set(PLAYER.position.x, PLAYER.position.y + 1.4, PLAYER.position.z);
    camera.rotation.set(PLAYER.pitch, PLAYER.yaw, 0);
    renderer.render(scene, camera);
    requestAnimationFrame(gameLoop);
  }
  updateUI(); gameLoop();
}

document.getElementById('login-btn').onclick = () => {
  if (document.getElementById('password-input').value === "JAKE") {
    document.getElementById('home-screen').style.display = 'none';
    document.getElementById('game-screen').style.display = 'block';
    play3D();
  }
};

window.onkeydown = (e) => { 
  if(e.key==='s') INPUT.forward=true; if(e.key==='w') INPUT.backward=true; 
  if(e.key==='a') INPUT.left=true; if(e.key==='d') INPUT.right=true; 
  if(e.key===' ') INPUT.jump=true;
  if(e.key >= '1' && e.key <= '9') { PLAYER.activeSlot = parseInt(e.key)-1; updateUI(); }
};
window.onkeyup = (e) => { 
  if(e.key==='s') INPUT.forward=false; if(e.key==='w') INPUT.backward=false; 
  if(e.key==='a') INPUT.left=false; if(e.key==='d') INPUT.right=false; 
  if(e.key===' ') INPUT.jump=false;
};