// ============================================================
// QUIZZY — Vanilla JS UI Renderer
// Renders Monopoly board game + Office Party Games.
// Single event-delegation listener on #app. Full re-render
// on every game action.
// ============================================================

const CATEGORY_CLASS = {
  'Team Building': 'cat-TeamBuilding',
  'Word Games': 'cat-WordGames',
};
function catClass(cat) {
  return CATEGORY_CLASS[cat] || 'cat-' + cat.replace(/\s+/g, '');
}

// Grid placement for each of the 40 board spaces: [col, row] (1-indexed).
function spaceGridPos(i) {
  if (i === 0) return [11, 11];
  if (i >= 1 && i <= 9) return [11 - i, 11];
  if (i === 10) return [1, 11];
  if (i >= 11 && i <= 19) return [1, 11 - (i - 10)];
  if (i === 20) return [1, 1];
  if (i >= 21 && i <= 29) return [i - 19, 1];
  if (i === 30) return [11, 1];
  if (i >= 31 && i <= 39) return [11, (i - 30) + 1];
  return [1, 1];
}

function spaceSideClass(i) {
  if (i === 0) return 'sp-bottom sp-corner-br';
  if (i >= 1 && i <= 9) return 'sp-bottom';
  if (i === 10) return 'sp-bottom sp-corner-bl';
  if (i >= 11 && i <= 19) return 'sp-left';
  if (i === 20) return 'sp-top sp-corner-tl';
  if (i >= 21 && i <= 29) return 'sp-top';
  if (i === 30) return 'sp-top sp-corner-tr';
  if (i >= 31 && i <= 39) return 'sp-right';
  return '';
}

