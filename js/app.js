import {
  SCALES, ROOTS_SHARP, STRINGS, buildScale, fretboard, positions,
  scaleRun, backingChords, mtof, pretty,
} from './theory.js';

/* ------------------------------------------------------------------ state */

const state = {
  rootIdx: 0,
  scaleId: 'major',
  posIndex: 0,
  bpm: 72,
  beats: 4,
  metronome: false,
  backing: 'off',
  articulation: 'legato',
  volume: 0.6,
};

const rootName = () => ROOTS_SHARP[state.rootIdx];
const $ = (sel) => document.querySelector(sel);

/** Renders trusted, locally authored markup without innerHTML. */
function setHTML(node, markup) {
  const doc = new DOMParser().parseFromString(markup, 'text/html');
  node.replaceChildren(...doc.body.childNodes);
}

/* ------------------------------------------------------------------ audio */

let ac = null;
let master = null;
let bus = null; // every voice goes through here, so ■ Detener can silence them at once
let noiseBuffer = null;

function audio() {
  if (!ac) {
    ac = new (window.AudioContext || window.webkitAudioContext)();
    master = ac.createGain();
    master.gain.value = state.volume;
    master.connect(ac.destination);
  }
  if (ac.state === 'suspended') ac.resume();
  return ac;
}

/** The voice bus. Notes are scheduled seconds ahead, so stopping means muting the bus. */
function voiceBus() {
  const ctx = audio();
  if (!bus) {
    bus = ctx.createGain();
    bus.gain.value = 1;
    bus.connect(master);
  }
  return bus;
}

const openVoices = () => { if (bus && ac) bus.gain.setValueAtTime(1, ac.currentTime); };
const silenceVoices = () => { if (bus && ac) bus.gain.setValueAtTime(0, ac.currentTime); };

/** Plucked-string-ish voice: triangle + a touch of saw through a lowpass. */
function pluck(midi, when = 0, dur = 0.6, gain = 1) {
  const ctx = audio();
  const t = Math.max(when, ctx.currentTime);
  const freq = mtof(midi);
  const env = ctx.createGain();
  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = Math.min(7000, freq * 7);
  filter.Q.value = 0.6;
  const osc = ctx.createOscillator();
  osc.type = 'triangle';
  osc.frequency.value = freq;
  const bite = ctx.createOscillator();
  bite.type = 'sawtooth';
  bite.frequency.value = freq;
  const biteGain = ctx.createGain();
  biteGain.gain.value = 0.18;
  env.gain.setValueAtTime(0.0001, t);
  env.gain.exponentialRampToValueAtTime(0.95 * gain, t + 0.006);
  env.gain.exponentialRampToValueAtTime(0.0001, t + Math.max(0.12, dur));
  osc.connect(env);
  bite.connect(biteGain).connect(env);
  env.connect(filter).connect(voiceBus());
  osc.start(t);
  bite.start(t);
  osc.stop(t + dur + 0.05);
  bite.stop(t + dur + 0.05);
}

