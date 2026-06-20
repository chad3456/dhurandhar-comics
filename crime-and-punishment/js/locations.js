// locations.js — 3D geometry for each location
'use strict';

// Simple particle fountain helper
class Fountain {
  constructor(group, x, z) {
    const count = 200;
    const geo = new THREE.BufferGeometry();
    this.pos = new Float32Array(count * 3);
    this.vel = [];
    this.origin = { x, z };
    for (let i = 0; i < count; i++) {
      this.resetParticle(i, true);
    }
    geo.setAttribute('position', new THREE.BufferAttribute(this.pos, 3));
    const mat = new THREE.PointsMaterial({ color: 0x99bbdd, size: 0.06, transparent: true, opacity: 0.7 });
    this.points = new THREE.Points(geo, mat);
    this.count = count;
    group.add(this.points);
  }
  resetParticle(i, init) {
    this.pos[i * 3] = this.origin.x;
    this.pos[i * 3 + 1] = init ? Math.random() * 1.2 + 0.6 : 0.7;
    this.pos[i * 3 + 2] = this.origin.z;
    const a = Math.random() * Math.PI * 2;
    const s = 0.4 + Math.random() * 0.4;
    this.vel[i] = { x: Math.cos(a) * 0.3, y: 1.6 + Math.random() * 0.8, z: Math.sin(a) * 0.3, s };
  }
  update(dt) {
    for (let i = 0; i < this.count; i++) {
      const v = this.vel[i];
      this.pos[i * 3] += v.x * dt;
      this.pos[i * 3 + 1] += v.y * dt;
      this.pos[i * 3 + 2] += v.z * dt;
      v.y -= 4.5 * dt;
      if (this.pos[i * 3 + 1] < 0.6) this.resetParticle(i, false);
    }
    this.points.geometry.attributes.position.needsUpdate = true;
  }
}

