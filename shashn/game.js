// ============================================================
// SHASHN GAME ENGINE
// ============================================================

const PLAYER_COLORS = {
  red:    { name:'Red',    hex:'#e53e3e', light:'#fed7d7', text:'#fff' },
  blue:   { name:'Blue',   hex:'#3182ce', light:'#bee3f8', text:'#fff' },
  green:  { name:'Green',  hex:'#38a169', light:'#c6f6d5', text:'#fff' },
  yellow: { name:'Yellow', hex:'#d69e2e', light:'#fefcbf', text:'#1a202c' },
  purple: { name:'Purple', hex:'#805ad5', light:'#e9d8fd', text:'#fff' },
};

const REGIONS = ['Northeast', 'Southeast', 'Midwest', 'Southwest', 'West'];

const WIN_CONDITIONS = { voterPegs: 20, rounds: 10 };

class ShashnGame {
  constructor() {
    this.state = 'lobby'; // lobby | setup | vote | resources | gameplay | election | gameover
    this.players = [];
    this.currentPlayerIndex = 0;
    this.round = 1;
    this.decks = null;
    this.log = [];
    this.voteTally = {}; // playerId -> playerId they voted for
    this.firstPlayerIndex = 0;
    this.selectedColors = new Set();
    this.phase = null; // draw | action | end
    this.actionsThisTurn = 0;
    this.MAX_ACTIONS = 2;
    this.winner = null;
    this.pendingEffect = null; // for targeting
  }

  addLog(msg, type = 'info') {
    this.log.unshift({ msg, type, time: new Date().toLocaleTimeString() });
    if (this.log.length > 100) this.log.pop();
  }

  // ── LOBBY ──────────────────────────────────────────────────
  addPlayer(name, color) {
    if (this.players.length >= 5) return { ok: false, error: 'Max 5 players' };
    if (!PLAYER_COLORS[color]) return { ok: false, error: 'Invalid color' };
    if (this.selectedColors.has(color)) return { ok: false, error: 'Color taken' };
    if (!name.trim()) return { ok: false, error: 'Name required' };
    const p = {
      id: 'p' + (this.players.length + 1),
      name: name.trim(),
      color,
      hand: [],
      voterPegs: {},      // region -> count
      resources: [],      // resource cards held
      ideologiesPlayed: [],
      votersWon: [],
      fundingTokens: 0,
      policyPoints: 0,
    };
    REGIONS.forEach(r => p.voterPegs[r] = 0);
    this.players.push(p);
    this.selectedColors.add(color);
    this.addLog(`${name} joined as ${PLAYER_COLORS[color].name}.`, 'join');
    return { ok: true };
  }

  removePlayer(id) {
    const idx = this.players.findIndex(p => p.id === id);
    if (idx === -1) return;
    const p = this.players[idx];
    this.selectedColors.delete(p.color);
    this.players.splice(idx, 1);
    this.addLog(`${p.name} left the game.`, 'info');
  }

  startSetup() {
    if (this.players.length < 2) return { ok: false, error: 'Need at least 2 players' };
    this.decks = createDecks();
    this.state = 'vote';
    this.voteTally = {};
    this.addLog('Setup complete. Vote to determine who goes first!', 'system');
    return { ok: true };
  }

  // ── VOTING ─────────────────────────────────────────────────
  castVote(voterId, candidateId) {
    if (voterId === candidateId) return { ok: false, error: 'Cannot vote for yourself' };
    const voter = this.players.find(p => p.id === voterId);
    const candidate = this.players.find(p => p.id === candidateId);
    if (!voter || !candidate) return { ok: false, error: 'Invalid player' };
    this.voteTally[voterId] = candidateId;
    this.addLog(`${voter.name} voted.`, 'vote');
    if (Object.keys(this.voteTally).length === this.players.length) {
      return this._resolveVoting();
    }
    return { ok: true, waiting: true };
  }

  _resolveVoting() {
    const tally = {};
    this.players.forEach(p => { tally[p.id] = 0; });
    Object.values(this.voteTally).forEach(id => { tally[id] = (tally[id] || 0) + 1; });
    const maxVotes = Math.max(...Object.values(tally));
    const winners = Object.keys(tally).filter(id => tally[id] === maxVotes);
    if (winners.length > 1) {
      this.voteTally = {};
      this.addLog('Tie! Vote again. Remember, you cannot vote for yourself.', 'system');
      return { ok: true, tie: true };
    }
    this.firstPlayerIndex = this.players.findIndex(p => p.id === winners[0]);
    this.currentPlayerIndex = this.firstPlayerIndex;
    const first = this.players[this.firstPlayerIndex];
    this.addLog(`${first.name} goes first!`, 'system');
    this.state = 'resources';
    return { ok: true, firstPlayer: first };
  }

