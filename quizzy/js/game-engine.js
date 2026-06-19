// ============================================================
// MONOPOLY — Full Game Engine
// ============================================================

class MonopolyGame {
  constructor() {
    this.players       = [];
    this.currentIndex  = 0;
    this.state         = 'setup';   // setup | playing | trade | bankrupt | gameover
    this.log           = [];
    this.properties    = {};        // spaceId → owner playerId (or null)
    this.buildings     = {};        // spaceId → { houses:0..4, hotel:false }
    this.mortgaged     = {};        // spaceId → bool
    this.freeParkingPot = 0;
    this.chanceDeck    = [];
    this.communityDeck = [];
    this.lastDice      = [1,1];
    this.doublesCount  = 0;
    this.pendingAction = null;      // { type, spaceId, ... } action waiting for player decision
    this.pendingCard   = null;      // card currently shown
    this.tradeOffer    = null;
    this.winner        = null;
    this._initDecks();
  }

  _initDecks() {
    this.chanceDeck    = shuffle([...CHANCE_CARDS]);
    this.communityDeck = shuffle([...COMMUNITY_CHEST_CARDS]);
  }

  addLog(msg, type='info') {
    this.log.unshift({ msg, type, ts: Date.now() });
    if (this.log.length > 80) this.log.pop();
  }

  // ── SETUP ────────────────────────────────────────────────
  addPlayer(name, color, emoji) {
    if (this.players.length >= 8) return false;
    const id = 'P' + (this.players.length + 1);
    this.players.push({
      id, name, color, emoji,
      money: 1500,
      position: 0,
      inJail: false,
      jailTurns: 0,
      jailFreeCards: 0,
      bankrupt: false,
      get houses() {
        return Object.entries(this.buildings || {}).reduce((s,[k,v])=>s+(v?.houses||0),0);
      },
      get hotels() {
        return Object.entries(this.buildings || {}).reduce((s,[k,v])=>s+(v?.hotel?1:0),0);
      },
    });
    return true;
  }

  startGame() {
    if (this.players.length < 2) return false;
    // Shuffle turn order
    this.players = shuffle(this.players);
    this.state = 'playing';
    // Init property/building state
    BOARD.forEach(sp => {
      if (sp.type === 'property' || sp.type === 'railroad' || sp.type === 'utility') {
        this.properties[sp.id] = null;
        this.buildings[sp.id]  = { houses:0, hotel:false };
        this.mortgaged[sp.id]  = false;
      }
    });
    this.addLog(`Game started with ${this.players.length} players! ${this.currentPlayer().name} goes first.`, 'system');
    return true;
  }

  currentPlayer() {
    return this.players[this.currentIndex];
  }

  activePlayers() {
    return this.players.filter(p => !p.bankrupt);
  }

  // ── DICE ─────────────────────────────────────────────────
  rollDice() {
    const p = this.currentPlayer();
    if (p.bankrupt) return null;

    const d1 = Math.floor(Math.random()*6)+1;
    const d2 = Math.floor(Math.random()*6)+1;
    this.lastDice = [d1,d2];
    const isDoubles = d1 === d2;
    const total = d1 + d2;

    this.addLog(`${p.name} rolls ${d1}+${d2}=${total}${isDoubles?' 🎲 DOUBLES!':''}`, 'dice');

    if (p.inJail) {
      return this._handleJailRoll(p, d1, d2, isDoubles, total);
    }

    if (isDoubles) {
      this.doublesCount++;
      if (this.doublesCount >= 3) {
        this.addLog(`${p.name} rolled doubles THREE times — Go to Jail!`, 'jail');
        this.sendToJail(p);
        this.doublesCount = 0;
        this._endTurn(false);
        return { rolled: [d1,d2], movedTo: 10, jailSent: true };
      }
    } else {
      this.doublesCount = 0;
    }

    const newPos = this._advance(p, total);
    const result = this._landOn(p, newPos, total);
    if (!isDoubles || p.inJail) {
      // Non-doubles or if doubles sent to jail — pendingAction set by _landOn
    }
    return { rolled: [d1,d2], movedTo: newPos, doubles: isDoubles, ...result };
  }

