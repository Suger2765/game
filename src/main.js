import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { stars, starMap } from './data/stars.js';
import { constellations } from './data/constellations.js';
import { StarField } from './scene/StarField.js';
import { ConstellationLines } from './scene/ConstellationLines.js';
import { Effects } from './scene/Effects.js';
import { StoryCard } from './ui/StoryCard.js';
import { getUserLocation } from './data/skycalc.js';

// ── State ──
const state = {
  phase: 'title', // title | explore | complete
  currentConId: null,
  currentConStars: [],
  clickedStarIndices: [],
  starToCon: {},   // star index → constellation id
  completed: new Set(),
  totalConstellations: 0,
  userLocation: { lat: 40, lon: 116 },
};

// Build star → constellation lookup
for (const con of constellations) {
  if (!con.stars || con.myths === undefined) continue;
  for (const si of con.stars) {
    state.starToCon[si] = con.id;
  }
}
state.totalConstellations = constellations.filter(c => c.myths && Object.keys(c.myths).length > 0).length;

// ── Setup ──
const canvas = document.getElementById('canvas');
const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
  alpha: false,
  powerPreference: 'high-performance',
});
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x020010);

const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 2000);
camera.position.set(0, 200, 700);
camera.lookAt(0, 0, 0);

// Controls
const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.rotateSpeed = 0.3;
controls.minDistance = 200;
controls.maxDistance = 1200;
controls.autoRotate = true;
controls.autoRotateSpeed = 0.3;
controls.target.set(0, 0, 0);

// ── Modules ──
const starField = new StarField(scene, camera);
const constellationLines = new ConstellationLines(scene);
const effects = new Effects(renderer, scene, camera);
const storyCard = new StoryCard();

// ── Interaction ──
const raycaster = new THREE.Raycaster();
raycaster.params.Points = { threshold: 15 };
const pointer = new THREE.Vector2();

function getIntersection(event) {
  const rect = canvas.getBoundingClientRect();
  pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  raycaster.setFromCamera(pointer, camera);
  const intersects = raycaster.intersectObject(starField.mesh);
  return intersects.length > 0 ? intersects[0] : null;
}

function onPointerDown(event) {
  if (state.phase === 'title') {
    startGame();
    return;
  }
  if (state.phase === 'complete') {
    hideCompletion();
    return;
  }
  if (storyCard.isVisible()) {
    storyCard.hide();
    return;
  }

  const hit = getIntersection(event);
  if (hit) {
    const starIndex = starField.getStarIndex(hit);
    if (starIndex >= 0) handleStarClick(starIndex);
  }
}

canvas.addEventListener('pointerdown', onPointerDown);

// ── Game Flow ──
function startGame() {
  state.phase = 'explore';
  document.getElementById('title-screen').classList.add('hidden');
  document.getElementById('hud').classList.add('visible');
  controls.autoRotate = false;
  // Check user location
  getUserLocation().then(loc => {
    state.userLocation = loc;
  });
}

function handleStarClick(starIndex) {
  const conId = state.starToCon[starIndex];
  if (!conId) return;

  const con = constellations.find(c => c.id === conId);
  if (!con || !con.myths) return;

  // Find position of this star in the constellation
  const pos = con.stars.indexOf(starIndex);
  if (pos < 0) return;

  // Check if this constellation's stars are being clicked in order
  if (state.currentConId !== conId) {
    // Start new constellation sequence
    state.currentConId = conId;
    state.clickedStarIndices = [pos];
  } else {
    // Continue sequence
    if (state.clickedStarIndices.includes(pos)) return;
    state.clickedStarIndices.push(pos);
    state.clickedStarIndices.sort((a, b) => a - b);
  }

  // Reveal constellation lines
  constellationLines.reveal(conId, starIndex);

  // Show story card
  storyCard.show(conId, starIndex);
  
  // Update HUD
  document.getElementById('constellation-name').textContent = con.nameCn;
  updateProgress();

  // Check if all stars clicked
  if (state.clickedStarIndices.length === con.stars.length) {
    setTimeout(() => showCompletion(conId), 500);
  }
}

function updateProgress() {
  const done = state.completed.size;
  const total = state.totalConstellations;
  document.getElementById('progress-text').textContent = `${done} / ${total} 已完成`;
  document.getElementById('progress-fill').style.width = `${(done / total) * 100}%`;
}

function showCompletion(conId) {
  const con = constellations.find(c => c.id === conId);
  if (!con) return;
  
  state.completed.add(conId);
  constellationLines.complete(conId);
  state.phase = 'complete';

  document.getElementById('complete-title').textContent = `✦ ${con.nameCn} ✦`;
  // Pick Greek mythology for completion story
  document.getElementById('complete-story').textContent = con.myths?.greek || con.desc;
  document.getElementById('constellation-complete').classList.remove('hidden');
  updateProgress();

  // Bloom burst
  effects.setBloomStrength(1.0);
  setTimeout(() => effects.setBloomStrength(0.6), 1500);
}

function hideCompletion() {
  state.phase = 'explore';
  state.currentConId = null;
  state.clickedStarIndices = [];
  document.getElementById('constellation-complete').classList.add('hidden');
}

// ── Tonight Visible ──
document.getElementById('tonight-btn').addEventListener('click', () => {
  const list = document.getElementById('tonight-list');
  const toggle = list.classList.toggle('hidden');
  if (!toggle) updateTonightList();
  else list.classList.add('hidden');
});

function updateTonightList() {
  const list = document.getElementById('tonight-list');
  const { lat, lon } = state.userLocation;
  
  // Simple visibility: use the star map's current rotation to determine which stars are visible
  const visible = [];
  for (const con of constellations) {
    if (!con.myths) continue;
    if (state.completed.has(con.id)) continue;
    // Check if at least some stars are in view
    let inView = 0;
    for (const si of con.stars) {
      if (si >= stars.length) continue;
      const pos = starField.getStarPosition(si);
      // Transform by camera rotation
      const dir = pos.clone().normalize();
      // Stars with positive z (toward camera) are visible
      if (dir.z > -0.2) inView++;
    }
    if (inView >= Math.ceil(con.stars.length * 0.3)) {
      visible.push(con);
    }
  }

  list.innerHTML = '<div class="title">今夜可见星座</div>';
  if (visible.length === 0) {
    list.innerHTML += '<div class="item">旋转星空探索更多</div>';
    return;
  }
  for (const con of visible) {
    const item = document.createElement('div');
    item.className = 'item';
    item.textContent = con.nameCn;
    item.addEventListener('click', () => {
      // Fly to constellation
      if (con.stars.length > 0) {
        const pos = starField.getStarPosition(con.stars[0]);
        controls.target.lerp(pos, 0.1);
      }
      list.classList.add('hidden');
    });
    list.appendChild(item);
  }
}

// ── Resize ──
window.addEventListener('resize', () => {
  const w = window.innerWidth;
  const h = window.innerHeight;
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  renderer.setSize(w, h);
  effects.resize(w, h);
});

// ── Animation Loop ──
function animate(time) {
  requestAnimationFrame(animate);
  
  controls.update();
  starField.update(time);
  constellationLines.update(time);

  effects.render();
}

animate(0);

// ── Cleanup ──
window.addEventListener('beforeunload', () => {
  starField.dispose();
  constellationLines.dispose();
  effects.dispose();
  canvas.removeEventListener('pointerdown', onPointerDown);
});
