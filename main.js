import { WORLD, getBlockType } from './world.js';
import { PLAYER, INPUT, updatePlayerState, setMode, setHotbarSlot, addHotbarItem } from './player.js';

const VALID_USERS = {
  'admin': 'mine1234',
  'builder': 'creative1',
  'survival': 'campfire'
};

const loginForm = document.getElementById('login-form');
const loginError = document.getElementById('login-error');
const homeScreen = document.getElementById('home-screen');
const gameScreen = document.getElementById('game-screen');
const creativeModeBtn = document.getElementById('creative-mode-btn');
const survivalModeBtn = document.getElementById('survival-mode-btn');
const modeType = document.getElementById('mode-type');
const survivalUI = document.getElementById('survival-ui');
const healthBar = document.getElementById('health-bar');
const hungerBar = document.getElementById('hunger-bar');
const armorBar = document.getElementById('armor-bar');
const healthText = document.getElementById('health-text');
const hungerText = document.getElementById('hunger-text');
const armorText = document.getElementById('armor-text');
const positionText = document.getElementById('position-text');
const creativeMenu = document.getElementById('creative-menu');
const creativeItems = document.getElementById('creative-items');
const closeCreative = document.getElementById('close-creative');
const hotbar = document.getElementById('hotbar');
const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');

let lastTime = 0;
let creativeCategory = 'blocks';
let activeUser = null;
let layerRotation = 0;

function init() {
  resizeCanvas();
  populateHotbar();
  renderCreativeItems('blocks');
  bindEvents();
  restoreUser();
  creativeModeBtn.disabled = true;
  survivalModeBtn.disabled = true;
  requestAnimationFrame(gameLoop);
}

function bindEvents() {
  window.addEventListener('resize', resizeCanvas);
  loginForm.addEventListener('submit', handleLogin);
  creativeModeBtn.addEventListener('click', () => switchMode('creative'));
  survivalModeBtn.addEventListener('click', () => switchMode('survival'));
  closeCreative.addEventListener('click', () => creativeMenu.classList.add('hidden'));

  document.addEventListener('keydown', (event) => {
    if (event.key === 'w' || event.key === 'W') INPUT.forward = true;
    if (event.key === 's' || event.key === 'S') INPUT.backward = true;
    if (event.key === 'a' || event.key === 'A') INPUT.left = true;
    if (event.key === 'd' || event.key === 'D') INPUT.right = true;
    if (event.key === ' ') INPUT.jump = true;
    if (event.key === 'e' || event.key === 'E') toggleCreativeMenu();
    if (event.key === 'q' || event.key === 'Q') removeBlock();
    if (!isNaN(event.key) && event.key !== '0') setHotbarSlot(Number(event.key) - 1);
    if (event.key === 'Tab') {
      event.preventDefault();
      creativeMenu.classList.toggle('hidden');
    }
    if (event.key === 'Escape') {
      creativeMenu.classList.add('hidden');
    }
    populateHotbar();
  });

  document.addEventListener('keyup', (event) => {
    if (event.key === 'w' || event.key === 'W') INPUT.forward = false;
    if (event.key === 's' || event.key === 'S') INPUT.backward = false;
    if (event.key === 'a' || event.key === 'A') INPUT.left = false;
    if (event.key === 'd' || event.key === 'D') INPUT.right = false;
    if (event.key === ' ') INPUT.jump = false;
  });

  creativeItems.addEventListener('click', (event) => {
    const itemCard = event.target.closest('.item-card');
    if (!itemCard) return;
    const itemId = itemCard.dataset.id;
    const blockType = getBlockType(itemId);
    if (blockType) {
      addHotbarItem(blockType);
      populateHotbar();
    }
  });

  document.querySelectorAll('#creative-menu .category-row button').forEach((button) => {
    button.addEventListener('click', () => {
      document.querySelectorAll('#creative-menu .category-row button').forEach((btn) => btn.classList.remove('active'));
      button.classList.add('active');
      creativeCategory = button.dataset.category;
      renderCreativeItems(creativeCategory);
    });
  });
}

function handleLogin(event) {
  event.preventDefault();
  const username = loginForm.username.value.trim();
  const password = loginForm.password.value;
  const remember = loginForm.remember.checked;

  if (VALID_USERS[username] === password) {
    activeUser = username;
    loginError.textContent = '';
    if (remember) {
      window.localStorage.setItem('webcraft-remember-user', username);
    } else {
      window.localStorage.removeItem('webcraft-remember-user');
    }
    creativeModeBtn.disabled = false;
    survivalModeBtn.disabled = false;
    homeScreen.classList.remove('active');
    gameScreen.classList.add('active');
    setMode('creative');
    updateHud();
    return;
  }

  loginError.textContent = 'Invalid username or password.';
}

