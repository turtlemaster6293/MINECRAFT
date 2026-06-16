const PLAYER = {
  position: { x: 32, y: 12, z: 32 },
  velocity: { x: 0, y: 0, z: 0 },
  speed: 0.08,
  jumpStrength: 0.22,
  gravity: -0.016,
  onGround: false,
  yaw: 0,
  pitch: 0,
  health: 20,
  hunger: 20,
  armor: 0,
  inventory: [],
  hotbar: Array.from({ length: 9 }, () => ({ id: 'grass', count: 64 })),
  activeSlot: 0,
  selectedItem() {
    return this.hotbar[this.activeSlot];
  },
  addItem(item) {
    const existing = this.inventory.find(i => i.id === item.id);
    if (existing) {
      existing.count += item.count || 1;
    } else {
      this.inventory.push({ id: item.id, count: item.count || 1 });
    }
  },
  removeItem(id, count = 1) {
    const item = this.inventory.find(i => i.id === id);
    if (item) {
      item.count -= count;
      if (item.count <= 0) {
        this.inventory = this.inventory.filter(i => i.id !== id);
      }
    }
  }
};

const INPUT = {
  forward: false,
  backward: false,
  left: false,
  right: false,
  jump: false,
  pointerLocked: false,
  mouseDX: 0,
  mouseDY: 0
};

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function updatePlayerState(dt, world) {
  const dirX = Math.sin(PLAYER.yaw);
  const dirZ = Math.cos(PLAYER.yaw);

  const rightX = Math.sin(PLAYER.yaw + Math.PI / 2);
  const rightZ = Math.cos(PLAYER.yaw + Math.PI / 2);

  let moveX = 0;
  let moveZ = 0;

  if (INPUT.forward) {
    moveX += dirX;
    moveZ += dirZ;
  }
  if (INPUT.backward) {
    moveX -= dirX;
    moveZ -= dirZ;
  }
  if (INPUT.left) {
    moveX -= rightX;
    moveZ -= rightZ;
  }
  if (INPUT.right) {
    moveX += rightX;
    moveZ += rightZ;
  }

  const len = Math.hypot(moveX, moveZ) || 1;
  moveX /= len;
  moveZ /= len;

  PLAYER.position.x += moveX * PLAYER.speed * dt;
  PLAYER.position.z += moveZ * PLAYER.speed * dt;

  if (INPUT.jump && PLAYER.onGround) {
    PLAYER.velocity.y = PLAYER.jumpStrength;
    PLAYER.onGround = false;
  }

  PLAYER.velocity.y += PLAYER.gravity * dt;
  PLAYER.position.y += PLAYER.velocity.y * dt;

  if (PLAYER.position.y <= 3) {
    PLAYER.position.y = 3;
    PLAYER.velocity.y = 0;
    PLAYER.onGround = true;
  }

  PLAYER.position.x = clamp(PLAYER.position.x, 1, world.width - 2);
  PLAYER.position.z = clamp(PLAYER.position.z, 1, world.depth - 2);
  PLAYER.position.y = clamp(PLAYER.position.y, 2, world.height + 10);
}

function setHotbarSlot(slotIndex) {
  PLAYER.activeSlot = clamp(slotIndex, 0, PLAYER.hotbar.length - 1);
}

export { PLAYER, INPUT, updatePlayerState, setHotbarSlot };