/** Metronome click: short noise burst, brighter on the downbeat. */
function click(when, accent) {
  const ctx = audio();
  const t = Math.max(when, ctx.currentTime);
  if (!noiseBuffer) {
    noiseBuffer = ctx.createBuffer(1, ctx.sampleRate * 0.05, ctx.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  }
  const src = ctx.createBufferSource();
  src.buffer = noiseBuffer;
  const filter = ctx.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.value = accent ? 2400 : 1500;
  const env = ctx.createGain();
  env.gain.setValueAtTime(accent ? 0.5 : 0.28, t);
  env.gain.exponentialRampToValueAtTime(0.0001, t + 0.05);
  src.connect(filter).connect(env).connect(voiceBus());
  src.start(t);
  src.stop(t + 0.06);
}

const durFactor = () => (state.articulation === 'legato' ? 0.98 : state.articulation === 'portato' ? 0.7 : 0.3);

/** Plays a list of MIDI notes, evenly spaced, with optional per-note callback. */
function playSequence(midis, { stepBeats = 0.5, onNote = null, gain = 1 } = {}) {
  const ctx = audio();
  stopSequence();
  openVoices();
  const spb = 60 / state.bpm;
  const stepDur = stepBeats * spb;
  const t0 = ctx.currentTime + 0.15;
  const timers = [];
  midis.forEach((midi, i) => {
    const when = t0 + i * stepDur;
    pluck(midi, when, Math.max(0.14, stepDur * durFactor()), gain);
    timers.push(
      setTimeout(() => {
        clearHighlight();
        highlight(midi);
        if (onNote) onNote(midi, i);
      }, Math.max(0, (when - ctx.currentTime) * 1000 - 5)),
    );
  });
  timers.push(setTimeout(() => clearHighlight(), (t0 + midis.length * stepDur - ctx.currentTime) * 1000 + 400));
  seqTimers = timers;
}

let seqTimers = [];
function stopSequence() {
  seqTimers.forEach(clearTimeout);
  seqTimers = [];
  clearHighlight();
}

/* -------------------------------------------------------------- clock/backing */

const clock = { timer: null, nextTime: 0, step: 0 };

function startClock() {
  if (clock.timer) return;
  audio();
  openVoices();
  clock.nextTime = ac.currentTime + 0.1;
  clock.step = 0;
  clock.timer = setInterval(tick, 25);
}

function stopClock() {
  clearInterval(clock.timer);
  clock.timer = null;
}

function tick() {
  const spb = 60 / state.bpm;
  const stepDur = spb / 4; // 16th-note grid
  const stepsPerBar = state.beats * 4;
  // A throttled tab (or a suspended AudioContext) can leave the clock seconds
  // behind: resync instead of firing every missed step at once.
  if (clock.nextTime < ac.currentTime - 0.1) clock.nextTime = ac.currentTime + 0.05;
  while (clock.nextTime < ac.currentTime + 0.2) {
    const when = clock.nextTime;
    const inBar = clock.step % stepsPerBar;
    if (inBar % 4 === 0) {
      const beatIndex = inBar / 4;
      if (state.metronome) click(when, beatIndex === 0);
      const delay = Math.max(0, (when - ac.currentTime) * 1000);
      setTimeout(() => flashBeat(beatIndex), delay);
    }
    if (inBar === 0) scheduleBar(when, Math.floor(clock.step / stepsPerBar));
    clock.step++;
    clock.nextTime += stepDur;
  }
}

/** Backing: drone (root+5th) or a chord progression for the current key. */
function scheduleBar(when, bar) {
  if (state.backing === 'off') return;
  const scale = buildScale(rootName(), state.scaleId);
  const barDur = (60 / state.bpm) * state.beats;
  const voicing = (pcs) => pcs.map((pc) => 45 + (((pc - 45) % 12) + 12) % 12);
  if (state.backing === 'drone') {
    voicing([scale.rootPc, (scale.rootPc + 7) % 12]).forEach((midi, i) =>
      pluck(midi, when + i * 0.02, barDur * 0.95, 0.42));
    return;
  }
  const chord = backingChords(rootName(), state.backing, bar);
  voicing(chord).forEach((midi, i) => pluck(midi, when + i * 0.025, barDur * 0.9, 0.38));
}

function flashBeat(beatIndex) {
  const dot = document.querySelector(`.beat-dot[data-beat="${beatIndex}"]`);
  if (dot) {
    dot.classList.add('on');
    setTimeout(() => dot.classList.remove('on'), 110);
  }
}

/* ------------------------------------------------------------- fretboard svg */

const SVG_NS = 'http://www.w3.org/2000/svg';

function el(name, attrs = {}) {
  const node = document.createElementNS(SVG_NS, name);
  for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, v);
  return node;
}

const OPEN_MIDI = STRINGS.map((s) => s.midi);

