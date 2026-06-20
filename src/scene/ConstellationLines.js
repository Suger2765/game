import * as THREE from 'three';
import { constellations } from '../data/constellations.js';
import { stars } from '../data/stars.js';
import { eqToCart } from '../data/skycalc.js';

const RADIUS = 400;

export class ConstellationLines {
  constructor(scene) {
    this.scene = scene;
    this.lines = {};
    this.ghostLines = {};
    this.activeConId = null;
    this.completed = new Set();
    this.flowingParticles = [];
    this.flowGroup = new THREE.Group();
    this.scene.add(this.flowGroup);
    this.guideParticles = [];
    this.guideGroup = new THREE.Group();
    this.scene.add(this.guideGroup);
    this.build();
  }

  build() {
    for (const con of constellations) {
      if (!con.edges || con.edges.length === 0) continue;
      const positions = [];
      for (const [ai, bi] of con.edges) {
        const aStar = stars[con.stars[ai]];
        const bStar = stars[con.stars[bi]];
        if (!aStar || !bStar) continue;
        const p1 = eqToCart(aStar[1], aStar[2], RADIUS);
        const p2 = eqToCart(bStar[1], bStar[2], RADIUS);
        positions.push(p1[0], p1[1], p1[2], p2[0], p2[1], p2[2]);
      }

      const geom = new THREE.BufferGeometry();
      geom.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
      const mat = new THREE.LineBasicMaterial({
        color: 0x4a6aff, transparent: true, opacity: 0,
        blending: THREE.AdditiveBlending, depthWrite: false
      });
      const line = new THREE.LineSegments(geom, mat);
      line.visible = false;
      this.scene.add(line);
      this.lines[con.id] = { line, mat, con, done: false };

      const ghostMat = new THREE.LineBasicMaterial({
        color: 0x3a5acc, transparent: true, opacity: 0,
        blending: THREE.AdditiveBlending, depthWrite: false
      });
      const ghostLine = new THREE.LineSegments(geom.clone(), ghostMat);
      ghostLine.visible = false;
      this.scene.add(ghostLine);
      this.ghostLines[con.id] = { line: ghostLine, mat: ghostMat, con };
    }
  }

  reveal(conId, starIndex) {
    if (this.activeConId !== conId) {
      this.clearAll();
      this.activeConId = conId;
    }
    const entry = this.lines[conId];
    if (!entry || entry.done) return;
    const con = entry.con;
    const starPos = con.stars.indexOf(starIndex);
    if (starPos < 0) return;

    const ghostEntry = this.ghostLines[conId];
    if (ghostEntry && !ghostEntry.line.visible) {
      ghostEntry.line.visible = true;
      ghostEntry.mat.opacity = 0.1;
    }

    const edgeCount = con.edges.length;
    const showEdges = Math.min(starPos + 1, edgeCount);
    const positions = [];
    for (let i = 0; i < showEdges; i++) {
      const [ai, bi] = con.edges[i];
      const aStar = stars[con.stars[ai]];
      const bStar = stars[con.stars[bi]];
      if (!aStar || !bStar) continue;
      const p1 = eqToCart(aStar[1], aStar[2], RADIUS);
      const p2 = eqToCart(bStar[1], bStar[2], RADIUS);
      positions.push(p1[0], p1[1], p1[2], p2[0], p2[1], p2[2]);
    }
    entry.line.geometry.dispose();
    const newGeom = new THREE.BufferGeometry();
    newGeom.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    entry.line.geometry = newGeom;
    entry.line.visible = true;
    entry.mat.opacity = Math.min(1, 0.3 + (starPos / edgeCount) * 0.7);

    this.flowFromStar(conId, starIndex);
    this.guideToNextStar(conId, starPos);
    this.starPulse(starIndex);
  }

  starPulse(starIndex) {
    const pos = this.lines[Object.keys(this.lines)[0]];
    if (!pos) return;
    for (const key in this.lines) {
      const entry = this.lines[key];
      if (!entry.line.visible) continue;
      const conStars = entry.con.stars;
      const idx3 = conStars.indexOf(starIndex);
      if (idx3 < 0) continue;
      const starPos = eqToCart(stars[starIndex][1], stars[starIndex][2], RADIUS);
      const geom = new THREE.BufferGeometry();
      const positions = new Float32Array([starPos[0], starPos[1], starPos[2]]);
      geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      const mat = new THREE.PointsMaterial({
        color: 0xffffff, size: 60, transparent: true, opacity: 0.6,
        blending: THREE.AdditiveBlending, depthWrite: false
      });
      const mesh = new THREE.Points(geom, mat);
      mesh.userData = { life: 1, decay: 0.03 };
      this.flowGroup.add(mesh);
      this.flowingParticles.push(mesh);
      break;
    }
  }

