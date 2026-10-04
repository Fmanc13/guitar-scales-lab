// Pure music-theory helpers. No DOM, no audio -> importable from Node for tests.
// Naming convention: American notation (C D E F G A B).

export const LETTERS = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
const LETTER_PC = [0, 2, 4, 5, 7, 9, 11];
const MAJOR_STEPS = [0, 2, 4, 5, 7, 9, 11]; // semitones of each degree in a major scale

export const ROOTS_SHARP = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
export const ROOTS_FLAT = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];

// Two colours only: the tonic in red, every other note in silver. The diagram's job is
// to make the tonic obvious, not to encode the degree.
export const ROOT_COLOR = '#c92a2a';
export const NOTE_COLOR = '#C0C0C0';

export const SCALES = [
  { id: 'major', name: 'Mayor (jónico)', degrees: ['1', '2', '3', '4', '5', '6', '7'], family: 'Diatónica' },
  { id: 'minor', name: 'Menor natural (eólico)', degrees: ['1', '2', 'b3', '4', '5', 'b6', 'b7'], family: 'Diatónica' },
  { id: 'pent-major', name: 'Pentatónica mayor', degrees: ['1', '2', '3', '5', '6'], family: 'Pentatónica' },
  { id: 'pent-minor', name: 'Pentatónica menor', degrees: ['1', 'b3', '4', '5', 'b7'], family: 'Pentatónica' },
  { id: 'blues', name: 'Blues (pent. menor + ♭5)', degrees: ['1', 'b3', '4', 'b5', '5', 'b7'], family: 'Pentatónica' },
  { id: 'dorian', name: 'Dórico — 2º modo', degrees: ['1', '2', 'b3', '4', '5', '6', 'b7'], family: 'Modal' },
  { id: 'phrygian', name: 'Frigio — 3er modo', degrees: ['1', 'b2', 'b3', '4', '5', 'b6', 'b7'], family: 'Modal' },
  { id: 'lydian', name: 'Lidio — 4º modo', degrees: ['1', '2', '3', '#4', '5', '6', '7'], family: 'Modal' },
  { id: 'mixolydian', name: 'Mixolidio — 5º modo', degrees: ['1', '2', '3', '4', '5', '6', 'b7'], family: 'Modal' },
  { id: 'locrian', name: 'Locrio — 7º modo', degrees: ['1', 'b2', 'b3', '4', 'b5', 'b6', 'b7'], family: 'Modal' },
  { id: 'harmonic-minor', name: 'Menor armónica', degrees: ['1', '2', 'b3', '4', '5', 'b6', '7'], family: 'Menor' },
  { id: 'melodic-minor', name: 'Menor melódica', degrees: ['1', '2', 'b3', '4', '5', '6', '7'], family: 'Menor' },
  { id: 'lydian-b7', name: 'Lidio ♭7 (dominante)', degrees: ['1', '2', '3', '#4', '5', '6', 'b7'], family: 'Avanzada' },
  { id: 'altered', name: 'Alterada / superlocria (♭4 = 3)', degrees: ['1', 'b2', 'b3', 'b4', 'b5', 'b6', 'b7'], family: 'Avanzada' },
];

// 6th string -> 1st string.
export const STRINGS = [
  { label: '6ª', note: 'E', midi: 40 },
  { label: '5ª', note: 'A', midi: 45 },
  { label: '4ª', note: 'D', midi: 50 },
  { label: '3ª', note: 'G', midi: 55 },
  { label: '2ª', note: 'B', midi: 59 },
  { label: '1ª', note: 'e', midi: 64 },
];

export function pcOf(name) {
  let pc = LETTER_PC[LETTERS.indexOf(name[0])];
  for (const ch of name.slice(1)) {
    if (ch === '#') pc += 1;
    else if (ch === 'b') pc -= 1;
  }
  return ((pc % 12) + 12) % 12;
}

export function letterIndexOf(name) {
  return LETTERS.indexOf(name[0]);
}

// Writes a pitch class with the accidental it needs to sit on the given letter.
export function spell(letterIdx, pc) {
  const letter = LETTERS[((letterIdx % 7) + 7) % 7];
  let diff = (((pc - LETTER_PC[LETTERS.indexOf(letter)]) % 12) + 12) % 12;
  if (diff > 6) diff -= 12;
  const acc = diff > 0 ? '#'.repeat(diff) : diff < 0 ? 'b'.repeat(-diff) : '';
  return letter + acc;
}

