// world.js — Three.js scene, lighting, renderer, atmosphere
'use strict';

class GameWorld {
  constructor() {
    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.FogExp2(0x0a0612, 0.035);

    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    this.camera.position.set(0, 1.6, 3);

    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.setClearColor(0x0a0612, 1);

    this.clock = new THREE.Clock();
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();

    this.interactables = [];   // { mesh, type, label, action }
    this.locationGroup = null; // current location root
    this.animatedLights = [];  // candle / flicker lights
    this.rain = null;
    this.fountain = null;
    this.stars = null;

    // movement
    this.keys = {};
    this.velocity = new THREE.Vector3();
    this.pitch = 0;
    this.yaw = 0;
    this.pointerLocked = false;
    this.bounds = { minX: -1.8, maxX: 1.8, minZ: -1.3, maxZ: 1.3 };

    this.hovered = null;
    this.onInteract = null; // callback(interactable)
    this.enabled = false;
  }

  init() {
    const container = document.getElementById('game-canvas');
    container.appendChild(this.renderer.domElement);

    // Ambient — kept low for noir feel
    this.ambient = new THREE.AmbientLight(0x2a2438, 0.45);
    this.scene.add(this.ambient);

    // Moonlight
    this.moon = new THREE.DirectionalLight(0xc8d8ff, 0.4);
    this.moon.position.set(-6, 10, -4);
    this.moon.castShadow = true;
    this.moon.shadow.mapSize.width = 1024;
    this.moon.shadow.mapSize.height = 1024;
    this.moon.shadow.camera.near = 0.5;
    this.moon.shadow.camera.far = 40;
    this.moon.shadow.camera.left = -15;
    this.moon.shadow.camera.right = 15;
    this.moon.shadow.camera.top = 15;
    this.moon.shadow.camera.bottom = -15;
    this.scene.add(this.moon);

    this.createStars();
    this.bindEvents();
    this.animate();
  }

  createStars() {
    const geo = new THREE.BufferGeometry();
    const count = 2000;
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const r = 400 + Math.random() * 100;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = Math.abs(r * Math.cos(phi)) * 0.6 + 20;
      positions[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
    }
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const mat = new THREE.PointsMaterial({ color: 0xdde6ff, size: 1.4, sizeAttenuation: true, transparent: true, opacity: 0.9 });
    this.stars = new THREE.Points(geo, mat);
    this.scene.add(this.stars);
  }

