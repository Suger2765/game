import * as THREE from 'three';
import { stars } from '../data/stars.js';
import { eqToCart } from '../data/skycalc.js';

const RADIUS = 400;

function createStarTexture(size = 128) {
  const canvas = document.createElement('canvas');
  canvas.width = size; canvas.height = size;
  const ctx = canvas.getContext('2d');
  const cx = size/2, cy = size/2;
  const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, cx*0.5);
  grad.addColorStop(0, 'rgba(255,255,255,1)');
  grad.addColorStop(0.15, 'rgba(255,240,220,0.7)');
  grad.addColorStop(0.4, 'rgba(200,210,255,0.2)');
  grad.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);
  ctx.globalCompositeOperation = 'screen';
  for (let ang = 0; ang < 4; ang++) {
    const angle = ang * Math.PI/2 + Math.PI/4;
    const grad2 = ctx.createRadialGradient(cx, cy, 0, cx, cy, cx*0.8);
    grad2.addColorStop(0, 'rgba(255,255,255,0.3)');
    grad2.addColorStop(0.5, 'rgba(200,220,255,0.08)');
    grad2.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(angle);
    ctx.scale(1, 0.08);
    ctx.fillStyle = grad2;
    ctx.beginPath();
    ctx.arc(0, 0, cx*0.9, 0, Math.PI*2);
    ctx.fill();
    ctx.restore();
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.needsUpdate = true;
  return tex;
}

function createBgTexture(size = 32) {
  const canvas = document.createElement('canvas');
  canvas.width = size; canvas.height = size;
  const ctx = canvas.getContext('2d');
  const g = ctx.createRadialGradient(size/2, size/2, 0, size/2, size/2, size/2);
  g.addColorStop(0, 'rgba(255,255,255,0.6)');
  g.addColorStop(0.3, 'rgba(200,210,255,0.15)');
  g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  return new THREE.CanvasTexture(canvas);
}

export class StarField {
  constructor(scene, camera, starToCons) {
    this.scene = scene;
    this.camera = camera;
    this.starToCons = starToCons || {};
    this.mainMesh = null;
    this.bgMesh = null;
    this.milkyWay = null;
    this.positions = [];
    this.starIdx = [];
    this.colors = [];
    this.twinklePhases = [];
    this.bgTwinklePhases = [];
    this.glowTex = createStarTexture();
    this.bgTex = createBgTexture();
    this.highlightRings = [];
    this.highlightGroup = new THREE.Group();
    this.scene.add(this.highlightGroup);
    this.shootingStars = [];
    this.shootingGroup = new THREE.Group();
    this.scene.add(this.shootingGroup);
    this.nebulaGroup = new THREE.Group();
    this.scene.add(this.nebulaGroup);
    this.collectedStars = new Set();
    this.originalSizes = null;
    this.build();
  }

  build() {
    this.buildCatalogStars();
    this.buildBackgroundStars();
    this.buildMilkyWay();
    this.buildNebulae();
  }

