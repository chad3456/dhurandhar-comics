// ============================================================
// PROFANITY WORD LIST
// English · Hindi (Devanagari + Latin) · Hinglish · Slang
// ============================================================
// Each entry: { word, lang, severity (1-3), matchType }
// matchType: 'exact' | 'partial' | 'regex'
// severity: 1=mild, 2=moderate, 3=severe
// ============================================================

const PROFANITY_LIST = {

  // ── ENGLISH ──────────────────────────────────────────────
  english: [
    // Severe
    'fuck', 'fucker', 'fucking', 'fucked', 'motherfucker', 'motherfucking',
    'shit', 'shitting', 'shitty', 'bullshit', 'horseshit', 'dipshit', 'apeshit',
    'cunt', 'cunts', 'bastard', 'bastards',
    'cock', 'cocksucker', 'cocksucking',
    'ass', 'asshole', 'assholes', 'asshat', 'asswipe', 'jackass', 'dumbass', 'badass', 'smartass',
    'bitch', 'bitches', 'bitching', 'son of a bitch', 'sonovabitch',
    'dick', 'dickhead', 'dickface', 'dicks',
    'pussy', 'pussies',
    'whore', 'whores', 'whorehouse',
    'slut', 'slutty', 'sluts',
    'nigger', 'nigga', 'niggas',
    'faggot', 'fag', 'fags',
    'crap', 'crappy',
    'piss', 'pissed', 'pissing', 'pissed off',
    // Moderate
    'damn', 'damned', 'goddamn', 'goddamned',
    'hell', 'what the hell', 'go to hell',
    'crap', 'holy crap',
    'jerk', 'jerkoff', 'jerk off',
    'moron', 'idiot', 'imbecile', 'retard', 'retarded',
    'douche', 'douchebag', 'douchebags',
    'twat', 'twats',
    'wank', 'wanker', 'wanking', 'wanked',
    'bollocks', 'bloody hell', 'bloody', 'bugger', 'sod off',
    'shag', 'shagging',
    'tosser', 'wankstain',
    'arse', 'arsehole',
    'prick', 'pricks',
    'screw you', 'screw off', 'get screwed',
    'scumbag', 'scum', 'sleazebag', 'slimeball',
    'freak', 'pervert', 'perv',
    'bimbo', 'tramp', 'skank',
    'homo', 'dyke',
    // Mild
    'crap', 'shoot', 'fudge', 'darn', 'dang', 'heck',
    'witch', 'witch hunt',
    'sex', 'sexy', 'sexual', 'sexually',
    'boobs', 'boob', 'tits', 'tit',
    'butt', 'butthole', 'butt crack',
    'penis', 'vagina', 'balls', 'testicles', 'genitals',
    'erection', 'ejaculate', 'orgasm',
    'boner', 'hard on', 'hard-on',
    'nude', 'naked', 'strip', 'stripper',
    'porn', 'porno', 'pornography', 'pornographic',
    'rape', 'rapist', 'raping', 'raped',
    'kill yourself', 'kys',
    'go kill', 'murder',
  ],

  // ── HINDI (Devanagari script) ────────────────────────────
  hindi_devanagari: [
    // Severe
    'मादरचोद', 'मादरचोद', 'मादरचोदों', 'मादरचोदो',
    'बहनचोद', 'बहनचोद', 'बहनचोदो', 'बहनचोदों',
    'भड़वा', 'भड़वे', 'भड़वों', 'भड़वाई',
    'भोसड़ी', 'भोसड़ीवाला', 'भोसड़ीवाले', 'भोसड़ीके',
    'चूतिया', 'चूतिये', 'चूतियों', 'चूतियापा',
    'लंड', 'लंडू', 'लंडुरा',
    'चूत', 'चूतड़',
    'रंडी', 'रंडियाँ', 'रंडीबाज़', 'रंडीखाना',
    'गांड', 'गांडू', 'गांडुओं', 'गांड मार', 'गांड मारा',
    'हरामी', 'हरामज़ादा', 'हरामज़ाद', 'हरामज़ादे', 'हरामज़ादों',
    'कमीना', 'कमीने', 'कमीनों',
    'कुत्ता', 'कुत्ते', 'कुत्तों', 'कुत्ती',
    'साला', 'साले', 'सालों', 'साली',
    'सालेभाई',
    'बकलोल', 'उल्लू', 'उल्लू का पट्ठा',
    'चुटिया',
    'लोड़े', 'लोड़ा',
    // Moderate
    'बेवकूफ', 'बेवकूफों', 'बेवकूफी',
    'गधा', 'गधे', 'गधों',
    'कमज़र्फ', 'बदमाश', 'बदमाशी', 'शैतान',
    'पागल', 'पागलों', 'पागलपन',
    'दो नंबर', 'डरपोक',
    'मूर्ख', 'मूर्खों', 'मूर्खता',
    'गंदा', 'गंदे', 'गंदगी',
    'नंगा', 'नंगे', 'नंगी',
    'छिनाल', 'छिनालों',
    'वेश्या', 'वेश्याएँ',
    'दलाल', 'दलालों',
    'बदतमीज़', 'बदतमीज़ी',
    'बेशर्म', 'बेशर्मी',
    'नालायक', 'नालायकों',
    'गांड़ फटना',
    'झाटू', 'भड़', 'रंडी का बच्चा', 'रंडी के पिल्ले',
    'सुअर', 'सुअरों', 'सुअरी',
    'मरजाना', 'मर जा',
  ],

  // ── HINDI (Latin / Romanized — common in subtitles) ─────
  hindi_latin: [
    // Severe
    'madarchod', 'madarchodon', 'madarchodon',
    'behenchod', 'behenchood', 'bhenchodd', 'bhenchod',
    'bhadwa', 'bhadwe', 'bhadwon',
    'bhosdi', 'bhosadike', 'bhosdike', 'bhosdiwala',
    'chutiya', 'chutiye', 'chutiyon', 'chutiyapa', 'chuttiya',
    'lund', 'lundu', 'lundura',
    'chut', 'chutad',
    'randi', 'randiyan', 'randibaz', 'randikhana',
    'gaand', 'gaandu', 'gandu', 'gaand maar', 'gaand mara',
    'harami', 'haramzada', 'haramzaade', 'haramzadi', 'haramjaada',
    'kamina', 'kamine', 'kaminon',
    'kutta', 'kutte', 'kutton', 'kutti',
    'saala', 'saale', 'salon', 'saali',
    'bakloL', 'baklol', 'ullu', 'ullu ka pattha', 'ullu ke pathhe',
    'lode', 'loda', 'lodu',
    'gashti',
    'laude', 'lauda',
    'maaki', 'teri maa ki', 'teri maa ki aankh',
    'teri maa', 'teri behan',
    'bhad mein ja', 'bhadme jao',
    'jhatu', 'jhaat', 'jhaatu',
    'mc', 'bc', 'mbc', 'mch', 'bch',
    'mc bc', 'saale mc', 'bhenchod saale',
    // Moderate
    'bewakoof', 'bewkoof', 'bevakoof', 'bevkoof', 'bewkuf',
    'gadha', 'gadhe', 'gadhon',
    'pagal', 'pagalon', 'paagal',
    'maha bewakoof',
    'ganda', 'gande', 'gandi', 'gandagi',
    'nanga', 'nange', 'nangi',
    'chhinaal', 'chhinal',
    'veshya', 'veshyaen',
    'dalaal', 'dalal',
    'badtameez', 'badtameezi',
    'besharam', 'besharmi',
    'nalaayak', 'nalayak',
    'suar', 'suaron',
    'darpok', 'do number', 'donumber',
    'kamzarf',
    'maa ka', 'baap ka', 'tere baap ka', 'teri maa ka',
    'ja maar', 'maar ja', 'teri maa ki',
    'bhen ke', 'tere maa ke',
  ],

  // ── HINGLISH / URBAN SLANG ───────────────────────────────
  hinglish: [
    'bc', 'mc', 'bsdk', 'mbc',
    'chup kar', 'chup reh',
    'teri maa', 'teri behan', 'teri behen',
    'bhad mein ja', 'bhaad mein',
    'nikal lavde', 'nikal yahan se', 'bhago yahan se',
    'saale kamine', 'kamine saale',
    'tharki', 'tharak', 'tharkiyon',
    'darpok nikla', 'tu darpok hai',
    'tujhe kya pata',
    'apni maa se puchh', 'apni maa ko puchh',
    'randwa', 'randve',
    'chamar', 'chamaron',
    'chura', 'churon',
    'bhangi', 'bhangiyon',
    'hijra', 'hijron', 'khusra',
    'chakka', 'chakke',
    'gandu sala', 'gandu saale',
    'item', // offensive when used as slur
    'maal', // when used derogatorily
    'fattu', 'fattua',
    'nalayak kahin ka', 'gadhe kahin ke',
    'kapde utaar', 'nanga kar doon',
    'teri izzat', // when in threatening context
    'bhen ke tatte', 'maa ke tatte',
    'teri gand', 'teri gaand',
    'jhant', 'jhanton',
    'lundbaaz', 'lund ke dhakkan',
    'chut ke dhakkan', 'bhosdike',
  ],

  // ── PUNJABI SLANG (common in Hindi films) ───────────────
  punjabi: [
    'teri phuddi', 'phuddi', 'phudi',
    'teri maan di', 'teri maan',
    'teri phen di', 'teri pen di', 'teri pen',
    'teri bhen di',
    'lann', 'lann de', 'lanne',
    'kutta kamine', 'kutte kamine',
    'harami kuta', 'haraami',
    'kuttey', 'kutteya',
    'paaji', // context-based
    'gand maar', 'gand marao',
    'bhainchod', 'bhainchood',
    'bhen ch', 'bhain di',
    'makkar', 'makkaroon',
    'teri maa nu', 'teri maa di',
    'ja lavde',
    'bakwaas', 'bakvass',
    'thooknda', 'thuk',
    'teri', // in certain slur combinations
    'randi', 'randan', 'randiya',
  ],

  // ── TELUGU / SOUTH INDIAN SLANG (common in OTT) ─────────
  telugu: [
    'dengey', 'dengu', 'denguta', 'dengodu',
    'puku', 'pooku',
    'modda', 'moddalu',
    'bokka', 'bokki',
    'naayala', 'naayala kodaka', 'nakkal',
    'porra', 'porre', 'porri',
    'lanjodika', 'lanja kodaka', 'lanja',
    'gadida', 'gadide',
    'lavda', 'lavde',
    'sala', // context
    'maryadha', // threatening context
    'kukka', 'kukkala',
    'pichcha', 'pichchi',
    'gadi', 'gaadi',
    'pachha',
    'cheera',
    'amma nadhala', // severe
    'akka nadhala',
    'nee ammani dengutanu',
  ],

  // ── ENGLISH ABBREVIATIONS / INTERNET SLANG ──────────────
  internet_slang: [
    'wtf', 'wth', 'omfg', 'stfu', 'gtfo', 'fu', 'fk', 'fck', 'fkn',
    'fvck', 'fvk', 'fuk', 'fuq', 'phuck', 'phuq',
    'sh1t', 'sh!t', 's.h.i.t',
    'a$$', '@ss', 'a**', 'a-hole',
    'b!tch', 'b1tch', 'biatch', 'biotch',
    'n!gga', 'n-word', 'ni**a',
    'c0ck', 'c*ck', 'd!ck', 'd*ck',
    'p*ssy', 'pu$$y',
    'f*ck', 'f**k', 'f***',
    'motherf', 'mf', 'mfer',
    'bs', // when used as profanity
  ],

};