  _handleJailRoll(p, d1, d2, isDoubles, total) {
    if (isDoubles) {
      p.inJail = false;
      p.jailTurns = 0;
      this.addLog(`${p.name} rolled doubles and got out of Jail!`, 'jail');
      const newPos = this._advance(p, total);
      const result = this._landOn(p, newPos, total);
      return { rolled: [d1,d2], movedTo: newPos, jailEscape: true, ...result };
    }
    p.jailTurns++;
    if (p.jailTurns >= 3) {
      this.addLog(`${p.name} must pay $50 to leave Jail!`, 'jail');
      this.chargeMoney(p, 50, 'Jail fine');
      p.inJail = false;
      p.jailTurns = 0;
      const newPos = this._advance(p, total);
      const result = this._landOn(p, newPos, total);
      this._endTurn(false);
      return { rolled:[d1,d2], movedTo:newPos, paidJailFine:true, ...result };
    }
    this.addLog(`${p.name} stays in Jail (${p.jailTurns}/3 turns).`, 'jail');
    this._endTurn(false);
    return { rolled:[d1,d2], stayedInJail:true };
  }

  _advance(p, steps) {
    const oldPos = p.position;
    p.position = (p.position + steps) % 40;
    if (p.position < oldPos || (oldPos === 0 && steps > 0)) {
      // Passed or landed on GO
      if (p.position !== 0) {
        this.grantMoney(p, 200, 'Passed GO');
      }
    }
    return p.position;
  }

  _landOn(p, pos, diceTotal) {
    const space = BOARD[pos];
    this.addLog(`${p.name} lands on ${space.name}.`, 'move');

    switch (space.type) {
      case 'go':
        this.grantMoney(p, 200, 'Landed on GO');
        this._endTurn(false);
        return { action:'go' };

      case 'property':
      case 'railroad':
      case 'utility': {
        const owner = this.properties[pos];
        if (!owner) {
          // Unowned — offer to buy
          this.pendingAction = { type:'buy', spaceId:pos, player:p.id };
          return { action:'buy_option', spaceId:pos };
        }
        if (owner === p.id || this.mortgaged[pos]) {
          this._endTurn(false);
          return { action:'own_or_mortgaged' };
        }
        // Pay rent
        const ownerPlayer = this.players.find(pl => pl.id === owner);
        const rent = this._calcRent(pos, diceTotal, p);
        this.addLog(`${p.name} owes $${rent} rent to ${ownerPlayer.name}.`, 'rent');
        this.chargeMoney(p, rent, `Rent on ${space.name}`, ownerPlayer);
        this._endTurn(false);
        return { action:'rent_paid', amount:rent, to:owner };
      }

      case 'chance':
        return this._drawCard('chance', p);

      case 'community':
        return this._drawCard('community', p);

      case 'tax': {
        const amt = space.id === 4
          ? Math.min(200, Math.floor(this._netWorth(p) * 0.1))
          : space.amount;
        this.addLog(`${p.name} pays $${amt} ${space.name}.`, 'tax');
        this.chargeMoney(p, amt, space.name);
        this.freeParkingPot += amt;
        this._endTurn(false);
        return { action:'tax', amount:amt };
      }

      case 'freeparking': {
        const pot = this.freeParkingPot;
        if (pot > 0) {
          this.grantMoney(p, pot, 'Free Parking jackpot');
          this.freeParkingPot = 0;
        }
        this._endTurn(false);
        return { action:'freeparking', collected:pot };
      }

      case 'gotojail':
        this.sendToJail(p);
        this._endTurn(false);
        return { action:'gotojail' };

      case 'jail':
        // Just visiting
        this._endTurn(false);
        return { action:'visiting' };

      default:
        this._endTurn(false);
        return {};
    }
  }

