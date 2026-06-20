import * as THREE from 'three';
import { stars } from '../data/stars.js';
import { eqToCart } from '../data/skycalc.js';

const RADIUS = 500;

// Generate glow sprite texture from canvas
function createGlowTexture(size = 128) {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  const center = size / 2;
  const gradient = ctx.createRadialGradient(center, center, 0, center, center, center);
  gradient.addColorStop(0, 'rgba(255,255,255,1)');
  gradient.addColorStop(0.1, 'rgba(255,240,220,0.8)');
  gradient.addColorStop(0.3, 'rgba(200,210,255,0.3)');
  gradient.addColorStop(0.6, 'rgba(150,180,255,0.08)');
  gradient.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);
  return new THREE.CanvasTexture(canvas);
}

// Generate cross-flare sprite texture
function createFlareTexture(size = 64) {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  const cx = size / 2, cy = size / 2;
  const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, cx);
  grad.addColorStop(0, 'rgba(255,255,255,0.6)');
  grad.addColorStop(0.2, 'rgba(200,210,255,0.15)');
  grad.addColorStop(0.5, 'rgba(100,150,255,0.03)');
  grad.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);
  return new THREE.CanvasTexture(canvas);
}

export class StarField {
  constructor(scene, camera) {
    this.scene = scene;
    this.camera = camera;
    this.points = [];
    this.mesh = null;
    this.twinkleTime = 0;
    this.starObjects = []; // For raycaster interaction
    
    this.glowTex = createGlowTexture();
    this.flareTex = createFlareTexture();
    
    this.build();
  }

  build() {
    const positions = [];
    const colors = [];
    const sizes = [];
    const mags = [];
    const starIdx = [];

    for (let i = 0; i < stars.length; i++) {
      const s = stars[i];
      const [x, y, z] = eqToCart(s[1], s[2], RADIUS);
      positions.push(x, y, z);

      // Color based on spectral type (simplified)
      const spec = s[6] || 'A';
      const firstChar = spec.charAt(0);
      let r, g, b;
      if ('O'.includes(firstChar)) { r = 0.75; g = 0.80; b = 1.0; }     // Blue
      else if ('B'.includes(firstChar)) { r = 0.70; g = 0.80; b = 1.0; }
      else if ('A'.includes(firstChar)) { r = 0.90; g = 0.90; b = 1.0; } // White-blue
      else if ('F'.includes(firstChar)) { r = 1.0; g = 0.95; b = 0.85; } // Yellow-white
      else if ('G'.includes(firstChar)) { r = 1.0; g = 0.95; b = 0.70; } // Yellow
      else if ('K'.includes(firstChar)) { r = 1.0; g = 0.80; b = 0.55; } // Orange
      else if ('M'.includes(firstChar)) { r = 1.0; g = 0.65; b = 0.45; } // Red
      else { r = 0.95; g = 0.95; b = 0.95; }
      
      colors.push(r, g, b);

      // Size based on magnitude (brighter = larger)
      const brightness = Math.max(0.1, 1 - (s[3] + 1.46) / 7);
      const size = 0.5 + brightness * 4;
      sizes.push(size);
      mags.push(s[3]);
      starIdx.push(i);
    }

    const geom = new THREE.BufferGeometry();
    geom.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geom.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    geom.setAttribute('size', new THREE.Float32BufferAttribute(sizes, 1));
    geom.userData = { mags, starIdx };

    const material = new THREE.PointsMaterial({
      size: 3,
      map: this.glowTex,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      transparent: true,
      vertexColors: true,
      opacity: 0.95,
    });

    this.mesh = new THREE.Points(geom, material);
    this.mesh.userData.isStar = true;
    this.scene.add(this.mesh);

    // Store positions for raycasting
    this.positions = positions;
    this.starIdx = starIdx;
  }

  // Get star world position by index
  getStarPosition(index) {
    const i = index * 3;
    return new THREE.Vector3(this.positions[i], this.positions[i+1], this.positions[i+2]);
  }

  // Get interactive star objects for raycaster
  getInteractiveStars() {
    return [this.mesh];
  }

  // Get star index from intersection
  getStarIndex(intersect) {
    if (!intersect) return -1;
    const idx = intersect.index;
    return this.mesh.geometry.userData.starIdx[idx];
  }

  update(time) {
    this.twinkleTime = time;
    // Subtle rotation
    this.mesh.rotation.y = -time * 0.002;
  }

  dispose() {
    this.scene.remove(this.mesh);
    this.mesh.geometry.dispose();
    this.mesh.material.dispose();
  }
}