  flowFromStar(conId, starIndex) {
    const entry = this.lines[conId];
    if (!entry) return;
    const con = entry.con;
    const starPos = con.stars.indexOf(starIndex);
    if (starPos < 0) return;

    const edgesFrom = [];
    for (const [ai, bi] of con.edges) {
      if (ai === starPos || bi === starPos) edgesFrom.push([ai, bi]);
    }
    for (const [ai, bi] of edgesFrom) {
      const targetIdx = ai === starPos ? bi : ai;
      if (targetIdx >= con.stars.length) continue;
      const tStar = stars[con.stars[targetIdx]];
      if (!tStar) continue;
      const p2 = eqToCart(tStar[1], tStar[2], RADIUS);
      const src = new THREE.Vector3(this._starPos(starIndex));
      const dst = new THREE.Vector3(p2[0], p2[1], p2[2]);
      for (let j = 0; j < 5; j++) {
        const t = j / 5;
        const px = src.x + (dst.x - src.x) * t + (Math.random() - 0.5) * 10;
        const py = src.y + (dst.y - src.y) * t + (Math.random() - 0.5) * 10;
        const pz = src.z + (dst.z - src.z) * t + (Math.random() - 0.5) * 10;
        const geom = new THREE.BufferGeometry();
        const pos = new Float32Array([px, py, pz]);
        geom.setAttribute('position', new THREE.BufferAttribute(pos, 3));
        const mat = new THREE.PointsMaterial({
          color: 0x88bbff, size: 2, transparent: true, opacity: 0.7,
          blending: THREE.AdditiveBlending, depthWrite: false
        });
        const mesh = new THREE.Points(geom, mat);
        mesh.userData = {
          target: dst.clone(), speed: 1 + Math.random(),
          life: 1, decay: 0.01 + Math.random() * 0.01
        };
        this.flowGroup.add(mesh);
        this.flowingParticles.push(mesh);
      }
    }
  }

  guideToNextStar(conId, currentPos) {
    this.clearGuideParticles();
    const entry = this.lines[conId];
    if (!entry) return;
    const con = entry.con;
    if (currentPos + 1 >= con.stars.length) return;
    const nextIdx = con.stars[currentPos + 1];
    const dst = this._starPos(nextIdx);
    const count = 20;
    for (let i = 0; i < count; i++) {
      const geom = new THREE.BufferGeometry();
      const pos = new Float32Array([dst[0] + (Math.random() - 0.5) * 8, dst[1] + (Math.random() - 0.5) * 8, dst[2] + (Math.random() - 0.5) * 8]);
      geom.setAttribute('position', new THREE.BufferAttribute(pos, 3));
      const mat = new THREE.PointsMaterial({
        color: 0xffdd44, size: 1.5, transparent: true, opacity: 0,
        blending: THREE.AdditiveBlending, depthWrite: false
      });
      const mesh = new THREE.Points(geom, mat);
      mesh.userData = { phase: Math.random() * Math.PI * 2, life: 1 };
      this.guideGroup.add(mesh);
      this.guideParticles.push(mesh);
    }
  }

  clearGuideParticles() {
    for (const m of this.guideParticles) {
      this.guideGroup.remove(m);
      m.geometry.dispose(); m.material.dispose();
    }
    this.guideParticles = [];
  }

  complete(conId) {
    const entry = this.lines[conId];
    if (!entry) return;
    entry.done = true;
    entry.mat.color.setHex(0xffd700);
    entry.mat.opacity = 1;
    this.completed.add(conId);
    const ghostEntry = this.ghostLines[conId];
    if (ghostEntry) { ghostEntry.line.visible = false; ghostEntry.mat.opacity = 0; }
    this.clearGuideParticles();
    this.spawnCompletionEffect(conId);
  }

