// ============================================================
// SHASHN PROFANITY MUTER — Popup Logic
// ============================================================

const STREAMING_HOSTS = {
  netflix:   ['netflix.com'],
  youtube:   ['youtube.com', 'youtu.be'],
  prime:     ['primevideo.com', 'amazon.com'],
  hotstar:   ['hotstar.com', 'jiocinema.com'],
  disney:    ['disneyplus.com'],
  hulu:      ['hulu.com'],
  max:       ['max.com', 'hbomax.com'],
  appletv:   ['tv.apple.com'],
  sonyliv:   ['sonyliv.com'],
  zee5:      ['zee5.com'],
  mxplayer:  ['mxplayer.in'],
  voot:      ['voot.com'],
};

function detectPlatformFromTab(url) {
  if (!url) return null;
  for (const [name, hosts] of Object.entries(STREAMING_HOSTS)) {
    if (hosts.some(h => url.includes(h))) return name;
  }
  return null;
}

function platformLabel(key) {
  const labels = {
    netflix: 'Netflix', youtube: 'YouTube', prime: 'Prime Video',
    hotstar: 'Hotstar / JioCinema', disney: 'Disney+', hulu: 'Hulu',
    max: 'Max / HBO', appletv: 'Apple TV+', sonyliv: 'SonyLIV',
    zee5: 'Zee5', mxplayer: 'MX Player', voot: 'Voot',
  };
  return labels[key] || key;
}

// ── INIT ────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  // Load settings
  const settings = await chrome.storage.sync.get([
    'enabled', 'muteCount', 'sensitivity', 'showBadge', 'languages',
  ]);

  // Master toggle
  const masterToggle = document.getElementById('masterToggle');
  const statusText   = document.getElementById('statusText');
  masterToggle.checked = settings.enabled !== false;
  updateStatusLabel(masterToggle.checked);

  masterToggle.addEventListener('change', () => {
    const enabled = masterToggle.checked;
    chrome.storage.sync.set({ enabled });
    updateStatusLabel(enabled);
    // Notify active tab
    sendToActiveTab({ type: 'SET_ENABLED', enabled });
  });

  function updateStatusLabel(on) {
    statusText.textContent = on ? 'Protection: ON' : 'Protection: OFF';
    statusText.style.color = on ? 'var(--green)' : 'var(--muted)';
  }

  // All-time count
  document.getElementById('totalCount').textContent = settings.muteCount || 0;

  // Session count from active tab stats
  const tab = await getActiveTab();
  if (tab) {
    chrome.runtime.sendMessage({ type: 'GET_TAB_STATS' }, (res) => {
      if (res) {
        document.getElementById('sessionCount').textContent = res.count || 0;
        renderMutedWords(res.words || []);
      }
    });

    // Platform detection
    const platform = detectPlatformFromTab(tab.url);
    const dot  = document.getElementById('platformDot');
    const name = document.getElementById('platformName');
    if (platform) {
      dot.classList.remove('inactive');
      name.textContent = `Active on ${platformLabel(platform)}`;
      // Highlight the platform tag
      const tag = document.getElementById(`tag-${platform}`);
      if (tag) tag.style.fontWeight = '800';
    } else {
      name.textContent = 'Not a streaming page';
      dot.classList.add('inactive');
    }
  }

  // Language toggles
  const langSettings = settings.languages || {};
  document.querySelectorAll('[data-lang]').forEach(input => {
    const lang = input.dataset.lang;
    input.checked = langSettings[lang] !== false;
    input.addEventListener('change', () => {
      const langs = { ...langSettings, [lang]: input.checked };
      chrome.storage.sync.set({ languages: langs });
      sendToActiveTab({ type: 'SET_LANGUAGES', languages: langs });
    });
  });

  // Sensitivity buttons
  const currentSens = settings.sensitivity || 'all';
  document.querySelectorAll('[data-sens]').forEach(btn => {
    if (btn.dataset.sens === currentSens) btn.classList.add('active');
    btn.addEventListener('click', () => {
      document.querySelectorAll('[data-sens]').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      chrome.storage.sync.set({ sensitivity: btn.dataset.sens });
      sendToActiveTab({ type: 'SET_SENSITIVITY', sensitivity: btn.dataset.sens });
    });
  });

  // Reset
  document.getElementById('resetBtn').addEventListener('click', () => {
    chrome.storage.sync.set({ muteCount: 0 });
    document.getElementById('totalCount').textContent = '0';
    chrome.runtime.sendMessage({ type: 'RESET_BADGE' });
  });
});

function renderMutedWords(words) {
  const container = document.getElementById('mutedWords');
  if (!words || !words.length) {
    container.innerHTML = '<span class="muted-word-hint">No words muted yet this session.</span>';
    return;
  }
  // Count unique words
  const freq = {};
  words.forEach(w => freq[w] = (freq[w] || 0) + 1);
  const sorted = Object.entries(freq).sort((a, b) => b[1] - a[1]).slice(0, 12);
  container.innerHTML = sorted.map(([w, c]) =>
    `<span class="muted-word" title="Click to reveal">${'*'.repeat(Math.min(w.length, 6))}${c > 1 ? ` ×${c}` : ''}</span>`
  ).join('');
}

async function getActiveTab() {
  return new Promise(resolve => {
    chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
      resolve(tabs[0] || null);
    });
  });
}

async function sendToActiveTab(msg) {
  const tab = await getActiveTab();
  if (tab) {
    chrome.tabs.sendMessage(tab.id, msg).catch(() => {});
  }
}