/** One neck drawing: a window of frets (fret 0 is never drawn), strings as rows. */
function neckSvg(scale, data, min, max, { label = '', highlight = null, openNotes = false } = {}) {
  const width = Math.max(6, max - min + 1);
  const rowH = 30;
  const left = 40;
  const top = 30;
  // Fixed viewBox: height and note size are identical for every scale, so switching
  // scales never resizes the neck nor nudges the legend/formula up or down.
  const w = 674;
  const cellW = (w - left - 18) / width;
  const h = top + 6 * rowH + 10;
  const svg = el('svg', { viewBox: `0 0 ${w} ${h}`, class: 'fret-svg wide', role: 'group' });
  svg.setAttribute('aria-label', `${label} — ${scale.scale.name} en ${rootName()}`);

  // neck background
  svg.append(el('rect', { x: left, y: top, width: width * cellW, height: 6 * rowH, fill: '#fffdf8' }));

  // The selected position reads as a band of warm light behind the dots.
  if (highlight) {
    svg.append(el('rect', {
      class: 'pos-window',
      x: left + (highlight.start - min) * cellW,
      y: top,
      width: (highlight.end - highlight.start + 1) * cellW,
      height: 6 * rowH,
      fill: '#f0a13c', 'fill-opacity': 0.26,
      stroke: '#d98a26', 'stroke-opacity': 0.55, 'stroke-width': 1.5,
    }));
  }

  // frets (there is no nut: fret 0 is left out of the diagram)
  for (let i = 0; i <= width; i++) {
    const x = left + i * cellW;
    svg.append(el('line', {
      x1: x, y1: top, x2: x, y2: top + 6 * rowH,
      stroke: '#b9b2a4', 'stroke-width': 1.2,
    }));
  }

  // inlay markers at frets 3 5 7 9 12
  const markers = [3, 5, 7, 9, 12];
  markers.forEach((f) => {
    if (f < min || f > max) return;
    const cx = left + (f - min + 0.5) * cellW;
    const cy = top + 3 * rowH;
    if (f === 12) {
      svg.append(el('circle', { cx, cy: cy - rowH, r: 4.5, fill: '#e6e0d4' }));
      svg.append(el('circle', { cx, cy: cy + rowH, r: 4.5, fill: '#e6e0d4' }));
    } else {
      svg.append(el('circle', { cx, cy, r: 4.5, fill: '#e6e0d4' }));
    }
  });

  // fret numbers
  for (let f = min; f <= max; f++) {
    const num = el('text', {
      x: left + (f - min + 0.5) * cellW, y: top - 10, 'text-anchor': 'middle', class: 'fret-num',
    });
    num.textContent = String(f);
    svg.append(num);
  }

  // A scale note as a dot. Reused by the frets and by the open strings of position 1.
  const dot = (string, si, f, cx, y) => {
    const note = string.frets[f];
    if (!note) return;
    const g = el('g', {
      class: note.isRoot ? 'note root' : 'note',
      'data-midi': note.midi, tabindex: '0', role: 'button',
    });
    g.setAttribute('aria-label', `${string.label} traste ${f}, grado ${note.degree} (${pretty(note.name)})`);
    g.append(el('circle', { cx, cy: y, r: 12, fill: note.color }));
    if (note.isRoot) g.append(el('circle', { cx, cy: y, r: 12, fill: 'none', stroke: '#1b1b1b', 'stroke-width': 2 }));
    const text = el('text', { x: cx, y: y + 4.2, 'text-anchor': 'middle', class: 'note-label' });
    text.textContent = pretty(note.name);
    g.append(text);
    const fire = () => pluck(OPEN_MIDI[si] + f, 0, 0.8);
    g.addEventListener('click', fire);
    g.addEventListener('keydown', (ev) => {
      if (ev.key !== 'Enter' && ev.key !== ' ') return;
      ev.preventDefault(); // Space would otherwise scroll the page
      fire();
    });
    svg.append(g);
  };

  // strings + dots
  data.forEach((string, si) => {
    const y = top + si * rowH + rowH / 2;
    svg.append(el('line', {
      x1: left, y1: y, x2: left + width * cellW, y2: y,
      stroke: '#6b665c', 'stroke-width': [3.4, 3, 2.6, 2, 1.5, 1.1][si],
    }));
    // Position 1 circles the open strings that belong to the scale, left of fret 1.
    const open = string.frets[0];
    if (openNotes && open) {
      dot(string, si, 0, left - 12, y);
    } else {
      const openLabel = el('text', { x: left - 12, y: y + 5, 'text-anchor': 'middle', class: 'open-label' });
      openLabel.textContent = string.note;
      svg.append(openLabel);
    }

    for (let f = min; f <= max; f++) dot(string, si, f, left + (f - min + 0.5) * cellW, y);
  });

  return svg;
}