  _drawCard(deck, p) {
    const cards = deck === 'chance' ? this.chanceDeck : this.communityDeck;
    if (!cards.length) {
      const src = deck === 'chance' ? CHANCE_CARDS : COMMUNITY_CHEST_CARDS;
      this[deck === 'chance' ? 'chanceDeck' : 'communityDeck'] = shuffle([...src]);
      cards.push(...this[deck === 'chance' ? 'chanceDeck' : 'communityDeck']);
    }
    const card = cards.shift();
    if (!card.keep) cards.push(card); // return to bottom unless keep card
    this.addLog(`${p.name} draws: "${card.text}"`, deck === 'chance' ? 'chance' : 'community');
    this.pendingCard = { card, deck, playerId: p.id };
    return { action:'card', card };
  }

  resolveCard() {
    if (!this.pendingCard) return;
    const { card, playerId } = this.pendingCard;
    const p = this.players.find(pl => pl.id === playerId);
    if (card.action) card.action(this, p);
    this.pendingCard = null;
    if (!this.pendingAction) this._endTurn(false);
  }

  // ── RENT CALCULATION ─────────────────────────────────────
  _calcRent(spaceId, diceTotal, lander) {
    const space = BOARD[spaceId];
    const bld = this.buildings[spaceId];
    const owner = this.properties[spaceId];

    if (space.type === 'railroad') {
      const railroads = [5,15,25,35];
      const owned = railroads.filter(id => this.properties[id] === owner).length;
      return RAILROAD_RENT[owned] || 25;
    }

    if (space.type === 'utility') {
      const utilities = [12,28];
      const owned = utilities.filter(id => this.properties[id] === owner).length;
      const multiplier = owned === 2 ? 10 : 4;
      return (diceTotal || (this.lastDice[0]+this.lastDice[1])) * multiplier;
    }

    // Property
    if (bld.hotel) return space.rent[5];
    if (bld.houses > 0) return space.rent[bld.houses];
    // Check color monopoly (all in group owned by same player)
    if (this._hasMonopoly(owner, space.color)) return space.rent[0] * 2;
    return space.rent[0];
  }

  _hasMonopoly(playerId, color) {
    const groupSpaces = BOARD.filter(s => s.type === 'property' && s.color === color);
    return groupSpaces.every(s => this.properties[s.id] === playerId);
  }

  _netWorth(p) {
    let total = p.money;
    Object.entries(this.properties).forEach(([id,owner]) => {
      if (owner === p.id) {
        const sp = BOARD[parseInt(id)];
        total += sp.price;
        const bld = this.buildings[id];
        if (bld) total += (bld.houses * (sp.houseCost||50)) + (bld.hotel ? (sp.houseCost||50)*5 : 0);
      }
    });
    return total;
  }

  // ── BUY / AUCTION ────────────────────────────────────────
  buyProperty(playerId) {
    const pa = this.pendingAction;
    if (!pa || pa.type !== 'buy' || pa.player !== playerId) return false;
    const p = this.players.find(pl => pl.id === playerId);
    const space = BOARD[pa.spaceId];
    if (p.money < space.price) return false;
    this.chargeMoney(p, space.price, `Bought ${space.name}`);
    this.properties[pa.spaceId] = playerId;
    this.addLog(`${p.name} bought ${space.name} for $${space.price}!`, 'buy');
    this.pendingAction = null;
    this._endTurn(false);
    return true;
  }

  passProperty() {
    // Player declines to buy — in this version we skip auction for simplicity
    if (!this.pendingAction || this.pendingAction.type !== 'buy') return false;
    const space = BOARD[this.pendingAction.spaceId];
    this.addLog(`${this.currentPlayer().name} passed on ${space.name}.`, 'info');
    this.pendingAction = null;
    this._endTurn(false);
    return true;
  }

