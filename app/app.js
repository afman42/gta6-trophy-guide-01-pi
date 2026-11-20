import { loadProgress, saveProgress, loadPreferences, savePreferences, readImport, exportProgress } from './store.js';

const data = await (await fetch('data/trophies.json')).json();
const trophies = data.trophies;
const knownNames = trophies.map(trophy => trophy.name);
const earned = loadProgress();
const preferences = loadPreferences();
let selected = trophies[0];
let activeView = 'tracker';
let toastTimer;

const $ = selector => document.querySelector(selector);
const list = $('#trophy-list');
const panel = $('#detail-panel');
const search = $('#search');
const gradeFilter = $('#grade-filter');
const kindFilter = $('#kind-filter');
const spoilerSetting = $('#spoiler-setting');
const toast = $('#toast');

spoilerSetting.checked = Boolean(preferences.spoilers);

function gradeLabel(grade) {
  return grade.charAt(0).toUpperCase() + grade.slice(1);
}

function isConcealed(trophy) {
  return preferences.spoilers && (trophy.hidden || trophy.kind.includes('story')) && !earned.has(trophy.name);
}

function displayName(trophy) {
  return isConcealed(trophy) ? 'Hidden trophy' : trophy.name;
}

function allowed(trophy) {
  const query = search.value.trim().toLocaleLowerCase();
  const gradeMatch = gradeFilter.value === 'all' || trophy.grade === gradeFilter.value;
  const kindMatch = kindFilter.value === 'all' || (kindFilter.value === 'missable' ? ['confirmed', 'check'].includes(trophy.watchTier) : trophy.kind.includes(kindFilter.value));
  const concealed = isConcealed(trophy);
  const searchable = concealed
    ? `${trophy.kind.join(' ')} ${trophy.grade} hidden trophy`
    : `${trophy.name} ${trophy.description} ${trophy.guide} ${trophy.kind.join(' ')}`;
  return gradeMatch && kindMatch && (!query || searchable.toLocaleLowerCase().includes(query));
}

function updateProgress() {
  const count = trophies.filter(trophy => earned.has(trophy.name)).length;
  const percent = Math.round(count / trophies.length * 100);
  $('#progress').textContent = `${count}/${trophies.length} earned`;
  $('#hero-earned').textContent = String(count).padStart(2, '0');
  $('#hero-percent').textContent = `${percent}%`;
  $('#hero-bar').style.width = `${percent}%`;
  $('#chip-bar').style.width = `${percent}%`;
  kindFilter.closest('.select-wrap').classList.toggle('filter-active', kindFilter.value !== 'all');
  $('#filter-note').textContent = `${trophies.filter(allowed).length} of 55 trophies · progress saves on this device.`;
}

function renderDetail() {
  if (!selected) return;
  const hidden = isConcealed(selected);
  const display = displayName(selected);
  const sourceNames = selected.sources.map(source => `${source.name} — ${source.role}`).join(' · ');
  panel.innerHTML = `
    <div class="detail-top"><span class="detail-kicker">FIELD NOTE <b>NO. ${String(selected.id).padStart(2, '0')}</b></span><span class="grade-pill ${selected.grade}"><i>✦</i> ${gradeLabel(selected.grade)}</span></div>
    <h3>${escapeHtml(display)}</h3>
    <p class="official-label">OFFICIAL DESCRIPTION</p>
    <p class="official-description">${hidden ? 'Earn this trophy to reveal its description.' : escapeHtml(selected.description)}</p>
    <div class="guide-block"><p class="official-label">THE APPROACH <span>OWN-WORD FIELD NOTE</span></p><p>${hidden ? 'The guide and story details stay tucked away until you earn this trophy.' : escapeHtml(selected.guide)}</p></div>
    <div class="fact-row"><span>TRACKING TYPE</span><strong>${selected.kind.map(kind => `<i class="kind-label">${escapeHtml(kind)}</i>`).join(' ')}</strong></div>
    <div class="fact-row"><span>WATCH PRIORITY</span><strong class="unknown">${escapeHtml(selected.watchTier)} · ${hidden ? 'Story detail concealed until earned.' : escapeHtml(selected.watchReason)}</strong></div>
    <div class="cites"><span class="official-label">LIST & TARGET SOURCES</span><p>${escapeHtml(sourceNames)}</p><small>${escapeHtml(selected.missableNote)}</small></div>
    <button class="earned-button ${earned.has(selected.name) ? 'is-earned' : ''}" data-earn="${escapeAttr(selected.name)}">${earned.has(selected.name) ? '✓  Marked earned' : '○  Mark as earned'}</button>`;
  panel.querySelector('[data-earn]').addEventListener('click', () => toggleEarned(selected.name));
}

