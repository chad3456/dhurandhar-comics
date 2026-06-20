// story.js — chapter/scene state machine
'use strict';

const Story = {
  world: null,
  currentChapter: 0,
  completedObjectives: [],
  inventory: [],
  unlocked: [true, false, false, false, false, false],

  chapters: [
    {
      number: 'I', title: 'The Plan', location: 'garret',
      ambient: [0x2a2438, 0.4],
      objectives: ['Examine your article on the desk', 'Leave the garret', 'Visit the pawnbroker'],
      intro: "A young man crept out of his garret and walked slowly, as though in hesitation, towards the bridge.",
      lines: {
        papers: { name: 'Raskolnikov', text: ["My article... 'On Crime.' The extraordinary man has a right — within himself — to permit his conscience to overstep certain obstacles."] },
        street_sign: { name: 'Notice', text: ["'A. I. — Pledges accepted. Third floor.' Her door. I know it well."] },
        haymarket_kneel: null
      }
    },
    {
      number: 'II', title: 'The Crime', location: 'pawnbroker',
      ambient: [0x1a1018, 0.3],
      objectives: ['Take the axe', 'Confront Alyona Ivanovna', 'Commit the deed'],
      intro: "It was a fine warm evening. His heart was beating so violently that he could scarcely breathe.",
      lines: {
        axe: { name: 'Raskolnikov', text: ["The axe. Cold and certain in my hand. There is no turning back now."], item: 'Axe' }
      }
    },
    {
      number: 'III', title: 'The Fever', location: 'streets',
      ambient: [0x1c1828, 0.35],
      objectives: ['Wander the streets in delirium', 'Read the police summons'],
      intro: "He had a feeling now of being utterly alone. A cold shiver ran down his spine.",
      lines: {
        street_sign: { name: 'Summons', text: ["A summons. From the police office. They... they call me in. Do they know? My head is burning."] }
      }
    },
    {
      number: 'IV', title: 'The Investigation', location: 'police',
      ambient: [0x3a1a1a, 0.35],
      objectives: ['Examine the case file', 'Endure Porfiry\'s questioning'],
      intro: "Porfiry Petrovich watched him with eyes that seemed to laugh and to know everything.",
      lines: {
        police_docs: { name: 'Case File', text: ["The widow Alyona Ivanovna. And her sister Lizaveta. Both. Witnesses: none. Suspect: unknown. Yet he looks at me as if my name were written here."] }
      }
    },
    {
      number: 'V', title: 'Sonya', location: 'sonya',
      ambient: [0x3a2a1a, 0.45],
      objectives: ['Read the Gospel on the table', 'Confess to Sonya'],
      intro: "Here was the only creature who would not condemn him. The lamp burned warm against the cold of the world.",
      lines: {
        bible: { name: 'The Gospel', text: ["The raising of Lazarus. 'I am the resurrection and the life.' Sonya reads it to me, and for a moment I am not damned."] }
      }
    },
    {
      number: 'VI', title: 'The Punishment', location: 'haymarket',
      ambient: [0xaab8cc, 0.6],
      objectives: ['Kneel at the crossroads', 'Accept your suffering'],
      intro: "He knelt down in the middle of the square, bowed down to the earth, and kissed that filthy earth with bliss and rapture.",
      lines: {
        haymarket_kneel: { name: 'Raskolnikov', text: ["I bow to the earth I have defiled. I have killed. Let them hear it. In suffering, perhaps, lies the path back to men."] }
      }
    }
  ],

  init(world) {
    this.world = world;
    world.onInteract = (it) => this.handleInteract(it);
  },

  chapter() { return this.chapters[this.currentChapter]; },

  startChapter(index) {
    if (index >= this.chapters.length) { UI.showEnding(); return; }
    this.currentChapter = index;
    this.unlocked[index] = true;
    this.completedObjectives = [];
    const ch = this.chapters[index];
    UI.showChapterCard(ch, () => {
      this.world.loadLocation(ch.location, ch.ambient[0], ch.ambient[1]);
      this.world.enabled = true;
      UI.updateHUD(this);
      UI.toast(ch.intro, 6000);
    });
  },

  handleInteract(it) {
    const ch = this.chapter();
    if (it.type === 'talk') {
      const npc = it.action.npc;
      UI.startDialogue(Characters.displayName(npc), Characters.dialogueFor(npc), () => {
        this.markObjective(npc);
        this.checkAdvance(npc);
      });
      return;
    }
    if (it.type === 'enter') {
      this.handleTransition(it.action);
      return;
    }
    // examine
    const line = ch.lines && ch.lines[it.action];
    if (line) {
      UI.startDialogue(line.name, line.text, () => {
        if (line.item && !this.inventory.includes(line.item)) {
          this.inventory.push(line.item);
          UI.updateInventory(this.inventory);
        }
        this.markObjective(it.action);
        this.checkAdvance(it.action);
      });
    } else {
      UI.toast('Nothing more here.', 1500);
    }
  },

  handleTransition(action) {
    const ch = this.chapter();
    // chapter-specific routing
    if (ch.location === 'garret' && action === 'door_streets') {
      this.markObjective('leave');
      this.world.loadLocation('streets', 0x1c1828, 0.35);
      UI.updateHUD(this);
      UI.toast('The streets of St. Petersburg. Sweltering, foul, oppressive.', 4000);
      return;
    }
    if (ch.location === 'streets' && action === 'door_pawnbroker') {
      this.markObjective('visit');
      // in chapter 1 this is a preview; chapter 2 begins inside pawnbroker
      if (this.currentChapter === 0) {
        this.world.loadLocation('pawnbroker', 0x1a1018, 0.3);
        UI.updateHUD(this);
        UI.toast('You climb to the third floor. A rehearsal. You are only looking... for now.', 4500);
        this.completeChapter();
      }
      return;
    }
    if (action === 'door_pawnbroker') {
      this.world.loadLocation('pawnbroker', 0x1a1018, 0.3);
      UI.updateHUD(this);
      return;
    }
    if (action === 'door_streets') {
      this.world.loadLocation('streets', 0x1c1828, 0.35);
      UI.updateHUD(this);
      return;
    }
  },

  markObjective(key) {
    if (!this.completedObjectives.includes(key)) {
      this.completedObjectives.push(key);
      UI.updateHUD(this);
    }
  },

  checkAdvance(key) {
    const idx = this.currentChapter;
    // Each chapter advances on its key trigger
    const triggers = {
      0: null, // advances on pawnbroker visit
      1: 'alyona',          // confronting Alyona ends the crime chapter
      2: 'street_sign',     // reading summons
      3: 'porfiry',         // enduring Porfiry
      4: 'sonya',           // confessing to Sonya
      5: 'haymarket_kneel'  // kneeling
    };
    if (triggers[idx] && key === triggers[idx]) {
      this.completeChapter();
    }
  },

  completeChapter() {
    const idx = this.currentChapter;
    const ch = this.chapters[idx];
    ch.completed = true;
    if (idx + 1 < this.chapters.length) this.unlocked[idx + 1] = true;
    UI.showChapterComplete(ch, () => {
      if (idx + 1 < this.chapters.length) this.startChapter(idx + 1);
      else UI.showEnding();
    });
  }
};

window.Story = Story;