function esc(s) {
  return String(s).replace(/[&<>"']/g, c => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ));
}

const DIE_FACE = ['', '⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];

class QuizzyUI {
  constructor(game) {
    this.game = game;
    this.app = null;
    this.tab = 'monopoly';        // monopoly | party
    this.filter = 'All';
    this.openRule = null;
    this.openGameId = null;
    this.showPropMgr = false;
    this.showTrade = false;
    this.showLeaderboard = false;
    this.diceAnimating = false;
    this._toastTimer = null;
    // lobby setup state
    this.setupPlayers = [
      { name: 'Player 1', emoji: TOKEN_EMOJIS[0], color: PLAYER_COLORS[0] },
      { name: 'Player 2', emoji: TOKEN_EMOJIS[1], color: PLAYER_COLORS[1] },
    ];
  }

  init() {
    this.app = document.getElementById('app');
    this.app.addEventListener('click', e => this._onClick(e));
    this.app.addEventListener('input', e => this._onInput(e));
    this.render();
  }

  render() {
    const inGame = this.game.state !== 'setup';
    if (this.tab === 'party') {
      this.app.innerHTML = this._chrome(this._renderPartyGames());
    } else if (inGame) {
      this.app.innerHTML = this._chrome(this._renderGame(), true);
    } else {
      this.app.innerHTML = this._chrome(this._renderLobby());
    }
  }

  _chrome(inner, wide) {
    return `
      <div class="screen${wide ? ' wide' : ''}">
        <header class="party-header">
          <div>
            <h1 class="board-center-title" style="font-size:1.8rem;letter-spacing:.08em;">Quizzy</h1>
            <p class="board-center-subtitle" style="color:var(--muted)">Board Games &amp; Office Party Games</p>
          </div>
        </header>
        <div class="tab-bar">
          <button class="tab-btn${this.tab === 'monopoly' ? ' active' : ''}" data-act="tab" data-tab="monopoly">
            <span class="tab-icon">🎲</span> Monopoly Board Game
          </button>
          <button class="tab-btn${this.tab === 'party' ? ' active' : ''}" data-act="tab" data-tab="party">
            <span class="tab-icon">🎉</span> Party Games
          </button>
        </div>
        ${inner}
      </div>
    `;
  }

  // ── LOBBY ────────────────────────────────────────────────
  _renderLobby() {
    const slots = this.setupPlayers.map((p, idx) => `
      <div class="player-slot">
        <div class="token-picker">
          ${TOKEN_EMOJIS.map((em, ti) => `
            <button class="token-btn${p.emoji === em ? ' selected' : ''}"
              data-act="pick-token" data-idx="${idx}" data-em="${em}" data-color="${PLAYER_COLORS[ti]}"
              style="border-color:${p.emoji === em ? PLAYER_COLORS[ti] : 'transparent'}">${em}</button>
          `).join('')}
        </div>
        <input class="player-name-input" data-act="player-name" data-idx="${idx}"
          value="${esc(p.name)}" maxlength="16" placeholder="Player name" />
        ${this.setupPlayers.length > 2
          ? `<button class="btn btn-ghost slot-remove" data-act="remove-player" data-idx="${idx}">✕</button>`
          : ''}
      </div>
    `).join('');

    const rules = [
      ['Objective', 'Be the last player standing. Bankrupt everyone else by collecting rent and managing your money.'],
      ['Rolling & Moving', 'Roll two dice and move clockwise. Roll doubles for an extra turn — but three doubles in a row sends you to Jail.'],
      ['Buying Property', 'Land on an unowned property, railroad, or utility and choose to buy it at face value, or pass.'],
      ['Rent', 'Land on an opponent\'s property and pay rent. Owning a full color group doubles base rent and lets you build houses.'],
      ['Houses & Hotels', 'Build evenly across a color group you fully own. Five houses become a hotel. Buildings multiply rent.'],
      ['Railroads & Utilities', 'Railroad rent scales with how many you own (25/50/100/200). Utility rent is dice × 4, or × 10 if you own both.'],
      ['Chance & Community Chest', 'Draw a card and follow its instructions — money, movement, jail, or repairs.'],
      ['Jail', 'Get out by rolling doubles, paying $50, or using a Get Out of Jail Free card. After 3 turns you must pay.'],
      ['Mortgages & Trades', 'Mortgage properties for quick cash (unmortgage costs +10%). Trade money and properties with other players.'],
      ['Taxes & Free Parking', 'Pay Income/Luxury Tax into the pot. Land on Free Parking to collect the accumulated jackpot.'],
    ];

    return `
      <div class="lobby-screen">
        <div class="setup-card">
          <h2>🎲 New Monopoly Game</h2>
          <div class="player-slots">${slots}</div>
          <div class="add-player-row">
            ${this.setupPlayers.length < 6
              ? `<button class="btn btn-ghost" data-act="add-player">+ Add Player</button>`
              : `<span class="mat-status">Maximum 6 players</span>`}
          </div>
          <button class="btn btn-primary" data-act="start-game" style="margin-top:1rem;width:100%">
            Start Game (${this.setupPlayers.length} players)
          </button>
        </div>

        <div class="setup-card">
          <h2>📖 How to Play</h2>
          <div class="rules-accordion">
            ${rules.map(([title, body], i) => `
              <div class="rule-section">
                <div class="rule-header" data-act="toggle-rule" data-rule="${i}">
                  <span>${title}</span>
                  <span class="rule-chevron">${this.openRule === i ? '▾' : '▸'}</span>
                </div>
                ${this.openRule === i ? `<div class="rule-body">${esc(body)}</div>` : ''}
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;
  }

  // ── GAME ─────────────────────────────────────────────────
  _renderGame() {
    return `
      <div class="game-layout">
        <div class="left-panel">
          <div class="panel-card">
            <h3>Players</h3>
            ${this._playerMatsHTML()}
          </div>
        </div>
        <div class="board-container">
          ${this._buildBoard()}
        </div>
        <div class="right-panel">
          <div class="panel-card">
            <h3>Dice</h3>
            ${this._diceHTML()}
            ${this._actionsHTML()}
          </div>
          <div class="panel-card">
            <h3>Activity Log</h3>
            ${this._logHTML()}
          </div>
        </div>
      </div>
      ${this.game.pendingCard ? this._cardPopupHTML(this.game.pendingCard.card, this.game.pendingCard.deck) : ''}
      ${this.showPropMgr ? this._propManagerHTML() : ''}
      ${this.showTrade ? this._tradeModalHTML() : ''}
      ${this.showLeaderboard ? this._leaderboardHTML() : ''}
      ${this.game.state === 'gameover' ? this._gameOverHTML() : ''}
    `;
  }

  _buildBoard() {
    let html = '<div class="board">';
    html += `
      <div class="board-center">
        <div class="board-logo">🎩</div>
        <div class="board-center-title">QUIZZY</div>
        <div class="board-center-subtitle">MONOPOLY</div>
      </div>`;
    for (let i = 0; i < 40; i++) html += this._spaceHTML(i);
    html += '</div>';
    return html;
  }

  _spaceHTML(i) {
    const sp = BOARD[i];
    const [col, row] = spaceGridPos(i);
    const side = spaceSideClass(i);
    const style = `grid-column:${col};grid-row:${row};`;

    const tokens = this.game.players
      .filter(p => !p.bankrupt && p.position === i)
      .map(p => `<span class="board-token" style="color:${p.color}" title="${esc(p.name)}">${p.emoji}</span>`)
      .join('');
    const tokensHTML = tokens ? `<div class="board-tokens">${tokens}</div>` : '';
    const hasPlayer = tokens ? ' has-player' : '';

    const isCorner = i === 0 || i === 10 || i === 20 || i === 30;
    if (isCorner) {
      const cornerIcon = { 0: '➡️', 10: '🔒', 20: '🅿️', 30: '🚓' }[i];
      const cornerLabel = { 0: 'GO', 10: 'JAIL', 20: 'FREE PARKING', 30: 'GO TO JAIL' }[i];
      return `
        <div class="${side}" style="${style}">
          <div class="board-space corner-space${hasPlayer}" data-space="${i}">
            <span class="corner-icon">${cornerIcon}</span>
            <span>${cornerLabel}</span>
            ${tokensHTML}
          </div>
        </div>`;
    }

    let colorBar = '';
    const owner = this.game.properties[i];
    if (sp.type === 'property') {
      const hex = COLOR_GROUPS[sp.color] ? COLOR_GROUPS[sp.color].hex : '#999';
      colorBar = `<div class="space-color-bar" style="background:${hex}"></div>`;
    }

    let icon = '';
    if (sp.type === 'railroad') icon = '<span class="space-icon">🚂</span>';
    else if (sp.type === 'utility') icon = `<span class="space-icon">${sp.id === 12 ? '💡' : '🚰'}</span>`;
    else if (sp.type === 'chance') icon = '<span class="space-icon">❓</span>';
    else if (sp.type === 'community') icon = '<span class="space-icon">📦</span>';
    else if (sp.type === 'tax') icon = '<span class="space-icon">💸</span>';

    const price = sp.price ? `<span class="space-price">$${sp.price}</span>` : '';

    let ownerTag = '';
    if (owner) {
      const op = this.game.players.find(p => p.id === owner);
      const bld = this.game.buildings[i];
      let blds = '';
      if (bld) {
        if (bld.hotel) blds = ' 🏨';
        else if (bld.houses) blds = ' ' + '🏠'.repeat(bld.houses);
      }
      const mort = this.game.mortgaged[i] ? ' (M)' : '';
      ownerTag = `<span class="space-price" style="color:${op ? op.color : '#999'}">●${blds}${mort}</span>`;
    }

    return `
      <div class="${side}" style="${style}">
        <div class="board-space${hasPlayer}" data-space="${i}">
          ${colorBar}
          ${icon}
          <span class="space-name">${esc(sp.name)}</span>
          ${price}
          ${ownerTag}
          ${tokensHTML}
        </div>
      </div>`;
  }

  _playerMatsHTML() {
    const cur = this.game.currentPlayer();
    return this.game.players.map(p => {
      const active = cur && cur.id === p.id && this.game.state === 'playing';
      const props = this.game.getOwnedProperties(p.id);
      const dots = props.map(sp => {
        const hex = sp.type === 'property' && COLOR_GROUPS[sp.color]
          ? COLOR_GROUPS[sp.color].hex
          : (sp.type === 'railroad' ? '#222' : '#888');
        return `<span class="prop-dot" style="background:${hex}" title="${esc(sp.name)}"></span>`;
      }).join('');
      const jail = p.inJail ? `<div class="mat-jail">🔒 In Jail (${p.jailTurns}/3)</div>` : '';
      const cards = p.jailFreeCards > 0 ? ` · 🎟️×${p.jailFreeCards}` : '';
      return `
        <div class="player-mat${active ? ' active-mat' : ''}${p.bankrupt ? ' bankrupt' : ''}"
          style="border-left-color:${p.color}">
          <div class="mat-top">
            <span class="mat-name"><span class="mat-token">${p.emoji}</span> ${esc(p.name)}${p.bankrupt ? ' 💀' : ''}</span>
            <span class="mat-money">$${p.money}</span>
          </div>
          <div class="mat-status">${props.length} propert${props.length === 1 ? 'y' : 'ies'}${cards}</div>
          ${dots ? `<div class="mat-props">${dots}</div>` : ''}
          ${jail}
        </div>`;
    }).join('');
  }

  _diceHTML() {
    const [d1, d2] = this.game.lastDice;
    const doubles = d1 === d2;
    const anim = this.diceAnimating ? ' rolling' : '';
    return `
      <div class="dice-row">
        <div class="die${anim}">${DIE_FACE[d1]}</div>
        <div class="die${anim}">${DIE_FACE[d2]}</div>
      </div>
      ${doubles && this.game.state === 'playing'
        ? `<div class="mat-status" style="text-align:center;color:var(--accent)">🎲 Doubles!</div>` : ''}
    `;
  }

  _actionsHTML() {
    const g = this.game;
    if (g.state === 'gameover') {
      return `<div class="action-btns"><button class="btn btn-primary" data-act="new-game">New Game</button></div>`;
    }
    const p = g.currentPlayer();
    const pa = g.pendingAction;
    const buying = pa && pa.type === 'buy';
    const waiting = !!g.pendingCard;
    const btns = [];

    if (p && p.inJail && !buying && !waiting) {
      if (p.money >= 50) btns.push(`<button class="btn btn-danger" data-act="jail-fine">Pay $50 Fine</button>`);
      if (p.jailFreeCards > 0) btns.push(`<button class="btn btn-success" data-act="jail-card">Use Jail Card</button>`);
    }

    if (buying) {
      const sp = BOARD[pa.spaceId];
      const canAfford = p && p.money >= sp.price;
      return `
        <div class="buy-prompt">
          <div style="font-weight:700">${esc(sp.name)}</div>
          <div class="space-price" style="font-size:1rem">Price: $${sp.price}</div>
          <div class="buy-btns" style="margin-top:.6rem">
            <button class="btn btn-success" data-act="buy" ${canAfford ? '' : 'disabled'}>Buy</button>
            <button class="btn btn-ghost" data-act="pass">Pass</button>
          </div>
        </div>
        ${this._sideActionsHTML()}
      `;
    }

    const rollDisabled = waiting || g.state !== 'playing';
    btns.unshift(`<button class="btn btn-primary" data-act="roll" ${rollDisabled ? 'disabled' : ''}>🎲 Roll Dice</button>`);

    return `
      <div class="action-btns">${btns.join('')}</div>
      ${this._sideActionsHTML()}
    `;
  }

  _sideActionsHTML() {
    return `
      <div class="action-btns" style="margin-top:.6rem">
        <button class="btn btn-sm btn-ghost" data-act="open-propmgr">🏠 Properties</button>
        <button class="btn btn-sm btn-ghost" data-act="open-trade">🤝 Trade</button>
        <button class="btn btn-sm btn-ghost" data-act="open-lb">🏆 Leaderboard</button>
      </div>
    `;
  }

  _logHTML() {
    const entries = this.game.log.slice(0, 20);
    return `
      <div class="log-feed">
        ${entries.map(e => `<div class="log-entry log-${e.type}">${esc(e.msg)}</div>`).join('')}
      </div>
    `;
  }

  // ── CARD POPUP ───────────────────────────────────────────
  _cardPopupHTML(card, deck) {
    const label = deck === 'chance' ? 'Chance' : 'Community Chest';
    return `
      <div class="card-popup" data-act="resolve-card">
        <div class="card-inner" data-stop="1">
          <div class="card-type-label">${label === 'Chance' ? '❓ ' : '📦 '}${label}</div>
          <div class="card-text">${esc(card.text)}</div>
          <button class="btn btn-primary" data-act="resolve-card">OK</button>
        </div>
      </div>
    `;
  }

  _showCardPopup() { this.render(); }
  _hideCardPopup() { this.render(); }

  // ── PROPERTY MANAGER ─────────────────────────────────────
  _showPropertyManager() { this.showPropMgr = true; this.render(); }

  _propManagerHTML() {
    const p = this.game.currentPlayer();
    const props = this.game.getOwnedProperties(p.id);
    const rows = props.length ? props.map(sp => {
      const id = sp.id;
      const bld = this.game.buildings[id] || { houses: 0, hotel: false };
      const mortgaged = this.game.mortgaged[id];
      const hex = sp.type === 'property' && COLOR_GROUPS[sp.color] ? COLOR_GROUPS[sp.color].hex : '#888';
      let bldText = '';
      if (sp.type === 'property') {
        bldText = bld.hotel ? '🏨 Hotel' : (bld.houses ? '🏠'.repeat(bld.houses) : 'No buildings');
      }
      const canBuild = sp.type === 'property';
      return `
        <div class="prop-item">
          <div class="prop-item-name">
            <span class="prop-color-dot" style="background:${hex}"></span>
            ${esc(sp.name)} ${mortgaged ? '<span class="mortgaged-tag">MORTGAGED</span>' : ''}
          </div>
          <div class="prop-item-status">${bldText}</div>
          <div class="action-btns">
            ${canBuild ? `<button class="btn btn-sm btn-success" data-act="buy-house" data-id="${id}">+ House</button>` : ''}
            ${canBuild ? `<button class="btn btn-sm btn-ghost" data-act="sell-house" data-id="${id}">- House</button>` : ''}
            <button class="btn btn-sm btn-ghost" data-act="toggle-mortgage" data-id="${id}">
              ${mortgaged ? 'Unmortgage' : 'Mortgage'}
            </button>
          </div>
        </div>`;
    }).join('') : `<p class="mat-status">No properties owned yet.</p>`;

    return `
      <div class="game-detail-overlay" data-act="close-propmgr">
        <div class="game-detail-modal" data-stop="1">
          <div class="detail-header">
            <div class="detail-title">🏠 ${esc(p.name)}'s Properties</div>
            <button class="detail-close" data-act="close-propmgr">✕</button>
          </div>
          <div class="detail-body prop-list">${rows}</div>
        </div>
      </div>
    `;
  }

  // ── TRADE MODAL ──────────────────────────────────────────
  _showTradeModal() { this.showTrade = true; this.render(); }

  _tradeModalHTML() {
    const players = this.game.activePlayers();
    const from = this.game.currentPlayer();
    const others = players.filter(p => p.id !== from.id);
    const to = others[0];
    if (!to) {
      return `
        <div class="game-detail-overlay" data-act="close-trade">
          <div class="trade-modal" data-stop="1">
            <p>No other players available to trade.</p>
            <button class="btn btn-ghost" data-act="close-trade">Close</button>
          </div>
        </div>`;
    }
    const propList = (player) => this.game.getOwnedProperties(player.id).map(sp =>
      `<label class="prop-item-name"><input type="checkbox" data-trade-prop="${sp.id}" data-side="${player.id === from.id ? 'give' : 'receive'}"> ${esc(sp.name)}</label>`
    ).join('') || '<span class="mat-status">No properties</span>';

    return `
      <div class="game-detail-overlay" data-act="close-trade">
        <div class="trade-modal" data-stop="1">
          <div class="detail-header">
            <div class="detail-title">🤝 Propose Trade</div>
            <button class="detail-close" data-act="close-trade">✕</button>
          </div>
          <div class="trade-sides">
            <div class="trade-side">
              <h4>${esc(from.name)} gives</h4>
              <input class="trade-money-input" type="number" min="0" id="give-money" placeholder="$ cash" />
              ${propList(from)}
            </div>
            <div class="trade-side">
              <h4>${esc(to.name)} gives</h4>
              <input class="trade-money-input" type="number" min="0" id="receive-money" placeholder="$ cash" />
              ${propList(to)}
            </div>
          </div>
          <div class="action-btns" style="margin-top:1rem">
            <button class="btn btn-success" data-act="submit-trade" data-to="${to.id}">Offer &amp; Accept</button>
            <button class="btn btn-ghost" data-act="close-trade">Cancel</button>
          </div>
        </div>
      </div>
    `;
  }

  // ── LEADERBOARD ──────────────────────────────────────────
  _showLeaderboard() { this.showLeaderboard = true; this.render(); }

  _leaderboardHTML() {
    const board = this.game.getLeaderboard();
    return `
      <div class="game-detail-overlay" data-act="close-lb">
        <div class="leaderboard" data-stop="1">
          <div class="detail-header">
            <div class="detail-title">🏆 Leaderboard</div>
            <button class="detail-close" data-act="close-lb">✕</button>
          </div>
          ${board.map((p, i) => `
            <div class="lb-row">
              <span class="lb-rank">${i + 1}</span>
              <span class="lb-token">${p.emoji}</span>
              <span class="lb-name" style="color:${p.color}">${esc(p.name)}${p.bankrupt ? ' 💀' : ''}</span>
              <span class="lb-worth">$${p.money}</span>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  _gameOverHTML() {
    const w = this.game.winner;
    return `
      <div class="gameover-overlay">
        <div class="gameover-card">
          <div class="board-logo">🏆</div>
          <div class="winner-token">${w ? w.emoji : ''}</div>
          <div class="winner-name" style="color:${w ? w.color : ''}">${w ? esc(w.name) : 'Game Over'} Wins!</div>
          <button class="btn btn-primary" data-act="new-game" style="margin-top:1rem">New Game</button>
        </div>
      </div>
    `;
  }

  // ── PARTY GAMES ──────────────────────────────────────────
  _renderPartyGames() {
    const cats = ['All', ...Array.from(new Set(PARTY_GAMES.map(g => g.category)))];
    const games = this.filter === 'All'
      ? PARTY_GAMES
      : PARTY_GAMES.filter(g => g.category === this.filter);

    const cards = games.map(g => `
      <div class="game-card" data-act="open-game" data-game="${g.id}">
        <div class="game-card-top">
          <span class="game-card-emoji">${g.emoji}</span>
          <div class="game-card-info">
            <div class="game-card-name">${esc(g.name)}</div>
            <div class="game-card-cat ${catClass(g.category)}">${esc(g.category)}</div>
          </div>
        </div>
        <div class="game-card-desc">${esc(g.description)}</div>
        <div class="game-card-meta">
          <span class="meta-pill">👥 ${esc(g.players)}</span>
          <span class="meta-pill">⏱️ ${esc(g.time)}</span>
          <span class="meta-pill energy-${g.energy}">⚡ ${esc(g.energy)}</span>
        </div>
      </div>
    `).join('');

    return `
      <div class="party-screen">
        <div class="filter-bar">
          ${cats.map(c => `
            <button class="filter-btn${this.filter === c ? ' active' : ''}" data-act="filter" data-cat="${esc(c)}">${esc(c)}</button>
          `).join('')}
        </div>
        <div class="games-grid">${cards}</div>
      </div>
      ${this.openGameId ? this._gameDetailHTML(this.openGameId) : ''}
    `;
  }

  _gameDetailHTML(id) {
    const g = PARTY_GAMES.find(x => x.id === id);
    if (!g) return '';
    const section = (title, items) => items && items.length ? `
      <div class="detail-section">
        <div class="detail-title">${title}</div>
        <ul class="sample-list">${items.map(t => `<li class="tip-item">${esc(t)}</li>`).join('')}</ul>
      </div>` : '';
    const chips = (title, items) => items && items.length ? `
      <div class="detail-section">
        <div class="detail-title">${title}</div>
        <div>${items.map(t => `<span class="sample-chip">${esc(t)}</span>`).join('')}</div>
      </div>` : '';

    return `
      <div class="game-detail-overlay" data-act="close-game">
        <div class="game-detail-modal" data-stop="1">
          <div class="detail-header">
            <span class="detail-emoji">${g.emoji}</span>
            <div>
              <div class="detail-name">${esc(g.name)}</div>
              <div class="detail-categ ${catClass(g.category)}">${esc(g.category)}</div>
            </div>
            <button class="detail-close" data-act="close-game">✕</button>
          </div>
          <div class="detail-body">
            <div class="detail-meta">
              <span class="meta-pill">👥 ${esc(g.players)}</span>
              <span class="meta-pill">⏱️ ${esc(g.time)}</span>
              <span class="meta-pill energy-${g.energy}">⚡ ${esc(g.energy)}</span>
              <span class="meta-pill">🎒 ${esc(g.supplies)}</span>
            </div>
            <p class="detail-desc">${esc(g.description)}</p>
            ${section('📋 How to Play', g.howToPlay)}
            ${section('💡 Tips', g.tips)}
            ${section('🔄 Variations', g.variations)}
            ${chips('Sample Questions', g.sampleQuestions)}
            ${chips('Sample Words', g.sampleWords)}
            ${chips('Sample Squares', g.sampleSquares)}
            ${chips('Sample Topics', g.sampleTopics)}
            ${chips('Samples', g.samples)}
            ${chips('Prompts', g.prompts)}
            ${chips('Sample Headlines', g.sampleHeadlines)}
            ${chips('Sample Categories', g.sampleCategories)}
            ${chips('Sample Awards', g.sampleAwards)}
            ${chips('Sample Blocks', g.sampleBlocks)}
            ${chips('Events', g.events)}
            ${chips('Roles', g.roles)}
            ${chips('Signals', g.signals)}
            ${chips('Task Ideas', g.taskIdeas)}
            ${chips('Puzzle Ideas', g.puzzleIdeas)}
          </div>
        </div>
      </div>
    `;
  }

  // ── TOAST ────────────────────────────────────────────────
  _toast(msg, type = 'info') {
    let el = document.getElementById('quizzy-toast');
    if (!el) {
      el = document.createElement('div');
      el.id = 'quizzy-toast';
      document.body.appendChild(el);
    }
    el.className = 'toast ' + type;
    el.textContent = msg;
    requestAnimationFrame(() => el.classList.add('show'));
    clearTimeout(this._toastTimer);
    this._toastTimer = setTimeout(() => el.classList.remove('show'), 2600);
  }

  // ── EVENTS ───────────────────────────────────────────────
  _onInput(e) {
    const t = e.target.closest('[data-act]');
    if (!t) return;
    const act = t.getAttribute('data-act');
    if (act === 'player-name') {
      const idx = +t.getAttribute('data-idx');
      this.setupPlayers[idx].name = t.value;
    }
  }

  _onClick(e) {
    const t = e.target.closest('[data-act]');
    if (!t) return;
    const act = t.getAttribute('data-act');
    const g = this.game;

    switch (act) {
      case 'tab':
        this.tab = t.getAttribute('data-tab');
        this.render();
        break;

      case 'toggle-rule': {
        const r = +t.getAttribute('data-rule');
        this.openRule = this.openRule === r ? null : r;
        this.render();
        break;
      }

      case 'pick-token': {
        const idx = +t.getAttribute('data-idx');
        this.setupPlayers[idx].emoji = t.getAttribute('data-em');
        this.setupPlayers[idx].color = t.getAttribute('data-color');
        this.render();
        break;
      }

      case 'add-player':
        if (this.setupPlayers.length < 6) {
          const n = this.setupPlayers.length;
          this.setupPlayers.push({ name: 'Player ' + (n + 1), emoji: TOKEN_EMOJIS[n], color: PLAYER_COLORS[n] });
          this.render();
        }
        break;

      case 'remove-player': {
        const idx = +t.getAttribute('data-idx');
        if (this.setupPlayers.length > 2) {
          this.setupPlayers.splice(idx, 1);
          this.render();
        }
        break;
      }

      case 'start-game': {
        const names = this.setupPlayers.map(p => p.name.trim());
        if (names.some(n => !n)) { this._toast('All players need a name', 'error'); return; }
        if (new Set(this.setupPlayers.map(p => p.emoji)).size !== this.setupPlayers.length) {
          this._toast('Each player needs a unique token', 'error'); return;
        }
        this.setupPlayers.forEach(p => g.addPlayer(p.name.trim(), p.color, p.emoji));
        g.startGame();
        this._toast('Game started!', 'success');
        this.render();
        break;
      }

      case 'roll':
        this._doRoll();
        break;

      case 'buy':
        if (g.buyProperty(g.currentPlayer().id)) this._toast('Property purchased!', 'success');
        else this._toast('Cannot buy', 'error');
        this.render();
        break;

      case 'pass':
        g.passProperty();
        this.render();
        break;

      case 'resolve-card':
        g.resolveCard();
        this.render();
        break;

      case 'jail-fine':
        if (g.payJailFine(g.currentPlayer().id)) this._toast('Out of jail!', 'success');
        this.render();
        break;

      case 'jail-card':
        if (g.useJailCard(g.currentPlayer().id)) this._toast('Used jail card!', 'success');
        this.render();
        break;

      case 'open-propmgr': this.showPropMgr = true; this.render(); break;
      case 'close-propmgr': this.showPropMgr = false; this.render(); break;
      case 'open-trade': this.showTrade = true; this.render(); break;
      case 'close-trade': this.showTrade = false; this.render(); break;
      case 'open-lb': this.showLeaderboard = true; this.render(); break;
      case 'close-lb': this.showLeaderboard = false; this.render(); break;

      case 'buy-house': {
        const id = +t.getAttribute('data-id');
        const r = g.buyHouse(g.currentPlayer().id, id);
        this._toast(r.ok ? (r.hotel ? 'Hotel built!' : 'House built!') : r.err, r.ok ? 'success' : 'error');
        this.render();
        break;
      }

      case 'sell-house': {
        const id = +t.getAttribute('data-id');
        const r = g.sellHouse(g.currentPlayer().id, id);
        this._toast(r.ok ? 'Building sold' : r.err, r.ok ? 'success' : 'error');
        this.render();
        break;
      }

      case 'toggle-mortgage': {
        const id = +t.getAttribute('data-id');
        const ok = g.toggleMortgage(g.currentPlayer().id, id);
        if (!ok) this._toast('Cannot change mortgage (sell buildings or check funds)', 'error');
        this.render();
        break;
      }

      case 'submit-trade':
        this._submitTrade(t.getAttribute('data-to'));
        break;

      case 'open-game':
        this.openGameId = t.getAttribute('data-game');
        this.render();
        break;
      case 'close-game':
        this.openGameId = null;
        this.render();
        break;

      case 'filter':
        this.filter = t.getAttribute('data-cat');
        this.render();
        break;

      case 'new-game':
        g.reset();
        this.showPropMgr = this.showTrade = this.showLeaderboard = false;
        this.tab = 'monopoly';
        this.render();
        break;
    }
  }

  _doRoll() {
    const g = this.game;
    if (g.state !== 'playing' || g.pendingCard) return;
    this.diceAnimating = true;
    g.rollDice();
    this.render();
    setTimeout(() => { this.diceAnimating = false; this.render(); }, 320);
  }

  _submitTrade(toId) {
    const g = this.game;
    const from = g.currentPlayer();
    const root = document.querySelector('.trade-modal');
    if (!root) return;
    const giveMoney = +(root.querySelector('#give-money')?.value || 0);
    const receiveMoney = +(root.querySelector('#receive-money')?.value || 0);
    const give = { money: giveMoney, properties: [] };
    const receive = { money: receiveMoney, properties: [] };
    root.querySelectorAll('input[data-trade-prop]:checked').forEach(cb => {
      const id = +cb.getAttribute('data-trade-prop');
      if (cb.getAttribute('data-side') === 'give') give.properties.push(id);
      else receive.properties.push(id);
    });
    g.proposeTrade(from.id, toId, { give, receive });
    g.acceptTrade();
    this.showTrade = false;
    this._toast('Trade completed', 'success');
    this.render();
  }
}

if (typeof module !== 'undefined') {
  module.exports = { QuizzyUI };
}
