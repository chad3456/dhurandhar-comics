// ============================================================
// SHASHN UI RENDERER
// ============================================================

class ShashnUI {
  constructor(game) {
    this.game = game;
    this.simulator = null;
    this.selectedCardIndex = null;
    this.root = document.getElementById('app');
  }

  render() {
    const g = this.game;
    switch (g.state) {
      case 'lobby':    this.renderLobby(); break;
      case 'vote':     this.renderVote(); break;
      case 'resources':this.renderResources(); break;
      case 'gameplay': this.renderGameplay(); break;
      case 'election': this.renderElection(); break;
      case 'gameover': this.renderGameOver(); break;
      default: this.renderLobby();
    }
  }

  // ── LOBBY ──────────────────────────────────────────────────
  renderLobby() {
    const g = this.game;
    const takenColors = g.selectedColors;
    const availColors = Object.keys(PLAYER_COLORS).filter(c => !takenColors.has(c));

    this.root.innerHTML = `
      <div class="screen lobby">
        <div class="hero">
          <h1 class="logo">SHASHN</h1>
          <p class="tagline">The Game of Power, Politics &amp; Persuasion</p>
          <p class="subtitle">2–5 players take on the role of politicians competing in a national election.
          Build your political persona, answer tough policy questions, manage resources, influence voters,
          and outmaneuver rivals to seize power.</p>
        </div>

        <div class="deck-stats">
          <div class="stat-pill">🗳️ 108 Ideology Cards</div>
          <div class="stat-pill">💰 120 Resource Cards</div>
          <div class="stat-pill">👥 60 Voter Cards</div>
          <div class="stat-pill">🕵️ 20 Conspiracy Cards</div>
        </div>

        <div class="lobby-panel">
          <h2>Add Players (${g.players.length}/5)</h2>
          <div class="player-list">
            ${g.players.map(p => `
              <div class="player-chip" style="background:${PLAYER_COLORS[p.color].hex};color:${PLAYER_COLORS[p.color].text}">
                <span>${p.name}</span>
                <button class="chip-remove" data-remove="${p.id}">✕</button>
              </div>
            `).join('') || '<p class="muted">No players yet. Add at least 2 to begin.</p>'}
          </div>

          ${g.players.length < 5 ? `
            <div class="add-player-form">
              <input type="text" id="playerName" placeholder="Politician name..." maxlength="28" />
              <div class="color-picker">
                ${availColors.map(c => `
                  <button class="color-swatch" data-color="${c}" style="background:${PLAYER_COLORS[c].hex}" title="${PLAYER_COLORS[c].name}"></button>
                `).join('')}
              </div>
            </div>
            <p class="hint">Pick a name, then click a color to add the player.</p>
          ` : '<p class="muted">Maximum players reached.</p>'}

          <div class="lobby-actions">
            <button class="btn btn-primary ${g.players.length < 2 ? 'disabled' : ''}" id="startGame"
              ${g.players.length < 2 ? 'disabled' : ''}>
              Start Game →
            </button>
            <button class="btn btn-secondary" id="runSimulator">▶ Watch Simulator</button>
          </div>
        </div>

        <div class="rules-summary">
          <h3>How to Start</h3>
          <ol>
            <li>Each player selects a <strong>color</strong> and takes a player mat &amp; voter pegs.</li>
            <li>All players <strong>vote</strong> to determine player #1 (you cannot vote for yourself; ties = revote).</li>
            <li>Players take turns clockwise.</li>
            <li>Player 1 takes <strong>1 resource</strong>, player 2 takes <strong>2</strong>, player 3 takes <strong>3</strong>, and so on — kept on their player mats.</li>
            <li>Answer policy questions, build your arsenal, influence voters, and adapt to conspiracies to win the election!</li>
          </ol>
        </div>
      </div>
    `;
    this._bindLobby(availColors);
  }

