import * as THREE from 'three';
import { constellations } from '../data/constellations.js';
import { stars } from '../data/stars.js';
import { eqToCart } from '../data/skycalc.js';

const RADIUS = 400;
const GLOW_COLOR = new THREE.Color(0.5, 0.6, 1.0);

export class ConstellationLines {
  constructor(scene) {
    this.scene = scene;
    this.lines = {};
    this.activeLines = {};
    this.completed = new Set();
    this.flowingParticles = [];
    this.flowGroup = new THREE.Group();
    this.scene.add(this.flowGroup);
    this.build();
  }

  build() {
    for (const con of constellations) {
      if (!con.edges || con.edges.length === 0) continue;
      
      const positions = [];
      for (const [ai, bi] of con.edges) {
        const aIdx = con.stars[ai];
        const bIdx = con.stars[bi];
        const aStar = stars[aIdx];
        const bStar = stars[bIdx];
        if (!aStar || !bStar) continue;
        
        const p1 = eqToCart(aStar[1], aStar[2], RADIUS);
        const p2 = eqToCart(bStar[1], bStar[2], RADIUS);
        positions.push(p1[0], p1[1], p1[2]);
        positions.push(p2[0], p2[1], p2[2]);
      }

      const geom = new THREE.BufferGeometry();
      geom.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));

      // Main glowing line
      const mat = new THREE.LineBasicMaterial({
        color: 0x4a6aff,
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        linewidth: 1,
      });

      const line = new THREE.LineSegments(geom, mat);
      line.visible = false;
      this.scene.add(line);
      this.lines[con.id] = { line, mat, con, done: false };
    }
  }

  // Show constellation outline
  reveal(conId, starIndex) {
    const entry = this.lines[conId];
    if (!entry || entry.done) return;

    // Calculate how many edges to show based on progress
    const con = entry.con;
    const edgeCount = con.edges.length;
    const starPos = con.stars.indexOf(starIndex);
    if (starPos < 0) return;

    const showEdges = Math.min(starPos + 1, edgeCount);
    const positions = [];

    for (let i = 0; i < showEdges; i++) {
      const [ai, bi] = con.edges[i];
      const aIdx = con.stars[ai];
      const bIdx = con.stars[bi];
      const aStar = stars[aIdx];
      const bStar = stars[bIdx];
      if (!aStar || !bStar) continue;
      const p1 = eqToCart(aStar[1], aStar[2], RADIUS);
      const p2 = eqToCart(bStar[1], bStar[2], RADIUS);
      positions.push(p1[0], p1[1], p1[2]);
      positions.push(p2[0], p2[1], p2[2]);
    }

    entry.line.geometry.dispose();
    const newGeom = new THREE.BufferGeometry();
    newGeom.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    entry.line.geometry = newGeom;
    entry.line.visible = true;
    entry.mat.opacity = Math.min(1, 0.3 + (starPos / edgeCount) * 0.7);
  }

  // Mark constellation as completed
  complete(conId) {
    const entry = this.lines[conId];
    if (!entry) return;
    entry.done = true;
    entry.mat.opacity = 1;
    entry.mat.color.setHex(0x88bbff);
    this.completed.add(conId);
    this.spawnCompletionEffect(conId);
  }

  // Particle celebration on completion
  spawnCompletionEffect(conId) {
    const entry = this.lines[conId];
    if (!entry) return;
    const positions = entry.line.geometry.attributes.position.array;
    for (let i = 0; i < positions.length; i += 6) {
      for (let j = 0; j < 3; j++) {
        const px = positions[i] + (Math.random() - 0.5) * 20;
        const py = positions[i+1] + (Math.random() - 0.5) * 20;
        const pz = positions[i+2] + (Math.random() - 0.5) * 20;
        this.addFlowingParticle(px, py, pz, conId);
      }
    }
  }

  addFlowingParticle(x, y, z, conId) {
    const geom = new THREE.BufferGeometry();
    const pos = new Float32Array([x, y, z]);
    geom.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const mat = new THREE.PointsMaterial({
      color: 0x88bbff,
      size: 1.5,
      transparent: true,
      opacity: 0.6,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const mesh = new THREE.Points(geom, mat);
    mesh.userData = {
      conId,
      velocity: new THREE.Vector3(
        (Math.random() - 0.5) * 0.5,
        (Math.random() - 0.5) * 0.5,
        (Math.random() - 0.5) * 0.5
      ),
      life: 1.0,
      decay: 0.005 + Math.random() * 0.01
    };
    this.flowGroup.add(mesh);
    this.flowingParticles.push(mesh);
  }

  flowParticles(time) {
    for (let i = this.flowingParticles.length - 1; i >= 0; i--) {
      const p = this.flowingParticles[i];
      p.userData.life -= p.userData.decay;
      const pos = p.geometry.attributes.position.array;
      pos[0] += p.userData.velocity.x;
      pos[1] += p.userData.velocity.y;
      pos[2] += p.userData.velocity.z;
      p.geometry.attributes.position.needsUpdate = true;
      p.material.opacity = Math.max(0, p.userData.life * 0.6);
      p.scale.setScalar(0.5 + p.userData.life * 0.5);
      
      if (p.userData.life <= 0) {
        this.flowGroup.remove(p);
        p.geometry.dispose();
        p.material.dispose();
        this.flowingParticles.splice(i, 1);
      }
    }
  }

  update(time) {
    // Subtle pulse on lines
    for (const key in this.lines) {
      const entry = this.lines[key];
      if (entry.line.visible) {
        const pulse = 0.85 + 0.15 * Math.sin(time * 0.001 + entry.con.stars.length * 0.5);
        entry.mat.opacity = entry.done ? 1 : Math.min(entry.mat.opacity, 0.7 * pulse);
      }
    }
    this.flowParticles(time);
  }

  dispose() {
    for (const key in this.lines) {
      this.scene.remove(this.lines[key].line);
      this.lines[key].line.geometry.dispose();
      this.lines[key].mat.dispose();
    }
    this.scene.remove(this.flowGroup);
  }
}
