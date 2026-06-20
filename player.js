//--- START OF FILE player.js ---
const PLAYER = {
  position: { x: 32, y: 15, z: 32 },
  velocity: { x: 0, y: 0, z: 0 },
  speed: 0.12,
  jumpStrength: 0.15,
  gravity: -0.008,
  onGround: false,
  yaw: 0,
  pitch: 0,
  width: 0.5, // Slightly thinner to fit through 1-block gaps easily
  height: 1.8,
  hotbar: [
    { id: 'grass', count: 64 },
    null, null, null, null, null, null, null, null
  ],
  activeSlot: 0,

  addItem(itemId) {
    const existing = this.hotbar.find(slot => slot && slot.id === itemId && slot.count < 64);
    if (existing) {
      existing.count++;
      return true;
    }
    const emptyIndex = this.hotbar.findIndex(slot => slot === null);
    if (emptyIndex !== -1) {
      this.hotbar[emptyIndex] = { id: itemId, count: 1 };
      return true;
    }
    return false; 
  },

  
  removeSelectedItem() {
    const slot = this.hotbar[this.activeSlot];
    if (!slot) return;
    slot.count--;
    if (slot.count <= 0) this.hotbar[this.activeSlot] = null;
  }
};

const INPUT = {
  forward: false, backward: false, left: false, right: false,
  jump: false, pointerLocked: false
};

// Helper to check if a specific coordinate is blocked
// Adding 0.5 aligns the Math.floor logic with Three.js centered meshes
function isBlocked(x, y, z, world) {
  const ix = Math.floor(x + 0.5);
  const iy = Math.floor(z + 0.5); // Depth
  const iz = Math.floor(y + 0.5); // Height

  if (ix < 0 || ix >= world.width || iy < 0 || iy >= world.depth || iz < 0 || iz >= world.height) {
    return y < 0; // Solid ground below world, air above/around
  }
  return world.blocks[ix][iy][iz] !== null;
}

function checkCollision(px, py, pz, world) {
  const w = PLAYER.width / 2;
  const h = PLAYER.height;
  
  // Check 8 points: Corners of the bounding box at feet and head
  const checkPoints = [
    {x: px - w, y: py, z: pz - w},
    {x: px + w, y: py, z: pz - w},
    {x: px - w, y: py, z: pz + w},
    {x: px + w, y: py, z: pz + w},
    {x: px - w, y: py + h, z: pz - w},
    {x: px + w, y: py + h, z: pz - w},
    {x: px - w, y: py + h, z: pz + w},
    {x: px + w, y: py + h, z: pz + w},
  ];

  for (const p of checkPoints) {
    if (isBlocked(p.x, p.y, p.z, world)) return true;
  }
  return false;
}

function updatePlayerState(dt, world) {
  const dirX = Math.sin(PLAYER.yaw);
  const dirZ = Math.cos(PLAYER.yaw);
  const rightX = Math.sin(PLAYER.yaw + Math.PI / 2);
  const rightZ = Math.cos(PLAYER.yaw + Math.PI / 2);

  let moveX = 0, moveZ = 0;
  if (INPUT.forward) { moveX += dirX; moveZ += dirZ; }
  if (INPUT.backward) { moveX -= dirX; moveZ -= dirZ; }
  if (INPUT.left) { moveX -= rightX; moveZ -= rightZ; }
  if (INPUT.right) { moveX += rightX; moveZ += rightZ; }

  const len = Math.hypot(moveX, moveZ) || 1;
  const vx = (moveX / len) * PLAYER.speed;
  const vz = (moveZ / len) * PLAYER.speed;

  // 1. Vertical Movement
  PLAYER.velocity.y += PLAYER.gravity * dt;
  let nextY = PLAYER.position.y + PLAYER.velocity.y * dt;
  
  if (checkCollision(PLAYER.position.x, nextY, PLAYER.position.z, world)) {
    if (PLAYER.velocity.y < 0) { // Landing
        // Set player height to exactly the top of the block (index + 0.5)
        PLAYER.position.y = Math.floor(nextY + 0.5) + 0.5;
        PLAYER.onGround = true;
    }
    PLAYER.velocity.y = 0;
  } else {
    PLAYER.position.y = nextY;
    PLAYER.onGround = false;
  }

  if (PLAYER.onGround && INPUT.jump) {
    PLAYER.velocity.y = PLAYER.jumpStrength;
    PLAYER.onGround = false;
  }

  // 2. Horizontal Movement (X then Z for sliding)
  let nextX = PLAYER.position.x + vx * dt;
  if (!checkCollision(nextX, PLAYER.position.y, PLAYER.position.z, world)) {
    PLAYER.position.x = nextX;
  }

  let nextZ = PLAYER.position.z + vz * dt;
  if (!checkCollision(PLAYER.position.x, PLAYER.position.y, nextZ, world)) {
    PLAYER.position.z = nextZ;
  }
}

function setHotbarSlot(slotIndex) {
  PLAYER.activeSlot = Math.max(0, Math.min(slotIndex, 8));
}

export { PLAYER, INPUT, updatePlayerState, setHotbarSlot };