import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { CSS2DRenderer, CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer.js';
import { stars, starMap } from './data/stars.js';
import { constellations } from './data/constellations.js';
import { StarField } from './scene/StarField.js';
import { ConstellationLines } from './scene/ConstellationLines.js';
import { Effects } from './scene/Effects.js';
import { StoryCard } from './ui/StoryCard.js';
import { AudioFX } from './scene/Audio.js';
import { getUserLocation } from './data/skycalc.js';

const state = {
  phase: 'title',
  currentConId: null,
  currentConStars: [],
  clickedStarIndices: [],
  starToCons: {},
  completed: new Set(),
  totalConstellations: 0,
  userLocation: { lat: 40, lon: 116 },
  conProgress: {},
  flyTarget: null,
  flyStart: null,
  flyTime: 0,
  flyDuration: 1.2,
};

for (const con of constellations) {
  if (!con.stars || con.myths === undefined) continue;
  for (const si of con.stars) {
    if (!state.starToCons[si]) state.starToCons[si] = [];
    state.starToCons[si].push(con.id);
  }
}
state.totalConstellations = constellations.filter(c => c.myths && Object.keys(c.myths).length > 0).length;

const renderer = new THREE.WebGLRenderer({
  canvas: document.getElementById('canvas'),
  antialias: true, alpha: false, powerPreference: 'high-performance'
});
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x020010);

const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 2000);
camera.position.set(0, 200, 700);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.08;
controls.rotateSpeed = 0.2;
controls.minDistance = 200;
controls.maxDistance = 1200;
controls.autoRotate = true;
controls.autoRotateSpeed = 0.2;
controls.target.set(0, 0, 0);

const labelRenderer = new CSS2DRenderer();
labelRenderer.setSize(window.innerWidth, window.innerHeight);
labelRenderer.domElement.style.position = 'absolute';
labelRenderer.domElement.style.top = '0';
labelRenderer.domElement.style.pointerEvents = 'none';
document.getElementById('app').appendChild(labelRenderer.domElement);

const audio = new AudioFX();
const starField = new StarField(scene, camera, state.starToCons);
const constellationLines = new ConstellationLines(scene);
const effects = new Effects(renderer, scene, camera);
const storyCard = new StoryCard();

storyCard.setCallback(() => {
  state.phase = 'explore';
});

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

const raycaster = new THREE.Raycaster();
raycaster.params.Points = { threshold: 80 };
const pointer = new THREE.Vector2();
let clusterCycle = null;

function getIntersections(event) {
  const rect = renderer.domElement.getBoundingClientRect();
  pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  raycaster.setFromCamera(pointer, camera);
  return raycaster.intersectObject(starField.mainMesh);
}

function pickBestStar(intersects) {
  if (!intersects || intersects.length === 0) return -1;
  const currentConStars = state.currentConStars;
  const uncollectedInCon = currentConStars.filter(si => !state.completed.has(si));
  const collected = state.completed;

  let best = -1, bestScore = -1;
  for (const hit of intersects) {
    const si = starField.getStarIndex(hit);
    if (si < 0) continue;
    const cons = state.starToCons[si];
    if (!cons || cons.length === 0) continue;

    let score = 100 - Math.round(hit.distance / 10);
    const hasRelevantCon = cons.some(conId => {
      const con = constellations.find(c => c.id === conId);
      return con && con.myths && Object.keys(con.myths).length > 0;
    });
    if (!hasRelevantCon) score -= 50;

    if (currentConStars.includes(si)) {
      if (!state.clickedStarIndices.includes(currentConStars.indexOf(si))) {
        score += 200;
      } else {
        score -= 100;
      }
    }
    if (uncollectedInCon.includes(si)) score += 100;
    if (collected.has(si)) score -= 200;

    if (score > bestScore) { bestScore = score; best = si; }
  }
  return best;
}

function handleStarClick(starIndex) {
  const cons = state.starToCons[starIndex];
  if (!cons || cons.length === 0) return;
  const conId = cons.find(id => {
    const con = constellations.find(c => c.id === id);
    return con && con.myths && Object.keys(con.myths).length > 0 && !state.completed.has(id);
  });
  if (!conId) return;
  const con = constellations.find(c => c.id === conId);
  if (!con) return;

  const pos = con.stars.indexOf(starIndex);
  if (pos < 0) return;

  if (state.currentConId !== conId) {
    state.currentConId = conId;
    state.currentConStars = con.stars;
    state.clickedStarIndices = [pos];
    constellationLines.clearAll();
    starField.showHighlights(conId, con.stars);
  } else {
    if (state.clickedStarIndices.includes(pos)) return;
    state.clickedStarIndices.push(pos);
    state.clickedStarIndices.sort((a, b) => a - b);
  }

  audio.resume();
  audio.starClick();
  constellationLines.reveal(conId, starIndex);
  storyCard.show(conId, starIndex);
  document.getElementById('constellation-name').textContent = con.nameCn;
  updateProgress();

  if (state.clickedStarIndices.length === con.stars.length) {
    setTimeout(() => showCompletion(conId), 500);
  }
}