  // ── RESOURCE DISTRIBUTION ──────────────────────────────────
  // Returns which resources the current setup player needs to pick
  getSetupPlayerIndex() {
    // During resources phase, we go around giving player 1 → 1 pick, player 2 → 2 picks etc.
    // Track via setupPicksDone per player
    if (!this._setupOrder) {
      this._setupOrder = [];
      for (let i = 0; i < this.players.length; i++) {
        const idx = (this.firstPlayerIndex + i) % this.players.length;
        this._setupOrder.push(idx);
        this.players[idx]._setupPicksNeeded = i + 1;
        this.players[idx]._setupPicksDone = 0;
      }
      this._setupOrderIdx = 0;
    }
    return this._setupOrder[this._setupOrderIdx] ?? null;
  }

  pickSetupResource(playerIdx, resourceCard) {
    const p = this.players[playerIdx];
    if (p._setupPicksDone >= p._setupPicksNeeded) return { ok: false, error: 'Already picked enough' };
    // Remove from deck
    const deckIdx = this.decks.resource.findIndex(c => c.id === resourceCard.id);
    if (deckIdx === -1) return { ok: false, error: 'Card not in deck' };
    this.decks.resource.splice(deckIdx, 1);
    p.resources.push(resourceCard);
    p._setupPicksDone++;
    this.addLog(`${p.name} took ${resourceCard.title}.`, 'resource');
    if (p._setupPicksDone >= p._setupPicksNeeded) {
      this._setupOrderIdx++;
      if (this._setupOrderIdx >= this._setupOrder.length) {
        this._beginGame();
        return { ok: true, done: true };
      }
    }
    return { ok: true };
  }

  _beginGame() {
    // Deal 5 cards to each player
    this.players.forEach(p => {
      for (let i = 0; i < 5; i++) {
        const card = this.decks.ideology.pop();
        if (card) p.hand.push(card);
      }
    });
    this.state = 'gameplay';
    this.phase = 'draw';
    this.round = 1;
    this.addLog('Game begins! Round 1 starts now.', 'system');
    this._startTurn();
  }

  // ── GAMEPLAY LOOP ──────────────────────────────────────────
  _startTurn() {
    const p = this.currentPlayer();
    this.phase = 'draw';
    this.actionsThisTurn = 0;
    this.addLog(`${p.name}'s turn begins.`, 'turn');
  }

  currentPlayer() {
    return this.players[this.currentPlayerIndex];
  }

  drawCards(count = 2) {
    if (this.phase !== 'draw') return { ok: false, error: 'Not draw phase' };
    const p = this.currentPlayer();
    let drawn = 0;
    for (let i = 0; i < count; i++) {
      const deck = this._pickDrawDeck();
      if (!deck) break;
      const card = deck.pop();
      if (card) { p.hand.push(card); drawn++; }
    }
    this.addLog(`${p.name} drew ${drawn} card(s).`, 'draw');
    this.phase = 'action';
    return { ok: true, drawn };
  }

  _pickDrawDeck() {
    // weighted: 40% ideology, 40% resource, 15% voter, 5% conspiracy
    const r = Math.random();
    if (r < 0.40 && this.decks.ideology.length) return this.decks.ideology;
    if (r < 0.80 && this.decks.resource.length) return this.decks.resource;
    if (r < 0.95 && this.decks.voter.length) return this.decks.voter;
    if (this.decks.conspiracy.length) return this.decks.conspiracy;
    if (this.decks.ideology.length) return this.decks.ideology;
    if (this.decks.resource.length) return this.decks.resource;
    return null;
  }

  // Actions: campaign, debate, fundraise, attack, play_ideology, play_voter
  takeAction(action, payload = {}) {
    if (this.phase !== 'action') return { ok: false, error: 'Not action phase' };
    if (this.actionsThisTurn >= this.MAX_ACTIONS) return { ok: false, error: 'No actions left this turn' };
    const p = this.currentPlayer();
    let result;
    switch (action) {
      case 'campaign':    result = this._actionCampaign(p, payload); break;
      case 'debate':      result = this._actionDebate(p, payload); break;
      case 'fundraise':   result = this._actionFundraise(p, payload); break;
      case 'attack':      result = this._actionAttack(p, payload); break;
      case 'play_ideology': result = this._actionPlayIdeology(p, payload); break;
      case 'play_voter':  result = this._actionPlayVoter(p, payload); break;
      case 'play_resource': result = this._actionPlayResource(p, payload); break;
      default: return { ok: false, error: 'Unknown action' };
    }
    if (result.ok) {
      this.actionsThisTurn++;
      this._checkWin();
    }
    return result;
  }

