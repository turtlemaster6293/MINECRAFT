import { WORLD, getBlockType, getRandomSpawnPoint } from './world.js';
import { PLAYER, INPUT, updatePlayerState, setHotbarSlot } from './player.js';

const PASSWORD = "minecraft";

const homeScreen = document.getElementById("home-screen");
const gameScreen = document.getElementById("game-screen");
const loginBtn = document.getElementById("login-btn");
const passwordInput = document.getElementById("password-input");
const loginError = document.getElementById("login-error");

loginBtn.addEventListener("click", () => {
  if (passwordInput.value === PASSWORD) {
    homeScreen.classList.remove("active");
    gameScreen.classList.add("active");

    play3D(); // FIXED: this now runs AFTER canvas is visible
  } else {
    loginError.textContent = "Incorrect password";
  }
});

function play3D() {

  // FIXED: canvas is now grabbed AFTER login, when it has real size
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

    const mesh =