// ── BUILD FLAT ARRAYS FOR FAST LOOKUP ────────────────────────
// We build two structures:
// 1. A Set of exact lowercase words for O(1) lookup
// 2. A sorted array of multi-word phrases (longest first) for phrase matching

function buildProfanityEngine() {
  const exactWords = new Set();
  const phrases = [];
  const regexPatterns = [];

  const allWords = [
    ...PROFANITY_LIST.english,
    ...PROFANITY_LIST.hindi_devanagari,
    ...PROFANITY_LIST.hindi_latin,
    ...PROFANITY_LIST.hinglish,
    ...PROFANITY_LIST.punjabi,
    ...PROFANITY_LIST.telugu,
    ...PROFANITY_LIST.internet_slang,
  ];

  allWords.forEach(word => {
    const w = word.toLowerCase().trim();
    if (!w) return;
    if (w.includes(' ')) {
      phrases.push(w);
    } else {
      exactWords.add(w);
    }
  });

  // Sort phrases longest-first so we match the most specific first
  phrases.sort((a, b) => b.length - a.length);

  // Common censored/obfuscated variants
  const obfuscated = [
    /\bf[u\*@]c?k+/i,
    /\bsh[i1!]t+\b/i,
    /\bb[i1!]tc?h/i,
    /\ba[s\$][s\$]+(hole|wipe|hat)?\b/i,
    /\bc[o0]ck(sucker|head)?\b/i,
    /\bd[i1!]ck(head|face)?\b/i,
    /\bp[u\*]s+y\b/i,
    /\bcu[n\*]t\b/i,
    /wh[o0]re/i,
    /n[i1!]gg[ae]/i,
    /\bf[ae4]g+[o0t]?\b/i,
    /madarc[h]*[o0]d/i,
    /behenc[h]*[o0]d/i,
    /ch[u\*]t[iy]a/i,
    /\bra+nd+i\b/i,
    /\bga+nd+u?\b/i,
  ];

  // ── SEVERE-WORD ROOTS for fuzzy substring matching ──────────
  // These are the "cores" of the worst slurs. We match them as
  // substrings on a *phonetically normalized* version of the text,
  // so spelling variants (madarchod / maderchod / madarchodd /
  // madar chod / m@d@rchod) all get caught even if the subtitle
  // spells them differently than our list.
  const severeRoots = [
    // Hindi / Hinglish romanized roots (already normalized form)
    'madarchod', 'mdrchod', 'maderchod', 'matarchod',
    'behenchod', 'bhenchod', 'banchod', 'bhonchod',
    'bhosdik', 'bhosadik', 'bhosdi', 'bhosad',
    'chutiya', 'chutia', 'chutiap', 'chut',
    'gandu', 'gand', 'gaand',
    'bhadwa', 'bhadw',
    'randi', 'rand',
    'harami', 'haramzad', 'haramjad',
    'lavda', 'lauda', 'lund', 'lode', 'loda',
    'kutta', 'kutia', 'kamina', 'kamine',
    'jhatu', 'jhant',
    'gashti', 'chinal', 'chhinal',
    'tatte', 'lundbaz',
    // Devanagari roots
    'मादरचोद', 'बहनचोद', 'भोसड़', 'चूतिय', 'चूत', 'गांड', 'गांडू',
    'भड़व', 'रंडी', 'हराम', 'लंड', 'लोड़', 'कमीन', 'कुत्त', 'झाट',
    // English severe roots
    'fuck', 'fuk', 'fck', 'phuck', 'shit', 'cunt', 'bitch',
    'asshol', 'motherfuck', 'dickhead', 'bastard', 'nigg', 'fagg',
  ];

  return { exactWords, phrases, obfuscated, severeRoots };
}

