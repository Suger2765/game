import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { CSS2DRenderer, CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer.js';
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
controls.autoRotateSpeed = 0.5;
controls.target.set(0, 0, 0);

// CSS2D renderer for labels
const labelRenderer = new CSS2DRenderer();
labelRenderer.setSize(window.innerWidth, window.innerHeight);
labelRenderer.domElement.style.position = 'absolute';
labelRenderer.domElement.style.top = '0';
labelRenderer.domElement.style.pointerEvents = 'none';
document.getElementById('app').appendChild(labelRenderer.domElement);

// ── Modules ──
const starField = new StarField(scene, camera);
const constellationLines = new ConstellationLines(scene);
const effects = new Effects(renderer, scene, camera);
const storyCard = new StoryCard();

// ── Constellation Labels ──
const labelGroup = new THREE.Group();
scene.add(labelGroup);
const labelStyle = 'color:rgba(200,215,245,0.5);font-size:11px;font-family:"Noto Serif SC",serif;letter-spacing:0.1em;text-shadow:0 0 20px rgba(100,150,255,0.3);pointer-events:none;white-space:nowrap;';
for (const con of constellations) {
  if (!con.stars || con.stars.length === 0 || con.myths === undefined) continue;
  const mid = Math.floor(con.stars.length / 2);
  const si = con.stars[mid];
  if (si >= stars.length) continue;
  const pos = starField.getStarPosition(si);
  const div = document.createElement('div');
  div.textContent = con.nameCn;
  div.style.cssText = labelStyle;
  const label = new CSS2DObject(div);
  label.position.copy(pos);
  label.position.multiplyScalar(1.1);
  labelGroup.add(label);
}

// ── Interaction ──
const raycaster = new THREE.Raycaster();
raycaster.params.Points = { threshold: 25 };
const pointer = new THREE.Vector2();

function getIntersection(event) {
  const rect = canvas.getBoundingClientRect();
  pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  raycaster.setFromCamera(pointer, camera);
  const intersects = raycaster.intersectObject(starField.mainMesh);
  return intersects.length > 0 ? intersects[0] : null;
}

function onCanvasClick(event) {
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

// Cursor hover feedback
canvas.addEventListener('pointermove', (e) => {
  if (state.phase !== 'explore') return;
  const hit = getIntersection(e);
  canvas.style.cursor = hit ? 'pointer' : 'default';
});

// Title screen click (separate from canvas to avoid overlay blocking)
document.getElementById('title-screen').addEventListener('click', (e) => {
  if (state.phase === 'title') startGame();
});

// Canvas interaction
canvas.addEventListener('click', onCanvasClick);
// Also handle touch for mobile
canvas.addEventListener('touchstart', (e) => {
  e.preventDefault();
  const touch = e.touches[0];
  onCanvasClick({ clientX: touch.clientX, clientY: touch.clientY });
}, { passive: false });

// ── Game Flow ──
function startGame() {
  state.phase = 'explore';
  document.getElementById('title-screen').classList.add('hidden');
  document.getElementById('hud').classList.add('visible');
  controls.autoRotate = true;
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

// ── Help Toggle ──
document.getElementById('help-btn').addEventListener('click', () => {
  const overlay = document.getElementById('help-overlay');
  overlay.classList.toggle('hidden');
});
document.getElementById('help-close').addEventListener('click', () => {
  document.getElementById('help-overlay').classList.add('hidden');
});
document.getElementById('help-overlay').addEventListener('click', (e) => {
  if (e.target === e.currentTarget) {
    document.getElementById('help-overlay').classList.add('hidden');
  }
});

// ── Resize ──
window.addEventListener('resize', () => {
  const w = window.innerWidth;
  const h = window.innerHeight;
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  renderer.setSize(w, h);
  labelRenderer.setSize(w, h);
  effects.resize(w, h);
});

// ── Animation Loop ──
function animate(time) {
  requestAnimationFrame(animate);
  
  controls.update();
  starField.update(time);
  constellationLines.update(time);

  effects.render();
  labelRenderer.render(scene, camera);
}

animate(0);

// ── Cleanup ──
window.addEventListener('beforeunload', () => {
  starField.dispose();
  constellationLines.dispose();
  effects.dispose();
  canvas.removeEventListener('click', onCanvasClick);
});