  _actionCampaign(p, { region }) {
    if (!region || !REGIONS.includes(region)) return { ok: false, error: 'Choose a valid region' };
    const pegs = 1 + Math.floor(p.policyPoints / 3);
    p.voterPegs[region] = (p.voterPegs[region] || 0) + pegs;
    this.addLog(`${p.name} campaigns in ${region}, gaining ${pegs} voter peg(s).`, 'action');
    return { ok: true };
  }

  _actionDebate(p, { targetId }) {
    const target = this.players.find(pl => pl.id === targetId && pl.id !== p.id);
    if (!target) return { ok: false, error: 'Invalid target' };
    const myRoll = Math.floor(Math.random() * 6) + 1 + p.policyPoints;
    const theirRoll = Math.floor(Math.random() * 6) + 1 + target.policyPoints;
    if (myRoll > theirRoll) {
      const region = REGIONS[Math.floor(Math.random() * REGIONS.length)];
      p.voterPegs[region]++;
      target.voterPegs[region] = Math.max(0, (target.voterPegs[region] || 0) - 1);
      this.addLog(`${p.name} wins debate vs ${target.name}! (${myRoll} vs ${theirRoll}) Gains 1 peg in ${region}.`, 'debate');
    } else {
      this.addLog(`${p.name} loses debate vs ${target.name}. (${myRoll} vs ${theirRoll})`, 'debate');
    }
    return { ok: true };
  }

  _actionFundraise(p, {}) {
    const gained = Math.floor(Math.random() * 3) + 1;
    p.fundingTokens += gained;
    this.addLog(`${p.name} fundraises and gains ${gained} funding token(s). Total: ${p.fundingTokens}`, 'action');
    return { ok: true };
  }

  _actionAttack(p, { cardIndex, targetId }) {
    const card = p.hand[cardIndex];
    if (!card || card.type !== 'conspiracy') return { ok: false, error: 'Must play a conspiracy card' };
    const target = this.players.find(pl => pl.id === targetId && pl.id !== p.id);
    if (!target) return { ok: false, error: 'Invalid target' };
    p.hand.splice(cardIndex, 1);
    this.decks.conspiracyDiscard.push(card);
    this._applyConspiracy(card, p, target);
    this.addLog(`${p.name} plays "${card.title}" against ${target.name}!`, 'conspiracy');
    return { ok: true };
  }

  _applyConspiracy(card, player, target) {
    const pegsLost = card.severity;
    const regions = Object.keys(target.voterPegs);
    const reg = regions.find(r => target.voterPegs[r] > 0) || regions[0];
    target.voterPegs[reg] = Math.max(0, target.voterPegs[reg] - pegsLost);
    this.addLog(`${target.name} loses ${pegsLost} voter peg(s) in ${reg} due to ${card.title}.`, 'conspiracy');
  }

  _actionPlayIdeology(p, { cardIndex }) {
    const card = p.hand[cardIndex];
    if (!card || card.type !== 'ideology') return { ok: false, error: 'Not an ideology card' };
    p.hand.splice(cardIndex, 1);
    p.ideologiesPlayed.push(card);
    p.policyPoints += card.policy_points || 1;
    this.decks.ideologyDiscard.push(card);
    // Apply generic effect: gain pegs
    this._applyCardEffect(card, p);
    this.addLog(`${p.name} plays ideology: "${card.title}" — ${card.description}`, 'ideology');
    return { ok: true };
  }

  _actionPlayVoter(p, { cardIndex }) {
    const card = p.hand[cardIndex];
    if (!card || card.type !== 'voter') return { ok: false, error: 'Not a voter card' };
    const diffMod = card.persuasion === 'easy' ? 0.7 : card.persuasion === 'moderate' ? 0.5 : 0.3;
    const roll = Math.random();
    if (roll < diffMod) {
      p.hand.splice(cardIndex, 1);
      p.votersWon.push(card);
      const region = REGIONS[Math.floor(Math.random() * REGIONS.length)];
      p.voterPegs[region] += card.pegs_on_win;
      this.addLog(`${p.name} wins over "${card.title}"! +${card.pegs_on_win} pegs in ${region}.`, 'voter');
    } else {
      this.addLog(`${p.name} fails to persuade "${card.title}". Card stays in hand.`, 'voter');
    }
    this.decks.voterDiscard.push(card);
    return { ok: true };
  }