function renderList() {
  list.replaceChildren();
  const filtered = trophies.filter(allowed);
  for (const trophy of filtered) {
    const button = document.createElement('button');
    const isEarned = earned.has(trophy.name);
    button.className = `trophy-row ${selected?.id === trophy.id ? 'is-selected' : ''} ${isEarned ? 'is-earned' : ''}`;
    button.setAttribute('aria-pressed', String(selected?.id === trophy.id));
    const obscured = isConcealed(trophy);
    const name = obscured ? 'Hidden trophy' : trophy.name;
    const description = obscured ? 'Spoiler hidden · earn to reveal' : trophy.description;
    button.innerHTML = `<span class="checkmark">${isEarned ? '✓' : ''}</span><span class="row-copy"><strong>${escapeHtml(name)}</strong><small>${escapeHtml(description)}</small></span><span class="row-grade ${trophy.grade}">${escapeHtml(gradeLabel(trophy.grade))}</span><span class="row-arrow">↗</span>`;
    button.addEventListener('click', () => { selected = trophy; renderList(); renderDetail(); });
    list.append(button);
  }
  if (!filtered.length) list.innerHTML = kindFilter.value === 'missable' ? '<div class="empty-state">No Confirmed or Check items match.<br><span>All missable statuses remain unverified; check supplied guidance before advancing.</span></div>' : '<div class="empty-state">No trophies match those filters.<br><button id="clear-filters" class="text-button">Clear filters →</button></div>';
  $('#clear-filters')?.addEventListener('click', () => { search.value = ''; gradeFilter.value = 'all'; kindFilter.value = 'all'; render(); });
  renderDetail();
  updateProgress();
}

function toggleEarned(name) {
  earned.has(name) ? earned.delete(name) : earned.add(name);
  saveProgress(earned);
  renderList();
  announce(earned.has(name) ? 'Trophy marked earned.' : 'Trophy moved back to your list.');
}

function renderRoadmap() {
  const stages = [
    { n: '01', title: 'Clear the story milestones', text: 'Use the supplied story sequence as a checklist: Gone Fishing, Chapters 1–4, then the final mission. These descriptions identify milestones, not a verified mission-by-mission order or replay policy; check each unlock at its named completion point.', ids: [2,3,4,5,6,7,8,9,10,11,12,13] },
    { n: '02', title: 'Finish character strands', text: 'Complete the named final mission for each character strand, and track eight completed stranger strands for Strangers & Freaks. Count a strand at its final mission, not by tallying eight individual missions; the list gives no strand locations or dependency order.', ids: [22,23,24,25,26,27] },
    { n: '03', title: 'Build counted progress', text: 'Prioritize measured requirements: 3 Collectible Card sets, WAiNK It at 100 locations, 42 Shooting Range challenges all at gold, 20 different race wins, and 50 Challenges. These targets come from the supplied trophy descriptions/listed progress targets; locations, qualifying pools, and routes are not supplied.', ids: [15,16,17,18,19,20,21,28,29,30,31,32,35,42] },
    { n: '04', title: 'Close out and verify', text: 'Use the in-game records to clear remaining activity, robbery, spending, vehicle and property requirements. Check each stated count or condition before marking it done, then reach 100% completion and use the remaining requirements for the platinum. This is a planning order, not a verified unlock sequence.', ids: [33,34,36,37,38,39,40,41,43,44,45,46,47,48,49,50,51,52,53,54,55,14,1] }
  ];
  $('#roadmap-view').innerHTML = `<div class="roadmap-intro"><div><p class="eyebrow">THE PLATINUM ROUTE</p><h3>Four legs. No shortcuts promised.</h3></div><span class="roadmap-warning">Order is a planning aid<br>not a verified unlock order.</span></div><div class="stage-grid">${stages.map(stage => `<article class="stage-card"><div class="stage-number">${stage.n}<span> / 04</span></div><h4>${stage.title}</h4><p>${stage.text}</p><div class="stage-tags">${stage.ids.map(id => { const t = trophies.find(item => item.id === id); return `<button class="stage-tag ${earned.has(t.name) ? 'done' : ''}" data-jump="${id}">${escapeHtml(displayName(t))}</button>`; }).join('')}</div></article>`).join('')}</div><div class="roadmap-footer"><div class="roadmap-check"><strong>100% COMPLETION GOLD · A LONG ROAD</strong><span>Reach 100% completion; Exophase and PSNProfiles provide the target description, but no category breakdown.</span></div><div class="roadmap-check"><strong>FINAL PLATINUM CHECK · VICE GOT A PRICE!</strong><span>Use the remaining trophy requirements as the final checklist; the supplied lists do not establish an optimal unlock order.</span></div><button class="text-button" data-view="tracker">Back to tracker →</button></div>`;
  $('#roadmap-view').querySelectorAll('[data-jump]').forEach(button => button.addEventListener('click', () => selectTrophy(Number(button.dataset.jump))));
  $('#roadmap-view').querySelector('[data-view="tracker"]').addEventListener('click', () => setView('tracker'));
}