  _bindLobby(availColors) {
    const g = this.game;
    let chosenColor = availColors[0];
    this.root.querySelectorAll('.color-swatch').forEach(btn => {
      btn.onclick = () => {
        const name = document.getElementById('playerName').value;
        const color = btn.dataset.color;
        const res = g.addPlayer(name, color);
        if (!res.ok) { this._toast(res.error); return; }
        this.render();
      };
    });
    this.root.querySelectorAll('[data-remove]').forEach(btn => {
      btn.onclick = () => { g.removePlayer(btn.dataset.remove); this.render(); };
    });
    const startBtn = document.getElementById('startGame');
    if (startBtn) startBtn.onclick = () => {
      const res = g.startSetup();
      if (!res.ok) { this._toast(res.error); return; }
      this.render();
    };
    const simBtn = document.getElementById('runSimulator');
    if (simBtn) simBtn.onclick = () => this.startSimulator();
    const nameInput = document.getElementById('playerName');
    if (nameInput) nameInput.onkeydown = (e) => {
      if (e.key === 'Enter' && availColors.length) {
        const res = g.addPlayer(nameInput.value, availColors[0]);
        if (!res.ok) { this._toast(res.error); return; }
        this.render();
      }
    };
  }

  // ── VOTING ─────────────────────────────────────────────────
  renderVote() {
    const g = this.game;
    const voted = Object.keys(g.voteTally);
    const nextVoter = g.players.find(p => !voted.includes(p.id));

    this.root.innerHTML = `
      <div class="screen vote-screen">
        <h2>🗳️ Vote for Player #1</h2>
        <p class="subtitle">Players cannot vote for themselves. In case of a tie, vote again.</p>
        ${nextVoter ? `
          <div class="vote-card" style="border-color:${PLAYER_COLORS[nextVoter.color].hex}">
            <h3 style="color:${PLAYER_COLORS[nextVoter.color].hex}">${nextVoter.name}, cast your vote:</h3>
            <div class="vote-options">
              ${g.players.filter(p => p.id !== nextVoter.id).map(p => `
                <button class="btn vote-btn" data-vote="${p.id}"
                  style="background:${PLAYER_COLORS[p.color].hex};color:${PLAYER_COLORS[p.color].text}">
                  ${p.name}
                </button>
              `).join('')}
            </div>
          </div>
        ` : '<p>Tallying votes...</p>'}
        <div class="vote-progress">${voted.length} / ${g.players.length} votes cast</div>
      </div>
    `;
    this.root.querySelectorAll('[data-vote]').forEach(btn => {
      btn.onclick = () => {
        const res = g.castVote(nextVoter.id, btn.dataset.vote);
        if (res.tie) this._toast('Tie! Everyone votes again.');
        this.render();
      };
    });
  }

  // ── RESOURCES ──────────────────────────────────────────────
  renderResources() {
    const g = this.game;
    const idx = g.getSetupPlayerIndex();
    if (idx === null) { this.render(); return; }
    const p = g.players[idx];
    const remaining = p._setupPicksNeeded - p._setupPicksDone;
    const options = g.decks.resource.slice(0, 8);

    this.root.innerHTML = `
      <div class="screen resource-screen">
        <h2>Resource Distribution</h2>
        <p class="subtitle">Player 1 takes 1 resource, player 2 takes 2, and so on — kept on their player mats.</p>
        <div class="current-picker" style="border-color:${PLAYER_COLORS[p.color].hex}">
          <h3 style="color:${PLAYER_COLORS[p.color].hex}">${p.name}</h3>
          <p>Choose <strong>${remaining}</strong> more resource(s). (${p._setupPicksDone}/${p._setupPicksNeeded} picked)</p>
        </div>
        <div class="card-grid">
          ${options.map(c => this._cardHTML(c, { pickable: true })).join('')}
        </div>
        <div class="picked-so-far">
          <h4>${p.name}'s arsenal:</h4>
          <div class="mini-cards">
            ${p.resources.map(c => `<span class="mini-card cat-${this._catClass(c.category)}">${c.title}</span>`).join('') || '<span class="muted">None yet</span>'}
          </div>
        </div>
      </div>
    `;
    this.root.querySelectorAll('[data-pick]').forEach(btn => {
      btn.onclick = () => {
        const card = options.find(c => c.id === btn.dataset.pick);
        g.pickSetupResource(idx, card);
        this.render();
      };
    });
  }