  // ── BUILDING ─────────────────────────────────────────────
  buyHouse(playerId, spaceId) {
    const p = this.players.find(pl => pl.id === playerId);
    const space = BOARD[spaceId];
    if (!space || space.type !== 'property') return { ok:false, err:'Not a property' };
    if (this.properties[spaceId] !== playerId) return { ok:false, err:'You don\'t own this' };
    if (!this._hasMonopoly(playerId, space.color)) return { ok:false, err:'Need all in group' };
    if (this.mortgaged[spaceId]) return { ok:false, err:'Property is mortgaged' };
    const bld = this.buildings[spaceId];
    if (bld.hotel) return { ok:false, err:'Already has a hotel' };
    if (bld.houses >= 4) {
      // Upgrade to hotel
      if (p.money < space.houseCost) return { ok:false, err:'Not enough money' };
      this.chargeMoney(p, space.houseCost, `Hotel on ${space.name}`);
      bld.houses = 0;
      bld.hotel = true;
      this.addLog(`${p.name} built a HOTEL on ${space.name}!`, 'build');
      return { ok:true, hotel:true };
    }
    // Even building rule — must not exceed others in group by more than 1
    const groupSpaces = BOARD.filter(s => s.type==='property' && s.color===space.color);
    const minHouses = Math.min(...groupSpaces.map(s => this.buildings[s.id]?.houses || 0));
    if (bld.houses > minHouses) return { ok:false, err:'Must build evenly across color group' };
    if (p.money < space.houseCost) return { ok:false, err:'Not enough money' };
    this.chargeMoney(p, space.houseCost, `House on ${space.name}`);
    bld.houses++;
    this.addLog(`${p.name} built a house on ${space.name}!`, 'build');
    return { ok:true, hotel:false };
  }

  sellHouse(playerId, spaceId) {
    const p = this.players.find(pl => pl.id === playerId);
    const space = BOARD[spaceId];
    if (!space || this.properties[spaceId] !== playerId) return { ok:false, err:'Invalid' };
    const bld = this.buildings[spaceId];
    const refund = Math.floor(space.houseCost / 2);
    if (bld.hotel) {
      bld.hotel = false;
      bld.houses = 4;
      this.grantMoney(p, refund, `Sold hotel on ${space.name}`);
      return { ok:true };
    }
    if (bld.houses === 0) return { ok:false, err:'No buildings to sell' };
    bld.houses--;
    this.grantMoney(p, refund, `Sold house on ${space.name}`);
    return { ok:true };
  }

  // ── MORTGAGE ─────────────────────────────────────────────
  toggleMortgage(playerId, spaceId) {
    const p = this.players.find(pl => pl.id === playerId);
    const space = BOARD[spaceId];
    if (!space || this.properties[spaceId] !== playerId) return false;
    const bld = this.buildings[spaceId];
    if ((bld?.houses||0) > 0 || bld?.hotel) return false; // must sell buildings first
    if (!this.mortgaged[spaceId]) {
      // Mortgage it
      this.mortgaged[spaceId] = true;
      this.grantMoney(p, space.mortgage, `Mortgaged ${space.name}`);
      this.addLog(`${p.name} mortgaged ${space.name} for $${space.mortgage}.`, 'mortgage');
    } else {
      // Unmortgage: costs mortgage value + 10%
      const cost = Math.floor(space.mortgage * 1.1);
      if (p.money < cost) return false;
      this.chargeMoney(p, cost, `Unmortgaged ${space.name}`);
      this.mortgaged[spaceId] = false;
      this.addLog(`${p.name} unmortgaged ${space.name} for $${cost}.`, 'mortgage');
    }
    return true;
  }

  // ── JAIL ─────────────────────────────────────────────────
  sendToJail(p) {
    p.position = 10;
    p.inJail = true;
    p.jailTurns = 0;
    this.addLog(`${p.name} is sent to Jail!`, 'jail');
  }