const ENGINE = buildProfanityEngine();

/**
 * Phonetic normalization for romanized Hindi / English.
 * Collapses the spelling variation that makes subtitle text differ
 * from our word list. Order of operations matters.
 */
function normalizePhonetic(s) {
  return s
    .toLowerCase()
    // strip everything except letters (latin + devanagari) — removes
    // spaces, punctuation, leetspeak separators inside a slur
    .replace(/[^a-zऀ-ॿ]/g, '')
    // common leetspeak → letters
    .replace(/0/g, 'o').replace(/1/g, 'i').replace(/3/g, 'e')
    .replace(/4/g, 'a').replace(/5/g, 's').replace(/7/g, 't')
    .replace(/@/g, 'a').replace(/\$/g, 's')
    // collapse repeated letters: "madarchodd" → "madarchod", "fuuck" → "fuck"
    .replace(/([a-zऀ-ॿ])\1+/g, '$1')
    // phonetic folding for romanized Hindi vowel/consonant variants
    .replace(/aa/g, 'a').replace(/ee/g, 'i').replace(/ii/g, 'i')
    .replace(/oo/g, 'u').replace(/uu/g, 'u')
    .replace(/ph/g, 'f').replace(/w/g, 'v')
    .replace(/dh/g, 'd').replace(/th/g, 't').replace(/bh/g, 'b')
    .replace(/ck/g, 'k').replace(/ch/g, 'c')
    .replace(/sch/g, 'c');
}