  // ── GAMEPLAY ───────────────────────────────────────────────
  renderGameplay() {
    const g = this.game;
    const p = g.currentPlayer();
    const isSimMode = this.simulator && this.simulator.running;

    this.root.innerHTML = `
      <div class="screen gameplay">
        <div class="game-header">
          <div class="round-info">
            <span class="round-badge">Round ${g.round}/${WIN_CONDITIONS.rounds}</span>
            <span class="phase-badge">${g.phase === 'draw' ? 'Draw Phase' : 'Action Phase'} · ${g.MAX_ACTIONS - g.actionsThisTurn} actions left</span>
          </div>
          <div class="turn-indicator" style="background:${PLAYER_COLORS[p.color].hex};color:${PLAYER_COLORS[p.color].text}">
            ${p.name}'s Turn
          </div>
          ${isSimMode ? '<button class="btn btn-small" id="stopSim">⏹ Stop Sim</button>' :
            '<button class="btn btn-small" id="quitGame">Exit</button>'}
        </div>

        <div class="game-body">
          <div class="players-column">
            ${g.players.map(pl => this._playerMatHTML(pl, pl.id === p.id)).join('')}
          </div>

          <div class="action-column">
            ${!isSimMode ? this._actionPanelHTML(p, g) : '<div class="sim-banner">🤖 Simulator Running...</div>'}
            ${!isSimMode ? this._handHTML(p, g) : ''}
          </div>

          <div class="log-column">
            <h4>Campaign Feed</h4>
            <div class="log-feed">
              ${g.log.slice(0, 30).map(l => `<div class="log-entry log-${l.type}">${l.msg}</div>`).join('')}
            </div>
          </div>
        </div>
      </div>
    `;
    this._bindGameplay(p, g, isSimMode);
  }

  _playerMatHTML(pl, isCurrent) {
    const g = this.game;
    const score = g.getScore(pl);
    const col = PLAYER_COLORS[pl.color];
    return `
      <div class="player-mat ${isCurrent ? 'active-mat' : ''}" style="border-color:${col.hex}">
        <div class="mat-header" style="background:${col.hex};color:${col.text}">
          <span class="mat-name">${pl.name}</span>
          <span class="mat-score">${score} pegs</span>
        </div>
        <div class="mat-body">
          <div class="peg-regions">
            ${REGIONS.map(r => `
              <div class="region-row">
                <span class="region-name">${r}</span>
                <div class="pegs">
                  ${Array.from({length: Math.min(pl.voterPegs[r] || 0, 12)}).map(() =>
                    `<span class="peg" style="background:${col.hex}"></span>`).join('')}
                  ${(pl.voterPegs[r] || 0) > 12 ? `<span class="peg-overflow">+${pl.voterPegs[r] - 12}</span>` : ''}
                  ${(pl.voterPegs[r] || 0) === 0 ? '<span class="peg-empty">—</span>' : ''}
                </div>
              </div>
            `).join('')}
          </div>
          <div class="mat-stats">
            <span title="Funding Tokens">💰 ${pl.fundingTokens}</span>
            <span title="Policy Points">📜 ${pl.policyPoints}</span>
            <span title="Resources">🎴 ${pl.resources.length}</span>
            <span title="Cards in hand">✋ ${pl.hand.length}</span>
            <span title="Voters won">👥 ${pl.votersWon.length}</span>
          </div>
          <div class="win-bar">
            <div class="win-fill" style="width:${Math.min(100, (score / WIN_CONDITIONS.voterPegs) * 100)}%;background:${col.hex}"></div>
          </div>
        </div>
      </div>
    `;
  }

  _actionPanelHTML(p, g) {
    if (g.phase === 'draw') {
      return `
        <div class="action-panel">
          <h3>Draw Phase</h3>
          <p>Draw 2 cards to start your turn.</p>
          <button class="btn btn-primary" id="drawBtn">🎴 Draw 2 Cards</button>
        </div>
      `;
    }
    const others = g.players.filter(pl => pl.id !== p.id);
    return `
      <div class="action-panel">
        <h3>Choose Actions (${g.MAX_ACTIONS - g.actionsThisTurn} left)</h3>
        <div class="action-buttons">
          <div class="action-group">
            <label>🎤 Campaign (gain pegs)</label>
            <div class="region-buttons">
              ${REGIONS.map(r => `<button class="btn btn-action" data-campaign="${r}">${r}</button>`).join('')}
            </div>
          </div>
          <div class="action-group">
            <label>💰 Fundraise</label>
            <button class="btn btn-action" id="fundraiseBtn">Raise Funds</button>
          </div>
          <div class="action-group">
            <label>⚔️ Debate a rival</label>
            <div class="target-buttons">
              ${others.map(o => `<button class="btn btn-action" data-debate="${o.id}">${o.name}</button>`).join('')}
            </div>
          </div>
        </div>
        <button class="btn btn-secondary btn-end" id="endTurnBtn">End Turn →</button>
      </div>
    `;
  }

