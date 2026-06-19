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
    /f[u\*@]c?k+/i,
    /sh[i1!]t+/i,
    /b[i1!]tc?h/i,
    /a[s\$][s\$]+/i,
    /c[o0]c?k/i,
    /d[i1!]c?k/i,
    /p[u\*]s+y/i,
    /cu[n\*]t/i,
    /wh[o0]re?/i,
    /n[i1!]gg[ae]/i,
    /f[ae4]g+[o0t]?/i,
    /madarc[h]*[o0]d/i,
    /behenc[h]*[o0]d/i,
    /ch[u\*]t[iy]/i,
    /rn[d]*i/i,
    /ga[a]?[n]*[d]+[u]?/i,
  ];

  return { exactWords, phrases, obfuscated };
}

const ENGINE = buildProfanityEngine();

/**
 * Check if a text string contains any profanity.
 * Returns { found: bool, word: string|null }
 */
function containsProfanity(text) {
  if (!text || typeof text !== 'string') return { found: false, word: null };

  const lower = text.toLowerCase();

  // 1. Phrase check (multi-word, longest first)
  for (const phrase of ENGINE.phrases) {
    if (lower.includes(phrase)) return { found: true, word: phrase };
  }

  // 2. Word boundary check for exact words
  // Split on whitespace, punctuation, and common separators
  const tokens = lower.split(/[\s\p{P}\p{Z}—–\-,\.!?;:'"()\[\]{}\/\\|<>@#$%^&*+=~`]+/u);
  for (const token of tokens) {
    if (!token) continue;
    if (ENGINE.exactWords.has(token)) return { found: true, word: token };
    // Also check without trailing 's', 'ed', 'ing', 'er' for English morphology
    if (ENGINE.exactWords.has(token.replace(/(?:ing|ings|ed|er|ers|s)$/i, ''))) {
      return { found: true, word: token };
    }
  }

  // 3. Regex / obfuscated check
  for (const pattern of ENGINE.obfuscated) {
    const m = lower.match(pattern);
    if (m) return { found: true, word: m[0] };
  }

  return { found: false, word: null };
}

// Export for use in content script (also works as global when injected)
if (typeof module !== 'undefined') {
  module.exports = { PROFANITY_LIST, ENGINE, containsProfanity };
}