  spawnCompletionEffect(conId) {
    const entry = this.lines[conId];
    if (!entry) return;
    const positions = entry.line.geometry.attributes.position.array;
    const burst = (wave) => {
      for (let i = 0; i < positions.length; i += 6) {
        for (let j = 0; j < 3; j++) {
          const px = positions[i] + (Math.random() - 0.5) * wave * 5;
          const py = positions[i+1] + (Math.random() - 0.5) * wave * 5;
          const pz = positions[i+2] + (Math.random() - 0.5) * wave * 5;
          const geom = new THREE.BufferGeometry();
          const pos = new Float32Array([px, py, pz]);
          geom.setAttribute('position', new THREE.BufferAttribute(pos, 3));
          const mat = new THREE.PointsMaterial({
            color: new THREE.Color().setHSL(0.12 + Math.random() * 0.08, 0.8, 0.6),
            size: 1 + Math.random() * 2, transparent: true, opacity: 0.8,
            blending: THREE.AdditiveBlending, depthWrite: false
          });
          const mesh = new THREE.Points(geom, mat);
          mesh.userData = {
            velocity: new THREE.Vector3((Math.random() - 0.5) * 2 * wave, (Math.random() - 0.5) * 2 * wave, (Math.random() - 0.5) * 2 * wave),
            life: 1, decay: 0.003 + Math.random() * 0.005
          };
          this.flowGroup.add(mesh);
          this.flowingParticles.push(mesh);
        }
      }
    };
    for (let w = 1; w <= 3; w++) setTimeout(() => burst(w), (w - 1) * 300);
  }

  clearAll() {
    for (const key in this.lines) {
      const entry = this.lines[key];
      entry.line.visible = false;
      entry.mat.opacity = 0;
    }
    for (const key in this.ghostLines) {
      const entry = this.ghostLines[key];
      entry.line.visible = false;
      entry.mat.opacity = 0;
    }
    this.clearGuideParticles();
    this.activeConId = null;
  }

  _starPos(index) {
    const s = stars[index];
    if (!s) return [0, 0, 0];
    return eqToCart(s[1], s[2], RADIUS);
  }

  flowParticles(time) {
    for (let i = this.flowingParticles.length - 1; i >= 0; i--) {
      const p = this.flowingParticles[i];
      p.userData.life -= p.userData.decay;
      const pos = p.geometry.attributes.position.array;
      if (p.userData.target) {
        const dir = p.userData.target.clone().sub(new THREE.Vector3(pos[0], pos[1], pos[2]));
        if (dir.length() > 1) { dir.normalize(); pos[0] += dir.x * p.userData.speed; pos[1] += dir.y * p.userData.speed; pos[2] += dir.z * p.userData.speed; }
      } else if (p.userData.velocity) {
        pos[0] += p.userData.velocity.x; pos[1] += p.userData.velocity.y; pos[2] += p.userData.velocity.z;
        p.userData.velocity.multiplyScalar(0.98);
      }
      p.geometry.attributes.position.needsUpdate = true;
      p.material.opacity = Math.max(0, p.userData.life * 0.6);
      p.scale.setScalar(0.5 + p.userData.life * 0.5);
      if (p.userData.life <= 0) {
        this.flowGroup.remove(p);
        p.geometry.dispose(); p.material.dispose();
        this.flowingParticles.splice(i, 1);
      }
    }
  }

  update(time) {
    const t = time * 0.001;
    for (const key in this.lines) {
      const entry = this.lines[key];
      if (entry.line.visible && !entry.done) {
        const pulse = 0.85 + 0.15 * Math.sin(t + entry.con.stars.length * 0.5);
        entry.mat.opacity = Math.min(entry.mat.opacity, 0.7 * pulse);
      }
      if (entry.done) {
        const glow = 0.8 + 0.2 * Math.sin(t * 0.5 + key.charCodeAt(0));
        entry.mat.opacity = glow;
      }
    }
    for (const key in this.ghostLines) {
      const entry = this.ghostLines[key];
      if (entry.line.visible) {
        entry.mat.opacity = 0.05 + 0.05 * Math.sin(t * 0.3 + key.charCodeAt(0));
      }
    }
    const sec = time * 0.001;
    for (const m of this.guideParticles) {
      const phase = m.userData.phase;
      const opacity = 0.3 + 0.3 * Math.sin(sec * 3 + phase);
      m.material.opacity = opacity;
      const s = 0.8 + 0.4 * Math.sin(sec * 3 + phase);
      m.scale.setScalar(s);
    }
    this.flowParticles(time);
  }

  dispose() {
    for (const key in this.lines) {
      this.scene.remove(this.lines[key].line);
      this.lines[key].line.geometry.dispose();
      this.lines[key].mat.dispose();
    }
    for (const key in this.ghostLines) {
      this.scene.remove(this.ghostLines[key].line);
      this.ghostLines[key].line.geometry.dispose();
      this.ghostLines[key].mat.dispose();
    }
    this.scene.remove(this.flowGroup);
    this.scene.remove(this.guideGroup);
  }
}