  _handHTML(p, g) {
    return `
      <div class="hand-area">
        <h4>Your Hand (${p.hand.length})</h4>
        <div class="hand-cards">
          ${p.hand.map((c, i) => this._cardHTML(c, { handIndex: i, playable: g.phase === 'action' && g.actionsThisTurn < g.MAX_ACTIONS })).join('')
            || '<p class="muted">No cards in hand.</p>'}
        </div>
      </div>
    `;
  }

  _cardHTML(card, opts = {}) {
    const cat = this._catClass(card.category || card.type);
    let body = '';
    if (card.type === 'ideology') {
      body = `
        <div class="card-cat">${card.category}</div>
        <div class="card-title">${card.title}</div>
        <div class="card-stance stance-${(card.stance||'').replace(/[^a-z]/g,'')}">${card.stance || ''}</div>
        <div class="card-desc">${card.description}</div>
        <div class="card-effect">⚡ ${card.effect}</div>
        <div class="card-foot">📜 ${card.policy_points} policy pts</div>
      `;
    } else if (card.type === 'resource') {
      body = `
        <div class="card-cat">${card.category}</div>
        <div class="card-title">${card.title}</div>
        <div class="card-power">Power ${'★'.repeat(card.power)}</div>
        <div class="card-desc">${card.description}</div>
        <div class="card-effect">⚡ ${card.effect}</div>
      `;
    } else if (card.type === 'voter') {
      body = `
        <div class="card-cat">VOTER BLOC</div>
        <div class="card-title">${card.title}</div>
        <div class="card-meta">${card.bloc_size} · ${card.persuasion} · +${card.pegs_on_win} pegs</div>
        <div class="card-desc">${card.description}</div>
        <div class="card-effect">Issues: ${(card.issues||[]).join(', ')}</div>
      `;
    } else if (card.type === 'conspiracy') {
      body = `
        <div class="card-cat">🕵️ CONSPIRACY</div>
        <div class="card-title">${card.title}</div>
        <div class="card-power">Severity ${'☠'.repeat(card.severity)}</div>
        <div class="card-desc">${card.description}</div>
        <div class="card-effect">⚡ ${card.effect}</div>
        <div class="card-foot">Counter: ${card.counter}</div>
      `;
    }
    const actionAttr = opts.pickable ? `data-pick="${card.id}"` :
                       opts.handIndex !== undefined ? `data-hand="${opts.handIndex}"` : '';
    return `<div class="game-card cat-${cat} ${opts.playable ? 'playable' : ''} ${opts.pickable ? 'pickable' : ''}" ${actionAttr}>${body}</div>`;
  }

  _bindGameplay(p, g, isSimMode) {
    if (isSimMode) {
      const stop = document.getElementById('stopSim');
      if (stop) stop.onclick = () => { this.simulator.stop(); this.render(); };
      return;
    }
    const quit = document.getElementById('quitGame');
    if (quit) quit.onclick = () => { if (confirm('Exit to lobby?')) { g.resetGame(); this.render(); } };

    const draw = document.getElementById('drawBtn');
    if (draw) draw.onclick = () => { g.drawCards(2); this.render(); };

    this.root.querySelectorAll('[data-campaign]').forEach(btn => {
      btn.onclick = () => { this._doAction('campaign', { region: btn.dataset.campaign }); };
    });
    this.root.querySelectorAll('[data-debate]').forEach(btn => {
      btn.onclick = () => { this._doAction('debate', { targetId: btn.dataset.debate }); };
    });
    const fund = document.getElementById('fundraiseBtn');
    if (fund) fund.onclick = () => { this._doAction('fundraise', {}); };

    const end = document.getElementById('endTurnBtn');
    if (end) end.onclick = () => { g.endTurn(); this.render(); };

    this.root.querySelectorAll('[data-hand]').forEach(card => {
      card.onclick = () => this._playHandCard(parseInt(card.dataset.hand), p, g);
    });
  }