  _actionPlayResource(p, { cardIndex, targetId }) {
    const card = p.hand[cardIndex];
    if (!card || card.type !== 'resource') return { ok: false, error: 'Not a resource card' };
    p.hand.splice(cardIndex, 1);
    this.decks.resourceDiscard.push(card);
    this._applyResourceEffect(card, p, targetId ? this.players.find(pl => pl.id === targetId) : null);
    this.addLog(`${p.name} plays resource: "${card.title}" — ${card.description}`, 'resource');
    return { ok: true };
  }

  _applyCardEffect(card, player) {
    // Parse simple effects from description
    const effect = card.effect || '';
    const pegMatch = effect.match(/gain (\d+) voter peg/);
    if (pegMatch) {
      const num = parseInt(pegMatch[1]);
      const region = REGIONS[Math.floor(Math.random() * REGIONS.length)];
      player.voterPegs[region] = (player.voterPegs[region] || 0) + num;
    }
    const fundMatch = effect.match(/gain (\d+) funding/);
    if (fundMatch) {
      player.fundingTokens += parseInt(fundMatch[1]);
    }
  }

  _applyResourceEffect(card, player, target) {
    const effect = card.effect || '';
    if (effect.includes('gain') && effect.includes('voter peg')) {
      const m = effect.match(/gain (\d+)/);
      const num = m ? parseInt(m[1]) : 1;
      const region = REGIONS[Math.floor(Math.random() * REGIONS.length)];
      player.voterPegs[region] = (player.voterPegs[region] || 0) + num;
    } else if (effect.includes('gain') && effect.includes('funding')) {
      const m = effect.match(/gain (\d+)/);
      player.fundingTokens += m ? parseInt(m[1]) : 1;
    } else if (effect.includes('draw')) {
      const deck = this._pickDrawDeck();
      if (deck) { const c = deck.pop(); if (c) player.hand.push(c); }
    }
    if (target && effect.includes('opponent loses')) {
      const m = effect.match(/loses (\d+) voter peg/);
      if (m) {
        const num = parseInt(m[1]);
        const region = REGIONS.find(r => target.voterPegs[r] > 0) || REGIONS[0];
        target.voterPegs[region] = Math.max(0, target.voterPegs[region] - num);
      }
    }
  }

  endTurn() {
    if (this.phase !== 'action') return { ok: false, error: 'Not in action phase' };
    const p = this.currentPlayer();
    // Discard to max hand size 7
    while (p.hand.length > 7) {
      const discarded = p.hand.pop();
      if (discarded.type === 'ideology') this.decks.ideologyDiscard.push(discarded);
      else if (discarded.type === 'resource') this.decks.resourceDiscard.push(discarded);
      else if (discarded.type === 'voter') this.decks.voterDiscard.push(discarded);
      else this.decks.conspiracyDiscard.push(discarded);
    }
    this.addLog(`${p.name} ends their turn.`, 'turn');
    this._advanceTurn();
    return { ok: true };
  }

  _advanceTurn() {
    this.currentPlayerIndex = (this.currentPlayerIndex + 1) % this.players.length;
    if (this.currentPlayerIndex === this.firstPlayerIndex) {
      this.round++;
      this.addLog(`--- Round ${this.round} begins ---`, 'system');
      if (this.round > WIN_CONDITIONS.rounds) {
        this._triggerElection();
        return;
      }
    }
    this._startTurn();
  }

  _checkWin() {
    const totalPegs = p => Object.values(p.voterPegs).reduce((a, b) => a + b, 0);
    const leader = this.players.reduce((a, b) => totalPegs(a) > totalPegs(b) ? a : b);
    if (totalPegs(leader) >= WIN_CONDITIONS.voterPegs) {
      this.winner = leader;
      this.state = 'gameover';
      this.addLog(`🎉 ${leader.name} wins the election with ${totalPegs(leader)} voter pegs!`, 'win');
    }
  }

  _triggerElection() {
    this.state = 'election';
    this.addLog('Election Day! Counting votes...', 'system');
    const totalPegs = p => Object.values(p.voterPegs).reduce((a, b) => a + b, 0);
    const sorted = [...this.players].sort((a, b) => totalPegs(b) - totalPegs(a));
    this.winner = sorted[0];
    this.addLog(`🗳️ ${this.winner.name} wins the national election with ${totalPegs(this.winner)} voter pegs!`, 'win');
    setTimeout(() => { this.state = 'gameover'; if (window.ui) window.ui.render(); }, 2000);
  }

  getScore(player) {
    return Object.values(player.voterPegs).reduce((a, b) => a + b, 0);
  }

  getLeaderboard() {
    return [...this.players].sort((a, b) => this.getScore(b) - this.getScore(a));
  }

  resetGame() {
    Object.assign(this, new ShashnGame());
    this.addLog('New game started.', 'system');
  }
}
