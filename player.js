const PLAYER = {
  position: { x: 32, y: 15, z: 32 },
  velocity: { x: 0, y: 0, z: 0 },
  speed: 0.08,
  jumpStrength: 0.22,
  gravity: -0.016,
  onGround: false,
  yaw: 0,
  pitch: 0,
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
  PLAYER.position.x += (moveX / len) * PLAYER.speed * dt;
  PLAYER.position.z += (moveZ / len) * PLAYER.speed * dt;

  PLAYER.velocity.y += PLAYER.gravity * dt;
  PLAYER.position.y += PLAYER.velocity.y * dt;

  // Collision
  const ix = Math.floor(PLAYER.position.x);
  const iz = Math.floor(PLAYER.position.z);
  let floorY = 0;
  if (world.blocks[ix] && world.blocks[ix][iz]) {
    for (let h = world.height - 1; h >= 0; h--) {
      if (world.blocks[ix][iz][h]) { floorY = h + 1; break; }
    }
  }

  if (PLAYER.position.y <= floorY) {
    PLAYER.position.y = floorY;
    PLAYER.velocity.y = 0;
    PLAYER.onGround = true;
    if (INPUT.jump) {
      PLAYER.velocity.y = PLAYER.jumpStrength;
      PLAYER.onGround = false;
    }
  }
}

function setHotbarSlot(slotIndex) {
  PLAYER.activeSlot = Math.max(0, Math.min(slotIndex, 8));
}

export { PLAYER, INPUT, updatePlayerState, setHotbarSlot };