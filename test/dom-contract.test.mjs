// Contract checks between the static HTML, the app code and the stylesheet.
// The page is scales only: no tab bar and no Improvisación/Melodía/Fuentes modules.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const app = readFileSync(new URL('../js/app.js', import.meta.url), 'utf8');
const styles = readFileSync(new URL('../styles.css', import.meta.url), 'utf8');

const htmlIds = new Set([...html.matchAll(/\bid="([^"]+)"/g)].map((m) => m[1]));
const appIds = new Set([...app.matchAll(/\$\('#([^']+)'\)/g)].map((m) => m[1]));

test('every element the app looks up exists in the HTML', () => {
  const missing = [...appIds].filter((id) => !htmlIds.has(id));
  assert.deepEqual(missing, []);
  assert.ok(htmlIds.size > 15, 'the page should expose the expected controls');
});

test('the page is scales only: no tab bar, no other modules', () => {
  assert.equal(/role="tablist"|data-tab=|class="tab/.test(html), false, 'the tab bar is gone');
  assert.equal(/#tab-(improvisacion|melodia|fuentes)/.test(html), false, 'the other panels are gone');
  assert.ok(htmlIds.has('tab-escalas'), 'the Escalas section stays');
});

test('the stylesheet defines the classes the app leans on', () => {
  for (const cls of ['.fret-svg', '.neck-box', '.legend', '.formula', '.note.active', '.beat-dot.on']) {
    assert.ok(styles.includes(cls), `styles.css is missing ${cls}`);
  }
  for (const dead of ['.key-badge', '.hint', 'nav.tabs', 'footer.site', '.accordion-nav']) {
    assert.equal(styles.includes(dead), false, `styles.css still carries dead rule ${dead}`);
  }
});
