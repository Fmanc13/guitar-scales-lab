// Boots the real page in jsdom with a stubbed Web Audio API and exercises the UI:
// renders the fretboard, switches scales/positions, plays notes, toggles the clock.
import { test, before } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { JSDOM } from 'jsdom';

class FakeParam {
  constructor(v = 0) { this.value = v; }
  setValueAtTime(v) { globalThis.__gainEvents.push(v); return this; }
  linearRampToValueAtTime() { return this; }
  exponentialRampToValueAtTime() { return this; }
}

class FakeNode {
  constructor() {
    this.gain = new FakeParam(0.5);
    this.frequency = new FakeParam(440);
    this.Q = new FakeParam(1);
    this.type = '';
    this.buffer = null;
  }
  connect(dest) { return dest; }
  start() { if (this.type === 'triangle') globalThis.__voices.push(this.frequency.value); }
  stop() {}
}

class FakeAudioContext {
  constructor() {
    this.currentTime = 0;
    this.sampleRate = 44100;
    this.state = 'running';
    this.destination = new FakeNode();
  }
  resume() { return Promise.resolve(); }
  createGain() { return new FakeNode(); }
  createOscillator() { return new FakeNode(); }
  createBiquadFilter() { return new FakeNode(); }
  createBufferSource() { return new FakeNode(); }
  createBuffer() { return { getChannelData: () => new Float32Array(2048) }; }
}

let doc;
let win;

const $$ = (sel) => [...doc.querySelectorAll(sel)];
const fire = (node, type = 'change') => node.dispatchEvent(new win.Event(type));
const delay = (ms) => new Promise((r) => setTimeout(r, ms));

before(async () => {
  const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
  const dom = new JSDOM(html, { url: 'http://localhost:5173/', pretendToBeVisual: true });
  win = dom.window;
  doc = win.document;
  win.scrollTo = () => {};
  win.AudioContext = FakeAudioContext;
  globalThis.window = win;
  globalThis.document = doc;
  globalThis.DOMParser = win.DOMParser;
  globalThis.__voices = [];
  globalThis.__gainEvents = [];
  await import('../js/app.js');
  doc.dispatchEvent(new win.Event('DOMContentLoaded'));
});

test('the fretboard shows every position of the scale on one continuous neck', () => {
  assert.equal($$('.fret-svg').length, 1, 'one continuous neck');
  assert.equal($$('.neck-box').length, 1);
  const frets = $$('.fret-num').map((t) => Number(t.textContent));
  assert.equal(frets[0], 1, 'fret 0 is not drawn');
  assert.deepEqual(frets, [...Array(14)].map((_, i) => i + 1), 'C major runs from fret 1 to 14, contiguous');
  const notes = $$('.fret-svg .note');
  assert.ok(notes.length >= 10, `expected a full box of notes, got ${notes.length}`);
  assert.equal(notes.filter((n) => n.dataset.midi === undefined).length, 0, 'every dot knows its pitch');
  assert.equal($$('.legend .chip').length, 7, 'C major has 7 degrees');
  const roots = notes.filter((n) => n.querySelector('circle[stroke]'));
  assert.ok(roots.length >= 2, 'the tonic should be marked in every octave of the box');
  assert.ok($$('.fret-svg .note[data-midi="40"]').length >= 1, 'position 1 circles the open low E string');
  assert.equal($$('.fret-svg .pos-window').length, 1, 'the selected position is lit');
  assert.match(doc.querySelector('#formula').textContent, /grados: 1 2 3 4 5 6 7/);
  assert.match(doc.querySelector('#formula').textContent, /Intervalos: TTSTTT/, 'T = tono, S = semitono');
  assert.equal($$('#posSelect option').length, 7, 'one option per position');
  assert.equal(doc.querySelector('#posSelect').value, '0');
  assert.match($$('#posSelect option')[0].textContent, /^1 - E$/, 'option shows number and anchor note only');
});