  payJailFine(playerId) {
    const p = this.players.find(pl => pl.id === playerId);
    if (!p.inJail) return false;
    if (p.money < 50) return false;
    this.chargeMoney(p, 50, 'Jail fine');
    p.inJail = false;
    p.jailTurns = 0;
    this.addLog(`${p.name} paid $50 to get out of Jail.`, 'jail');
    return true;
  }

  useJailCard(playerId) {
    const p = this.players.find(pl => pl.id === playerId);
    if (!p.inJail || p.jailFreeCards < 1) return false;
    p.jailFreeCards--;
    p.inJail = false;
    p.jailTurns = 0;
    this.addLog(`${p.name} used a Get Out of Jail Free card!`, 'jail');
    return true;
  }

  // ── TRADE ────────────────────────────────────────────────
  proposeTrade(fromId, toId, offer) {
    // offer: { money, properties, jailCards } for each side
    this.tradeOffer = { fromId, toId, offer, state:'pending' };
    this.addLog(`${this.players.find(p=>p.id===fromId).name} proposed a trade to ${this.players.find(p=>p.id===toId).name}.`, 'trade');
  }

  acceptTrade() {
    const { fromId, toId, offer } = this.tradeOffer || {};
    if (!fromId) return false;
    const from = this.players.find(p => p.id === fromId);
    const to   = this.players.find(p => p.id === toId);
    // Transfer money
    if ((offer.give?.money||0) > 0) {
      this.chargeMoney(from, offer.give.money, 'Trade');
      this.grantMoney(to, offer.give.money, 'Trade received');
    }
    if ((offer.receive?.money||0) > 0) {
      this.chargeMoney(to, offer.receive.money, 'Trade');
      this.grantMoney(from, offer.receive.money, 'Trade received');
    }
    // Transfer properties
    (offer.give?.properties||[]).forEach(id => { this.properties[id] = toId; });
    (offer.receive?.properties||[]).forEach(id => { this.properties[id] = fromId; });
    this.addLog(`Trade completed between ${from.name} and ${to.name}.`, 'trade');
    this.tradeOffer = null;
    return true;
  }

  declineTrade() {
    if (!this.tradeOffer) return;
    this.addLog(`${this.players.find(p=>p.id===this.tradeOffer.toId)?.name} declined the trade.`, 'trade');
    this.tradeOffer = null;
  }

  // ── MONEY ─────────────────────────────────────────────────
  grantMoney(p, amount, reason) {
    p.money += amount;
    this.addLog(`${p.name} receives $${amount} (${reason}). Balance: $${p.money}`, 'money');
  }

  chargeMoney(p, amount, reason, recipient = null) {
    if (p.money >= amount) {
      p.money -= amount;
      if (recipient) recipient.money += amount;
      this.addLog(`${p.name} pays $${amount} (${reason}). Balance: $${p.money}`, 'money');
    } else {
      // Bankrupt scenario — simplified: pay what they can
      const paid = p.money;
      p.money = 0;
      if (recipient) recipient.money += paid;
      this.addLog(`${p.name} cannot afford $${amount}! Paid $${paid} and goes BANKRUPT.`, 'bankrupt');
      this._declareBankruptcy(p);
    }
  }

  payAllPlayers(p, amount) {
    const others = this.activePlayers().filter(pl => pl.id !== p.id);
    others.forEach(o => {
      if (p.money >= amount) {
        p.money -= amount;
        o.money += amount;
      }
    });
    this.addLog(`${p.name} pays $${amount} to each other player.`, 'money');
    this._endTurn(false);
  }

  collectFromAllPlayers(p, amount, reason) {
    const others = this.activePlayers().filter(pl => pl.id !== p.id);
    others.forEach(o => {
      const paid = Math.min(o.money, amount);
      o.money -= paid;
      p.money += paid;
    });
    this.addLog(`${p.name} collects $${amount} from each player (${reason}).`, 'money');
    this._endTurn(false);
  }