/** One continuous neck with every position of the scale; the selected box is lit. */
function renderFretboard() {
  const scale = buildScale(rootName(), state.scaleId);
  const data = fretboard(scale, 15);
  const list = positions(scale);
  state.posIndex = Math.min(state.posIndex, list.length - 1);

  // Fret 0 is not drawn, so the open position starts at fret 1.
  const min = Math.max(1, Math.min(...list.map((p) => p.startFret)));
  const max = Math.max(...list.map((p) => p.endFret));

  const p = list[state.posIndex];
  const start = Math.max(min, Math.max(1, p.startFret));
  const end = Math.min(max, p.endFret);
  const highlight = start <= end ? { start, end } : null;
  const openNotes = p.startFret === 0;
  const label = `Todas las posiciones — ${scale.scale.name} en ${rootName()}`;

  const fig = document.createElement('figure');
  fig.className = 'neck-box';
  fig.append(neckSvg(scale, data, min, max, { label, highlight, openNotes }));
  $('#fretWrap').replaceChildren(fig);
}

function highlight(midi) {
  // Keyed by attribute, not by a Map: the same pitch lives on several strings and
  // in the full-neck view every one of them has to light up.
  document.querySelectorAll(`.fret-svg .note[data-midi="${midi}"]`).forEach((n) => n.classList.add('active'));
}

function clearHighlight() {
  document.querySelectorAll('.note.active').forEach((n) => n.classList.remove('active'));
}

/* ------------------------------------------------------------------ legend */

function renderLegend(scale) {
  const parts = scale.notes.map((n) => `
    <span class="chip"><i style="background:${n.color}"></i><b>${n.degree}</b> ${pretty(n.name)}</span>`);
  setHTML($('#legend'), parts.join(''));
  // Interval code: T = whole tone, S = semitone (T+S when the step is a tone and a half).
  const steps = scale.notes.map((n, i) => {
    if (i === 0) return null;
    const d = n.semi - scale.notes[i - 1].semi;
    return d === 1 ? 'S' : d === 2 ? 'T' : d === 3 ? 'T+S' : `${d}S`;
  }).filter(Boolean);
  setHTML($('#formula'), `
    <p><b>${rootName()} ${scale.scale.name}</b> — grados: <code>${scale.notes.map((n) => n.degree).join(' ')}</code>
    &nbsp;·&nbsp; notas: <code>${scale.notes.map((n) => pretty(n.name)).join(' ')}</code>
    &nbsp;·&nbsp; Intervalos: <code>${steps.join('')}</code></p>`);
}

function renderPositionSelect() {
  const list = positions(buildScale(rootName(), state.scaleId));
  state.posIndex = Math.min(state.posIndex, list.length - 1);
  const sel = $('#posSelect');
  sel.replaceChildren(...list.map((p, i) => {
    const o = document.createElement('option');
    o.value = String(i);
    o.textContent = `${p.index} - ${pretty(p.anchorNote)}`;
    return o;
  }));
  sel.value = String(state.posIndex);
  sel.disabled = list.length < 2;
}

