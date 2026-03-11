import { CHORD_GRAPH, CHORD_TYPE, CHORD_NOTES, JAZZ_PROGRESSION_MAP } from '../data/chords.js';
import { midiToNoteName } from '../audio/voiceleading.js';

const TYPE_LABELS = {
  major7:   'Maggiore 7\u00aa',
  minor7:   'Minore 7\u00aa',
  dom7:     'Dominante 7\u00aa',
  half_dim: 'Semidiminuito',
  dim7:     'Diminuito 7\u00aa',
  aug:      'Aumentato',
  minor:    'Minore',
  major:    'Maggiore'
};

const CATEGORY_LABELS = {
  low:      { label: 'Low (risoluzione)', color: '#50d0a0' },
  mid:      { label: 'Mid (diatonico)',   color: '#e8d8a0' },
  high:     { label: 'High (sorpresa)',   color: '#d05050' },
  cycle:    { label: 'Cycle (quinte)',    color: '#f0a050' },
  parallel: { label: 'Parallel (modale)', color: '#b088d0' }
};

// Callback for when a chord tag is clicked in the info panel
let onChordTagClick = null;

export function setOnChordTagClick(callback) {
  onChordTagClick = callback;
}

// Populate chord dropdowns
export function populateDropdowns() {
  const chords = Object.keys(CHORD_GRAPH).sort();
  const selects = [
    document.getElementById('random-start'),
    document.getElementById('weighted-start')
  ];

  for (const select of selects) {
    if (!select) continue;
    select.innerHTML = '';
    for (const chord of chords) {
      const opt = document.createElement('option');
      opt.value = chord;
      opt.textContent = chord;
      select.appendChild(opt);
    }
  }

  const randomStart = document.getElementById('random-start');
  if (randomStart) randomStart.value = 'Cmaj7';
  const weightedStart = document.getElementById('weighted-start');
  if (weightedStart) weightedStart.value = 'Cmaj7';
}

// Update info panel with chord details
export function updateInfoPanel(chordName, voicing = null) {
  const infoEl = document.getElementById('info-content');
  if (!infoEl) return;

  if (!chordName) {
    infoEl.innerHTML = `
      <div class="empty-state">
        <div class="empty-state__icon">&#127929;</div>
        <div class="empty-state__text">Seleziona un accordo nel grafo per vedere i dettagli</div>
      </div>
    `;
    return;
  }

  const type = CHORD_TYPE[chordName] || 'major7';
  const notes = CHORD_NOTES[chordName] || [];
  const typeLabel = TYPE_LABELS[type] || type;
  const map = JAZZ_PROGRESSION_MAP[chordName];

  let successorsHtml = '';

  if (map) {
    // Accordo chiave: mostra per categoria
    for (const [cat, info] of Object.entries(CATEGORY_LABELS)) {
      const chords = map[cat] || [];
      if (chords.length === 0) continue;
      successorsHtml += `
        <div style="margin-bottom:6px">
          <div style="font-size:10px; color:${info.color}; margin-bottom:2px">${info.label}</div>
          <div class="infopanel__successors">
            ${chords.map(s => {
              const t = CHORD_TYPE[s] || 'dom7';
              return `<span class="chord-tag chord-tag--${t}" data-chord="${s}" style="cursor:pointer">${s}</span>`;
            }).join('')}
          </div>
        </div>
      `;
    }
  } else {
    // Accordo solo-successore: mostra lista piatta
    const successors = CHORD_GRAPH[chordName] || [];
    successorsHtml = `
      <div style="font-size:10px; color:var(--text-muted); margin-bottom:2px">Successori (${successors.length})</div>
      <div class="infopanel__successors">
        ${successors.map(s => {
          const t = CHORD_TYPE[s] || 'dom7';
          return `<span class="chord-tag chord-tag--${t}" data-chord="${s}" style="cursor:pointer">${s}</span>`;
        }).join('')}
      </div>
    `;
  }

  infoEl.innerHTML = `
    <div class="infopanel__chord-name" style="color: var(--chord-${type})">${chordName}</div>
    <div style="font-size:11px; color:var(--text-muted); margin-bottom:var(--space-sm)">${typeLabel}</div>
    <div class="infopanel__chord-notes">${notes.join(' \u00b7 ')}</div>
    <div style="margin-top:var(--space-md)">${successorsHtml}</div>
  `;

  // Delegated click on chord tags
  infoEl.addEventListener('click', (e) => {
    const tag = e.target.closest('[data-chord]');
    if (tag && onChordTagClick) {
      onChordTagClick(tag.dataset.chord);
    }
  });
}

// Update voice leading info
export function updateVoiceLeadingInfo(voicing) {
  const el = document.getElementById('voice-leading-info');
  if (!el) return;

  if (!voicing) {
    el.innerHTML = `
      <div class="empty-state">
        <div class="empty-state__text" style="font-size:12px;">Genera una progressione per visualizzare il voice leading</div>
      </div>
    `;
    return;
  }

  const noteNames = voicing.map(midi => midiToNoteName(midi));

  el.innerHTML = `
    <div style="font-family:var(--font-mono); font-size:13px; color:var(--text-primary)">
      ${noteNames.join(' \u00b7 ')}
    </div>
    <div style="margin-top:var(--space-sm); font-size:11px; color:var(--text-muted)">
      MIDI: ${voicing.join(' \u00b7 ')}
    </div>
  `;
}

// Switch between mode control panels
export function showModeControls(mode) {
  const panels = ['tree', 'random', 'weighted', 'dijkstra'];
  for (const p of panels) {
    const el = document.getElementById(`controls-${p}`);
    if (el) el.style.display = p === mode ? 'block' : 'none';
  }
}