  buildCatalogStars() {
    const positions = [];
    const colors = [];
    const starIdx = [];
    const phases = [];

    for (let i = 0; i < stars.length; i++) {
      const s = stars[i];
      const [x, y, z] = eqToCart(s[1], s[2], RADIUS);
      positions.push(x, y, z);
      const spec = s[6] || 'A';
      const fc = spec.charAt(0);
      let r, g, b;
      if ('OB'.includes(fc)) { r=0.75; g=0.80; b=1.0; }
      else if (fc === 'A') { r=0.90; g=0.90; b=1.0; }
      else if (fc === 'F') { r=1.0; g=0.95; b=0.85; }
      else if (fc === 'G') { r=1.0; g=0.95; b=0.70; }
      else if (fc === 'K') { r=1.0; g=0.80; b=0.55; }
      else if (fc === 'M') { r=1.0; g=0.65; b=0.45; }
      else { r=0.95; g=0.95; b=0.95; }
      const brightness = Math.max(0.1, 1 - (s[3] + 1.46) / 7);
      colors.push(r * (0.7 + 0.3 * brightness), g * (0.7 + 0.3 * brightness), b * (0.7 + 0.3 * brightness));
      starIdx.push(i);
      phases.push(Math.random() * Math.PI * 2);
    }

    this.colors = colors;

    const geom = new THREE.BufferGeometry();
    geom.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geom.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    geom.userData = { starIdx };

    const mat = new THREE.PointsMaterial({
      size: 28,
      map: this.glowTex,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      transparent: true,
      vertexColors: true,
      opacity: 0.95,
      sizeAttenuation: true,
    });

    this.mainMesh = new THREE.Points(geom, mat);
    this.mainMesh.userData.isStar = true;
    this.scene.add(this.mainMesh);
    this.positions = positions;
    this.starIdx = starIdx;
    this.twinklePhases = phases;
    this.originalSizes = new Float32Array(stars.length);
    this.twinkleOffsets = new Float32Array(stars.length);
    for (let i = 0; i < stars.length; i++) {
      this.originalSizes[i] = 28;
      this.twinkleOffsets[i] = Math.random() * 100;
    }
  }

  buildBackgroundStars() {
    const count = 2500;
    const positions = [];
    const phases = [];
    for (let i = 0; i < count; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = RADIUS + (Math.random() - 0.5) * 50;
      positions.push(r * Math.sin(phi) * Math.cos(theta), r * Math.cos(phi), r * Math.sin(phi) * Math.sin(theta));
      phases.push(Math.random() * Math.PI * 2);
    }
    const geom = new THREE.BufferGeometry();
    geom.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    const mat = new THREE.PointsMaterial({
      size: 2, map: this.bgTex, blending: THREE.AdditiveBlending,
      depthWrite: false, transparent: true, opacity: 0.4, color: 0x8899bb, sizeAttenuation: true
    });
    this.bgMesh = new THREE.Points(geom, mat);
    this.scene.add(this.bgMesh);
    this.bgTwinklePhases = phases;
    this.bgPositions = positions;
  }

  buildMilkyWay() {
    const count = 4000;
    const positions = [], sizes = [], colors = [];
    for (let i = 0; i < count; i++) {
      const spread = 0.15 + Math.random() * 0.3;
      const angle = Math.random() * Math.PI * 2;
      const bandOffset = (Math.random() - 0.5) * spread;
      const dist = RADIUS * 0.9 + Math.random() * RADIUS * 0.2;
      positions.push(dist * Math.cos(angle), dist * bandOffset * 1.5, dist * Math.sin(angle));
      const bright = 0.1 + Math.random() * 0.15;
      colors.push(bright, bright * 1.1, bright * 1.3);
      sizes.push(1 + Math.random() * 3);
    }
    const geom = new THREE.BufferGeometry();
    geom.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geom.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    const mat = new THREE.PointsMaterial({
      size: 3, map: this.bgTex, blending: THREE.AdditiveBlending,
      depthWrite: false, transparent: true, opacity: 0.25, vertexColors: true, sizeAttenuation: true
    });
    this.milkyWay = new THREE.Points(geom, mat);
    this.scene.add(this.milkyWay);
  }