function renderAll() {
  renderFretboard();
  renderLegend(buildScale(rootName(), state.scaleId));
  renderPositionSelect();
}

/* --------------------------------------------------------------- playback */

function tonicMidi(scale = buildScale(rootName(), state.scaleId)) {
  const midi = 55 + (((scale.rootPc - 55) % 12) + 12) % 12;
  return midi > 64 ? midi - 12 : midi;
}


/* -------------------------------------------------------------------- init */

function initControls() {
  const scaleSel = $('#scale');
  SCALES.forEach((s) => {
    const o = document.createElement('option');
    o.value = s.id;
    o.textContent = `${s.name} (${s.family})`;
    scaleSel.append(o);
  });
  scaleSel.value = state.scaleId;
  scaleSel.addEventListener('change', () => {
    state.scaleId = scaleSel.value;
    state.posIndex = 0;
    renderAll();
  });

  const rootSel = $('#root');
  rootSel.addEventListener('change', () => {
    state.rootIdx = Number(rootSel.value);
    renderAll();
  });
  rootSel.replaceChildren(...ROOTS_SHARP.map((name, i) => {
    const o = document.createElement('option');
    o.value = String(i);
    o.textContent = name;
    return o;
  }));
  rootSel.value = String(state.rootIdx);

  $('#posSelect').addEventListener('change', (e) => {
    state.posIndex = Number(e.target.value);
    renderFretboard();
  });

  $('#playScale').addEventListener('click', () => {
    const scale = buildScale(rootName(), state.scaleId);
    playSequence(scaleRun(scale, { startMidi: tonicMidi() - 12 }));
  });
  $('#playNeck').addEventListener('click', () => {
    const scale = buildScale(rootName(), state.scaleId);
    playSequence(scaleRun(scale, { octaves: 1, startMidi: tonicMidi() - 12 }), { stepBeats: 0.5 });
  });
      $('#stopAll').addEventListener('click', () => {
        stopSequence();
        stopClock();
        silenceVoices();
        // Stop means stop: leaving the controls lit up would claim audio that is not there.
        state.metronome = false;
        state.backing = 'off';
        $('#metronome').checked = false;
        $('#backing').value = 'off';
      });

  const bpmEl = $('#bpm');
  const bpmRange = $('#bpmRange');
  const setBpm = (v) => {
    state.bpm = Math.min(220, Math.max(40, Number(v) || 72));
    bpmEl.value = String(state.bpm);
    bpmRange.value = String(state.bpm);
    $('#bpmOut').textContent = `${state.bpm} BPM`;
  };
  bpmEl.addEventListener('change', () => setBpm(bpmEl.value));
  bpmRange.addEventListener('input', () => setBpm(bpmRange.value));
  setBpm(state.bpm);

  $('#beats').addEventListener('change', (e) => {
    state.beats = Number(e.target.value);
    renderBeatDots();
  });

  $('#metronome').addEventListener('change', (e) => {
    state.metronome = e.target.checked;
    if (state.metronome || state.backing !== 'off') startClock();
    if (!state.metronome && state.backing === 'off') stopClock();
  });

  $('#backing').addEventListener('change', (e) => {
    state.backing = e.target.value;
    if (state.backing !== 'off') startClock();
    else if (!state.metronome) stopClock();
  });

  $('#articulation').addEventListener('change', (e) => { state.articulation = e.target.value; });

  $('#volume').addEventListener('input', (e) => {
    state.volume = Number(e.target.value) / 100;
    if (master) master.gain.value = state.volume;
  });
}

function renderBeatDots() {
  setHTML($('#beatDots'), Array.from({ length: state.beats }, (_, i) =>
    `<span class="beat-dot" data-beat="${i}"></span>`).join(''));
}

function init() {
  initControls();
  renderBeatDots();
  renderAll();
}

document.addEventListener('DOMContentLoaded', init);