/** Typographic accidentals for display (ASCII stays in the data layer). */
export function pretty(name) {
  return String(name).replace(/b/g, '\u266d').replace(/#/g, '\u266f');
}

export function parseDegree(token) {
  const alt = token.startsWith('b') ? -1 : token.startsWith('#') ? 1 : 0;
  const deg = Number(token.replace(/[^0-9]/g, ''));
  const label = token.replace('b', '♭').replace('#', '♯');
  return { deg, alt, label };
}

export function getScale(scaleId) {
  return SCALES.find((s) => s.id === scaleId) || SCALES[0];
}

/** Notes of a scale: correct letter spelling, degree label and degree color. */
export function buildScale(rootName, scaleId) {
  const scale = getScale(scaleId);
  const rootLetter = letterIndexOf(rootName);
  const rootPc = pcOf(rootName);
  const notes = scale.degrees.map((token) => {
    const { deg, alt, label } = parseDegree(token);
    const semi = MAJOR_STEPS[deg - 1] + alt;
    const pc = (((rootPc + semi) % 12) + 12) % 12;
    return {
      degree: label,
      degreeNumber: deg,
      alt,
      semi,
      pc,
      name: spell(rootLetter + deg - 1, pc),
      color: null,
      isRoot: alt === 0 && deg === 1,
    };
  });
  notes.forEach((n) => { n.color = n.isRoot ? ROOT_COLOR : NOTE_COLOR; });
  return { rootName, rootPc, scale, notes };
}

/** Notes + status for every string/fret cell up to maxFret. */
export function fretboard(scale, maxFret = 12) {
  const byPc = new Map(scale.notes.map((n) => [n.pc, n]));
  return STRINGS.map((s, stringIndex) => ({
    ...s,
    stringIndex,
    frets: Array.from({ length: maxFret + 1 }, (_, fret) => {
      const midi = s.midi + fret;
      const note = byPc.get(midi % 12);
      return note ? { ...note, midi, fret, stringIndex } : null;
    }),
  }));
}

/**
 * Position boxes: one window per scale tone found on the 6th string (frets 0..11).
 * 7-note scales -> 7 positions of 5 frets, pentatonic/blues -> 5-6 boxes of 4 frets.
 */
export function positions(scale) {
  const span = scale.notes.length <= 6 ? 3 : 4;
  const byPc = new Map(scale.notes.map((n) => [n.pc, n]));
  const lowMidi = STRINGS[0].midi;
  const out = [];
  for (let fret = 0; fret <= 11; fret++) {
    const note = byPc.get((lowMidi + fret) % 12);
    if (!note) continue;
    out.push({
      index: out.length + 1,
      startFret: fret,
      endFret: fret + span,
      anchorNote: note.name,
      anchorDegree: note.degree,
    });
  }
  return out;
}

/** Ascending/descending run from the tonic, two octaves, as MIDI numbers. */
export function scaleRun(scale, { octaves = 2, startMidi = 52 } = {}) {
  const base = startMidi + ((((scale.rootPc - startMidi) % 12) + 12) % 12);
  const up = [];
  for (let o = 0; o < octaves; o++) for (const n of scale.notes) up.push(base + o * 12 + n.semi);
  up.push(base + octaves * 12);
  return up.concat(up.slice(0, -1).reverse());
}

    /** Diatonic triad built on each degree of the scale (1-3-5, skipping one note). */
    export function diatonicTriads(scale) {
      const n = scale.notes.length;
      if (n !== 7) return [];
      return scale.notes.map((_, i) => [0, 2, 4].map((k) => scale.notes[(i + k) % n]));
    }
    
    /**
     * Pitch classes of the backing chord for one bar.
     * The progression belongs to the KEY, never to the scale currently on the fretboard:
     * the blues and the pentatonic have 5-6 notes, so their note indexes are not degrees.
     * blues -> I7 x4, IV7 x2, I7 x2, V7, IV7, I7, V7 (semitone offsets from the tonic).
     */
    export function backingChords(rootName, backing, bar) {
      if (backing === 'blues') {
        const off = [0, 0, 0, 0, 5, 5, 0, 0, 7, 5, 0, 7][bar % 12];
        const r = (pcOf(rootName) + off) % 12;
        return [r, (r + 4) % 12, (r + 10) % 12]; // dominant 7th
      }
      const key = buildScale(rootName, backing === 'diatonic-minor' ? 'minor' : 'major');
      // i-iv-v-i in the minor key, I-IV-V-vi in the major one.
      const seq = backing === 'diatonic-minor' ? [0, 3, 4, 0] : [0, 3, 4, 5];
      return diatonicTriads(key)[seq[bar % 4]].map((n) => n.pc);
    }

export const mtof = (midi) => 440 * Math.pow(2, (midi - 69) / 12);