  // ── NAVIGATE ─────────────────────────────────────────────
  moveToSpace(p, targetId, collectGo) {
    const oldPos = p.position;
    p.position = targetId;
    if (collectGo && targetId < oldPos && targetId !== 0) {
      this.grantMoney(p, 200, 'Passed GO');
    }
    const result = this._landOn(p, targetId, this.lastDice[0]+this.lastDice[1]);
    return result;
  }

  moveRelative(p, steps) {
    const newPos = ((p.position + steps) % 40 + 40) % 40;
    p.position = newPos;
    this._landOn(p, newPos, Math.abs(steps));
  }

  advanceToNearestRailroad(p) {
    const railroads = [5,15,25,35];
    const nearest = railroads.find(r => r > p.position) || railroads[0];
    const passedGo = nearest < p.position;
    if (passedGo) this.grantMoney(p, 200, 'Passed GO');
    p.position = nearest;
    // Double rent if owned
    const ownerId = this.properties[nearest];
    if (ownerId && ownerId !== p.id) {
      const owner = this.players.find(pl => pl.id === ownerId);
      const railroads2 = [5,15,25,35];
      const owned = railroads2.filter(id => this.properties[id] === ownerId).length;
      const rent = (RAILROAD_RENT[owned] || 25) * 2;
      this.chargeMoney(p, rent, `Double railroad rent (Chance)`, owner);
    }
    this._endTurn(false);
  }

  advanceToNearestUtility(p) {
    const utilities = [12,28];
    const nearest = utilities.find(u => u > p.position) || utilities[0];
    p.position = nearest;
    const ownerId = this.properties[nearest];
    if (ownerId && ownerId !== p.id) {
      const owner = this.players.find(pl => pl.id === ownerId);
      const roll = this.lastDice[0] + this.lastDice[1];
      const rent = roll * 10;
      this.chargeMoney(p, rent, `Utility rent ×10 (Chance)`, owner);
    }
    this._endTurn(false);
  }

  // ── BANKRUPTCY ───────────────────────────────────────────
  _declareBankruptcy(p) {
    p.bankrupt = true;
    // Return all properties to bank
    Object.keys(this.properties).forEach(id => {
      if (this.properties[id] === p.id) {
        this.properties[id] = null;
        this.buildings[id] = { houses:0, hotel:false };
        this.mortgaged[id] = false;
      }
    });
    this.addLog(`${p.name} has gone BANKRUPT and is eliminated!`, 'bankrupt');
    this._checkWin();
  }

  _checkWin() {
    const alive = this.activePlayers();
    if (alive.length === 1) {
      this.winner = alive[0];
      this.state = 'gameover';
      this.addLog(`🏆 ${alive[0].name} WINS THE GAME!`, 'win');
    }
  }

  // ── TURN MANAGEMENT ─────────────────────────────────────
  _endTurn(moreActions) {
    // moreActions = true means player rolled doubles and gets another turn
    if (!moreActions) {
      this.doublesCount = 0;
      this._nextPlayer();
    }
  }

  _nextPlayer() {
    const alive = this.activePlayers();
    if (alive.length < 2) { this._checkWin(); return; }
    let next = (this.currentIndex + 1) % this.players.length;
    while (this.players[next].bankrupt) {
      next = (next + 1) % this.players.length;
    }
    this.currentIndex = next;
    this.addLog(`--- ${this.currentPlayer().name}'s turn ---`, 'turn');
  }

  getOwnedProperties(playerId) {
    return Object.entries(this.properties)
      .filter(([,owner]) => owner === playerId)
      .map(([id]) => BOARD[parseInt(id)]);
  }

  getLeaderboard() {
    return [...this.players].sort((a,b) => this._netWorth(b) - this._netWorth(a));
  }

  reset() {
    Object.assign(this, new MonopolyGame());
  }
}

// ── HELPERS ──────────────────────────────────────────────────
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length-1; i > 0; i--) {
    const j = Math.floor(Math.random()*(i+1));
    [a[i],a[j]] = [a[j],a[i]];
  }
  return a;
}
