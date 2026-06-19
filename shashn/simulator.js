// ============================================================
// SHASHN AI SIMULATOR
// ============================================================

class ShashnSimulator {
  constructor(game, ui) {
    this.game = game;
    this.ui = ui;
    this.running = false;
    this.speed = 1200; // ms between actions
    this.commentary = [];
  }

  addCommentary(text, type = 'info') {
    this.commentary.unshift({ text, type, ts: Date.now() });
    if (this.commentary.length > 50) this.commentary.pop();
    this.game.addLog(`[SIM] ${text}`, type);
    if (this.ui) this.ui.render();
  }

  async start() {
    this.running = true;
    const g = this.game;

    // Add AI players
    const candidates = [
      { name: 'Sen. Alex Rivera', color: 'red' },
      { name: 'Gov. Patricia Stone', color: 'blue' },
      { name: 'Rep. Marcus Webb', color: 'green' },
      { name: 'Mayor Elena Cruz', color: 'yellow' },
      { name: 'AG Thomas Finch', color: 'purple' },
    ];
    const count = Math.floor(Math.random() * 2) + 3; // 3-4 players
    for (let i = 0; i < count; i++) {
      g.addPlayer(candidates[i].name, candidates[i].color);
    }
    this.addCommentary(`${count} politicians enter the race!`, 'system');
    await this._delay(this.speed);

    // Setup
    g.startSetup();
    this.addCommentary('The campaign season begins. Who will go first?', 'system');
    await this._delay(this.speed);

    // Voting
    await this._simulateVoting();

    // Resource distribution
    await this._simulateResources();

    // Gameplay
    await this._simulateGameplay();
  }

  async _simulateVoting() {
    const g = this.game;
    this.addCommentary('Players vote to determine who goes first...', 'vote');
    await this._delay(this.speed);
    let attempts = 0;
    while (g.state === 'vote' && attempts < 10) {
      attempts++;
      g.voteTally = {};
      for (const voter of g.players) {
        const others = g.players.filter(p => p.id !== voter.id);
        const choice = others[Math.floor(Math.random() * others.length)];
        g.voteTally[voter.id] = choice.id;
      }
      const result = g._resolveVoting();
      if (result.tie) {
        this.addCommentary('Tie vote! Going to revote...', 'vote');
        await this._delay(this.speed);
      } else {
        this.addCommentary(`${result.firstPlayer.name} wins the vote and goes first!`, 'vote');
        break;
      }
    }
    await this._delay(this.speed);
  }

  async _simulateResources() {
    const g = this.game;
    this.addCommentary('Players select starting resources...', 'resource');
    await this._delay(this.speed);
    g.getSetupPlayerIndex(); // initialize order
    let safetyLimit = 100;
    while (g.state === 'resources' && safetyLimit-- > 0) {
      const idx = g._setupOrderIdx < g._setupOrder.length ? g._setupOrder[g._setupOrderIdx] : null;
      if (idx === null) break;
      const p = g.players[idx];
      if (!g.decks.resource.length) break;
      const picked = g.decks.resource[Math.floor(Math.random() * Math.min(5, g.decks.resource.length))];
      const result = g.pickSetupResource(idx, picked);
      this.addCommentary(`${p.name} takes "${picked.title}" (${picked.category})`, 'resource');
      await this._delay(this.speed / 2);
      if (result.done) break;
    }
    await this._delay(this.speed);
  }

  async _simulateGameplay() {
    const g = this.game;
    this.addCommentary('The campaign trail heats up!', 'system');
    let safetyLimit = 300;
    while ((g.state === 'gameplay' || g.state === 'election') && safetyLimit-- > 0 && this.running) {
      if (g.state === 'election') {
        await this._delay(this.speed * 2);
        break;
      }
      const p = g.currentPlayer();

      // Draw phase
      if (g.phase === 'draw') {
        g.drawCards(2);
        this.addCommentary(`${p.name} draws cards.`, 'draw');
        await this._delay(this.speed * 0.6);
      }

      // Action phase - AI takes 2 actions
      if (g.phase === 'action') {
        await this._aiTakeActions(p);
        g.endTurn();
      }

      await this._delay(this.speed);

      if (g.state === 'gameover') break;
    }

    if (g.winner) {
      this.addCommentary(`🎉 ${g.winner.name} wins the election! The people have spoken.`, 'win');
    }
    this.running = false;
    if (this.ui) this.ui.render();
  }