function renderMissables() {
  const sections = [
      { tier: 'confirmed', title: 'Confirmed', note: 'Confirmed one-time windows supported by supplied evidence.' },
      { tier: 'check', title: 'Check before advancing', note: 'Inferred caution from the official description, not a confirmed missable window.' },
      { tier: 'unverified', title: 'Unverified', note: 'The supplied description does not establish a missable window.' }
    ];
  const counts = Object.fromEntries(sections.map(section => [section.tier, trophies.filter(trophy => trophy.watchTier === section.tier).length]));
  $('#missables-view').innerHTML = `<div class="missable-banner"><div class="alert-symbol">!</div><div><p class="eyebrow">MISSABLE WATCH · ${counts.confirmed} CONFIRMED · ${counts.check} CHECK · ${counts.unverified} UNVERIFIED</p><h3>Unknown is not the same as safe.</h3><p>Check items are cautious inferences from the official descriptions, never claims of a one-time window. Replay availability is unknown where the supplied evidence is silent.</p></div></div>${sections.map(section => {
    const entries = trophies.filter(trophy => trophy.watchTier === section.tier);
    return `<section class="watch-section"><div class="watch-heading"><h4>${section.title}</h4><span>${entries.length} ${entries.length === 1 ? 'trophy' : 'trophies'}</span></div><p class="watch-note">${section.note}</p><div class="missable-list">${entries.length ? entries.map(trophy => {
      const concealed = isConcealed(trophy);
      return `<button class="missable-row" data-jump="${trophy.id}"><span class="unknown-dot">${section.tier === 'confirmed' ? '!' : section.tier === 'check' ? '!' : '?'}</span><span><strong>${escapeHtml(displayName(trophy))}</strong><small>${concealed ? 'Story details concealed · earn to reveal' : escapeHtml(trophy.description)}</small><small class="watch-reason">${concealed ? 'Story detail concealed until earned; replay availability unknown.' : escapeHtml(trophy.watchReason)}</small></span><em>${section.title.toUpperCase()}</em><span>→</span></button>`;
    }).join('') : `<p class="watch-empty">None supported by the supplied descriptions.</p>`}</div></section>`;
  }).join('')}<p class="fine-print">All missable status fields remain unverified. A Check label is an inference to pause and verify before advancing, not proof that a trophy is lost permanently; replay availability is unknown where sources are silent.</p>`;
  $('#missables-view').querySelectorAll('[data-jump]').forEach(button => button.addEventListener('click', () => selectTrophy(Number(button.dataset.jump))));
}

function selectTrophy(id) {
  selected = trophies.find(trophy => trophy.id === id) || trophies[0];
  search.value = '';
  gradeFilter.value = 'all';
  kindFilter.value = 'all';
  setView('tracker');
  renderList();
  $('#workspace').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function setView(view) {
  activeView = view;
  preferences.view = view;
  savePreferences(preferences);
  document.querySelectorAll('.tab').forEach(button => button.classList.toggle('active', button.dataset.view === view));
  $('#tracker-view').hidden = view !== 'tracker';
  $('#roadmap-view').hidden = view !== 'roadmap';
  $('#missables-view').hidden = view !== 'missables';
  if (view === 'roadmap') renderRoadmap();
  if (view === 'missables') renderMissables();
}

function render() {
  renderList();
  setView(activeView);
}

function announce(message) {
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 2200);
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]);
}
function escapeAttr(value) { return escapeHtml(value); }

for (const control of [search, gradeFilter, kindFilter]) control.addEventListener('input', renderList);
spoilerSetting.addEventListener('change', () => {
  preferences.spoilers = spoilerSetting.checked;
  savePreferences(preferences);
  render();
  announce(spoilerSetting.checked ? 'Spoiler details hidden.' : 'Spoiler details shown.');
});

document.querySelectorAll('[data-view]').forEach(button => button.addEventListener('click', () => {
  setView(button.dataset.view);
  $('#workspace').scrollIntoView({ behavior: 'smooth', block: 'start' });
}));

$('#export').addEventListener('click', () => {
  const blob = new Blob([exportProgress(earned)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = 'leonida-trophy-progress.json';
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  announce('Progress export downloaded.');
});

$('#import').addEventListener('change', async event => {
  const file = event.target.files?.[0];
  if (!file) return;
  try {
    const imported = readImport(await file.text(), knownNames);
    earned.clear();
    for (const name of imported) earned.add(name);
    saveProgress(earned);
    renderList();
    announce(`Imported ${earned.size} earned trophies.`);
  } catch (error) {
    announce(error.message || 'Could not read that progress file.');
  }
  event.target.value = '';
});

$('#reset').addEventListener('click', () => {
  if (!confirm('Reset every earned trophy on this device?')) return;
  earned.clear();
  saveProgress(earned);
  renderList();
  announce('Progress reset on this device.');
});

document.addEventListener('keydown', event => {
  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
    event.preventDefault();
    search.focus();
  }
});

renderRoadmap();
renderMissables();
render();
