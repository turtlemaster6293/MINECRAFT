// player.js
export const PLAYER = {
  position: { x: 8, y: 25, z: 8 },
  velocity: { x: 0, y: 0, z: 0 },
  yaw: 0, pitch: 0,
  onGround: false,
  width: 0.4, height: 1.8,
  hotbar: [{id:'grass', count:64}, {id:'stone', count:64}, {id:'dirt', count:64}, null, null, null, null, null, null],
  activeSlot: 0,
  addItem(id) {
    let stack = this.hotbar.find(s => s && s.id === id && s.count < 64);
    if (stack) stack.count++;
    else {
      const emptyIdx = this.hotbar.findIndex(s => s === null);
      if (emptyIdx !== -1) this.hotbar[emptyIdx] = { id, count: 1 };
    }
    updateUI();
  }
};

export const INPUT = { forward: false, backward: false, left: false, right: false, jump: false };

export function updateUI() {
  const container = document.getElementById('hotbar-ui');
  if (!container) return;
  container.innerHTML = '';
  const emojis = { 'grass': '🟩', 'dirt': '🟫', 'stone': '⬜', 'sand': '🟨', 'bedrock': '⬛' };
  PLAYER.hotbar.forEach((slot, i) => {
    const div = document.createElement('div');
    div.className = `hotbar-slot ${PLAYER.activeSlot === i ? 'active' : ''}`;
    if (slot && slot.count > 0) {
      div.innerHTML = `<span class="slot-emoji">${emojis[slot.id] || '📦'}</span><span class="slot-count">${slot.count}</span>`;
    }
    container.appendChild(div);
  });
}

// player.js
// ... (keep PLAYER, INPUT, updateUI same) ...

// player.js

// ... (Keep PLAYER, INPUT, updateUI as they were) ...

function checkCollision(x, y, z, world) {
    const r = 0.35; // Hitbox radius (slightly smaller than 0.5 to slide through gaps)
    // We check points at feet, waist, and head to be thorough
    const points = [
        [x - r, y, z - r], [x + r, y, z - r], 
        [x - r, y, z + r], [x + r, y, z + r],
        [x - r, y + 0.9, z - r], [x + r, y + 0.9, z - r], 
        [x - r, y + 0.9, z + r], [x + r, y + 0.9, z + r],
        [x - r, y + 1.7, z - r], [x + r, y + 1.7, z - r], 
        [x - r, y + 1.7, z + r], [x + r, y + 1.7, z + r]
    ];
    return points.some(p => world.getBlock(p[0], p[1], p[2]) !== null);
}

export function updatePlayer(world, dt) {
    const moveSpeed = 0.12 * dt;
    
    // 1. Horizontal Movement
    let mx = 0, mz = 0;
    if (INPUT.forward) { mx += Math.sin(PLAYER.yaw); mz += Math.cos(PLAYER.yaw); }
    if (INPUT.backward) { mx -= Math.sin(PLAYER.yaw); mz -= Math.cos(PLAYER.yaw); }
    if (INPUT.left) { mx -= Math.sin(PLAYER.yaw + Math.PI/2); mz -= Math.cos(PLAYER.yaw + Math.PI/2); }
    if (INPUT.right) { mx += Math.sin(PLAYER.yaw + Math.PI/2); mz += Math.cos(PLAYER.yaw + Math.PI/2); }
    
    const mag = Math.hypot(mx, mz) || 1;
    const vx = (mx / mag) * moveSpeed;
    const vz = (mz / mag) * moveSpeed;

    if (!checkCollision(PLAYER.position.x + vx, PLAYER.position.y, PLAYER.position.z, world)) {
        PLAYER.position.x += vx;
    }
    if (!checkCollision(PLAYER.position.x, PLAYER.position.y, PLAYER.position.z + vz, world)) {
        PLAYER.position.z += vz;
    }

    // 2. Vertical Movement & Gravity
    PLAYER.velocity.y -= 0.01 * dt;
    let vy = PLAYER.velocity.y * dt;

    // Check collision in the direction we are moving vertically
    // We add a tiny "step" (0.05) to check ahead
    const verticalCheckPoint = vy < 0 ? PLAYER.position.y + vy : PLAYER.position.y + vy + 0.2;

    if (checkCollision(PLAYER.position.x, verticalCheckPoint, PLAYER.position.z, world)) {
        if (PLAYER.velocity.y < 0) { // We are landing
            PLAYER.onGround = true;
            // SNAP: Align feet to the top of the block (Integer + 0.5)
            // We use Math.floor on the check-point to find the block we hit
            const groundY = Math.round(verticalCheckPoint);
            PLAYER.position.y = groundY + 0.501; // The 0.001 prevents re-triggering collision
        }
        PLAYER.velocity.y = 0;
    } else {
        PLAYER.position.y += vy;
        PLAYER.onGround = false;
    }

    // 3. Jump Logic
    if (PLAYER.onGround && INPUT.jump) {
        PLAYER.velocity.y = 0.2;
        PLAYER.onGround = false;
        PLAYER.position.y += 0.1; // Small lift to clear the floor
    }
}