  async _aiTakeActions(p) {
    const g = this.game;
    const personalities = {
      red:    { style: 'aggressive', priority: ['attack', 'debate', 'campaign'] },
      blue:   { style: 'voter-focused', priority: ['play_voter', 'campaign', 'play_ideology'] },
      green:  { style: 'balanced', priority: ['play_ideology', 'fundraise', 'campaign'] },
      yellow: { style: 'media-heavy', priority: ['play_resource', 'campaign', 'debate'] },
      purple: { style: 'strategic', priority: ['fundraise', 'play_ideology', 'attack'] },
    };
    const persona = personalities[p.color] || personalities.blue;

    for (let actionNum = 0; actionNum < g.MAX_ACTIONS; actionNum++) {
      if (g.phase !== 'action' || g.actionsThisTurn >= g.MAX_ACTIONS) break;

      const action = this._chooseAction(p, persona, g);
      if (!action) break;

      const result = g.takeAction(action.type, action.payload);
      if (result.ok) {
        this.addCommentary(this._generateCommentary(p, action, g), action.type);
      }
      await this._delay(this.speed * 0.8);
    }
  }

  _chooseAction(p, persona, g) {
    // Inventory check
    const hasConspiracy = p.hand.some(c => c.type === 'conspiracy');
    const hasIdeology = p.hand.some(c => c.type === 'ideology');
    const hasVoter = p.hand.some(c => c.type === 'voter');
    const hasResource = p.hand.some(c => c.type === 'resource');
    const otherPlayers = g.players.filter(pl => pl.id !== p.id);
    const leader = otherPlayers.reduce((a, b) => g.getScore(a) > g.getScore(b) ? a : b, otherPlayers[0]);

    // Priority-based action selection
    for (const prio of persona.priority) {
      if (prio === 'attack' && hasConspiracy && otherPlayers.length > 0) {
        const idx = p.hand.findIndex(c => c.type === 'conspiracy');
        return { type: 'attack', payload: { cardIndex: idx, targetId: leader.id } };
      }
      if (prio === 'debate' && otherPlayers.length > 0) {
        return { type: 'debate', payload: { targetId: leader.id } };
      }
      if (prio === 'campaign') {
        const weakRegion = REGIONS.reduce((a, b) => (p.voterPegs[a] || 0) < (p.voterPegs[b] || 0) ? a : b);
        return { type: 'campaign', payload: { region: weakRegion } };
      }
      if (prio === 'play_ideology' && hasIdeology) {
        const idx = p.hand.findIndex(c => c.type === 'ideology');
        return { type: 'play_ideology', payload: { cardIndex: idx } };
      }
      if (prio === 'play_voter' && hasVoter) {
        const idx = p.hand.findIndex(c => c.type === 'voter');
        return { type: 'play_voter', payload: { cardIndex: idx } };
      }
      if (prio === 'play_resource' && hasResource) {
        const idx = p.hand.findIndex(c => c.type === 'resource');
        return { type: 'play_resource', payload: { cardIndex: idx } };
      }
      if (prio === 'fundraise') {
        return { type: 'fundraise', payload: {} };
      }
    }
    // Fallback
    const region = REGIONS[Math.floor(Math.random() * REGIONS.length)];
    return { type: 'campaign', payload: { region } };
  }

  _generateCommentary(p, action, g) {
    const comments = {
      campaign: [
        `${p.name} hits the campaign trail in ${action.payload.region}!`,
        `${p.name} holds a massive rally in ${action.payload.region}.`,
        `${p.name} visits every county in ${action.payload.region}.`,
      ],
      debate: [
        `${p.name} challenges a rival to a policy debate!`,
        `${p.name} goes on the offensive in tonight's debate.`,
      ],
      fundraise: [
        `${p.name} hosts a high-dollar donor dinner.`,
        `${p.name} launches an emergency money bomb online.`,
        `${p.name}'s campaign coffers are growing.`,
      ],
      attack: [
        `${p.name} unleashes a devastating attack!`,
        `${p.name}'s oppo research team strikes!`,
      ],
      play_ideology: [
        `${p.name} takes a stand on a key policy issue.`,
        `${p.name} releases a bold new policy position.`,
      ],
      play_voter: [
        `${p.name} makes a direct appeal to a key voter bloc.`,
        `${p.name} hosts a listening tour with community leaders.`,
      ],
      play_resource: [
        `${p.name} deploys a major campaign resource.`,
        `${p.name}'s campaign infrastructure kicks into high gear.`,
      ],
    };
    const pool = comments[action.type] || [`${p.name} takes action.`];
    return pool[Math.floor(Math.random() * pool.length)];
  }

  stop() {
    this.running = false;
    this.addCommentary('Simulation stopped.', 'system');
  }

  _delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