function restoreUser() {
  const savedUser = window.localStorage.getItem('webcraft-remember-user');
  if (savedUser) {
    loginForm.username.value = savedUser;
  }
}

function switchMode(newMode) {
  if (!activeUser) return;
  setMode(newMode);
  modeType.textContent = newMode === 'creative' ? 'Creative' : 'Survival';
  survivalUI.classList.toggle('hidden', newMode === 'creative');
  creativeMenu.classList.add('hidden');
  updateHud();
}

function toggleCreativeMenu() {
  if (PLAYER.mode !== 'creative') return;
  creativeMenu.classList.toggle('hidden');
}

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}

function populateHotbar() {
  hotbar.innerHTML = '';
  PLAYER.hotbar.forEach((entry, index) => {
    const slot = document.createElement('div');
    slot.className = `hotbar-slot ${index === PLAYER.activeSlot ? 'active' : ''}`;
    const item = getBlockType(entry.id);
    slot.innerHTML = `<span>${item ? item.emoji : '▢'}<br><strong>${item ? item.label : 'Empty'}</strong>${entry.count ? `<div>${entry.count}</div>` : ''}</span>`;
    hotbar.appendChild(slot);
  });
}

function renderCreativeItems(category) {
  creativeItems.innerHTML = '';
  const items = WORLD.blockTypes.filter((item) => item.type === category || (category === 'blocks' && item.type === 'block'));
  items.forEach((item) => {
    const card = document.createElement('div');
    card.className = 'item-card';
    card.dataset.id = item.id;
    card.innerHTML = `<strong>${item.emoji} ${item.label}</strong><span>${item.type.charAt(0).toUpperCase() + item.type.slice(1)}</span>`;
    creativeItems.appendChild(card);
  });
}

function updateHud() {
  healthBar.style.width = `${(PLAYER.health / 20) * 100}%`;
  hungerBar.style.width = `${(PLAYER.hunger / 20) * 100}%`;
  armorBar.style.width = `${PLAYER.armor}%`;
  healthText.textContent = `${Math.round(PLAYER.health)} / 20`;
  hungerText.textContent = `${Math.round(PLAYER.hunger)} / 20`;
  armorText.textContent = `${Math.round(PLAYER.armor)}%`;
  positionText.textContent = `${Math.round(PLAYER.position.x)}, ${Math.round(PLAYER.position.y)}, ${Math.round(PLAYER.position.z)}`;
}

function drawWorld() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const size = Math.min(canvas.width, canvas.height) * 0.7;
  const centerX = canvas.width / 2;
  const centerY = canvas.height / 2 + 60;
  const scale = size / 32;

  for (let x = 0; x < WORLD.width; x++) {
    for (let y = 0; y < WORLD.depth; y++) {
      const height = 4;
      const drawX = centerX + (x - y) * (scale * 0.6);
      const drawY = centerY + (x + y) * (scale * 0.2);
      ctx.fillStyle = '#0c1728';
      ctx.strokeStyle = 'rgba(255,255,255,0.08)';
      ctx.lineWidth = 1;
      ctx.fillRect(drawX, drawY, scale * 0.95, scale * 0.5);
      ctx.strokeRect(drawX, drawY, scale * 0.95, scale * 0.5);
      if (Math.random() < 0.02) {
        ctx.fillStyle = 'rgba(255,255,255,0.1)';
        ctx.fillRect(drawX + 8, drawY + 8, 2, 2);
      }
    }
  }

  ctx.save();
  ctx.translate(centerX, centerY - 50);
  ctx.rotate(layerRotation);
  ctx.fillStyle = '#9dbd61';
  ctx.fillRect(-22, -22, 44, 44);
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 3;
  ctx.strokeRect(-22, -22, 44, 44);
  ctx.restore();
}

function drawPlayer() {
  const x = canvas.width - 180;
  const y = canvas.height - 140;
  ctx.save();
  ctx.fillStyle = '#f6f4ea';
  ctx.strokeStyle = '#0b1018';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(x, y - 20);
  ctx.lineTo(x + 14, y);
  ctx.lineTo(x - 14, y);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

function removeBlock() {
  // Placeholder for future survival building interaction.
}

function gameLoop(timestamp) {
  const dt = Math.min((timestamp - lastTime) / 16, 2);
  lastTime = timestamp;

  updatePlayerState(dt);
  updateHud();
  drawWorld();
  drawPlayer();

  layerRotation += 0.001 * dt;
  requestAnimationFrame(gameLoop);
}

init();
