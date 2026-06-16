const PLAYER = {
  position: { x: 16, y: 4, z: 16 },
  rotation: { x: 0, y: 0 },
  velocity: { x: 0, y: 0, z: 0 },
  speed: 0.12,
  jumpStrength: 0.22,
  gravity: -0.01,
  onGround: false,
  mode: 'creative',
  health: 20,
  hunger: 20,
  armor: 0,
  hotbar: Array.from({ length: 9 }, (_, index) => ({
    id: ['grass','dirt','stone','wood','torch','pickaxe','sword','bow','glass'][index],
    count: 1
  })),
  activeSlot: 0,
  selectedItem() {
    return this.hotbar[this.activeSlot];
  }
};

const INPUT = {
  forward: false,
  backward: false,
  left: false,
  right: false,
  jump: false,
  build: false,
  remove: false,
  menu: false,
  mouseX: 0,
  mouseY: 0,
  pointerLocked: false
};

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function updatePlayerState(dt) {
  const moveX = (INPUT.right ? 1 : 0) - (INPUT.left ? 1 : 0);
  const moveZ = (INPUT.backward ? 1 : 0) - (INPUT.forward ? 1 : 0);

  const speed = PLAYER.speed * (PLAYER.mode === 'creative' ? 1.4 : 1);
  PLAYER.position.x += moveX * speed * dt;
  PLAYER.position.z += moveZ * speed * dt;

  if (INPUT.jump && PLAYER.onGround) {
    PLAYER.velocity.y = PLAYER.jumpStrength;
    PLAYER.onGround = false;
  }

  PLAYER.velocity.y += PLAYER.gravity * dt;
  PLAYER.position.y += PLAYER.velocity.y * dt;

  if (PLAYER.position.y <= 4) {
    PLAYER.position.y = 4;
    PLAYER.velocity.y = 0;
    PLAYER.onGround = true;
  }

  PLAYER.position.x = clamp(PLAYER.position.x, 1, 30);
  PLAYER.position.z = clamp(PLAYER.position.z, 1, 30);
  PLAYER.position.y = clamp(PLAYER.position.y, 4, 32);

  if (PLAYER.mode === 'survival') {
    if (PLAYER.hunger > 0) {
      PLAYER.hunger = clamp(PLAYER.hunger - 0.003 * dt, 0, 20);
    }
    if (PLAYER.hunger < 3) {
      PLAYER.health = clamp(PLAYER.health - 0.004 * dt, 0, 20);
    }
  }
}

function setMode(newMode) {
  PLAYER.mode = newMode;
}

function setHotbarSlot(slotIndex) {
  PLAYER.activeSlot = clamp(slotIndex, 0, PLAYER.hotbar.length - 1);
}

function addHotbarItem(item) {
  const slot = PLAYER.hotbar.find((entry) => entry.id === item.id);
  if (slot) {
    slot.count += 1;
  } else {
    const emptyIndex = PLAYER.hotbar.findIndex((entry) => !entry.id);
    if (emptyIndex >= 0) {
      PLAYER.hotbar[emptyIndex] = { id: item.id, count: 1 };
    }
  }
}

export { PLAYER, INPUT, updatePlayerState, setMode, setHotbarSlot, addHotbarItem };
