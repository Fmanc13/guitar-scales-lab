import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildScale, positions, scaleRun, diatonicTriads, backingChords, spell, pcOf, SCALES, ROOT_COLOR, NOTE_COLOR } from '../js/theory.js';

const names = (root, id) => buildScale(root, id).notes.map((n) => n.name).join(' ');
const degrees = (root, id) => buildScale(root, id).notes.map((n) => n.degree).join(' ');

test('spelling of the most common major scales', () => {
  assert.equal(names('C', 'major'), 'C D E F G A B');
  assert.equal(names('G', 'major'), 'G A B C D E F#');
  assert.equal(names('F', 'major'), 'F G A Bb C D E');
  assert.equal(names('Eb', 'major'), 'Eb F G Ab Bb C D');
  assert.equal(names('F#', 'major'), 'F# G# A# B C# D# E#');
  assert.equal(names('Db', 'major'), 'Db Eb F Gb Ab Bb C');
});

test('minor, modal and pentatonic spellings', () => {
  assert.equal(names('A', 'minor'), 'A B C D E F G');
  assert.equal(names('B', 'locrian'), 'B C D E F G A');
  assert.equal(names('C', 'lydian'), 'C D E F# G A B');
  assert.equal(names('G', 'mixolydian'), 'G A B C D E F');
  assert.equal(names('D', 'dorian'), 'D E F G A B C');
  assert.equal(names('E', 'phrygian'), 'E F G A B C D');
  assert.equal(names('C', 'pent-major'), 'C D E G A');
  assert.equal(names('A', 'pent-minor'), 'A C D E G');
  assert.equal(names('Eb', 'pent-minor'), 'Eb Gb Ab Bb Db');
});

test('altered degrees get their own accidental and degree label', () => {
  assert.equal(names('C', 'blues'), 'C Eb F Gb G Bb');
  assert.equal(degrees('C', 'blues'), '1 ♭3 4 ♭5 5 ♭7');
  assert.equal(names('A', 'harmonic-minor'), 'A B C D E F G#');
  assert.equal(names('C', 'altered'), 'C Db Eb Fb Gb Ab Bb');
});

test('double accidentals are spelled on their own letter', () => {
  assert.equal(spell(3, pcOf('F##')), 'F##'); // 4th letter (F) raised twice
  assert.equal(names('G#', 'major'), 'G# A# B# C# D# E# F##');
});

test('positions: one box per scale tone on the 6th string', () => {
  const cmaj = positions(buildScale('C', 'major'));
  assert.equal(cmaj.length, 7);
  assert.deepEqual(
    cmaj.map((p) => p.startFret),
    [0, 1, 3, 5, 7, 8, 10],
  );
  assert.equal(cmaj[0].endFret - cmaj[0].startFret, 4);
  const aminPent = positions(buildScale('A', 'pent-minor'));
  assert.equal(aminPent.length, 5);
  assert.deepEqual(
    aminPent.map((p) => p.startFret),
    [0, 3, 5, 8, 10],
  );
  assert.equal(aminPent[0].endFret - aminPent[0].startFret, 3);
});

test('a two octave run goes up and back down to the tonic', () => {
  const run = scaleRun(buildScale('C', 'major'), { startMidi: 60 });
  assert.equal(run.length, 7 * 2 + 1 + 14);
  assert.equal(run[0], 60);
  assert.equal(run[13], 83); // last note of the first octave climb
  assert.equal(run[14], 84); // top of the second octave
  assert.equal(run[run.length - 1], 60); // finishes on the tonic an octave down
});

test('diatonic triads of C major are the seven chords of the key', () => {
  const triads = diatonicTriads(buildScale('C', 'major')).map((t) => t.map((n) => n.name).join('-'));
  assert.deepEqual(triads, ['C-E-G', 'D-F-A', 'E-G-B', 'F-A-C', 'G-B-D', 'A-C-E', 'B-D-F']);
});
    
test('the tonic is red and every other note is silver', () => {
  for (const s of SCALES) {
    const notes = buildScale('C', s.id).notes;
    assert.equal(notes.filter((n) => n.isRoot).length, 1, `${s.id} should have exactly one tonic`);
    notes.forEach((n) => assert.equal(n.color, n.isRoot ? ROOT_COLOR : NOTE_COLOR, `${s.id}: ${n.degree}`));
  }
});
    
test('the backing progression belongs to the key, not to the scale on the fretboard', () => {
  // Blues: I7 x4, IV7 x2, I7 x2, V7, IV7, I7, V7.
  const blues = Array.from({ length: 12 }, (_, b) => backingChords('C', 'blues', b));
  assert.deepEqual(blues.map((c) => c[0]), [0, 0, 0, 0, 5, 5, 0, 0, 7, 5, 0, 7]);
  assert.deepEqual(blues[0], [0, 4, 10]); // C7 = C E G Bb
  assert.deepEqual(blues[4], [5, 9, 3]); // F7 = F A C Eb
  assert.equal(backingChords('A', 'blues', 8)[0], 4); // V7 of A
    
  // i-iv-v-i in the minor key; I-IV-V-vi in the major one.
  assert.deepEqual([0, 1, 2, 3].map((b) => backingChords('A', 'diatonic-minor', b)[0]), [9, 2, 4, 9]);
  assert.deepEqual([0, 1, 2, 3].map((b) => backingChords('C', 'diatonic-major', b)[0]), [0, 5, 7, 9]);
});
