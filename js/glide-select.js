// GlideSelect — vanilla port of the GlideSelect component.
//
// Enhances a native <select>: the select stays in the DOM (hidden) as the source of
// truth for value/options/change — which is what the app and the tests use — while a
// dark listbox with a highlight that glides between options is rendered next to it.
//
// Usage: createGlideSelect(document.querySelector('#scale'), { align: 'left' })
// Returns { sync, refresh } so callers can re-read value/options after programmatic
// changes (the component also watches the select's childList by itself).

const SVG_NS = 'http://www.w3.org/2000/svg';

/** Chevron as real SVG nodes (no innerHTML). */
function chevronIcon() {
  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('viewBox', '0 0 12 12');
  svg.setAttribute('width', '12');
  svg.setAttribute('height', '12');
  svg.setAttribute('aria-hidden', 'true');
  const path = document.createElementNS(SVG_NS, 'path');
  path.setAttribute('d', 'M2.5 4.75 6 8.25l3.5-3.5');
  path.setAttribute('fill', 'none');
  path.setAttribute('stroke', 'currentColor');
  path.setAttribute('stroke-width', '1.6');
  path.setAttribute('stroke-linecap', 'round');
  path.setAttribute('stroke-linejoin', 'round');
  svg.append(path);
  return svg;
}

export function createGlideSelect(select, {
  accentColor = '#faf4d3',
  surfaceColor = '#27272a',
  highlightColor = '#3f3f46',
  textColor = '#f5f5f5',
  size = 'md',
  radius = 10,
  menuWidth = 176,
  placement = 'bottom',
  align = 'left',
  popDuration = 180,
  glideDuration = 220,
  rememberPosition = true,
} = {}) {
  const label = select.getAttribute('aria-label') || '';

  const wrap = document.createElement('div');
  wrap.className = `gsel gsel-${size}`;
  wrap.dataset.align = align;
  wrap.dataset.placement = placement;
  wrap.style.setProperty('--gsel-accent', accentColor);
  wrap.style.setProperty('--gsel-surface', surfaceColor);
  wrap.style.setProperty('--gsel-highlight', highlightColor);
  wrap.style.setProperty('--gsel-text', textColor);
  wrap.style.setProperty('--gsel-radius', `${radius}px`);
  wrap.style.setProperty('--gsel-menu-w', `${menuWidth}px`);
  wrap.style.setProperty('--gsel-pop', `${popDuration}ms`);
  wrap.style.setProperty('--gsel-glide', `${glideDuration}ms`);

  const caption = document.createElement('span');
  caption.className = 'gsel-caption';
  caption.textContent = label;

  const trigger = document.createElement('button');
  trigger.type = 'button';
  trigger.className = 'gsel-trigger';
  trigger.setAttribute('role', 'combobox');
  trigger.setAttribute('aria-haspopup', 'listbox');
  trigger.setAttribute('aria-expanded', 'false');
  trigger.setAttribute('aria-label', label);
  const valueEl = document.createElement('span');
  valueEl.className = 'gsel-value';
  const chevron = document.createElement('span');
  chevron.className = 'gsel-chevron';
  chevron.append(chevronIcon());
  trigger.append(valueEl, chevron);

  const menu = document.createElement('div');
  menu.className = 'gsel-menu';
  menu.setAttribute('role', 'listbox');
  menu.setAttribute('aria-label', label);
  const glide = document.createElement('div');
  glide.className = 'gsel-glide';
  glide.setAttribute('aria-hidden', 'true');
  const list = document.createElement('div');
  list.className = 'gsel-list';
  menu.append(glide, list);

  wrap.append(caption, trigger, menu);
  select.classList.add('gsel-native');
  select.after(wrap);

  let active = Math.max(0, select.selectedIndex);
  let open = false;
  const items = () => [...list.children];

  function moveGlide() {
    const el = items()[active];
    if (!el) return;
    glide.style.height = `${el.offsetHeight}px`;
    glide.style.transform = `translateY(${el.offsetTop}px)`;
  }

  function setActive(i) {
    active = Math.min(Math.max(0, i), items().length - 1);
    items().forEach((el, k) => {
      el.classList.toggle('is-active', k === active);
      el.setAttribute('aria-selected', String(k === active));
    });
    if (open && items()[active]) trigger.setAttribute('aria-activedescendant', items()[active].id);
    moveGlide();
  }

  function sync() {
    const i = Math.max(0, select.selectedIndex);
    valueEl.textContent = select.options[i]?.textContent ?? '';
    trigger.disabled = select.disabled;
    items().forEach((el, k) => el.classList.toggle('is-selected', k === i));
    setActive(i);
  }

  function build() {
    list.replaceChildren(...[...select.options].map((opt, i) => {
      const item = document.createElement('button');
      item.type = 'button';
      item.className = 'gsel-item';
      item.id = `${select.id || 'gsel'}-opt-${i}`;
      item.setAttribute('role', 'option');
      item.textContent = opt.textContent;
      item.addEventListener('click', () => choose(i));
      item.addEventListener('mouseenter', () => setActive(i));
      return item;
    }));
    sync();
  }

  function choose(i) {
    if (select.selectedIndex !== i) {
      select.selectedIndex = i;
      select.dispatchEvent(new Event('change', { bubbles: true }));
    }
    sync();
    close();
    trigger.focus();
  }

  function openMenu() {
    if (open || trigger.disabled) return;
    open = true;
    wrap.classList.add('is-open');
    trigger.setAttribute('aria-expanded', 'true');
    if (placement === 'auto') {
      const box = trigger.getBoundingClientRect();
      const below = window.innerHeight - box.bottom;
      wrap.dataset.placement = below >= menu.offsetHeight + 12 || below > box.top ? 'bottom' : 'top';
    }
    sync();
    if (rememberPosition) items()[active]?.scrollIntoView({ block: 'nearest' });
  }

  function close() {
    if (!open) return;
    open = false;
    wrap.classList.remove('is-open');
    trigger.setAttribute('aria-expanded', 'false');
    trigger.removeAttribute('aria-activedescendant');
  }

  trigger.addEventListener('click', () => (open ? close() : openMenu()));
  trigger.addEventListener('keydown', (e) => {
    const last = items().length - 1;
    switch (e.key) {
      case 'ArrowDown': e.preventDefault(); if (open) setActive(active + 1); else openMenu(); break;
      case 'ArrowUp': e.preventDefault(); if (open) setActive(active - 1); else openMenu(); break;
      case 'Home': if (open) { e.preventDefault(); setActive(0); } break;
      case 'End': if (open) { e.preventDefault(); setActive(last); } break;
      case 'Enter': case ' ': if (open) { e.preventDefault(); choose(active); } break;
      case 'Escape': if (open) { e.preventDefault(); close(); } break;
      case 'Tab': close(); break;
      default: break;
    }
  });
  document.addEventListener('click', (e) => { if (!wrap.contains(e.target)) close(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') close(); });
  select.addEventListener('change', sync);
  new window.MutationObserver(build).observe(select, { childList: true });
  build();

  return { sync, refresh: build, close };
}