  // Rain of falling line segments
  createRain() {
    const count = 1500;
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 6);
    this.rainData = [];
    for (let i = 0; i < count; i++) {
      const x = (Math.random() - 0.5) * 60;
      const y = Math.random() * 30;
      const z = (Math.random() - 0.5) * 60;
      const len = 0.3 + Math.random() * 0.4;
      positions[i * 6] = x; positions[i * 6 + 1] = y; positions[i * 6 + 2] = z;
      positions[i * 6 + 3] = x; positions[i * 6 + 4] = y - len; positions[i * 6 + 5] = z;
      this.rainData.push({ speed: 0.25 + Math.random() * 0.3, len });
    }
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const mat = new THREE.LineBasicMaterial({ color: 0xaab4cc, transparent: true, opacity: 0.4 });
    this.rain = new THREE.LineSegments(geo, mat);
    this.rain.frustumCulled = false;
    this.scene.add(this.rain);
  }

  removeRain() {
    if (this.rain) { this.scene.remove(this.rain); this.rain.geometry.dispose(); this.rain = null; }
  }

  updateRain() {
    if (!this.rain) return;
    const pos = this.rain.geometry.attributes.position.array;
    for (let i = 0; i < this.rainData.length; i++) {
      const d = this.rainData[i];
      pos[i * 6 + 1] -= d.speed;
      pos[i * 6 + 4] -= d.speed;
      if (pos[i * 6 + 4] < 0) {
        const y = 30 + Math.random() * 5;
        pos[i * 6 + 1] = y;
        pos[i * 6 + 4] = y - d.len;
      }
    }
    this.rain.geometry.attributes.position.needsUpdate = true;
  }

  // Clear current location geometry
  clearLocation() {
    if (this.locationGroup) {
      this.scene.remove(this.locationGroup);
      this.disposeGroup(this.locationGroup);
      this.locationGroup = null;
    }
    this.interactables = [];
    this.animatedLights = [];
    this.fountain = null;
    this.removeRain();
  }

  disposeGroup(group) {
    group.traverse((o) => {
      if (o.geometry) o.geometry.dispose();
      if (o.material) {
        if (Array.isArray(o.material)) o.material.forEach((m) => m.dispose());
        else o.material.dispose();
      }
    });
  }

  // Load a location built by Locations factory
  loadLocation(name, ambientColor, ambientIntensity) {
    this.clearLocation();
    const built = Locations.build(name, this);
    this.locationGroup = built.group;
    this.scene.add(built.group);

    if (built.bounds) this.bounds = built.bounds;
    if (ambientColor !== undefined) this.ambient.color.setHex(ambientColor);
    if (ambientIntensity !== undefined) this.ambient.intensity = ambientIntensity;
    this.moon.intensity = built.moon !== undefined ? built.moon : 0.4;

    // spawn camera
    const sp = built.spawn || { x: 0, y: 1.6, z: 1 };
    this.camera.position.set(sp.x, sp.y, sp.z);
    this.yaw = built.yaw || 0;
    this.pitch = 0;
    return built;
  }

  registerInteractable(mesh, type, label, action) {
    mesh.userData.interactable = { mesh, type, label, action };
    this.interactables.push(mesh.userData.interactable);
  }

  bindEvents() {
    window.addEventListener('resize', () => this.onResize());
    document.addEventListener('mousemove', (e) => this.onMouseMove(e));
    document.addEventListener('mousedown', (e) => this.onClick(e));
    document.addEventListener('keydown', (e) => { this.keys[e.code] = true; });
    document.addEventListener('keyup', (e) => { this.keys[e.code] = false; });
    document.addEventListener('pointerlockchange', () => {
      this.pointerLocked = document.pointerLockElement === this.renderer.domElement;
    });
  }

  requestPointerLock() {
    this.renderer.domElement.requestPointerLock();
  }

  onResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  onMouseMove(e) {
    if (this.pointerLocked && this.enabled) {
      this.yaw -= e.movementX * 0.0025;
      this.pitch -= e.movementY * 0.0025;
      this.pitch = Math.max(-1.2, Math.min(1.2, this.pitch));
    }
    this.mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
    this.mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
  }

  onClick(e) {
    if (!this.enabled) return;
    if (e.target && e.target.closest && e.target.closest('.ui-blocker')) return;
    if (!this.pointerLocked) { this.requestPointerLock(); return; }
    if (this.hovered && this.onInteract) this.onInteract(this.hovered);
  }

  updateMovement(dt) {
    if (!this.enabled || !this.pointerLocked) return;
    const speed = 2.4 * dt;
    const dir = new THREE.Vector3();
    const forward = new THREE.Vector3(Math.sin(this.yaw), 0, Math.cos(this.yaw));
    const right = new THREE.Vector3(Math.cos(this.yaw), 0, -Math.sin(this.yaw));
    if (this.keys['KeyW']) dir.sub(forward);
    if (this.keys['KeyS']) dir.add(forward);
    if (this.keys['KeyA']) dir.sub(right);
    if (this.keys['KeyD']) dir.add(right);
    if (dir.lengthSq() > 0) {
      dir.normalize().multiplyScalar(speed);
      this.camera.position.x += dir.x;
      this.camera.position.z += dir.z;
    }
    const b = this.bounds;
    this.camera.position.x = Math.max(b.minX, Math.min(b.maxX, this.camera.position.x));
    this.camera.position.z = Math.max(b.minZ, Math.min(b.maxZ, this.camera.position.z));
  }

  updateLook() {
    const target = new THREE.Vector3(
      this.camera.position.x + Math.sin(this.yaw) * Math.cos(this.pitch),
      this.camera.position.y + Math.sin(this.pitch),
      this.camera.position.z + Math.cos(this.yaw) * Math.cos(this.pitch)
    );
    this.camera.lookAt(target);
  }

  updateHover() {
    if (!this.enabled) return;
    const origin = this.pointerLocked ? new THREE.Vector2(0, 0) : this.mouse;
    this.raycaster.setFromCamera(origin, this.camera);
    const meshes = this.interactables.map((i) => i.mesh);
    const hits = this.raycaster.intersectObjects(meshes, true);
    let found = null;
    if (hits.length) {
      let o = hits[0].object;
      while (o && !o.userData.interactable) o = o.parent;
      if (o && hits[0].distance < 4) found = o.userData.interactable;
    }
    if (found !== this.hovered) {
      if (this.hovered) this.setEmphasis(this.hovered.mesh, false);
      this.hovered = found;
      if (this.hovered) this.setEmphasis(this.hovered.mesh, true);
      if (typeof UI !== 'undefined' && UI.showTooltip) UI.showTooltip(this.hovered);
    }
  }

  setEmphasis(mesh, on) {
    mesh.traverse((o) => {
      if (o.material && o.material.emissive) {
        if (on) {
          o.userData._emi = o.material.emissive.getHex();
          o.material.emissive.setHex(0x553311);
        } else if (o.userData._emi !== undefined) {
          o.material.emissive.setHex(o.userData._emi);
        }
      }
    });
  }

  animate() {
    requestAnimationFrame(() => this.animate());
    const dt = Math.min(this.clock.getDelta(), 0.05);
    const t = this.clock.getElapsedTime();

    // candle / flicker lights
    for (const l of this.animatedLights) {
      l.light.intensity = l.base + Math.sin(t * 8 + l.phase) * l.amp + Math.random() * 0.08;
    }

    this.updateRain();
    if (this.fountain) this.fountain.update(dt);
    if (this.stars) this.stars.rotation.y += dt * 0.005;

    this.updateMovement(dt);
    this.updateLook();
    this.updateHover();

    this.renderer.render(this.scene, this.camera);
  }
}

window.GameWorld = GameWorld;