  buildNebulae() {
    const nebulaData = [
      { count: 800, color: [0.6, 0.2, 0.4], spread: 70, pos: [80, -30, -280], opacity: 0.08 },
      { count: 600, color: [0.2, 0.3, 0.7], spread: 60, pos: [-200, 50, -300], opacity: 0.06 },
      { count: 500, color: [0.1, 0.5, 0.3], spread: 50, pos: [250, -20, -250], opacity: 0.05 },
      { count: 700, color: [0.5, 0.1, 0.3], spread: 80, pos: [-100, -60, -320], opacity: 0.07 },
    ];
    for (const nd of nebulaData) {
      const positions = [];
      for (let i = 0; i < nd.count; i++) {
        const x = nd.pos[0] + (Math.random() - 0.5) * nd.spread * 2;
        const y = nd.pos[1] + (Math.random() - 0.5) * nd.spread * 1.2;
        const z = nd.pos[2] + (Math.random() - 0.5) * nd.spread * 0.8;
        positions.push(x, y, z);
      }
      const geom = new THREE.BufferGeometry();
      geom.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
      const mat = new THREE.PointsMaterial({
        size: 12, color: new THREE.Color(nd.color[0], nd.color[1], nd.color[2]),
        transparent: true, opacity: nd.opacity, blending: THREE.AdditiveBlending,
        depthWrite: false, sizeAttenuation: true
      });
      const mesh = new THREE.Points(geom, mat);
      this.nebulaGroup.add(mesh);
    }
  }

  addShootingStar() {
    const angle = Math.random() * Math.PI * 2;
    const phi = (Math.random() - 0.5) * 0.8;
    const startR = RADIUS * 0.7;
    const x = startR * Math.cos(angle) * Math.cos(phi);
    const y = startR * Math.sin(phi);
    const z = startR * Math.sin(angle) * Math.cos(phi);
    const dx = (Math.random() - 0.5) * 3;
    const dy = (Math.random() - 0.5) * 3 + 0.5;
    const dz = (Math.random() - 0.5) * 3;
    const geom = new THREE.BufferGeometry();
    const trail = 20;
    const pos = new Float32Array(trail * 3);
    for (let i = 0; i < trail; i++) {
      pos[i*3] = x - dx * i; pos[i*3+1] = y - dy * i; pos[i*3+2] = z - dz * i;
    }
    geom.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const mat = new THREE.PointsMaterial({
      size: 1.5, color: 0xffffff, transparent: true, opacity: 0.6,
      blending: THREE.AdditiveBlending, depthWrite: false,
    });
    const mesh = new THREE.Points(geom, mat);
    mesh.userData = { dx, dy, dz, life: 1.0, trail };
    this.shootingGroup.add(mesh);
    this.shootingStars.push(mesh);
  }

  showHighlights(conId, conStars) {
    this.clearHighlights();
    if (!conStars) return;
    for (const si of conStars) {
      if (this.collectedStars.has(si)) continue;
      const i = si * 3;
      const p = new THREE.Vector3(this.positions[i], this.positions[i+1], this.positions[i+2]);
      const ringGeom = new THREE.RingGeometry(10, 14, 32);
      const ringMat = new THREE.MeshBasicMaterial({
        color: 0xffd700, transparent: true, opacity: 0.4, side: THREE.DoubleSide,
        depthWrite: false, blending: THREE.AdditiveBlending
      });
      const ring = new THREE.Mesh(ringGeom, ringMat);
      ring.position.copy(p);
      ring.lookAt(0, 0, 0);
      ring.userData = { starIdx: si, baseScale: 1 };
      this.highlightGroup.add(ring);
      this.highlightRings.push(ring);
    }
  }

  clearHighlights() {
    for (const r of this.highlightRings) {
      this.highlightGroup.remove(r);
      r.geometry.dispose();
      r.material.dispose();
    }
    this.highlightRings = [];
  }

  dimCollectedStars(conStars) {
    if (!this.mainMesh) return;
    const colors = this.mainMesh.geometry.attributes.color.array;
    for (const si of conStars) {
      this.collectedStars.add(si);
      const i3 = si * 3;
      colors[i3] *= 0.2;
      colors[i3+1] *= 0.2;
      colors[i3+2] *= 0.2;
    }
    this.mainMesh.geometry.attributes.color.needsUpdate = true;
  }

