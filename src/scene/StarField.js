import * as THREE from 'three';
import { stars } from '../data/stars.js';
import { eqToCart } from '../data/skycalc.js';

const RADIUS = 400;

// Generate 4-point star cross texture
function createStarTexture(size = 128) {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  const cx = size / 2, cy = size / 2;

  // Radial glow core
  const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, cx * 0.5);
  grad.addColorStop(0, 'rgba(255,255,255,1)');
  grad.addColorStop(0.15, 'rgba(255,240,220,0.7)');
  grad.addColorStop(0.4, 'rgba(200,210,255,0.2)');
  grad.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);

  // Four-point cross flare
  ctx.globalCompositeOperation = 'screen';
  const flareW = 2;
  for (let ang = 0; ang < 4; ang++) {
    const angle = ang * Math.PI / 2 + Math.PI / 4;
    const grad2 = ctx.createRadialGradient(cx, cy, 0, cx, cy, cx * 0.8);
    grad2.addColorStop(0, 'rgba(255,255,255,0.3)');
    grad2.addColorStop(0.5, 'rgba(200,220,255,0.08)');
    grad2.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(angle);
    ctx.scale(1, 0.08);
    ctx.fillStyle = grad2;
    ctx.beginPath();
    ctx.arc(0, 0, cx * 0.9, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.needsUpdate = true;
  return tex;
}

function createBackgroundTexture(size = 32) {
  const canvas = document.createElement('canvas');
  canvas.width = size; canvas.height = size;
  const ctx = canvas.getContext('2d');
  const grad = ctx.createRadialGradient(size/2, size/2, 0, size/2, size/2, size/2);
  grad.addColorStop(0, 'rgba(255,255,255,0.6)');
  grad.addColorStop(0.3, 'rgba(200,210,255,0.15)');
  grad.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);
  return new THREE.CanvasTexture(canvas);
}

export class StarField {
  constructor(scene, camera) {
    this.scene = scene;
    this.camera = camera;
    this.mainMesh = null;
    this.bgMesh = null;
    this.milkyWay = null;
    this.positions = [];
    this.starIdx = [];
    this.twinklePhases = [];
    this.bgTwinklePhases = [];
    this.glowTex = createStarTexture();
    this.bgTex = createBackgroundTexture();
    this.build();
  }

  build() {
    this.buildCatalogStars();
    this.buildBackgroundStars();
    this.buildMilkyWay();
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
      const firstChar = spec.charAt(0);
      let r, g, b;
      if ('O'.includes(firstChar)||'B'.includes(firstChar)) { r=0.75; g=0.80; b=1.0; }
      else if ('A'.includes(firstChar)) { r=0.90; g=0.90; b=1.0; }
      else if ('F'.includes(firstChar)) { r=1.0; g=0.95; b=0.85; }
      else if ('G'.includes(firstChar)) { r=1.0; g=0.95; b=0.70; }
      else if ('K'.includes(firstChar)) { r=1.0; g=0.80; b=0.55; }
      else if ('M'.includes(firstChar)) { r=1.0; g=0.65; b=0.45; }
      else { r=0.95; g=0.95; b=0.95; }

      const brightness = Math.max(0.1, 1 - (s[3] + 1.46) / 7);
      colors.push(r * (0.7 + 0.3 * brightness), g * (0.7 + 0.3 * brightness), b * (0.7 + 0.3 * brightness));
      starIdx.push(i);
      phases.push(Math.random() * Math.PI * 2);
    }

    const geom = new THREE.BufferGeometry();
    geom.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geom.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    geom.userData = { starIdx };

    const mat = new THREE.PointsMaterial({
      size: 10,
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
  }

  buildBackgroundStars() {
    const count = 2500;
    const positions = [];
    const phases = [];
    for (let i = 0; i < count; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = RADIUS + (Math.random() - 0.5) * 50;
      positions.push(
        r * Math.sin(phi) * Math.cos(theta),
        r * Math.cos(phi),
        r * Math.sin(phi) * Math.sin(theta)
      );
      phases.push(Math.random() * Math.PI * 2);
    }

    const geom = new THREE.BufferGeometry();
    geom.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));

    const mat = new THREE.PointsMaterial({
      size: 2,
      map: this.bgTex,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      transparent: true,
      opacity: 0.4,
      color: 0x8899bb,
      sizeAttenuation: true,
    });

    this.bgMesh = new THREE.Points(geom, mat);
    this.scene.add(this.bgMesh);
    this.bgTwinklePhases = phases;
    this.bgPositions = positions;
  }

  buildMilkyWay() {
    const count = 4000;
    const positions = [];
    const sizes = [];
    const colors = [];

    for (let i = 0; i < count; i++) {
      // Milky way is a disc-like band
      const spread = 0.15 + Math.random() * 0.3;
      const angle = Math.random() * Math.PI * 2;
      const bandOffset = (Math.random() - 0.5) * spread;
      const dist = RADIUS * 0.9 + Math.random() * RADIUS * 0.2;

      const x = dist * Math.cos(angle);
      const z = dist * Math.sin(angle);
      const y = dist * bandOffset * 1.5;

      positions.push(x, y, z);
      const bright = 0.1 + Math.random() * 0.15;
      colors.push(bright, bright * 1.1, bright * 1.3);
      sizes.push(1 + Math.random() * 3);
    }

    const geom = new THREE.BufferGeometry();
    geom.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geom.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

    const mat = new THREE.PointsMaterial({
      size: 3,
      map: this.bgTex,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      transparent: true,
      opacity: 0.25,
      vertexColors: true,
      sizeAttenuation: true,
    });

    this.milkyWay = new THREE.Points(geom, mat);
    this.scene.add(this.milkyWay);
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
    // Twinkle: subtle opacity pulse on main stars
    this.mainMesh.material.opacity = 0.85 + 0.1 * Math.sin(t * 0.5 + 1.3);
    // Background star twinkle
    this.bgMesh.material.opacity = 0.3 + 0.15 * Math.sin(t * 0.3 + 2.1);
    // Milky Way slow rotation
    this.milkyWay.rotation.x = Math.sin(t * 0.02) * 0.05;
  }

  dispose() {
    for (const m of [this.mainMesh, this.bgMesh, this.milkyWay]) {
      if (m) { this.scene.remove(m); m.geometry.dispose(); m.material.dispose(); }
    }
  }
}
