// ui.js — HUD, dialogue, inventory, menus, minimap
'use strict';

const UI = {
  el: {},
  dialogueQueue: [],
  dialogueIndex: 0,
  dialogueDone: null,

  init() {
    this.el.loading = document.getElementById('loading');
    this.el.loadingBar = document.getElementById('loading-bar');
    this.el.menu = document.getElementById('menu');
    this.el.chapterSelect = document.getElementById('chapter-select');
    this.el.about = document.getElementById('about');
    this.el.card = document.getElementById('chapter-card');
    this.el.hud = document.getElementById('hud');
    this.el.locName = document.getElementById('hud-location');
    this.el.dots = document.getElementById('hud-dots');
    this.el.hint = document.getElementById('hud-hint');
    this.el.tooltip = document.getElementById('tooltip');
    this.el.dialogue = document.getElementById('dialogue');
    this.el.dlgName = document.getElementById('dialogue-name');
    this.el.dlgText = document.getElementById('dialogue-text');
    this.el.dlgNext = document.getElementById('dialogue-next');
    this.el.inventory = document.getElementById('inventory');
    this.el.minimap = document.getElementById('minimap');
    this.el.toast = document.getElementById('toast');

    this.el.dlgNext.addEventListener('click', () => this.advanceDialogue());

    document.getElementById('btn-start').addEventListener('click', () => {
      this.hideMenu(); Story.startChapter(0);
    });
    document.getElementById('btn-chapters').addEventListener('click', () => this.openChapterSelect());
    document.getElementById('btn-about').addEventListener('click', () => this.toggle(this.el.about, true));
    document.getElementById('about-close').addEventListener('click', () => this.toggle(this.el.about, false));
    document.getElementById('cs-close').addEventListener('click', () => this.toggle(this.el.chapterSelect, false));

    document.addEventListener('keydown', (e) => {
      if (e.code === 'Escape') this.toggleMenu();
      if (e.code === 'KeyE' && Story.world && Story.world.hovered) {
        Story.world.onInteract(Story.world.hovered);
      }
      if (e.code === 'KeyI') this.toggleInventory();
    });
  },

  runLoading(done) {
    let p = 0;
    const iv = setInterval(() => {
      p += 2 + Math.random() * 6;
      if (p >= 100) { p = 100; clearInterval(iv); setTimeout(() => { this.hideLoading(); done(); }, 400); }
      this.el.loadingBar.style.width = p + '%';
    }, 90);
  },

  hideLoading() { this.el.loading.classList.add('hidden'); },

  showMenu() { this.toggle(this.el.menu, true); },
  hideMenu() { this.toggle(this.el.menu, false); },
  toggleMenu() {
    const open = !this.el.menu.classList.contains('hidden');
    this.toggle(this.el.menu, !open);
    if (Story.world) Story.world.enabled = open; // disable world while menu open
    if (open && Story.world) Story.world.requestPointerLock();
  },

  toggle(el, show) { el.classList.toggle('hidden', !show); },

  openChapterSelect() {
    const grid = document.getElementById('cs-grid');
    grid.innerHTML = '';
    Story.chapters.forEach((ch, i) => {
      const card = document.createElement('div');
      card.className = 'cs-card' + (Story.unlocked[i] ? '' : ' locked');
      card.innerHTML = `<div class="cs-num">${ch.number}</div><div class="cs-title">${ch.title}</div>` +
        (Story.unlocked[i] ? '' : '<div class="cs-lock">locked</div>');
      if (Story.unlocked[i]) card.addEventListener('click', () => {
        this.toggle(this.el.chapterSelect, false); this.hideMenu(); Story.startChapter(i);
      });
      grid.appendChild(card);
    });
    this.toggle(this.el.chapterSelect, true);
  },

  showChapterCard(ch, done) {
    const card = this.el.card;
    card.innerHTML = `<div class="cc-inner"><div class="cc-num">Chapter ${ch.number}</div>` +
      `<div class="cc-title">${ch.title}</div><div class="cc-line">${ch.intro}</div>` +
      `<div class="cc-hint">click to begin</div></div>`;
    card.classList.remove('hidden');
    card.classList.add('fade-in');
    const enter = () => {
      card.removeEventListener('click', enter);
      card.classList.add('hidden');
      done();
      if (Story.world) Story.world.requestPointerLock();
    };
    setTimeout(() => card.addEventListener('click', enter), 1200);
  },

  showChapterComplete(ch, done) {
    if (Story.world) Story.world.enabled = false;
    const card = this.el.card;
    card.innerHTML = `<div class="cc-inner"><div class="cc-num">Chapter ${ch.number} complete</div>` +
      `<div class="cc-title">${ch.title}</div><div class="cc-hint">click to continue</div></div>`;
    card.classList.remove('hidden');
    const next = () => { card.removeEventListener('click', next); card.classList.add('hidden'); done(); };
    setTimeout(() => card.addEventListener('click', next), 800);
  },

  showEnding() {
    if (Story.world) Story.world.enabled = false;
    const card = this.el.card;
    card.innerHTML = `<div class="cc-inner"><div class="cc-num">Epilogue</div>` +
      `<div class="cc-title">Resurrection</div>` +
      `<div class="cc-line">"They were renewed by love; the heart of each held infinite sources of life for the heart of the other."</div>` +
      `<div class="cc-line" style="margin-top:1rem">He was redeemed. He had risen again, and he knew it.</div>` +
      `<div class="cc-hint">click to return to the menu</div></div>`;
    card.classList.remove('hidden');
    const back = () => { card.removeEventListener('click', back); card.classList.add('hidden'); this.showMenu(); };
    setTimeout(() => card.addEventListener('click', back), 1000);
  },

  updateHUD(story) {
    const ch = story.chapter();
    this.toggle(this.el.hud, true);
    const locNames = { garret: "Raskolnikov's Garret", streets: 'St. Petersburg Streets',
      pawnbroker: "Pawnbroker's Apartment", haymarket: 'Haymarket Square',
      police: "Porfiry's Office", sonya: "Sonya's Room" };
    this.el.locName.textContent = locNames[story.world.locationGroup ? this.currentLoc(story) : ch.location] || ch.location;
    // progress dots
    this.el.dots.innerHTML = '';
    Story.chapters.forEach((c, i) => {
      const d = document.createElement('span');
      d.className = 'dot' + (i === story.currentChapter ? ' active' : '') + (c.completed ? ' done' : '');
      this.el.dots.appendChild(d);
    });
    // objectives in hint
    const next = ch.objectives.find((o, i) => i >= story.completedObjectives.length) || ch.objectives[ch.objectives.length - 1];
    this.el.hint.textContent = 'Objective: ' + next;
    this.updateMinimap(ch.location);
  },

  currentLoc(story) {
    return story.chapter().location;
  },

  showTooltip(it) {
    if (!it) { this.toggle(this.el.tooltip, false); return; }
    const verb = { examine: 'Examine', enter: 'Enter', talk: 'Talk' }[it.type] || 'Interact';
    this.el.tooltip.textContent = `${verb} — ${it.label} [E]`;
    this.toggle(this.el.tooltip, true);
  },

  startDialogue(name, lines, done) {
    if (!lines || !lines.length) { if (done) done(); return; }
    if (Story.world) Story.world.enabled = false;
    if (document.pointerLockElement) document.exitPointerLock();
    this.dialogueQueue = lines;
    this.dialogueIndex = 0;
    this.dialogueDone = done;
    this.el.dlgName.textContent = name;
    this.el.dlgText.textContent = lines[0];
    this.el.dlgNext.textContent = lines.length > 1 ? 'Next' : 'Close';
    this.toggle(this.el.dialogue, true);
  },

  advanceDialogue() {
    this.dialogueIndex++;
    if (this.dialogueIndex >= this.dialogueQueue.length) {
      this.toggle(this.el.dialogue, false);
      if (Story.world) { Story.world.enabled = true; Story.world.requestPointerLock(); }
      const cb = this.dialogueDone; this.dialogueDone = null;
      if (cb) cb();
      return;
    }
    this.el.dlgText.textContent = this.dialogueQueue[this.dialogueIndex];
    this.el.dlgNext.textContent = this.dialogueIndex === this.dialogueQueue.length - 1 ? 'Close' : 'Next';
  },

  updateInventory(items) {
    this.el.inventory.innerHTML = '';
    const icons = { Axe: '🪓', Watch: '⌚', Cross: '✝', Letter: '✉' };
    items.forEach((it) => {
      const d = document.createElement('div');
      d.className = 'inv-item';
      d.innerHTML = `<span class="inv-icon">${icons[it] || '◆'}</span><span class="inv-label">${it}</span>`;
      this.el.inventory.appendChild(d);
    });
    this.toggle(this.el.inventory, items.length > 0);
  },

  toggleInventory() {
    this.el.inventory.classList.toggle('expanded');
  },

  updateMinimap(loc) {
    const layout = { garret: 0, streets: 1, pawnbroker: 2, haymarket: 3, police: 4, sonya: 5 };
    const labels = ['Garret', 'Streets', 'Pawn', 'Market', 'Office', 'Sonya'];
    this.el.minimap.innerHTML = '<div class="mm-title">St. Petersburg</div>';
    labels.forEach((l, i) => {
      const d = document.createElement('div');
      d.className = 'mm-node' + (layout[loc] === i ? ' here' : '');
      d.innerHTML = `<span class="mm-dot"></span>${l}`;
      this.el.minimap.appendChild(d);
    });
  },

  toast(text, ms) {
    this.el.toast.textContent = text;
    this.el.toast.classList.add('show');
    clearTimeout(this._toastT);
    this._toastT = setTimeout(() => this.el.toast.classList.remove('show'), ms || 3000);
  }
};

window.UI = UI;
