# Quizzy 🎲🎉

A zero-dependency, single-page web app bundling two things teams love:

1. **Monopoly** — a complete, playable board game for 2–6 players.
2. **Office Party Games** — a browsable library of 38 ready-to-run team activities.

Everything is pure HTML, CSS, and vanilla JavaScript. No build step, no
frameworks, no internet required (other than the Google Fonts stylesheet).
Just open `index.html`.

---

## How to Run

Open `index.html` in any modern browser. That's it.

```
quizzy/
└── index.html   ← double-click this
```

There is nothing to install, compile, or serve. All logic runs client-side.

---

## File Structure

```
quizzy/
├── index.html            # Entry point — loads scripts and boots the UI
├── css/
│   └── style.css         # Dark luxury theme (all styling)
├── js/
│   ├── board-data.js     # Board layout, cards, tokens, party-game catalog
│   ├── game-engine.js    # MonopolyGame class — all game rules & state
│   └── ui.js             # QuizzyUI class — vanilla renderer + event handling
└── README.md
```

**Load order** (defined in `index.html`):
`board-data.js → game-engine.js → ui.js → inline init script`.

The init script is simply:

```js
const game = new MonopolyGame();
const ui = new QuizzyUI(game);
ui.init();
```

---

## Monopoly — Features Implemented

A faithful implementation of the classic rules:

- **40-space board** rendered as an 11×11 CSS grid — 22 properties, 4
  railroads, 2 utilities, taxes, Chance, Community Chest, Jail, Free Parking,
  and Go To Jail, all placed in correct board positions.
- **2–6 players**, each with a chosen token emoji and color.
- **Dice rolling** with two dice and a visual roll animation.
- **Doubles** grant logic; rolling doubles three times in a row sends you to Jail.
- **Buying properties** at face value, or passing.
- **Rent collection** including:
  - Color-group **monopoly bonus** (double base rent on undeveloped sets).
  - **House/hotel** rent tiers.
  - **Railroad rent** scaling with the number owned (25 / 50 / 100 / 200).
  - **Utility rent** of dice × 4, or dice × 10 if both are owned.
- **Houses & hotels** with the even-building rule across a color group;
  five houses upgrade to a hotel.
- **Mortgages** — mortgage for cash, unmortgage at +10%. Buildings must be
  sold before mortgaging.
- **Chance (16) & Community Chest (16) cards** with full effects — money,
  movement, advance-to-nearest, repairs, Get Out of Jail Free, and more.
- **Jail** — escape by rolling doubles, paying the $50 fine, or using a Get
  Out of Jail Free card; forced payment after 3 turns.
- **Taxes** — Income Tax (lesser of $200 or 10% net worth) and Luxury Tax,
  feeding a **Free Parking** jackpot pot.
- **Trading** — exchange cash and properties between players.
- **Bankruptcy & win detection** — last player standing wins.
- **Leaderboard** ranked by net worth.
- **Activity log** — color-coded, last 20 entries shown live.

The UI surfaces all of this through player mats, a dice panel, action buttons,
a slide-out property manager, a trade modal, a leaderboard modal, a card popup,
and a game-over overlay.

---

## Office Party Games (38)

Browse, filter by category, and open any game for full instructions
(description, step-by-step how-to-play, tips, supplies, and sample content).

| # | Game | Category |
|---|------|----------|
| 1 | Two Truths & One Lie | Icebreaker |
| 2 | Office Trivia Showdown | Trivia |
| 3 | Pictionary Relay | Creative |
| 4 | Office Bingo | Classics |
| 5 | Werewolf / Mafia | Strategy |
| 6 | Charades Championship | Creative |
| 7 | Never Have I Ever (Office Edition) | Icebreaker |
| 8 | The Price is Right: Office Edition | Trivia |
| 9 | Guess the Baby Photo | Icebreaker |
| 10 | Lip Sync Battle | Performance |
| 11 | Scavenger Hunt | Team Building |
| 12 | Office Olympics | Physical |
| 13 | Codenames | Strategy |
| 14 | Hot Takes Showdown | Debate |
| 15 | Jenga Truth or Dare | Social |
| 16 | GIF Battle | Creative |
| 17 | Emoji Pictionary | Creative |
| 18 | Speed Friending | Icebreaker |
| 19 | Typing Speed Race | Competitive |
| 20 | Murder Mystery Lunch | Immersive |
| 21 | Blind Drawing | Creative |
| 22 | Office Jeopardy | Trivia |
| 23 | Would You Rather (Workplace Edition) | Social |
| 24 | Caption Contest | Creative |
| 25 | Office Awards Ceremony | Celebration |
| 26 | Rock Paper Scissors Tournament | Competitive |
| 27 | Talent Show | Performance |
| 28 | Mini TED Talks | Learning |
| 29 | Heads Up! (Office Edition) | Social |
| 30 | Escape Room Challenge | Team Building |
| 31 | Karaoke Battle | Performance |
| 32 | Personality Quiz Showdown | Icebreaker |
| 33 | Recipe Showdown | Creative |
| 34 | News Reporter Role Play | Creative |
| 35 | Paper Airplane Distance Contest | Physical |
| 36 | Alphabet Challenge | Word Games |
| 37 | Podcast Recording | Creative |
| 38 | Progressive Story | Creative |

**Categories:** Icebreaker, Trivia, Creative, Classics, Strategy, Performance,
Physical, Debate, Social, Competitive, Immersive, Celebration, Learning,
Team Building, Word Games.

---

## Technical Notes

- **Pure HTML/CSS/JS.** No bundler, transpiler, or package manager — open the
  file and play.
- **Architecture:** the engine (`MonopolyGame`) holds all state and rules and
  is fully decoupled from rendering. The UI (`QuizzyUI`) reads engine state and
  re-renders on every action.
- **Rendering:** the UI does a full re-render via `innerHTML` on each change,
  keeping the data flow one-directional and predictable.
- **Events:** a single delegated `click`/`input` listener on `#app` handles all
  interaction via `data-act` attributes — no per-element listeners.
- **Board layout:** the 40 spaces are positioned on an 11×11 CSS grid using
  inline `grid-column` / `grid-row` styles computed per space index.
- **Theme:** dark luxury palette on a `#0d1117` background, Inter typeface.

Enjoy! 🎩