// Pre-normalize the severe roots once at load time.
// IMPORTANT: phonetic matching strips spaces/punctuation, so word
// boundaries are lost. Short roots (rand, gand, chut, lund, ass) would
// then fire inside innocent words (random, grandeur, shut...). We
// therefore only allow phonetic SUBSTRING matching for LONG compound
// slurs (>= 6 normalized chars) — exactly the ones whose spelling
// actually varies between subtitle and word list. Short slurs are
// still caught via the exact-token and word-boundaried regex layers.
const NORMALIZED_ROOTS = ENGINE.severeRoots.map(r => ({
  raw: r,
  norm: normalizePhonetic(r),
})).filter(x => x.norm.length >= 6);

/**
 * Check if a text string contains any profanity.
 * Returns { found: bool, word: string|null, method: string }
 *
 * APPROACH = TEXT-BASED (reads subtitle/caption text).
 * Matching is layered, fastest & most precise first:
 *   1. Multi-word phrase match
 *   2. Exact token match (+ English morphology)
 *   3. Obfuscation regex (f*ck, sh!t, ch*tiya)
 *   4. Phonetic-normalized substring match for severe slurs
 *      → this is what catches madarchod / maderchod / madar-chod /
 *        madarchodd / m@d@rchod, etc.
 */
function containsProfanity(text) {
  if (!text || typeof text !== 'string') return { found: false, word: null, method: null };

  const lower = text.toLowerCase();

  // 1. Phrase check (multi-word, longest first)
  for (const phrase of ENGINE.phrases) {
    if (lower.includes(phrase)) return { found: true, word: phrase, method: 'phrase' };
  }

  // 2. Word boundary check for exact words
  const tokens = lower.split(/[\s\p{P}\p{Z}—–\-,\.!?;:'"()\[\]{}\/\\|<>@#$%^&*+=~`]+/u);
  for (const token of tokens) {
    if (!token) continue;
    if (ENGINE.exactWords.has(token)) return { found: true, word: token, method: 'exact' };
    if (ENGINE.exactWords.has(token.replace(/(?:ing|ings|ed|er|ers|s)$/i, ''))) {
      return { found: true, word: token, method: 'morphology' };
    }
  }

  // 3. Regex / obfuscated check
  for (const pattern of ENGINE.obfuscated) {
    const m = lower.match(pattern);
    if (m) return { found: true, word: m[0], method: 'obfuscated' };
  }

  // 4. Phonetic-normalized substring match (catches spelling variants)
  const normText = normalizePhonetic(text);
  if (normText.length >= 3) {
    for (const root of NORMALIZED_ROOTS) {
      if (normText.includes(root.norm)) {
        return { found: true, word: root.raw, method: 'phonetic' };
      }
    }
  }

  return { found: false, word: null, method: null };
}

// Export for use in content script (also works as global when injected)
if (typeof module !== 'undefined') {
  module.exports = { PROFANITY_LIST, ENGINE, containsProfanity };
}