function onCanvasClick(event) {
  if (state.phase === 'complete' || state.phase === 'title') return;
  if (storyCard.isVisible()) { storyCard.hide(); return; }

  const intersects = getIntersections(event);
  if (intersects.length > 0) {
    const si = pickBestStar(intersects);
    if (si >= 0) handleStarClick(si);
  }
}

renderer.domElement.addEventListener('click', onCanvasClick);
renderer.domElement.addEventListener('touchstart', (e) => {
  e.preventDefault();
  const touch = e.touches[0];
  onCanvasClick({ clientX: touch.clientX, clientY: touch.clientY });
}, { passive: false });

renderer.domElement.addEventListener('pointermove', (e) => {
  if (state.phase !== 'explore') return;
  const hits = getIntersections(e);
  const si = pickBestStar(hits);
  renderer.domElement.style.cursor = si >= 0 ? 'pointer' : 'default';
});

document.getElementById('title-screen').addEventListener('click', () => {
  if (state.phase === 'title') startGame();
});

function startGame() {
  state.phase = 'explore';
  document.getElementById('title-screen').classList.add('hidden');
  document.getElementById('hud').classList.add('visible');
  document.querySelectorAll('.panel-btn').forEach(b => b.classList.add('visible'));
  controls.autoRotate = true;
  getUserLocation().then(loc => { state.userLocation = loc; });
  loadProgress();
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
  state.conProgress[conId] = 'completed';
  constellationLines.complete(conId);
  starField.dimCollectedStars(con.stars);
  starField.clearHighlights();
  state.phase = 'complete';

  audio.resume();
  audio.complete();

  document.getElementById('complete-title').textContent = `✦ ${con.nameCn} ✦`;
  document.getElementById('complete-story').textContent = con.myths?.greek || con.desc;
  document.getElementById('constellation-complete').classList.remove('hidden');
  updateProgress();
  updateGallery();
  updateConPanel();
  saveProgress();

  effects.setBloomStrength(1.0);
  setTimeout(() => effects.setBloomStrength(0.4), 1500);
}

document.getElementById('constellation-complete').addEventListener('click', () => {
  state.phase = 'explore';
  state.currentConId = null;
  state.currentConStars = [];
  state.clickedStarIndices = [];
  document.getElementById('constellation-complete').classList.add('hidden');
});

document.getElementById('tonight-btn').addEventListener('click', () => {
  const list = document.getElementById('tonight-list');
  const toggle = list.classList.toggle('hidden');
  if (!toggle) updateTonightList();
  else list.classList.add('hidden');
});

function updateTonightList() {
  const list = document.getElementById('tonight-list');
  const { lat, lon } = state.userLocation;
  const visible = [];
  for (const con of constellations) {
    if (!con.myths) continue;
    if (state.completed.has(con.id)) continue;
    let inView = 0;
    for (const si of con.stars) {
      if (si >= stars.length) continue;
      const pos = starField.getStarPosition(si);
      const dir = pos.clone().normalize();
      if (dir.z > -0.2) inView++;
    }
    if (inView >= Math.ceil(con.stars.length * 0.3)) visible.push(con);
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
      flyToConstellation(con.id);
      list.classList.add('hidden');
    });
    list.appendChild(item);
  }
}

document.getElementById('help-btn').addEventListener('click', () => {
  document.getElementById('help-overlay').classList.toggle('hidden');
});
document.getElementById('help-close').addEventListener('click', () => {
  document.getElementById('help-overlay').classList.add('hidden');
});
document.getElementById('help-overlay').addEventListener('click', (e) => {
  if (e.target === e.currentTarget) document.getElementById('help-overlay').classList.add('hidden');
});

function flyToConstellation(conId) {
  const con = constellations.find(c => c.id === conId);
  if (!con || con.stars.length === 0) return;
  const mid = Math.floor(con.stars.length / 2);
  const pos = starField.getStarPosition(con.stars[mid]);
  const camPos = camera.position.clone();
  const targetDir = pos.clone().normalize().multiplyScalar(500);
  state.flyStart = { cam: camPos, target: controls.target.clone() };
  state.flyTarget = { cam: targetDir, target: pos.clone() };
  state.flyTime = 0;
}

function saveProgress() {
  try {
    const data = { completed: [...state.completed], conProgress: state.conProgress };
    localStorage.setItem('constellation_progress', JSON.stringify(data));
  } catch(e) {}
}

