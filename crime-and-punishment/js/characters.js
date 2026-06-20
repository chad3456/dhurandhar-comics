// characters.js — NPC humanoid figures + dialogue
'use strict';

const Characters = {
  defs: {
    raskolnikov: { coat: 0x1c1c24, skin: 0xc9a888, height: 1.0, width: 1.0,
      dialogue: ["Am I a trembling creature, or do I have the right?"] },
    alyona: { coat: 0x3a2c3a, skin: 0xb89878, height: 0.78, width: 0.85, hunched: true,
      dialogue: [
        "What do you want? Come in, come in...",
        "You've brought something to pawn? Let me see it.",
        "A silver watch... I'll give you a rouble and a half. Not a kopeck more.",
        "Come back when you have more. Now go." ] },
    lizaveta: { coat: 0x4a4238, skin: 0xc0a080, height: 1.02, width: 0.95,
      dialogue: ["Oh... I did not expect anyone. Forgive me."] },
    sonya: { coat: 0x6a4a6a, skin: 0xd0b090, height: 0.92, width: 0.8,
      dialogue: [
        "You... you look so pale. What has happened to you?",
        "Tell me. Whatever it is, tell me.",
        "You did this? But why — why to yourself?",
        "Go at once, this very moment. Stand at the crossroads, bow down, kiss the earth which you have defiled.",
        "Then say aloud to all the world: 'I have killed.' Suffer, and you will be redeemed." ] },
    porfiry: { coat: 0x3a2a2a, skin: 0xc8a890, height: 0.95, width: 1.35, round: true,
      dialogue: [
        "Ah, Rodion Romanovitch! Do sit down. I've been expecting you.",
        "I read your article — 'On Crime.' Fascinating. The idea that certain men have the right to transgress...",
        "You divide men into ordinary and extraordinary. And which are you, I wonder?",
        "No, no — I accuse you of nothing. We are merely... talking. Psychology is a double-edged weapon.",
        "You will come to me yourself in the end. They always do." ] },
    razumikhin: { coat: 0x3a4a2a, skin: 0xcaa080, height: 1.05, width: 1.3,
      dialogue: [
        "Rodya! You're alive! I've been worried sick, brother.",
        "You've been raving in this fever for days. Let me help you." ] },
    crowd: { coat: 0x2a2a30, skin: 0x9a8a78, height: 0.95, width: 1.0, dialogue: [] }
  },

  create(name) {
    const d = this.defs[name] || this.defs.crowd;
    const group = new THREE.Group();
    const lm = (c) => new THREE.MeshLambertMaterial({ color: c });
    const skin = lm(d.skin);
    const coat = lm(d.coat);
    const h = d.height, w = d.width;

    const mesh = (geo, m, x, y, z) => {
      const o = new THREE.Mesh(geo, m); o.position.set(x, y, z);
      o.castShadow = true; group.add(o); return o;
    };

    // legs
    mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.5 * h, 8), coat, -0.08 * w, 0.25 * h, 0);
    mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.5 * h, 8), coat, 0.08 * w, 0.25 * h, 0);
    // body
    const body = mesh(new THREE.BoxGeometry(0.3 * w, 0.5 * h, 0.2 * w), coat, 0, 0.5 * h + 0.25 * h, 0);
    if (d.hunched) { body.rotation.x = 0.3; body.position.z = 0.05; }
    // arms
    mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.4 * h, 8), coat, -0.18 * w, 0.55 * h + 0.2 * h, 0);
    mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.4 * h, 8), coat, 0.18 * w, 0.55 * h + 0.2 * h, 0);
    // head
    const hy = 0.5 * h + 0.5 * h + 0.15;
    mesh(new THREE.SphereGeometry(0.15, 12, 12), skin, 0, d.hunched ? hy - 0.08 : hy, d.hunched ? 0.1 : 0);

    group.userData.dialogue = d.dialogue;
    group.userData.charName = name;
    return { group, dialogue: d.dialogue };
  },

  dialogueFor(name) {
    const d = this.defs[name];
    return d ? d.dialogue : [];
  },

  displayName(name) {
    const names = {
      raskolnikov: 'Raskolnikov', alyona: 'Alyona Ivanovna', lizaveta: 'Lizaveta',
      sonya: 'Sonya Marmeladova', porfiry: 'Porfiry Petrovich', razumikhin: 'Razumikhin'
    };
    return names[name] || name;
  }
};

window.Characters = Characters;
