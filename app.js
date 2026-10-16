(function () {
  'use strict';

  // The active party's data. setParty() swaps these.
  var PARTIES = window.PARTIES || {};
  var party = 'D';
  var CANDIDATES = [];
  var BY_ID = {};
  var DEFAULT_TIERS = [];
  var FIELD_KEYS = Object.keys(window.SCORE_FIELDS || {});
  var FIELDS = FIELD_KEYS.map(function (k) { return window.SCORE_FIELDS[k]; });
  var SCORES = window.CANDIDATE_SCORES || {};

  // Each party keeps its own saved list. Democrats keep the original key so existing saves still load.
  function storageKey() { return party === 'D' ? 'tier2028.v1' : 'tier2028.' + party + '.v1'; }
  var PARTY_KEY = 'tier2028.party';
  var SHARE_PREFIX = 'r.';
  // Where share links point. A host page can override this (the artifact build sets it).
  var SHARE_BASE = window.TIER_SHARE_BASE || (location.origin + location.pathname);

  var PALETTE = ['#3fbf6b', '#9acd52', '#e2cf45', '#f0a948', '#ec7f4a', '#df4d55', '#4fa8e0', '#8a6fe0', '#c86fc9', '#8d96a8'];

  var uid = 0;
  function newTierId() { uid += 1; return 't' + Date.now().toString(36) + uid; }

  function defaultState() {
    return {
      tiers: DEFAULT_TIERS.map(function (t) { return { id: newTierId(), label: t.label, color: t.color, items: [] }; }),
      pool: CANDIDATES.map(function (c) { return c.id; }),
      showNames: true,
      expanded: false,
      ratings: defaultRatings(),
    };
  }

  function defaultRatings() {
    var r = {};
    CANDIDATES.forEach(function (c) {
      var sc = SCORES[c.id] || {};
      r[c.id] = FIELD_KEYS.map(function (k) { return clampScore(sc[k]); });
    });
    return r;
  }
  function clampScore(v) {
    v = Math.round(Number(v));
    return isFinite(v) ? Math.min(10, Math.max(1, v)) : 5;
  }
  // Only ratings that differ from the defaults are stored and shared, which keeps links short.
  function ratingDiffs(ratings) {
    var defs = defaultRatings();
    var out = {};
    Object.keys(ratings).forEach(function (id) {
      if (ratings[id].join() !== defs[id].join()) out[id] = ratings[id];
    });
    return out;
  }
  function applyRatingDiffs(diffs) {
    var r = defaultRatings();
    Object.keys(diffs || {}).forEach(function (id) {
      if (r[id] && Array.isArray(diffs[id])) r[id] = r[id].map(function (v, i) { return diffs[id][i] == null ? v : clampScore(diffs[id][i]); });
    });
    return r;
  }
  function total(id) {
    return state.ratings[id].reduce(function (a, b) { return a + b; }, 0);
  }

  // Drop unknown ids, dedupe, and put any candidate not placed anywhere back in the pool.
  function normalize(s) {
    var seen = {};
    function clean(list) {
      return (Array.isArray(list) ? list : []).filter(function (id) {
        if (!BY_ID[id] || seen[id]) return false;
        seen[id] = true;
        return true;
      });
    }
    var tiers = (Array.isArray(s.tiers) ? s.tiers : []).map(function (t) {
      return {
        id: newTierId(),
        label: String(t.label == null ? '' : t.label).slice(0, 40),
        color: /^#[0-9a-f]{6}$/i.test(t.color) ? t.color : PALETTE[9],
        items: clean(t.items),
      };
    });
    var pool = clean(s.pool);
    CANDIDATES.forEach(function (c) { if (!seen[c.id]) pool.push(c.id); });
    return { tiers: tiers, pool: pool, showNames: s.showNames !== false, expanded: !!s.expanded, ratings: applyRatingDiffs(s.ratings) };
  }

  // ---------- persistence ----------
  function save() {
    try {
      localStorage.setItem(storageKey(), JSON.stringify({
        tiers: state.tiers.map(function (t) { return { label: t.label, color: t.color, items: t.items }; }),
        pool: state.pool,
        showNames: state.showNames,
        expanded: state.expanded,
        ratings: ratingDiffs(state.ratings),
      }));
    } catch (e) { /* storage unavailable: the page still works for this visit */ }
  }
  function load() {
    try {
      var raw = localStorage.getItem(storageKey());
      if (raw) return normalize(JSON.parse(raw));
    } catch (e) { /* ignore */ }
    return null;
  }

  // ---------- share links ----------
  // Hash format: #r.<base64url JSON>. Only letters, digits, '.', '_' and '-' so it survives artifact links.
  function b64urlEncode(str) {
    var bytes = new TextEncoder().encode(str);
    var bin = '';
    bytes.forEach(function (b) { bin += String.fromCharCode(b); });
    return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }
  function b64urlDecode(s) {
    s = s.replace(/-/g, '+').replace(/_/g, '/');
    while (s.length % 4) s += '=';
    var bin = atob(s);
    var bytes = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return new TextDecoder().decode(bytes);
  }
  function encodeShare() {
    var payload = { t: state.tiers.map(function (t) { return [t.label, t.color.slice(1), t.items]; }) };
    var diffs = ratingDiffs(state.ratings);
    if (Object.keys(diffs).length) payload.r = diffs;
    if (state.expanded) payload.x = 1;
    if (party !== 'D') payload.p = party;
    return SHARE_PREFIX + b64urlEncode(JSON.stringify(payload));
  }
  // Returns the raw payload; its party (p, default D) must be active before stateFromShare runs.
  function parseShare(hash) {
    var h = (hash || '').replace(/^#/, '');
    if (h.indexOf(SHARE_PREFIX) !== 0) return null;
    try {
      var p = JSON.parse(b64urlDecode(h.slice(SHARE_PREFIX.length)));
      if (!p || !Array.isArray(p.t)) return null;
      if (!PARTIES[p.p || 'D']) return null;
      return p;
    } catch (e) { return null; }
  }
  function stateFromShare(p) {
    return normalize({
      tiers: p.t.map(function (r) { return { label: r[0], color: '#' + r[1], items: r[2] }; }),
      pool: [],
      ratings: p.r,
      expanded: !!p.x,
    });
  }

  // ---------- images ----------
  // Prefer the bundled photo in images/; if it is missing, ask Wikipedia for the article's lead image.
  var wikiThumbs = null;
  var wikiThumbsPromise = null;
  function fetchWikiThumbs() {
    if (wikiThumbsPromise) return wikiThumbsPromise;
    var titles = CANDIDATES.map(function (c) { return c.wiki; }).join('|');
    var url = 'https://en.wikipedia.org/w/api.php?action=query&prop=pageimages&piprop=thumbnail&pithumbsize=400' +
      '&redirects=1&format=json&formatversion=2&origin=*&titles=' + encodeURIComponent(titles);
    wikiThumbsPromise = fetch(url).then(function (r) { return r.json(); }).then(function (data) {
      var q = data.query || {};
      var alias = {};
      (q.normalized || []).concat(q.redirects || []).forEach(function (n) { alias[n.to] = n.from; });
      var map = {};
      (q.pages || []).forEach(function (pg) {
        if (!pg.thumbnail) return;
        var t = pg.title;
        var chain = [t];
        while (alias[t]) { t = alias[t]; chain.push(t); }
        chain.forEach(function (name) { map[name.replace(/ /g, '_')] = pg.thumbnail.source; });
      });
      wikiThumbs = map;
      return map;
    }).catch(function () { wikiThumbs = {}; return wikiThumbs; });
    return wikiThumbsPromise;
  }
  function imgFallback(img, c) {
    if (img.dataset.stage === 'local') {
      img.dataset.stage = 'wiki';
      fetchWikiThumbs().then(function (map) {
        var src = map[c.wiki];
        if (src) { img.crossOrigin = 'anonymous'; img.src = src; }
        else showInitials(img);
      });
    } else {
      showInitials(img);
    }
  }
  function initials(name) {
    return name.split(/\s+/).map(function (w) { return w[0]; }).join('').slice(0, 3);
  }
  function showInitials(img) {
    img.hidden = true;
    var holder = img.parentNode;
    if (holder && !holder.querySelector('.initials')) {
      var c = BY_ID[holder.dataset.id];
      var span = document.createElement('span');
      span.className = 'initials';
      span.textContent = initials(c.name);
      holder.insertBefore(span, holder.firstChild);
    }
  }

  // Card elements are built once and moved between zones, so photos never reload.
  var cardEls = {};
  function buildCard(c) {
    var el = document.createElement('div');
    el.className = 'card entry';
    el.dataset.id = c.id;
    el.tabIndex = 0;
    el.setAttribute('role', 'button');
    el.setAttribute('aria-label', c.name + ', ' + c.role);
    el.title = tooltip(c);
    el.appendChild(photo(c));
    var name = document.createElement('span');
    name.className = 'name';
    name.textContent = c.name;
    el.appendChild(name);
    return el;
  }
  function tooltip(c) {
    return c.name + '\n' + c.role + (c.years ? ' (' + c.years + ')' : '') + (c.note ? '\n' + c.note : '');
  }
  function photo(c) {
    var img = document.createElement('img');
    img.alt = '';
    img.draggable = false;
    img.decoding = 'async';
    img.dataset.stage = 'local';
    img.addEventListener('error', function () { imgFallback(img, c); });
    img.src = 'images/' + c.id + '.jpg';
    return img;
  }

  // Expanded view: one row per candidate with editable 1–10 scores and a total.
  var rowEls = {};
  function buildRow(c) {
    var el = document.createElement('div');
    el.className = 'row-entry entry';
    el.dataset.id = c.id;
    el.tabIndex = 0;
    el.setAttribute('role', 'button');
    el.setAttribute('aria-label', c.name + ', ' + c.role);

    var who = document.createElement('div');
    who.className = 'who';
    who.title = tooltip(c);
    var thumb = document.createElement('span');
    thumb.className = 'thumb';
    thumb.dataset.id = c.id;
    thumb.appendChild(photo(c));
    who.appendChild(thumb);
    var txt = document.createElement('span');
    txt.className = 'who-text';
    var b = document.createElement('strong');
    b.textContent = c.name;
    var small = document.createElement('small');
    small.textContent = c.role;
    txt.appendChild(b);
    txt.appendChild(small);
    who.appendChild(txt);
    el.appendChild(who);

    FIELDS.forEach(function (f, i) {
      var cell = document.createElement('label');
      cell.className = 'score';
      var input = document.createElement('input');
      input.type = 'number';
      input.min = '1';
      input.max = '10';
      input.step = '1';
      input.inputMode = 'numeric';
      input.id = 'score-' + c.id + '-' + i;
      input.dataset.field = String(i);
      input.setAttribute('aria-label', c.name + ' ' + f + ', 1 to 10');
      cell.appendChild(input);
      el.appendChild(cell);
    });
    var tot = document.createElement('div');
    tot.className = 'total';
    el.appendChild(tot);
    return el;
  }
  function paintRow(id) {
    var el = rowEls[id];
    var vals = state.ratings[id];
    el.querySelectorAll('input[data-field]').forEach(function (input) {
      var v = vals[Number(input.dataset.field)];
      if (document.activeElement !== input || input.value !== '') input.value = v;
      input.parentNode.style.setProperty('--score-hue', String(Math.round((v - 1) / 9 * 125)));
    });
    var t = total(id);
    var tot = el.querySelector('.total');
    tot.textContent = t;
    tot.style.setProperty('--score-hue', String(Math.round(Math.max(0, t - 10) / 40 * 125)));
  }
  function entryEl(id) { return state.expanded && state.pool.indexOf(id) < 0 ? rowEls[id] : cardEls[id]; }

  // Expanded view shows each tier highest total first; ties keep the order they were dragged in.
  // This is display order only, so normal view keeps the hand-arranged order.
  function displayItems(t) {
    return state.expanded ? sortedItems(t) : t.items;
  }
  function sortedItems(t) {
    return t.items
      .map(function (id, i) { return { id: id, i: i, total: total(id) }; })
      .sort(function (a, b) { return b.total - a.total || a.i - b.i; })
      .map(function (x) { return x.id; });
  }
  function displayedOrder() {
    return Array.prototype.map.call(board.querySelectorAll('.zone'), function (z) {
      return Array.prototype.map.call(z.children, function (n) { return n.dataset.id; }).join();
    }).join('|');
  }
  function expectedOrder() {
    return state.tiers.map(function (t) { return displayItems(t).join(); }).join('|');
  }


  // Score edits: update live while typing, clamp to 1–10 when the field is left.
  document.addEventListener('input', function (e) {
    var input = e.target;
    if (!input.matches || !input.matches('.row-entry input[data-field]')) return;
    if (input.value === '') return;
    var id = input.closest('.row-entry').dataset.id;
    state.ratings[id][Number(input.dataset.field)] = clampScore(input.value);
    save();
    paintRow(id);
  });
  document.addEventListener('focusout', function (e) {
    var input = e.target;
    if (!input.matches || !input.matches('.row-entry input[data-field]')) return;
    paintRow(input.closest('.row-entry').dataset.id);
    setTimeout(resortIfNeeded, 0);
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' && e.target.matches && e.target.matches('.row-entry input[data-field]')) {
      e.preventDefault();
      resortIfNeeded();
    }
  });
  function resortIfNeeded() {
    if (!state.expanded || expectedOrder() === displayedOrder()) return;
    var active = document.activeElement;
    render();
    if (active && active !== document.body && document.contains(active)) active.focus({ preventScroll: true });
  }
  document.addEventListener('focusin', function (e) {
    if (e.target.matches && e.target.matches('.row-entry input[data-field]')) e.target.select();
  });

  // ---------- rendering ----------
  var board = document.getElementById('board');
  var poolEl = document.getElementById('pool');
  var namesToggle = document.getElementById('opt-names');
  var expandToggle = document.getElementById('opt-expanded');
  var resetRatingsBtn = document.getElementById('btn-reset-ratings');
  var poolHead = document.getElementById('pool-cols');

  var ICONS = {
    gear: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M19.4 13a7.6 7.6 0 0 0 0-2l2.1-1.6a.5.5 0 0 0 .1-.6l-2-3.5a.5.5 0 0 0-.6-.2l-2.5 1a7.4 7.4 0 0 0-1.7-1l-.4-2.7a.5.5 0 0 0-.5-.4h-4a.5.5 0 0 0-.5.4l-.4 2.7a7.4 7.4 0 0 0-1.7 1l-2.5-1a.5.5 0 0 0-.6.2l-2 3.5a.5.5 0 0 0 .1.6L4.6 11a7.6 7.6 0 0 0 0 2l-2.1 1.6a.5.5 0 0 0-.1.6l2 3.5c.1.2.4.3.6.2l2.5-1c.5.4 1.1.7 1.7 1l.4 2.7c0 .2.3.4.5.4h4c.2 0 .5-.2.5-.4l.4-2.7c.6-.3 1.2-.6 1.7-1l2.5 1c.2.1.5 0 .6-.2l2-3.5a.5.5 0 0 0-.1-.6L19.4 13ZM12 15.5a3.5 3.5 0 1 1 0-7 3.5 3.5 0 0 1 0 7Z"/></svg>',
    up: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m6 15 6-6 6 6"/></svg>',
    down: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>',
  };

  function render() {
    document.body.classList.toggle('hide-names', !state.showNames);
    document.body.classList.toggle('expanded', state.expanded);
    namesToggle.checked = state.showNames;
    expandToggle.checked = state.expanded;
    resetRatingsBtn.hidden = !state.expanded;

    // Detach entries first so rebuilding rows never destroys them.
    [cardEls, rowEls].forEach(function (set) {
      Object.keys(set).forEach(function (id) { var el = set[id]; if (el.parentNode) el.parentNode.removeChild(el); });
    });
    board.textContent = '';
    poolEl.classList.remove('list');

    if (state.expanded) {
      var head = document.createElement('div');
      head.className = 'board-head';
      head.setAttribute('aria-hidden', 'true');
      head.innerHTML = '<span class="h-tier">Tier</span><div class="cols"><span class="h-who">Candidate</span>' +
        FIELDS.map(function (f) { return '<span class="h-score">' + escapeAttr(f) + '</span>'; }).join('') +
        '<span class="h-score h-total">Total<small>/' + FIELDS.length * 10 + '</small></span></div><span></span>';
      board.appendChild(head);
      Object.keys(rowEls).forEach(paintRow);
    }
    poolHead.hidden = true;
    document.getElementById('pool-hint').textContent = state.expanded
      ? 'Drag a photo into a tier to rate it. Click any score to change it (1–10). Each tier sorts by total.'
      : 'Tap a photo, then a tier. Keys: Enter selects, 1–9 sends to a tier, 0 returns here.';

    state.tiers.forEach(function (t, i) {
      var row = document.createElement('div');
      row.className = 'tier';
      row.style.setProperty('--tier-color', t.color);

      var label = document.createElement('div');
      label.className = 'tier-label';
      label.textContent = t.label;
      row.appendChild(label);

      var zone = document.createElement('div');
      zone.className = 'zone' + (state.expanded ? ' list' : '');
      zone.dataset.zone = t.id;
      zone.setAttribute('aria-label', (t.label || 'Unnamed') + ' tier');
      displayItems(t).forEach(function (id) { zone.appendChild(entryEl(id)); });
      row.appendChild(zone);

      var ctl = document.createElement('div');
      ctl.className = 'tier-controls';
      ctl.innerHTML =
        '<button class="icon-btn" type="button" data-act="edit" aria-label="Edit tier ' + escapeAttr(t.label) + '">' + ICONS.gear + '</button>' +
        '<div class="move">' +
        '<button class="icon-btn" type="button" data-act="up" aria-label="Move tier up"' + (i === 0 ? ' disabled' : '') + '>' + ICONS.up + '</button>' +
        '<button class="icon-btn" type="button" data-act="down" aria-label="Move tier down"' + (i === state.tiers.length - 1 ? ' disabled' : '') + '>' + ICONS.down + '</button>' +
        '</div>';
      ctl.dataset.tier = t.id;
      row.appendChild(ctl);
      board.appendChild(row);
    });

    state.pool.forEach(function (id) { poolEl.appendChild(entryEl(id)); });
    updateSelectionUI();
  }

  function escapeAttr(s) {
    return String(s).replace(/[&<>"']/g, function (ch) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch];
    });
  }

  function listFor(zoneId) {
    if (zoneId === 'pool') return state.pool;
    var t = findTier(zoneId);
    return t ? t.items : null;
  }
  function findTier(id) {
    for (var i = 0; i < state.tiers.length; i++) if (state.tiers[i].id === id) return state.tiers[i];
    return null;
  }
  function removeEverywhere(id) {
    var i = state.pool.indexOf(id);
    if (i >= 0) state.pool.splice(i, 1);
    state.tiers.forEach(function (t) {
      var j = t.items.indexOf(id);
      if (j >= 0) t.items.splice(j, 1);
    });
  }
  function moveCard(id, zoneId, index) {
    var list = listFor(zoneId);
    if (!list) return;
    removeEverywhere(id);
    lastTap = { id: null, t: 0 }; // a move ends any double-click in progress
    if (index == null || index > list.length) index = list.length;
    list.splice(index, 0, id);
    save();
    render();
  }

  // ---------- tap / keyboard placement ----------
  var selectedId = null;
  function select(id) {
    selectedId = selectedId === id ? null : id;
    updateSelectionUI();
  }
  function updateSelectionUI() {
    [cardEls, rowEls].forEach(function (set) {
      Object.keys(set).forEach(function (id) { set[id].classList.toggle('selected', id === selectedId); });
    });
    document.querySelectorAll('.zone').forEach(function (z) { z.classList.toggle('tap-target', !!selectedId); });
  }

  document.addEventListener('click', function (e) {
    if (suppressClick) { suppressClick = false; return; }
    if (e.target.closest('.score')) return;
    var card = e.target.closest('.entry');
    if (card) { tapEntry(card.dataset.id); return; }
    var zone = e.target.closest('[data-zone]');
    if (!zone && e.target.closest('.tier-label')) zone = e.target.closest('.tier').querySelector('[data-zone]');
    if (zone && selectedId) {
      var id = selectedId;
      selectedId = null;
      moveCard(id, zone.dataset.zone);
      var el = entryEl(id);
      if (el) el.focus({ preventScroll: true });
    }
  });

  document.addEventListener('keydown', function (e) {
    if (document.querySelector('.scrim')) return;
    if (e.target.tagName === 'INPUT') return;
    var card = e.target.closest && e.target.closest('.entry');
    if (card && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      tapEntry(card.dataset.id);
      return;
    }
    if (e.key === 'Escape' && selectedId) { selectedId = null; updateSelectionUI(); return; }
    var target = selectedId || (card && card.dataset.id);
    if (!target || !/^[0-9]$/.test(e.key) || e.target.tagName === 'INPUT') return;
    var n = Number(e.key);
    var zoneId = n === 0 ? 'pool' : (state.tiers[n - 1] && state.tiers[n - 1].id);
    if (!zoneId) return;
    e.preventDefault();
    selectedId = null;
    moveCard(target, zoneId);
    entryEl(target).focus({ preventScroll: true });
  });

  // Two clicks (or taps, or Enter presses) on the same ranked candidate within this window open the profile.
  var DOUBLE_MS = 400;
  var lastTap = { id: null, t: 0 };
  function tapEntry(id) {
    var now = Date.now();
    var isDouble = lastTap.id === id && now - lastTap.t < DOUBLE_MS;
    lastTap = isDouble ? { id: null, t: 0 } : { id: id, t: now };
    if (isDouble && tierOf(id)) {
      selectedId = null;
      updateSelectionUI();
      openProfile(id);
      return;
    }
    select(id);
  }
  function tierOf(id) {
    for (var i = 0; i < state.tiers.length; i++) if (state.tiers[i].items.indexOf(id) >= 0) return state.tiers[i];
    return null;
  }

  // ---------- candidate profile ----------
  function fieldAverage(i) {
    var sum = 0;
    CANDIDATES.forEach(function (c) { sum += state.ratings[c.id][i]; });
    return sum / CANDIDATES.length;
  }
  function overallRank(id) {
    var mine = total(id);
    var better = CANDIDATES.filter(function (c) { return total(c.id) > mine; }).length;
    var tied = CANDIDATES.filter(function (c) { return total(c.id) === mine; }).length;
    return { rank: better + 1, tied: tied > 1, of: CANDIDATES.length };
  }
  function ordinal(n) {
    var s = ['th', 'st', 'nd', 'rd'], v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
  }

  function openProfile(id) {
    var c = BY_ID[id];
    var tier = tierOf(id);
    var vals = state.ratings[id];
    var tot = total(id);
    var max = FIELDS.length * 10;
    var r = overallRank(id);
    var tierPos = sortedItems(tier).indexOf(id) + 1; // position by score, as in expanded view

    openDialog(function (dlg, close) {
      dlg.setAttribute('aria-label', c.name + ' profile');
      dlg.style.setProperty('--tier-color', tier.color);
      dlg.innerHTML =
        '<button class="icon-btn profile-close" type="button" aria-label="Close profile">' +
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg></button>' +
        '<div class="profile-photo" data-id="' + escapeAttr(id) + '"></div>' +
        '<div class="profile-body">' +
          '<div class="profile-tier">' + escapeAttr(tier.label || 'Unnamed tier') + '<span>' + ordinal(tierPos) + ' of ' + tier.items.length + ' in tier</span></div>' +
          '<h3 class="profile-name">' + escapeAttr(c.name) + '</h3>' +
          '<p class="profile-role">' + escapeAttr(c.role) + (c.years ? ' · ' + escapeAttr(c.years) : '') + '</p>' +
          (c.note ? '<p class="profile-note">' + escapeAttr(c.note) + '</p>' : '') +
          '<div class="profile-total">' +
            '<div><span class="big">' + tot + '</span><span class="of">/' + max + '</span></div>' +
            '<div class="rank"><strong>' + (r.tied ? 'T-' : '') + ordinal(r.rank) + '</strong> of ' + r.of + ' in the field</div>' +
          '</div>' +
          '<div class="profile-scores">' +
            FIELDS.map(function (f, i) {
              var v = vals[i];
              var avg = fieldAverage(i);
              var cells = '';
              for (var k = 1; k <= 10; k++) cells += '<span class="seg' + (k <= v ? ' on' : '') + '"></span>';
              var diff = v - avg;
              var cmp = Math.abs(diff) < 0.5 ? 'about average' : (diff > 0 ? '+' : '−') + Math.abs(diff).toFixed(1) + ' vs. field';
              return '<div class="pscore" style="--score-hue:' + Math.round((v - 1) / 9 * 125) + '">' +
                '<span class="plabel">' + escapeAttr(f) + '</span>' +
                '<span class="pbar" role="img" aria-label="' + v + ' out of 10">' + cells +
                  '<span class="pavg" style="left:' + (avg / 10 * 100) + '%" title="Field average ' + avg.toFixed(1) + '"></span></span>' +
                '<span class="pval">' + v + '</span>' +
                '<span class="pcmp">Field avg ' + avg.toFixed(1) + ' · ' + cmp + '</span>' +
              '</div>';
            }).join('') +
          '</div>' +
          '<p class="profile-foot">The tick on each bar marks the field average across all ' + CANDIDATES.length + ' candidates. ' +
          '<a href="https://en.wikipedia.org/wiki/' + encodeURIComponent(c.wiki) + '" target="_blank" rel="noopener">' + escapeAttr(c.name) + ' on Wikipedia</a></p>' +
        '</div>';
      var img = photo(c);
      dlg.querySelector('.profile-photo').appendChild(img);
      dlg.querySelector('.profile-close').addEventListener('click', close);
    }, 'profile');
  }

  // ---------- drag and drop (mouse, pen and touch) ----------
  var drag = null;          // active or pending drag
  var suppressClick = false;
  var placeholder = document.createElement('div');
  placeholder.className = 'placeholder';
  var HOLD_MS = 220;        // touch: press-and-hold before a drag starts, so swipes still scroll
  var MOVE_PX = 6;

  document.addEventListener('pointerdown', function (e) {
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    if (e.target.closest('.score')) return;
    var card = e.target.closest('.entry');
    if (!card || drag) return;
    drag = {
      id: card.dataset.id,
      el: card,
      pointerId: e.pointerId,
      touch: e.pointerType !== 'mouse',
      startX: e.clientX,
      startY: e.clientY,
      x: e.clientX,
      y: e.clientY,
      active: false,
      timer: null,
    };
    if (drag.touch) {
      drag.timer = setTimeout(function () { if (drag && !drag.active) startDrag(); }, HOLD_MS);
    }
  });

  document.addEventListener('pointermove', function (e) {
    if (!drag || e.pointerId !== drag.pointerId) return;
    drag.x = e.clientX;
    drag.y = e.clientY;
    var dist = Math.hypot(e.clientX - drag.startX, e.clientY - drag.startY);
    if (!drag.active) {
      if (drag.touch) {
        if (dist > 10) cancelPending(); // finger moved before the hold finished: let the page scroll
      } else if (dist > MOVE_PX) {
        startDrag();
      }
      return;
    }
    e.preventDefault();
    positionGhost();
    updateDropTarget();
  });

  // Stop the page from scrolling under an active touch drag.
  document.addEventListener('touchmove', function (e) {
    if (drag && drag.active) e.preventDefault();
  }, { passive: false });
  document.addEventListener('contextmenu', function (e) {
    if (e.target.closest && e.target.closest('.entry') && !e.target.closest('.score')) e.preventDefault();
  });

  document.addEventListener('pointerup', function (e) {
    if (!drag || e.pointerId !== drag.pointerId) return;
    if (drag.active) finishDrag(true);
    else cancelPending();
  });
  document.addEventListener('pointercancel', function (e) {
    if (!drag || e.pointerId !== drag.pointerId) return;
    if (drag.active) finishDrag(false);
    else cancelPending();
  });
  window.addEventListener('blur', function () { if (drag && drag.active) finishDrag(false); });

  function cancelPending() {
    if (drag && drag.timer) clearTimeout(drag.timer);
    drag = null;
  }

  function startDrag() {
    if (drag.timer) clearTimeout(drag.timer);
    drag.active = true;
    selectedId = null;
    updateSelectionUI();
    var rect = drag.el.getBoundingClientRect();
    drag.offX = drag.startX - rect.left;
    drag.offY = drag.startY - rect.top;
    var ghost = drag.el.cloneNode(true);
    ghost.classList.remove('selected');
    ghost.classList.add('ghost');
    ghost.removeAttribute('tabindex');
    ghost.setAttribute('aria-hidden', 'true');
    ghost.style.width = rect.width + 'px';
    ghost.style.height = rect.height + 'px';
    document.body.appendChild(ghost);
    drag.ghost = ghost;
    drag.el.classList.add('lifted');
    document.body.classList.add('dragging');
    if (navigator.vibrate && drag.touch) { try { navigator.vibrate(12); } catch (err) { /* ignore */ } }
    positionGhost();
    updateDropTarget();
  }

  function positionGhost() {
    drag.ghost.style.left = (drag.x - drag.offX) + 'px';
    drag.ghost.style.top = (drag.y - drag.offY) + 'px';
  }

  function updateDropTarget() {
    var under = document.elementFromPoint(drag.x, drag.y);
    var zone = under && under.closest('[data-zone]');
    if (!zone) {
      // Over a tier label or its controls: use that row's zone.
      var row = under && under.closest('.tier');
      zone = row ? row.querySelector('[data-zone]') : null;
    }
    document.querySelectorAll('.zone.over').forEach(function (z) { if (z !== zone) z.classList.remove('over'); });
    if (!zone) {
      if (placeholder.parentNode) placeholder.parentNode.removeChild(placeholder);
      drag.zone = null;
      return;
    }
    zone.classList.add('over');
    drag.zone = zone;

    // Insert before the first card the pointer sits ahead of, reading rows left to right.
    var cards = Array.prototype.filter.call(zone.children, function (n) {
      return n.classList.contains('entry') && n !== drag.el;
    });
    if (zone.classList.contains('list')) {
      if (placeholder.parentNode) placeholder.parentNode.removeChild(placeholder);
      drag.beforeId = null;
      autoScroll();
      return;
    }
    var before = null;
    for (var i = 0; i < cards.length; i++) {
      var r = cards[i].getBoundingClientRect();
      if (drag.y < r.top) { before = cards[i]; break; }
      if (drag.y <= r.bottom && drag.x < r.left + r.width / 2) { before = cards[i]; break; }
    }
    if (before) {
      if (placeholder.nextSibling !== before || placeholder.parentNode !== zone) zone.insertBefore(placeholder, before);
    } else if (placeholder.parentNode !== zone || placeholder.nextSibling) {
      zone.appendChild(placeholder);
    }
    drag.beforeId = before ? before.dataset.id : null;
    autoScroll();
  }

  // Scroll the window when dragging near the top or bottom edge.
  var scrollRaf = null;
  function autoScroll() {
    if (scrollRaf) return;
    var edge = 60;
    var h = window.innerHeight;
    var dy = drag.y < edge ? -(edge - drag.y) / 4 : drag.y > h - edge ? (drag.y - (h - edge)) / 4 : 0;
    if (!dy) return;
    scrollRaf = requestAnimationFrame(function () {
      scrollRaf = null;
      if (!drag || !drag.active) return;
      window.scrollBy(0, dy);
      updateDropTarget();
    });
  }

  function finishDrag(commit) {
    var d = drag;
    drag = null;
    if (d.ghost) d.ghost.remove();
    d.el.classList.remove('lifted');
    document.body.classList.remove('dragging');
    document.querySelectorAll('.zone.over').forEach(function (z) { z.classList.remove('over'); });
    if (placeholder.parentNode) placeholder.parentNode.removeChild(placeholder);
    suppressClick = true;
    setTimeout(function () { suppressClick = false; }, 0);
    if (!commit || !d.zone) return;
    var zoneId = d.zone.dataset.zone;
    removeEverywhere(d.id);
    var list = listFor(zoneId);
    var idx = d.beforeId ? list.indexOf(d.beforeId) : list.length;
    moveCard(d.id, zoneId, idx < 0 ? list.length : idx);
  }

  // ---------- tier controls ----------
  board.addEventListener('click', function (e) {
    var btn = e.target.closest('[data-act]');
    if (!btn) return;
    e.stopPropagation();
    var tierId = btn.closest('.tier-controls').dataset.tier;
    var i = state.tiers.findIndex(function (t) { return t.id === tierId; });
    if (btn.dataset.act === 'up' && i > 0) swapTiers(i, i - 1, 'up');
    if (btn.dataset.act === 'down' && i < state.tiers.length - 1) swapTiers(i, i + 1, 'down');
    if (btn.dataset.act === 'edit') openTierDialog(tierId);
  });
  function swapTiers(a, b, dir) {
    var tmp = state.tiers[a];
    state.tiers[a] = state.tiers[b];
    state.tiers[b] = tmp;
    save();
    render();
    var btn = board.querySelector('[data-tier="' + tmp.id + '"] [data-act="' + dir + '"]');
    if (btn && !btn.disabled) btn.focus();
  }

  function openDialog(build, wide) {
    var prevFocus = document.activeElement;
    var scrim = document.createElement('div');
    scrim.className = 'scrim';
    var dlg = document.createElement('div');
    dlg.className = 'dialog' + (wide === true ? ' wide' : wide ? ' ' + wide : '');
    dlg.setAttribute('role', 'dialog');
    dlg.setAttribute('aria-modal', 'true');
    scrim.appendChild(dlg);
    function close() {
      scrim.remove();
      document.removeEventListener('keydown', onKey, true);
      if (prevFocus && prevFocus.focus) prevFocus.focus();
    }
    function onKey(e) { if (e.key === 'Escape') { e.preventDefault(); close(); } }
    document.addEventListener('keydown', onKey, true);
    scrim.addEventListener('pointerdown', function (e) { if (e.target === scrim) close(); });
    build(dlg, close);
    document.body.appendChild(scrim);
    var first = dlg.querySelector('input, button');
    if (first) first.focus();
    return close;
  }

  function openTierDialog(tierId) {
    var t = findTier(tierId);
    if (!t) return;
    openDialog(function (dlg, close) {
      dlg.setAttribute('aria-label', 'Edit tier');
      dlg.innerHTML =
        '<h3>Edit tier</h3>' +
        '<label class="field" for="tier-name">Tier name<input type="text" id="tier-name" maxlength="40"></label>' +
        '<div class="field" style="display:grid;gap:6px;font-weight:600;font-size:13px;color:var(--muted)">Color<div class="swatches" id="tier-swatches"></div></div>' +
        '<div class="row">' +
        '<button class="btn" type="button" data-do="above">Add tier above</button>' +
        '<button class="btn" type="button" data-do="below">Add tier below</button>' +
        '<button class="btn" type="button" data-do="clear">Send candidates back</button>' +
        '<button class="btn" type="button" data-do="delete">Delete tier</button>' +
        '</div>' +
        '<div class="row end"><button class="btn primary" type="button" data-do="done">Done</button></div>';
      var input = dlg.querySelector('#tier-name');
      input.value = t.label;
      input.addEventListener('input', function () { t.label = input.value; save(); render(); });
      input.addEventListener('keydown', function (e) { if (e.key === 'Enter') close(); });

      var sw = dlg.querySelector('#tier-swatches');
      function drawSwatches() {
        sw.textContent = '';
        PALETTE.forEach(function (col) {
          var b = document.createElement('button');
          b.type = 'button';
          b.className = 'swatch';
          b.style.background = col;
          b.setAttribute('aria-label', 'Color ' + col);
          b.setAttribute('aria-pressed', String(col.toLowerCase() === t.color.toLowerCase()));
          b.addEventListener('click', function () { setColor(col); });
          sw.appendChild(b);
        });
        var custom = document.createElement('input');
        custom.type = 'color';
        custom.id = 'tier-color-custom';
        custom.value = t.color;
        custom.setAttribute('aria-label', 'Custom color');
        custom.addEventListener('input', function () { setColor(custom.value, true); });
        sw.appendChild(custom);
      }
      function setColor(col, fromPicker) {
        t.color = col;
        save();
        render();
        if (!fromPicker) drawSwatches();
      }
      drawSwatches();

      var armedDelete = false;
      dlg.addEventListener('click', function (e) {
        var b = e.target.closest('[data-do]');
        if (!b) return;
        var idx = state.tiers.indexOf(t);
        switch (b.dataset.do) {
          case 'done': close(); break;
          case 'above':
          case 'below':
            state.tiers.splice(b.dataset.do === 'above' ? idx : idx + 1, 0,
              { id: newTierId(), label: 'New tier', color: PALETTE[state.tiers.length % PALETTE.length], items: [] });
            save(); render(); close();
            toast('Tier added');
            break;
          case 'clear':
            state.pool = state.pool.concat(t.items);
            t.items = [];
            save(); render();
            toast('Candidates moved to Unranked');
            break;
          case 'delete':
            if (!armedDelete) {
              armedDelete = true;
              b.textContent = 'Click again to delete';
              b.classList.add('danger-armed');
              return;
            }
            state.pool = state.pool.concat(t.items);
            state.tiers.splice(idx, 1);
            save(); render(); close();
            toast('Tier deleted');
            break;
        }
      });
    });
  }

  document.getElementById('btn-add-tier').addEventListener('click', function () {
    var t = { id: newTierId(), label: 'New tier', color: PALETTE[state.tiers.length % PALETTE.length], items: [] };
    state.tiers.push(t);
    save();
    render();
    openTierDialog(t.id);
  });

  var resetBtn = document.getElementById('btn-reset');
  var resetTimer = null;
  resetBtn.addEventListener('click', function () {
    if (!resetBtn.classList.contains('danger-armed')) {
      resetBtn.classList.add('danger-armed');
      resetBtn.textContent = 'Click again to reset';
      resetTimer = setTimeout(disarmReset, 3500);
      return;
    }
    disarmReset();
    var keep = state;
    state = defaultState();
    state.showNames = keep.showNames;
    state.expanded = keep.expanded;
    state.ratings = keep.ratings;
    save();
    render();
    toast('Tier list reset');
  });
  function disarmReset() {
    clearTimeout(resetTimer);
    resetBtn.classList.remove('danger-armed');
    resetBtn.textContent = 'Reset';
  }

  expandToggle.addEventListener('change', function () {
    state.expanded = expandToggle.checked;
    selectedId = null;
    save();
    render();
  });

  var resetRatingsTimer = null;
  resetRatingsBtn.addEventListener('click', function () {
    if (!resetRatingsBtn.classList.contains('danger-armed')) {
      resetRatingsBtn.classList.add('danger-armed');
      resetRatingsBtn.textContent = 'Click again to reset ratings';
      resetRatingsTimer = setTimeout(disarmRatings, 3500);
      return;
    }
    disarmRatings();
    state.ratings = defaultRatings();
    save();
    render();
    toast('Ratings reset to defaults');
  });
  function disarmRatings() {
    clearTimeout(resetRatingsTimer);
    resetRatingsBtn.classList.remove('danger-armed');
    resetRatingsBtn.textContent = 'Reset ratings';
  }

  namesToggle.addEventListener('change', function () {
    state.showNames = namesToggle.checked;
    save();
    render();
  });

  // ---------- share ----------
  document.getElementById('btn-share').addEventListener('click', function () {
    var link = SHARE_BASE + '#' + encodeShare();
    var done = function () { toast('Link copied. Anyone who opens it sees your tiers.'); };
    var fallback = function () { showLinkDialog(link); };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(link).then(done, fallback);
    } else {
      fallback();
    }
  });
  function showLinkDialog(link) {
    openDialog(function (dlg, close) {
      dlg.setAttribute('aria-label', 'Share link');
      dlg.innerHTML = '<h3>Share link</h3><label class="field" for="share-link">Copy this link<input type="text" id="share-link" readonly></label>' +
        '<div class="row end"><button class="btn primary" type="button">Done</button></div>';
      var input = dlg.querySelector('input');
      input.value = link;
      dlg.querySelector('button').addEventListener('click', close);
      setTimeout(function () { input.focus(); input.select(); }, 0);
    });
  }

  // ---------- export image ----------
  document.getElementById('btn-image').addEventListener('click', function () {
    renderPng().then(function (res) {
      openDialog(function (dlg, close) {
        dlg.setAttribute('aria-label', 'Tier list image');
        var url = URL.createObjectURL(res.blob);
        dlg.innerHTML = '<h3>Your tier list</h3>' +
          '<img class="export-img" alt="Your 2028 tier list">' +
          '<p class="hint">Right-click or long-press the image to save or share it.' + (res.tainted ? ' Some photos could not be included.' : '') + '</p>' +
          '<div class="row end">' +
          '<a class="btn" id="dl-png" download="2028-tier-list.png">Download PNG</a>' +
          '<button class="btn" type="button" id="copy-png">Copy image</button>' +
          '<button class="btn primary" type="button" id="close-png">Done</button></div>';
        dlg.querySelector('img').src = url;
        dlg.querySelector('#dl-png').href = url;
        dlg.querySelector('#close-png').addEventListener('click', close);
        var copyBtn = dlg.querySelector('#copy-png');
        if (!(window.ClipboardItem && navigator.clipboard && navigator.clipboard.write)) copyBtn.hidden = true;
        copyBtn.addEventListener('click', function () {
          navigator.clipboard.write([new ClipboardItem({ 'image/png': res.blob })])
            .then(function () { toast('Image copied'); }, function () { toast('Copying is blocked here. Right-click or long-press the image instead.'); });
        });
      }, true);
    });
  });

  function loadForCanvas(id) {
    return new Promise(function (resolve) {
      var src = cardEls[id].querySelector('img');
      if (!src || src.hidden || !src.complete || !src.naturalWidth) return resolve(null);
      var im = new Image();
      if (/^https?:/.test(src.src) && src.src.indexOf(location.origin) !== 0) im.crossOrigin = 'anonymous';
      im.onload = function () { resolve(im); };
      im.onerror = function () { resolve(null); };
      im.src = src.src;
    });
  }

  function renderPng() {
    return state.expanded ? renderTablePng() : renderGridPng();
  }

  // Expanded export: tiers down the left, one row per candidate with scores and total.
  function renderTablePng() {
    var W = 1240, PAD = 24, HEAD = 92, COLS = 46, LABEL = 170, WHO = 360, ROW = 64;
    var SC = Math.floor((W - PAD * 2 - LABEL - WHO) / (FIELDS.length + 1));
    var heights = state.tiers.map(function (t) { return Math.max(1, t.items.length) * ROW; });
    var orders = state.tiers.map(displayItems);
    var H = HEAD + COLS + heights.reduce(function (a, b) { return a + b + 1; }, 0) + PAD + 30;
    var ids = [];
    state.tiers.forEach(function (t) { ids = ids.concat(t.items); });
    var fontsReady = document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve();
    return fontsReady.then(function () { return Promise.all(ids.map(loadForCanvas)); }).then(function (imgs) {
      var map = {};
      ids.forEach(function (id, i) { map[id] = imgs[i]; });
      try {
        return toBlobChecked(draw(map)).then(function (blob) { return { blob: blob, tainted: false }; });
      } catch (err) {
        return toBlobChecked(draw({})).then(function (blob) { return { blob: blob, tainted: true }; });
      }
    });

    function draw(map) {
      var scale = 2;
      var cv = document.createElement('canvas');
      cv.width = W * scale;
      cv.height = H * scale;
      var ctx = cv.getContext('2d');
      ctx.scale(scale, scale);
      var display = "'Barlow Condensed', 'Arial Narrow', sans-serif";
      var body = "'Public Sans', system-ui, sans-serif";
      ctx.fillStyle = '#15171c';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#eceef3';
      ctx.font = '700 44px ' + display;
      ctx.textBaseline = 'alphabetic';
      ctx.fillText(PARTIES[party].exportTitle, PAD, 62);

      // Column titles
      var x0 = PAD + LABEL + WHO;
      ctx.fillStyle = '#9aa1b0';
      ctx.font = '700 15px ' + display;
      ctx.textBaseline = 'middle';
      ctx.textAlign = 'left';
      ctx.fillText('CANDIDATE', PAD + LABEL + 12, HEAD + COLS / 2);
      ctx.textAlign = 'center';
      FIELDS.concat(['Total']).forEach(function (f, i) {
        ctx.fillStyle = i === FIELDS.length ? '#eceef3' : '#9aa1b0';
        ctx.fillText(f.toUpperCase(), x0 + i * SC + SC / 2, HEAD + COLS / 2);
      });

      var y = HEAD + COLS;
      state.tiers.forEach(function (t, ti) {
        var h = heights[ti];
        ctx.fillStyle = '#2c3039';
        ctx.fillRect(PAD, y - 1, W - PAD * 2, h + 2);
        ctx.fillStyle = '#1a1c21';
        ctx.fillRect(PAD + LABEL, y, W - PAD * 2 - LABEL, h);
        ctx.fillStyle = t.color;
        ctx.fillRect(PAD, y, LABEL, h);
        ctx.fillStyle = '#15140f';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        fitText(ctx, t.label.toUpperCase(), PAD + LABEL / 2, y + h / 2, LABEL - 20, 30, display);

        orders[ti].forEach(function (id, k) {
          var ry = y + k * ROW;
          if (k) { ctx.fillStyle = '#2c3039'; ctx.fillRect(PAD + LABEL, ry, W - PAD * 2 - LABEL, 1); }
          var px = PAD + LABEL + 10, pw = 42, ph = 56;
          ctx.fillStyle = '#262a33';
          ctx.fillRect(px, ry + 4, pw, ph);
          if (map[id]) drawCover(ctx, map[id], px, ry + 4, pw, ph);
          ctx.textAlign = 'left';
          ctx.fillStyle = '#eceef3';
          ctx.font = '700 16px ' + body;
          ctx.fillText(BY_ID[id].name, px + pw + 12, ry + ROW / 2 - 9);
          ctx.fillStyle = '#9aa1b0';
          ctx.font = '500 12px ' + body;
          ctx.fillText(clip(ctx, BY_ID[id].role, WHO - pw - 40), px + pw + 12, ry + ROW / 2 + 11);
          var vals = state.ratings[id].concat([total(id)]);
          vals.forEach(function (v, i) {
            var hue = i === FIELDS.length ? Math.max(0, v - 10) / 40 * 125 : (v - 1) / 9 * 125;
            ctx.fillStyle = 'hsla(' + hue + ', 70%, 50%, 0.22)';
            ctx.fillRect(x0 + i * SC + 3, ry + 6, SC - 6, ROW - 12);
            ctx.fillStyle = '#eceef3';
            ctx.textAlign = 'center';
            ctx.font = (i === FIELDS.length ? '700 30px ' : '700 26px ') + display;
            ctx.fillText(String(v), x0 + i * SC + SC / 2, ry + ROW / 2 + 1);
          });
        });
        y += h + 1;
      });
      ctx.textAlign = 'left';
      ctx.fillStyle = '#9aa1b0';
      ctx.font = '500 13px ' + body;
      ctx.textBaseline = 'alphabetic';
      ctx.fillText(PARTIES[party].exportSource + '. Ratings 1–10.', PAD, H - 18);
      return cv;
    }
  }
  function clip(ctx, text, maxW) {
    if (ctx.measureText(text).width <= maxW) return text;
    while (text.length > 1 && ctx.measureText(text + '…').width > maxW) text = text.slice(0, -1);
    return text + '…';
  }
  function toBlobChecked(cv) {
    cv.getContext('2d').getImageData(0, 0, 1, 1); // throws on a tainted canvas
    return new Promise(function (resolve) { cv.toBlob(resolve, 'image/png'); });
  }

  function renderGridPng() {
    var W = 1200, LABEL = 190, CW = 96, CH = 128, GAP = 2, PAD = 24, HEAD = 92;
    var perRow = Math.floor((W - PAD * 2 - LABEL - GAP) / (CW + GAP));
    var heights = state.tiers.map(function (t) {
      var rows = Math.max(1, Math.ceil(t.items.length / perRow));
      return rows * (CH + GAP) + GAP;
    });
    var H = HEAD + heights.reduce(function (a, b) { return a + b + 1; }, 0) + PAD + 30;
    var ids = [];
    state.tiers.forEach(function (t) { ids = ids.concat(t.items); });

    var fontsReady = document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve();
    return fontsReady.then(function () {
      return Promise.all(ids.map(loadForCanvas));
    }).then(function (imgs) {
      var map = {};
      ids.forEach(function (id, i) { map[id] = imgs[i]; });
      try {
        return toBlob(draw(map)).then(function (blob) { return { blob: blob, tainted: false }; });
      } catch (err) {
        // A cross-origin photo without CORS headers taints the canvas; redraw with initials instead.
        return toBlob(draw({})).then(function (blob) { return { blob: blob, tainted: true }; });
      }
    });

    function toBlob(cv) {
      cv.getContext('2d').getImageData(0, 0, 1, 1); // throws on a tainted canvas
      return new Promise(function (resolve) { cv.toBlob(resolve, 'image/png'); });
    }

    function draw(map) {
      var scale = 2;
      var cv = document.createElement('canvas');
      cv.width = W * scale;
      cv.height = H * scale;
      var ctx = cv.getContext('2d');
      ctx.scale(scale, scale);
      var display = "'Barlow Condensed', 'Arial Narrow', sans-serif";
      var body = "'Public Sans', system-ui, sans-serif";

      ctx.fillStyle = '#15171c';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#eceef3';
      ctx.font = '700 44px ' + display;
      ctx.textBaseline = 'alphabetic';
      ctx.fillText(PARTIES[party].exportTitle, PAD, 62);

      var y = HEAD;
      state.tiers.forEach(function (t, ti) {
        var h = heights[ti];
        ctx.fillStyle = '#2c3039';
        ctx.fillRect(PAD, y - 1, W - PAD * 2, h + 2);
        ctx.fillStyle = '#1a1c21';
        ctx.fillRect(PAD + LABEL, y, W - PAD * 2 - LABEL, h);
        ctx.fillStyle = t.color;
        ctx.fillRect(PAD, y, LABEL, h);
        ctx.fillStyle = '#15140f';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        fitText(ctx, t.label.toUpperCase(), PAD + LABEL / 2, y + h / 2, LABEL - 20, 30, display);
        ctx.textAlign = 'left';

        t.items.forEach(function (id, k) {
          var cx = PAD + LABEL + GAP + (k % perRow) * (CW + GAP);
          var cy = y + GAP + Math.floor(k / perRow) * (CH + GAP);
          var im = map[id];
          ctx.fillStyle = '#262a33';
          ctx.fillRect(cx, cy, CW, CH);
          if (im) drawCover(ctx, im, cx, cy, CW, CH);
          else {
            ctx.fillStyle = '#9aa1b0';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.font = '700 30px ' + display;
            ctx.fillText(initials(BY_ID[id].name), cx + CW / 2, cy + CH / 2 - 10);
            ctx.textAlign = 'left';
          }
          if (state.showNames) {
            var g = ctx.createLinearGradient(0, cy + CH - 44, 0, cy + CH);
            g.addColorStop(0, 'rgba(0,0,0,0)');
            g.addColorStop(1, 'rgba(0,0,0,.85)');
            ctx.fillStyle = g;
            ctx.fillRect(cx, cy + CH - 44, CW, 44);
            ctx.fillStyle = '#ffffff';
            ctx.textBaseline = 'bottom';
            ctx.font = '600 11px ' + body;
            wrapText(ctx, BY_ID[id].name, cx + 5, cy + CH - 5, CW - 10, 13);
          }
        });
        y += h + 1;
      });
      ctx.fillStyle = '#9aa1b0';
      ctx.font = '500 13px ' + body;
      ctx.textBaseline = 'alphabetic';
      ctx.fillText(PARTIES[party].exportSource, PAD, H - 18);
      return cv;
    }
  }
  function drawCover(ctx, im, x, y, w, h) {
    var r = Math.max(w / im.naturalWidth, h / im.naturalHeight);
    var sw = w / r, sh = h / r;
    var sx = (im.naturalWidth - sw) / 2;
    var sy = (im.naturalHeight - sh) * 0.18;
    ctx.drawImage(im, sx, sy, sw, sh, x, y, w, h);
  }
  function fitText(ctx, text, x, y, maxW, size, family) {
    var s = size;
    ctx.font = '700 ' + s + 'px ' + family;
    while (ctx.measureText(text).width > maxW && s > 14) { s -= 1; ctx.font = '700 ' + s + 'px ' + family; }
    ctx.fillText(text, x, y);
  }
  function wrapText(ctx, text, x, bottom, maxW, lh) {
    var words = text.split(' ');
    var lines = [];
    var line = '';
    words.forEach(function (w) {
      var test = line ? line + ' ' + w : w;
      if (ctx.measureText(test).width > maxW && line) { lines.push(line); line = w; } else line = test;
    });
    lines.push(line);
    for (var i = lines.length - 1, yy = bottom; i >= 0; i--, yy -= lh) ctx.fillText(lines[i], x, yy);
  }

  // ---------- toast ----------
  var toastTimer = null;
  function toast(msg) {
    var el = document.querySelector('.toast');
    if (!el) {
      el = document.createElement('div');
      el.className = 'toast';
      el.setAttribute('role', 'status');
      document.body.appendChild(el);
    }
    el.textContent = msg;
    el.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { el.hidden = true; }, 2600);
  }

  // ---------- party (D / R) ----------
  var partyToggle = document.getElementById('party-toggle');
  function setParty(p) {
    party = PARTIES[p] ? p : 'D';
    var cfg = PARTIES[party];
    CANDIDATES = cfg.candidates;
    BY_ID = {};
    CANDIDATES.forEach(function (c) { BY_ID[c.id] = c; });
    DEFAULT_TIERS = cfg.tiers;
    wikiThumbsPromise = null;
    selectedId = null;
    lastTap = { id: null, t: 0 };

    // Throw away the other party's cards and rows.
    board.textContent = '';
    poolEl.textContent = '';
    cardEls = {};
    rowEls = {};
    CANDIDATES.forEach(function (c) { cardEls[c.id] = buildCard(c); rowEls[c.id] = buildRow(c); });

    document.documentElement.dataset.party = party;
    document.getElementById('eyebrow').textContent = cfg.eyebrow;
    document.getElementById('sources').innerHTML = cfg.sourcesHtml;
    partyToggle.dataset.active = party;
    partyToggle.querySelectorAll('[data-party]').forEach(function (b) {
      b.setAttribute('aria-pressed', String(b.dataset.party === party));
    });
    try { localStorage.setItem(PARTY_KEY, party); } catch (e) { /* ignore */ }
  }
  partyToggle.addEventListener('click', function (e) {
    var b = e.target.closest('[data-party]');
    // A click on the track (not a letter) flips to the other party.
    var next = b ? b.dataset.party : (party === 'D' ? 'R' : 'D');
    if (next === party) return;
    var view = { showNames: state.showNames, expanded: state.expanded };
    setParty(next);
    state = load() || defaultState();
    state.showNames = view.showNames;
    state.expanded = view.expanded;
    save();
    render();
    toast(PARTIES[party].name + ' field');
  });

  // ---------- boot ----------
  var shared = parseShare(location.hash);
  var savedParty = null;
  try { savedParty = localStorage.getItem(PARTY_KEY); } catch (e) { /* ignore */ }
  setParty(shared ? (shared.p || 'D') : (savedParty || 'D'));
  var state = shared ? stateFromShare(shared) : (load() || defaultState());
  if (shared) {
    var stored = load();
    if (stored) state.showNames = stored.showNames;
    save();
    try { history.replaceState(null, '', location.pathname + location.search); } catch (e) { /* ignore */ }
  }
  render();
  if (shared) toast('Loaded a shared ' + PARTIES[party].name + ' tier list');
})();