function loadProgress() {
  try {
    const raw = localStorage.getItem('constellation_progress');
    if (!raw) return;
    const data = JSON.parse(raw);
    if (data.completed) {
      for (const id of data.completed) {
        state.completed.add(id);
        constellationLines.completed.add(id);
        constellationLines.lines[id].done = true;
        constellationLines.lines[id].mat.color.setHex(0xffd700);
        constellationLines.lines[id].mat.opacity = 1;
        constellationLines.lines[id].line.visible = true;
        starField.dimCollectedStars(constellations.find(c => c.id === id)?.stars || []);
      }
    }
    if (data.conProgress) state.conProgress = data.conProgress;
    updateProgress();
    updateGallery();
    updateConPanel();
  } catch(e) {}
}

function updateGallery() {
  const grid = document.getElementById('gallery-grid');
  if (!grid) return;
  grid.innerHTML = '';
  for (const con of constellations) {
    if (!con.myths || Object.keys(con.myths).length === 0) continue;
    const done = state.completed.has(con.id);
    const card = document.createElement('div');
    card.className = `gallery-card${done ? ' done' : ''}`;
    const perc = done ? 100 : Math.round(((state.conProgress[con.id]?.stars?.length || 0) / con.stars.length) * 100);
    card.innerHTML = `
      <div class="gallery-icon">${done ? '✦' : '☆'}</div>
      <div class="gallery-name">${con.nameCn}</div>
      <div class="gallery-bar"><div class="gallery-fill" style="width:${perc}%"></div></div>
    `;
    card.addEventListener('click', () => { flyToConstellation(con.id); toggleGallery(); });
    grid.appendChild(card);
  }
}

function toggleGallery() {
  const el = document.getElementById('gallery-overlay');
  el.classList.toggle('hidden');
  if (!el.classList.contains('hidden')) updateGallery();
}

document.getElementById('gallery-btn').addEventListener('click', toggleGallery);
document.getElementById('gallery-close').addEventListener('click', toggleGallery);
document.getElementById('gallery-overlay').addEventListener('click', (e) => {
  if (e.target === e.currentTarget) toggleGallery();
});

function updateConPanel() {
  const list = document.getElementById('con-panel-list');
  if (!list) return;
  list.innerHTML = '';
  for (const con of constellations) {
    if (!con.myths || Object.keys(con.myths).length === 0) continue;
    const done = state.completed.has(con.id);
    const item = document.createElement('div');
    item.className = `con-panel-item${done ? ' done' : ''}`;
    item.innerHTML = `<span class="con-icon">${done ? '✦' : '☆'}</span><span class="con-name">${con.nameCn}</span>`;
    item.addEventListener('click', () => { flyToConstellation(con.id); });
    list.appendChild(item);
  }
}

document.getElementById('con-panel-btn').addEventListener('click', () => {
  document.getElementById('con-panel').classList.toggle('hidden');
  updateConPanel();
});
document.getElementById('con-panel-close').addEventListener('click', () => {
  document.getElementById('con-panel').classList.add('hidden');
});

window.addEventListener('resize', () => {
  const w = window.innerWidth;
  const h = window.innerHeight;
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  renderer.setSize(w, h);
  labelRenderer.setSize(w, h);
  effects.resize(w, h);
});

function animate(time) {
  requestAnimationFrame(animate);
  const dt = 1 / 60;

  if (state.flyStart && state.flyTarget) {
    state.flyTime += dt;
    const t = Math.min(state.flyTime / state.flyDuration, 1);
    const ease = 1 - Math.pow(1 - t, 3);
    camera.position.lerpVectors(state.flyStart.cam, state.flyTarget.cam, ease);
    controls.target.lerpVectors(state.flyStart.target, state.flyTarget.target, ease);
    if (t >= 1) {
      controls.autoRotate = true;
      state.flyStart = null;
      state.flyTarget = null;
    } else {
      controls.autoRotate = false;
    }
  }

  controls.update();
  starField.update(time);
  constellationLines.update(time);
  updateSkyColor(time);

  effects.render();
  labelRenderer.render(scene, camera);
}

function updateSkyColor(time) {
  const h = new Date().getHours() + new Date().getMinutes() / 60;
  let r, g, b;
  if (h >= 5 && h < 7) { const t = (h - 5) / 2; r=0.02+t*0.1; g=0.01+t*0.08; b=0.06+t*0.15; }
  else if (h >= 7 && h < 17) { const t = (h - 7) / 10; r=0.12*(1-t)+0.3*t; g=0.09*(1-t)+0.35*t; b=0.21*(1-t)+0.45*t; }
  else if (h >= 17 && h < 19) { const t = (h - 17) / 2; r=0.3*(1-t)+0.15*t; g=0.35*(1-t)+0.08*t; b=0.45*(1-t)+0.05*t; }
  else { r=0.01; g=0.005; b=0.04; }
  scene.background.setRGB(Math.max(0.005, r), Math.max(0.005, g), Math.max(0.01, b));
}

animate(0);

window.addEventListener('beforeunload', () => {
  starField.dispose();
  constellationLines.dispose();
  effects.dispose();
});