  _playHandCard(index, p, g) {
    if (g.phase !== 'action' || g.actionsThisTurn >= g.MAX_ACTIONS) {
      this._toast('No actions left or not action phase.');
      return;
    }
    const card = p.hand[index];
    if (!card) return;
    if (card.type === 'ideology') {
      this._doAction('play_ideology', { cardIndex: index });
    } else if (card.type === 'voter') {
      this._doAction('play_voter', { cardIndex: index });
    } else if (card.type === 'resource') {
      this._doAction('play_resource', { cardIndex: index });
    } else if (card.type === 'conspiracy') {
      const others = g.players.filter(pl => pl.id !== p.id);
      const target = this._promptTarget(others);
      if (target) this._doAction('attack', { cardIndex: index, targetId: target });
    }
  }

  _promptTarget(others) {
    if (others.length === 1) return others[0].id;
    const names = others.map((o, i) => `${i + 1}. ${o.name}`).join('\n');
    const choice = prompt(`Target which rival?\n${names}\n\nEnter number:`);
    const idx = parseInt(choice) - 1;
    return others[idx] ? others[idx].id : null;
  }

  _doAction(action, payload) {
    const res = this.game.takeAction(action, payload);
    if (!res.ok) { this._toast(res.error); return; }
    this.render();
  }

  // ── ELECTION / GAMEOVER ────────────────────────────────────
  renderElection() {
    const g = this.game;
    this.root.innerHTML = `
      <div class="screen election-screen">
        <h1 class="election-title">🗳️ ELECTION DAY</h1>
        <p class="subtitle">The votes are being counted...</p>
        <div class="counting">${g.getLeaderboard().map(p => `
          <div class="count-row" style="border-color:${PLAYER_COLORS[p.color].hex}">
            <span>${p.name}</span><span>${g.getScore(p)} pegs</span>
          </div>
        `).join('')}</div>
      </div>
    `;
  }

  renderGameOver() {
    const g = this.game;
    const board = g.getLeaderboard();
    const winner = g.winner || board[0];
    this.root.innerHTML = `
      <div class="screen gameover-screen">
        <div class="confetti">🎉</div>
        <h1>${winner.name} Wins!</h1>
        <p class="subtitle">Elected to lead the nation with ${g.getScore(winner)} voter pegs.</p>
        <div class="final-board">
          <h3>Final Results</h3>
          ${board.map((p, i) => `
            <div class="final-row ${i === 0 ? 'winner-row' : ''}" style="border-color:${PLAYER_COLORS[p.color].hex}">
              <span class="rank">#${i + 1}</span>
              <span class="fname" style="color:${PLAYER_COLORS[p.color].hex}">${p.name}</span>
              <span class="fscore">${g.getScore(p)} pegs</span>
              <span class="fstats">💰${p.fundingTokens} · 📜${p.ideologiesPlayed.length} · 👥${p.votersWon.length}</span>
            </div>
          `).join('')}
        </div>
        <button class="btn btn-primary" id="newGame">Play Again</button>
      </div>
    `;
    document.getElementById('newGame').onclick = () => { g.resetGame(); this.render(); };
  }

  // ── SIMULATOR ──────────────────────────────────────────────
  startSimulator() {
    this.game.resetGame();
    this.simulator = new ShashnSimulator(this.game, this);
    this.simulator.start();
    // Render loop driven by simulator's addCommentary calls
    const tick = setInterval(() => {
      this.render();
      if (!this.simulator.running && this.game.state === 'gameover') {
        clearInterval(tick);
      }
    }, 600);
  }

  // ── HELPERS ────────────────────────────────────────────────
  _catClass(cat) {
    return (cat || '').toLowerCase().replace(/[^a-z]/g, '').slice(0, 12) ||
      'default';
  }

  _toast(msg) {
    let t = document.getElementById('toast');
    if (!t) {
      t = document.createElement('div');
      t.id = 'toast';
      t.className = 'toast';
      document.body.appendChild(t);
    }
    t.textContent = msg;
    t.classList.add('show');
    setTimeout(() => t.classList.remove('show'), 2200);
  }
}

// ── BOOTSTRAP ────────────────────────────────────────────────
window.addEventListener('DOMContentLoaded', () => {
  window.game = new ShashnGame();
  window.ui = new ShashnUI(window.game);
  window.ui.render();
});