const Locations = {
  mat(color, opts) {
    return new THREE.MeshLambertMaterial(Object.assign({ color }, opts || {}));
  },

  box(w, h, d, color, opts) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), this.mat(color, opts));
    m.castShadow = true; m.receiveShadow = true;
    return m;
  },

  floor(group, w, d, color) {
    const f = new THREE.Mesh(new THREE.PlaneGeometry(w, d), this.mat(color));
    f.rotation.x = -Math.PI / 2;
    f.receiveShadow = true;
    group.add(f);
    return f;
  },

  wall(group, w, h, color, x, y, z, ry) {
    const wall = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshLambertMaterial({ color, side: THREE.DoubleSide }));
    wall.position.set(x, y, z);
    wall.rotation.y = ry || 0;
    wall.receiveShadow = true;
    group.add(wall);
    return wall;
  },

  flickerLight(world, group, color, x, y, z, base, amp, distance) {
    const light = new THREE.PointLight(color, base, distance || 6);
    light.position.set(x, y, z);
    group.add(light);
    world.animatedLights.push({ light, base, amp, phase: Math.random() * 6 });
    // glow sphere
    const glow = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 8), new THREE.MeshBasicMaterial({ color }));
    glow.position.set(x, y, z);
    group.add(glow);
    return light;
  },

  build(name, world) {
    const fn = 'build_' + name;
    return this[fn](world);
  },

  // ---------- 1. GARRET ----------
  build_garret(world) {
    const g = new THREE.Group();
    this.floor(g, 4, 3, 0x3a3320);
    // ceiling (low)
    const ceil = this.box(4, 0.05, 3, 0x2a2418); ceil.position.set(0, 2.2, 0); g.add(ceil);
    // walls dark yellow-beige
    this.wall(g, 4, 2.2, 0xc4a45a, 0, 1.1, -1.5, 0);
    this.wall(g, 3, 2.2, 0xb89850, 2, 1.1, 0, Math.PI / 2);
    this.wall(g, 3, 2.2, 0xb89850, -2, 1.1, 0, Math.PI / 2);
    this.wall(g, 4, 2.2, 0xa88840, 0, 1.1, 1.5, 0);

    // tiny window with moonlight beam
    const win = this.box(0.5, 0.6, 0.02, 0x223044, { emissive: 0x223a55, emissiveIntensity: 0.8 });
    win.position.set(-1, 1.5, -1.48); g.add(win);
    const beam = new THREE.SpotLight(0xc8d8ff, 1.2, 6, 0.5, 0.5);
    beam.position.set(-1, 1.5, -1.4); beam.target.position.set(0.5, 0, 0.5);
    g.add(beam); g.add(beam.target);

    // bed
    const bed = this.box(1.6, 0.3, 0.8, 0x4a3a2a); bed.position.set(-1.0, 0.15, 0.9); g.add(bed);
    const pillow = this.box(0.5, 0.12, 0.4, 0x9a8a70); pillow.position.set(-1.6, 0.32, 0.9); g.add(pillow);

    // desk + chair
    const desk = this.box(0.9, 0.05, 0.5, 0x5a4530); desk.position.set(1.3, 0.7, -0.9); g.add(desk);
    for (const [dx, dz] of [[0.9, -1.1], [0.9, -0.7], [1.7, -1.1], [1.7, -0.7]]) {
      const leg = this.box(0.05, 0.7, 0.05, 0x3a2a1a); leg.position.set(dx, 0.35, dz); g.add(leg);
    }
    const chair = this.box(0.4, 0.05, 0.4, 0x4a3520); chair.position.set(1.3, 0.45, -0.4); g.add(chair);

    // pile of papers (interactable)
    const papers = new THREE.Group();
    for (let i = 0; i < 5; i++) {
      const p = this.box(0.25, 0.01, 0.18, 0xd8d0b8);
      p.position.set(1.3 + (Math.random() - 0.5) * 0.1, 0.74 + i * 0.012, -0.9 + (Math.random() - 0.5) * 0.1);
      p.rotation.y = Math.random() * 0.5;
      papers.add(p);
    }
    g.add(papers);
    world.registerInteractable(papers, 'examine', 'Examine the article', 'papers');

    // flickering candle
    this.flickerLight(world, g, 0xffb347, 1.0, 0.85, -0.9, 0.55, 0.18, 4);

    // door (interactable -> streets)
    const door = this.box(0.9, 1.9, 0.08, 0x3a2a1a, { emissive: 0x000000 });
    door.position.set(1.9, 0.95, 0.8); door.rotation.y = Math.PI / 2; g.add(door);
    world.registerInteractable(door, 'enter', 'Leave the garret', 'door_streets');

    return { group: g, spawn: { x: 0, y: 1.6, z: 0.6 }, yaw: 0,
      bounds: { minX: -1.6, maxX: 1.6, minZ: -1.1, maxZ: 1.1 }, moon: 0.15 };
  },

  // ---------- 2. STREETS ----------
  build_streets(world) {
    const g = new THREE.Group();
    this.floor(g, 60, 60, 0x2a2a2a);
    // central street strip
    const strip = new THREE.Mesh(new THREE.PlaneGeometry(6, 50), this.mat(0x202020));
    strip.rotation.x = -Math.PI / 2; strip.position.y = 0.01; g.add(strip);

    // building facades left/right with lit windows
    for (let side = -1; side <= 1; side += 2) {
      for (let i = 0; i < 6; i++) {
        const h = 6 + Math.random() * 4;
        const b = this.box(4, h, 5, 0x1c1c24);
        b.position.set(side * 5.5, h / 2, -12 + i * 5); g.add(b);
        // windows
        for (let r = 0; r < 3; r++) {
          for (let c = 0; c < 2; c++) {
            const lit = Math.random() > 0.5;
            const win = this.box(0.6, 0.8, 0.05, lit ? 0xffcc66 : 0x111118,
              { emissive: lit ? 0xffaa33 : 0x000000, emissiveIntensity: lit ? 0.9 : 0 });
            win.position.set(side * (5.5 - side * 2.05), 1.5 + r * 1.6, -13 + i * 5 + c * 1.4 - 0.7);
            g.add(win);
          }
        }
      }
    }

    // gas lamps
    for (let i = 0; i < 8; i++) {
      const z = -12 + i * 4;
      const side = i % 2 === 0 ? -1 : 1;
      const x = side * 2.4;
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.07, 3, 8), this.mat(0x1a1a1a));
      pole.position.set(x, 1.5, z); g.add(pole);
      const lampGlow = new THREE.Mesh(new THREE.SphereGeometry(0.14, 10, 10), new THREE.MeshBasicMaterial({ color: 0xffb347 }));
      lampGlow.position.set(x, 3.05, z); g.add(lampGlow);
      const pl = new THREE.PointLight(0xffb347, 1.5, 8);
      pl.position.set(x, 3.05, z); g.add(pl);
      world.animatedLights.push({ light: pl, base: 1.4, amp: 0.12, phase: Math.random() * 6 });
    }

    world.createRain();

    // pawnbroker door at far end
    const door = this.box(1.2, 2.2, 0.1, 0x2a1a12, { emissive: 0x110800 });
    door.position.set(0, 1.1, -13); g.add(door);
    world.registerInteractable(door, 'enter', 'Enter the building', 'door_pawnbroker');

    // a sign to examine
    const sign = this.box(0.8, 0.4, 0.05, 0x6a5030, { emissive: 0x110800 });
    sign.position.set(1.2, 2.4, -13); g.add(sign);
    world.registerInteractable(sign, 'examine', 'Read the sign', 'street_sign');

    return { group: g, spawn: { x: 0, y: 1.6, z: 8 }, yaw: Math.PI,
      bounds: { minX: -2.2, maxX: 2.2, minZ: -11, maxZ: 12 }, moon: 0.35 };
  },

  // ---------- 3. PAWNBROKER ----------
  build_pawnbroker(world) {
    const g = new THREE.Group();
    this.floor(g, 5, 4, 0x2a2218);
    const ceil = this.box(5, 0.05, 4, 0x1a160e); ceil.position.set(0, 2.4, 0); g.add(ceil);
    this.wall(g, 5, 2.4, 0x4a3a28, 0, 1.2, -2, 0);
    this.wall(g, 4, 2.4, 0x42341f, 2.5, 1.2, 0, Math.PI / 2);
    this.wall(g, 4, 2.4, 0x42341f, -2.5, 1.2, 0, Math.PI / 2);
    this.wall(g, 5, 2.4, 0x3a2c1a, 0, 1.2, 2, 0);

    // clutter boxes
    for (let i = 0; i < 12; i++) {
      const s = 0.2 + Math.random() * 0.4;
      const b = this.box(s, s, s, 0x3a2e1c);
      b.position.set((Math.random() - 0.5) * 4, s / 2, (Math.random() - 0.5) * 3);
      b.rotation.y = Math.random();
      g.add(b);
    }
    // a small cabinet
    const cab = this.box(0.8, 1.2, 0.4, 0x4a3520); cab.position.set(-2, 0.6, -1.5); g.add(cab);

    // green lamp
    const lamp = new THREE.PointLight(0x88ff44, 0.7, 4);
    lamp.position.set(1.4, 1.0, -1.4); g.add(lamp);
    const lampGlow = new THREE.Mesh(new THREE.SphereGeometry(0.1, 10, 10), new THREE.MeshBasicMaterial({ color: 0x88ff44 }));
    lampGlow.position.set(1.4, 1.0, -1.4); g.add(lampGlow);
    const lampBase = this.box(0.15, 0.4, 0.15, 0x223322); lampBase.position.set(1.4, 0.7, -1.4); g.add(lampBase);

    // axe on the floor (prop, interactable)
    const axe = new THREE.Group();
    const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.7, 8), this.mat(0x5a3a1a));
    handle.rotation.z = Math.PI / 2; axe.add(handle);
    const head = this.box(0.18, 0.22, 0.04, 0x888892, { emissive: 0x222228 });
    head.position.set(0.35, 0, 0); axe.add(head);
    axe.position.set(0.5, 0.06, 1.2);
    g.add(axe);
    world.registerInteractable(axe, 'examine', 'Take the axe', 'axe');

    // pawnbroker character
    const alyona = Characters.create('alyona');
    alyona.group.position.set(-1.2, 0, -1.0);
    g.add(alyona.group);
    world.registerInteractable(alyona.group, 'talk', 'Speak to Alyona', { npc: 'alyona' });

    // door back to streets
    const door = this.box(1.0, 2.0, 0.08, 0x2a1c10, { emissive: 0x000000 });
    door.position.set(0, 1.0, 1.95); g.add(door);
    world.registerInteractable(door, 'enter', 'Leave', 'door_streets');

    return { group: g, spawn: { x: 0, y: 1.6, z: 1.3 }, yaw: Math.PI,
      bounds: { minX: -2.1, maxX: 2.1, minZ: -1.6, maxZ: 1.6 }, moon: 0.1 };
  },

  // ---------- 4. HAYMARKET ----------
  build_haymarket(world) {
    const g = new THREE.Group();
    this.floor(g, 50, 50, 0x6a6258);
    // circular pattern
    const ring = new THREE.Mesh(new THREE.RingGeometry(4, 8, 48), this.mat(0x55504a));
    ring.rotation.x = -Math.PI / 2; ring.position.y = 0.02; g.add(ring);

    // harsh daytime — handled via ambient/moon in world; add a sun
    const sun = new THREE.DirectionalLight(0xfff2d8, 0.9);
    sun.position.set(8, 14, 6); sun.castShadow = true; g.add(sun);
    g.add(new THREE.HemisphereLight(0xaab8cc, 0x554433, 0.5));

    // market stalls
    const clothColors = [0x8b1a1a, 0x1a5a8b, 0x5a8b1a, 0x8b6a1a, 0x6a1a8b];
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      const x = Math.cos(a) * 6, z = Math.sin(a) * 6;
      const stall = this.box(1.2, 1.0, 1.0, 0x6a5230); stall.position.set(x, 0.5, z); g.add(stall);
      const top = this.box(1.5, 0.1, 1.3, clothColors[i % clothColors.length]); top.position.set(x, 1.3, z); g.add(top);
      for (const [ox, oz] of [[-0.6, -0.5], [0.6, -0.5], [-0.6, 0.5], [0.6, 0.5]]) {
        const post = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 1.3, 6), this.mat(0x3a2a1a));
        post.position.set(x + ox, 0.65, z + oz); g.add(post);
      }
    }

    // crowd of static figures
    for (let i = 0; i < 18; i++) {
      const fig = Characters.create('crowd');
      const a = Math.random() * Math.PI * 2;
      const r = 2 + Math.random() * 6;
      fig.group.position.set(Math.cos(a) * r, 0, Math.sin(a) * r);
      fig.group.rotation.y = Math.random() * Math.PI * 2;
      g.add(fig.group);
    }

    // fountain in center
    const basin = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.4, 0.6, 24), this.mat(0x55504a));
    basin.position.set(0, 0.3, 0); g.add(basin);
    const pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.2, 1.0, 12), this.mat(0x6a655a));
    pillar.position.set(0, 0.9, 0); g.add(pillar);
    world.fountain = new Fountain(g, 0, 0);

    // confession spot (interactable — Raskolnikov kneels)
    const spot = this.box(0.6, 0.05, 0.6, 0x8b6a3a, { emissive: 0x221100 });
    spot.position.set(0, 0.03, 3); g.add(spot);
    world.registerInteractable(spot, 'examine', 'Kneel and kiss the earth', 'haymarket_kneel');

    // exit to streets
    const arch = this.box(2.0, 0.3, 0.3, 0x4a3a2a, { emissive: 0x000000 });
    arch.position.set(0, 3, -9); g.add(arch);
    const post1 = this.box(0.3, 3, 0.3, 0x4a3a2a); post1.position.set(-1, 1.5, -9); g.add(post1);
    const post2 = this.box(0.3, 3, 0.3, 0x4a3a2a); post2.position.set(1, 1.5, -9); g.add(post2);
    const gate = this.box(1.6, 1.8, 0.1, 0x3a2c1c, { emissive: 0x000000 });
    gate.position.set(0, 0.9, -8.9); g.add(gate);
    world.registerInteractable(gate, 'enter', 'Leave the square', 'door_streets');

    return { group: g, spawn: { x: 0, y: 1.6, z: 7 }, yaw: Math.PI,
      bounds: { minX: -8, maxX: 8, minZ: -8, maxZ: 8 }, moon: 0.0 };
  },

  // ---------- 5. POLICE / PORFIRY ----------
  build_police(world) {
    const g = new THREE.Group();
    this.floor(g, 5, 5, 0x2a2226);
    const ceil = this.box(5, 0.05, 5, 0x201820); ceil.position.set(0, 2.6, 0); g.add(ceil);
    this.wall(g, 5, 2.6, 0x5a4248, 0, 1.3, -2.5, 0);
    this.wall(g, 5, 2.6, 0x523a40, 2.5, 1.3, 0, Math.PI / 2);
    this.wall(g, 5, 2.6, 0x523a40, -2.5, 1.3, 0, Math.PI / 2);
    this.wall(g, 5, 2.6, 0x4a3238, 0, 1.3, 2.5, 0);

    // intimidating red light
    const red = new THREE.PointLight(0x8b1a1a, 1.4, 8);
    red.position.set(0, 2.2, 0); g.add(red);
    g.add(new THREE.AmbientLight(0x3a1a1a, 0.3));

    // desk + two chairs
    const desk = this.box(1.6, 0.08, 0.8, 0x4a3525); desk.position.set(0, 0.8, -1); g.add(desk);
    for (const [dx, dz] of [[-0.7, -1.3], [0.7, -1.3], [-0.7, -0.7], [0.7, -0.7]]) {
      const leg = this.box(0.06, 0.8, 0.06, 0x2a1c12); leg.position.set(dx, 0.4, dz); g.add(leg);
    }
    const chair1 = this.box(0.45, 0.05, 0.45, 0x3a2c1c); chair1.position.set(0, 0.5, 0.2); g.add(chair1);
    const chair2 = this.box(0.45, 0.05, 0.45, 0x3a2c1c); chair2.position.set(-0.6, 0.5, -1.8); g.add(chair2);

    // maps/papers on wall
    for (let i = 0; i < 4; i++) {
      const map = this.box(0.7, 0.9, 0.02, 0x9a958a);
      map.position.set(-1.6 + i * 1.0, 1.7, -2.46); g.add(map);
    }
    // documents on desk (interactable)
    const docs = this.box(0.4, 0.02, 0.3, 0xd8d2c0);
    docs.position.set(0.4, 0.85, -1); g.add(docs);
    world.registerInteractable(docs, 'examine', 'Examine the case file', 'police_docs');

    // Porfiry
    const porfiry = Characters.create('porfiry');
    porfiry.group.position.set(0.6, 0, -1.8);
    porfiry.group.rotation.y = Math.PI;
    g.add(porfiry.group);
    world.registerInteractable(porfiry.group, 'talk', 'Speak to Porfiry', { npc: 'porfiry' });

    // door out
    const door = this.box(1.0, 2.0, 0.08, 0x2a1c10, { emissive: 0x000000 });
    door.position.set(0, 1.0, 2.45); g.add(door);
    world.registerInteractable(door, 'enter', 'Leave', 'door_streets');

    return { group: g, spawn: { x: 0, y: 1.6, z: 1.5 }, yaw: Math.PI,
      bounds: { minX: -2.1, maxX: 2.1, minZ: -0.2, maxZ: 2.1 }, moon: 0.0 };
  },

  // ---------- 6. SONYA ----------
  build_sonya(world) {
    const g = new THREE.Group();
    this.floor(g, 4, 3.5, 0x4a3a28);
    const ceil = this.box(4, 0.05, 3.5, 0x3a2c1c); ceil.position.set(0, 2.3, 0); g.add(ceil);
    this.wall(g, 4, 2.3, 0xc9a86a, 0, 1.15, -1.75, 0);
    this.wall(g, 3.5, 2.3, 0xbf9e60, 2, 1.15, 0, Math.PI / 2);
    this.wall(g, 3.5, 2.3, 0xbf9e60, -2, 1.15, 0, Math.PI / 2);
    this.wall(g, 4, 2.3, 0xb08850, 0, 1.15, 1.75, 0);

    // warm amber light
    this.flickerLight(world, g, 0xffcc88, 0.7, 1.4, 0.5, 0.8, 0.1, 5);
    g.add(new THREE.AmbientLight(0x4a3a28, 0.5));

    // small window overlooking dark alley
    const win = this.box(0.5, 0.7, 0.02, 0x1a2230, { emissive: 0x141a28, emissiveIntensity: 0.6 });
    win.position.set(1, 1.5, -1.73); g.add(win);

    // table + bible
    const table = this.box(0.8, 0.05, 0.6, 0x5a4530); table.position.set(-1, 0.75, -1); g.add(table);
    for (const [dx, dz] of [[-1.3, -1.2], [-0.7, -1.2], [-1.3, -0.8], [-0.7, -0.8]]) {
      const leg = this.box(0.05, 0.75, 0.05, 0x3a2a1a); leg.position.set(dx, 0.37, dz); g.add(leg);
    }
    const bible = this.box(0.3, 0.06, 0.22, 0x6a4a2a, { emissive: 0x110800 });
    bible.position.set(-1, 0.81, -1); g.add(bible);
    world.registerInteractable(bible, 'examine', 'Read the Gospel', 'bible');

    // bed
    const bed = this.box(1.4, 0.3, 0.7, 0x6a5238); bed.position.set(1.0, 0.15, 0.9); g.add(bed);

    // Sonya
    const sonya = Characters.create('sonya');
    sonya.group.position.set(-0.2, 0, 0.2);
    g.add(sonya.group);
    world.registerInteractable(sonya.group, 'talk', 'Speak to Sonya', { npc: 'sonya' });

    // door out
    const door = this.box(0.9, 1.9, 0.08, 0x3a2a1a, { emissive: 0x000000 });
    door.position.set(1.9, 0.95, -0.6); door.rotation.y = Math.PI / 2; g.add(door);
    world.registerInteractable(door, 'enter', 'Leave', 'door_streets');

    return { group: g, spawn: { x: 0, y: 1.6, z: 0.8 }, yaw: Math.PI,
      bounds: { minX: -1.6, maxX: 1.6, minZ: -1.3, maxZ: 1.3 }, moon: 0.05 };
  }
};

window.Locations = Locations;
window.Fountain = Fountain;
