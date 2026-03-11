import { CHORD_TYPE } from '../data/chords.js';

const timelineChordsEl = document.getElementById('timeline-chords');

let currentPath = [];
let playingIndex = -1;
let onChordClick = null;

export function setOnChordClick(callback) {
  onChordClick = callback;
}

export function updateTimeline(path, activeIndex = -1) {
  currentPath = path;
  playingIndex = activeIndex;
  render();
}

export function setPlayingIndex(index) {
  playingIndex = index;
  render();
}

export function clearTimeline() {
  currentPath = [];
  playingIndex = -1;
  render();
}

function render() {
  if (currentPath.length === 0) {
    timelineChordsEl.innerHTML = '<span class="timeline__empty">Nessuna progressione — seleziona una modalità e inizia a comporre</span>';
    return;
  }

  timelineChordsEl.innerHTML = '';

  currentPath.forEach((chord, i) => {
    const card = document.createElement('div');
    const type = CHORD_TYPE[chord] || 'major';
    card.className = `timeline-card timeline-card--${type}`;
    if (i === playingIndex) card.classList.add('timeline-card--playing');

    // Make clickable
    card.style.cursor = 'pointer';
    card.addEventListener('click', () => {
      if (onChordClick) onChordClick(chord, i);
    });

    const name = document.createElement('div');
    name.className = 'timeline-card__name';
    name.textContent = chord;

    const index = document.createElement('div');
    index.className = 'timeline-card__index';
    index.textContent = i + 1;

    card.appendChild(name);
    card.appendChild(index);
    timelineChordsEl.appendChild(card);

    if (i < currentPath.length - 1) {
      const arrow = document.createElement('span');
      arrow.className = 'timeline__arrow';
      arrow.textContent = '→';
      timelineChordsEl.appendChild(arrow);
    }
  });

  // Auto-scroll
  if (playingIndex >= 0) {
    const cards = timelineChordsEl.querySelectorAll('.timeline-card');
    if (cards[playingIndex]) {
      cards[playingIndex].scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
  }
}