  restoreCollectedStars(conStars) {
    if (!this.mainMesh) return;
    const colors = this.mainMesh.geometry.attributes.color.array;
    for (const si of conStars) {
      if (!this.collectedStars.has(si)) continue;
      const otherCons = this.starToCons[si];
      let stillCollected = false;
      if (otherCons) {
        for (const oc of otherCons) {
          if (oc !== '*' && this.collectedStars.has(oc)) { stillCollected = true; break; }
        }
      }
      if (!stillCollected) {
        this.collectedStars.delete(si);
        const i3 = si * 3;
        colors[i3] = this.colors[i3];
        colors[i3+1] = this.colors[i3+1];
        colors[i3+2] = this.colors[i3+2];
      }
    }
    this.mainMesh.geometry.attributes.color.needsUpdate = true;
  }

  getStarPosition(index) {
    const i = index * 3;
    return new THREE.Vector3(this.positions[i], this.positions[i+1], this.positions[i+2]);
  }

  getStarIndex(intersect) {
    if (!intersect) return -1;
    return this.mainMesh.geometry.userData.starIdx[intersect.index];
  }

  update(time) {
    const t = time * 0.001;
    const sec = time * 0.001;

    if (this.mainMesh) {
      const sizes = this.mainMesh.geometry.attributes.position.array;
      const posAttr = this.mainMesh.geometry.attributes.position;
      const count = posAttr.count;
      if (!this._sizeOverrides) this._sizeOverrides = new Float32Array(count);
      for (let i = 0; i < count; i++) {
        const phase = this.twinklePhases[i] || 0;
        const twinkle = 0.85 + 0.15 * Math.sin(sec * 1.5 + phase * 10);
        this._sizeOverrides[i] = 28 * twinkle;
      }
      const sizeAttr = this.mainMesh.geometry.attributes.size;
      if (!sizeAttr) {
        const arr = new Float32Array(count);
        for (let i = 0; i < count; i++) arr[i] = this._sizeOverrides[i];
        this.mainMesh.geometry.setAttribute('size', new THREE.Float32BufferAttribute(arr, 1));
      } else {
        for (let i = 0; i < count; i++) sizeAttr.array[i] = this._sizeOverrides[i];
        sizeAttr.needsUpdate = true;
      }
      this.mainMesh.material.size = 1;
    }

    if (this.bgMesh) {
      this.bgMesh.material.opacity = 0.3 + 0.15 * Math.sin(sec * 0.3 + 2.1);
    }
    if (this.milkyWay) {
      this.milkyWay.rotation.x = Math.sin(sec * 0.02) * 0.05;
    }

    if (this.highlightRings.length > 0) {
      for (const ring of this.highlightRings) {
        const breathe = 0.7 + 0.3 * Math.sin(sec * 2 + ring.userData.starIdx);
        ring.material.opacity = 0.2 + 0.3 * breathe;
        const s = 1 + 0.2 * breathe;
        ring.scale.set(s, s, s);
      }
    }

    if (Math.random() < 0.003) this.addShootingStar();
    for (let i = this.shootingStars.length - 1; i >= 0; i--) {
      const m = this.shootingStars[i];
      m.userData.life -= 0.02;
      const pos = m.geometry.attributes.position.array;
      for (let j = pos.length / 3 - 1; j > 0; j--) {
        pos[j*3] = pos[(j-1)*3]; pos[j*3+1] = pos[(j-1)*3+1]; pos[j*3+2] = pos[(j-1)*3+2];
      }
      pos[0] += m.userData.dx; pos[1] += m.userData.dy; pos[2] += m.userData.dz;
      m.geometry.attributes.position.needsUpdate = true;
      m.material.opacity = Math.max(0, m.userData.life * 0.6);
      if (m.userData.life <= 0) {
        this.shootingGroup.remove(m);
        m.geometry.dispose(); m.material.dispose();
        this.shootingStars.splice(i, 1);
      }
    }
  }

  dispose() {
    for (const m of [this.mainMesh, this.bgMesh, this.milkyWay]) {
      if (m) { this.scene.remove(m); m.geometry.dispose(); m.material.dispose(); }
    }
    this.scene.remove(this.highlightGroup);
    this.scene.remove(this.shootingGroup);
    this.scene.remove(this.nebulaGroup);
  }
}