test('changing scale redraws the box and the legend', () => {
  const sel = doc.querySelector('#scale');
  sel.value = 'pent-minor';
  fire(sel);
  assert.equal($$('.legend .chip').length, 5);
  assert.match(doc.querySelector('#formula').textContent, /grados: 1 ♭3 4 5 ♭7/);
  assert.equal($$('#posSelect option').length, 5, 'pentatonic has five positions');

  sel.value = 'lydian';
  fire(sel);
  assert.match(doc.querySelector('#formula').textContent, /F♯/);
  assert.equal($$('#posSelect option').length, 7);
});

test('the position selector lights the chosen box on the neck', () => {
  const scale = doc.querySelector('#scale');
  scale.value = 'major';
  fire(scale);
  const sel = doc.querySelector('#posSelect');
  assert.equal($$('.fret-svg .pos-window').length, 1);
  const x0 = Number($$('.fret-svg .pos-window')[0].getAttribute('x'));
  assert.equal($$('.fret-svg .pos-window')[0].getAttribute('width'), String(4 * ((674 - 40 - 18) / 14)), 'open position spans frets 1-4');

  sel.value = '3';
  fire(sel);
  assert.ok(Number($$('.fret-svg .pos-window')[0].getAttribute('x')) > x0, 'the band moves up the neck');

  sel.value = '0';
  fire(sel);
  assert.equal(Number($$('.fret-svg .pos-window')[0].getAttribute('x')), x0);
});

test('the fretboard always labels notes by name', () => {
  const sel = doc.querySelector('#scale');
  sel.value = 'pent-minor';
  fire(sel);
  const text = $$('.fret-svg .note-label').map((t) => t.textContent);
  assert.ok(text.includes('C'), `expected note names, got ${text.slice(0, 6).join(',')}`);
  assert.ok(text.includes('E♭'), 'altered notes keep their accidental');
  assert.equal(text.includes('♭3'), false, 'no degree notation on the fretboard');
});

test('key switches keep the spelling coherent', () => {
  const sel = doc.querySelector('#scale');
  sel.value = 'major';
  fire(sel);
  const root = doc.querySelector('#root');
  root.value = '5'; // F
  fire(root);
  assert.match(doc.querySelector('#formula').textContent, /grados: 1 2 3 4 5 6 7/);
  assert.match(doc.querySelector('#formula').textContent, /notas: F G A B♭ C D E/);

  root.value = '6'; // F# — sharp spelling; the ♯/♭ toggle is gone
  fire(root);
  assert.match(doc.querySelector('#formula').textContent, /notas: F♯ G♯ A♯ B C♯ D♯ E♯/);
  root.value = '0';
  fire(root);
  assert.match(doc.querySelector('#formula').textContent, /notas: C D E F G A B/);
});

test('audio playback runs without throwing', async () => {
  const bpm = doc.querySelector('#bpm');
  bpm.value = '200';
  fire(bpm);
  assert.equal(doc.querySelector('#bpmOut').textContent, '200 BPM');
    
  doc.querySelector('#playScale').dispatchEvent(new win.Event('click'));
  doc.querySelector('#playNeck').dispatchEvent(new win.Event('click'));
  doc.querySelector('#stopAll').dispatchEvent(new win.Event('click'));
  await delay(60);
  assert.equal($$('.fret-svg .note.active').length, 0, 'stop clears the highlight');
  // Notes are scheduled seconds ahead: ■ Detener has to mute the bus, not just
  // cancel timers, or the listener keeps hearing the rest of the run.
  assert.ok(globalThis.__gainEvents.includes(0), 'stop mutes the voice bus');
});

test('metronome and backing start and stop the clock cleanly', async () => {
  const metro = doc.querySelector('#metronome');
  metro.checked = true;
  fire(metro);
  await delay(80);
  assert.equal($$('.beat-dot').length, 4, '4/4 shows four beat dots');

  const beats = doc.querySelector('#beats');
  beats.value = '3';
  fire(beats);
  assert.equal($$('.beat-dot').length, 3);

  const backing = doc.querySelector('#backing');
  backing.value = 'blues';
  fire(backing);
  await delay(60);

  metro.checked = false;
  fire(metro);
  backing.value = 'off';
  fire(backing);
  await delay(30);
});

