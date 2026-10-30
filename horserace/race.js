(function () {
  'use strict';

  var POLL = window.POLL;
  var SVG_NS = 'http://www.w3.org/2000/svg';

  // Straightaway geometry, in SVG units. Lanes run left to right; the poll leader is in the top lane.
  var LANE = 56;          // lane width (a head fits inside one lane)
  var HEAD_R = 24;        // bubble head radius
  var M = 26;             // turf above and below the track
  // On narrow screens the straightaway is shorter, so it fits the screen with heads big enough to grab.
  var narrowQuery = window.matchMedia('(max-width: 700px)');
  var VB_W, X_START, X_FINISH;
  function setGeometry() {
    var narrow = narrowQuery.matches;
    VB_W = narrow ? 760 : 1400;     // viewBox width
    X_START = narrow ? 76 : 120;    // start line
    X_FINISH = narrow ? 664 : 1290; // finish line
  }
  // Positions use a square-root scale so the field sits closer together than a straight proportion:
  // the leader is just short of the finish and the lowest share starts about a third of the way down.
  var F_LOW = 0.32;
  var F_LEADER = 0.95;
  var CURVE = 0.5;

  var COLORS = {
    grass: '#3c8a3d',
    grassStripe: '#45964a',
    dirt: '#b98a5c',
    rail: '#ffffff',
    check: '#1c8a3a',
  };

  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function value(pct) {
    if (pct === '<1') return 0.75;
    if (pct === '<.5') return 0.25;
    return Number(pct) || 0;
  }

  function el(name, attrs, parent) {
    var n = document.createElementNS(SVG_NS, name);
    Object.keys(attrs || {}).forEach(function (k) { n.setAttribute(k, attrs[k]); });
    if (parent) parent.appendChild(n);
    return n;
  }

  // Vertical painted label in the chute before the start or the run-out after the finish.
  function label(svg, text, x, cy) {
    var t = el('text', {
      x: x, y: cy, 'text-anchor': 'middle', 'dominant-baseline': 'central',
      transform: 'rotate(-90 ' + x + ' ' + cy + ')',
      fill: '#ffffff', 'fill-opacity': 0.85,
      'font-family': "'Alfa Slab One', Rockwell, Georgia, serif",
      'font-size': 30, 'letter-spacing': 4,
      'aria-hidden': 'true',
    }, svg);
    t.textContent = text;
  }

  function buildTrack(partyKey, section) {
    var data = POLL[partyKey];
    var field = data.field;
    var n = field.length;
    var top = M;
    var bottom = M + n * LANE;
    var H = bottom + M;
    var uid = 'trk-' + partyKey;

    section.querySelector('h2').textContent = data.title;
    section.querySelector('.universe').textContent = data.universe;

    var svg = el('svg', {
      viewBox: '0 0 ' + VB_W + ' ' + H,
      role: 'group',
      'aria-label': data.title + ' race. Drag a head along its lane, or focus it and use the arrow keys.',
    });

    var defs = el('defs', {}, svg);
    var stripes = el('pattern', { id: uid + '-turf', width: 120, height: 120, patternUnits: 'userSpaceOnUse' }, defs);
    el('rect', { width: 120, height: 120, fill: COLORS.grass }, stripes);
    el('rect', { width: 60, height: 120, fill: COLORS.grassStripe }, stripes);
    var shadow = el('filter', { id: uid + '-shadow', x: '-50%', y: '-50%', width: '200%', height: '200%' }, defs);
    el('feDropShadow', { dx: 0, dy: 3, stdDeviation: 3, 'flood-color': '#000', 'flood-opacity': 0.45 }, shadow);

    // Turf, then the dirt straightaway.
    el('rect', { width: VB_W, height: H, fill: 'url(#' + uid + '-turf)' }, svg);
    el('rect', { x: 0, y: top, width: VB_W, height: n * LANE, fill: COLORS.dirt }, svg);

    // Lane lines and rails.
    for (var k = 0; k <= n; k++) {
      var edge = k === 0 || k === n;
      el('line', {
        x1: 0, x2: VB_W, y1: top + k * LANE, y2: top + k * LANE,
        stroke: COLORS.rail, 'stroke-width': edge ? 6 : 2, 'stroke-opacity': edge ? 1 : 0.55,
      }, svg);
    }

    // Start line, and the checkered green-and-white finish line.
    el('line', { x1: X_START, y1: top, x2: X_START, y2: bottom, stroke: '#fff', 'stroke-width': 6 }, svg);
    label(svg, 'START', X_START / 2, (top + bottom) / 2);
    var sq = LANE / 2;
    var cols = 3;
    var fx = X_FINISH - (cols * sq) / 2;
    var check = el('g', { 'aria-hidden': 'true' }, svg);
    for (var row = 0; row < n * 2; row++) {
      for (var col = 0; col < cols; col++) {
        el('rect', {
          x: fx + col * sq, y: top + row * sq, width: sq, height: sq,
          fill: (row + col) % 2 ? COLORS.check : '#ffffff',
        }, check);
      }
    }
    label(svg, 'FINISH', (X_FINISH + cols * sq / 2 + VB_W) / 2, (top + bottom) / 2);

    // Lane centerlines, used for placing and dragging heads. Lane 0 (top) is the poll leader.
    var vmax = Math.max.apply(null, field.map(function (c) { return value(c.pct); }));
    var vmin = Math.min.apply(null, field.map(function (c) { return value(c.pct); }));
    function target(v) {
      var lo = Math.pow(vmin, CURVE);
      var hi = Math.pow(vmax, CURVE);
      var t = hi === lo ? 1 : (Math.pow(v, CURVE) - lo) / (hi - lo);
      return F_LOW + (F_LEADER - F_LOW) * t;
    }
    var heads = el('g', {}, svg);
    var runners = field.map(function (c, i) {
      var y = top + (i + 0.5) * LANE;
      var path = el('path', { d: 'M ' + X_START + ' ' + y + ' L ' + X_FINISH + ' ' + y, fill: 'none', stroke: 'none' }, svg);
      var len = path.getTotalLength();
      var samples = [];
      for (var s = 0; s <= 400; s++) samples.push({ x: X_START + (s / 400) * len, y: y, f: s / 400 });
      return {
        c: c,
        svg: svg,
        section: section,
        path: path,
        len: len,
        samples: samples,
        target: target(value(c.pct)),
        f: 0,
        moved: false,
      };
    });

    // Bubble heads: a shadow, the clipped face, and a white ring. Names only appear when clicked.
    runners.forEach(function (r, i) {
      var g = el('g', {
        class: 'head',
        'data-id': r.c.id,
        tabindex: 0,
        role: 'slider',
        'aria-label': 'Lane ' + (i + 1),
        'aria-valuemin': 0,
        'aria-valuemax': 100,
      }, heads);
      var clip = el('clipPath', { id: uid + '-clip-' + i }, defs);
      el('circle', { r: HEAD_R }, clip);
      var face = el('g', { filter: 'url(#' + uid + '-shadow)' }, g);
      el('circle', { r: HEAD_R, fill: '#d9d4cc' }, face);
      el('image', {
        href: 'heads/' + r.c.id + '.jpg',
        x: -HEAD_R, y: -HEAD_R, width: HEAD_R * 2, height: HEAD_R * 2,
        preserveAspectRatio: 'xMidYMid slice',
        'clip-path': 'url(#' + uid + '-clip-' + i + ')',
      }, face);
      el('circle', { class: 'ring', r: HEAD_R, fill: 'none', stroke: '#fff', 'stroke-width': 3 }, face);
      r.g = g;
      r.heads = heads;
      attachDrag(r);
    });

    section.querySelector('.track-scroll').appendChild(svg);
    return runners;
  }

  function place(r, f) {
    r.f = Math.min(1, Math.max(0, f));
    var p = r.path.getPointAtLength(r.f * r.len);
    r.g.setAttribute('transform', 'translate(' + p.x.toFixed(1) + ' ' + p.y.toFixed(1) + ')');
    r.g.setAttribute('aria-valuenow', Math.round(r.f * 100));
    if (nameTag.runner === r) positionNameTag();
  }

  // ---------- dragging along a lane (mouse, pen and touch) ----------
  function toSvgPoint(svg, clientX, clientY) {
    var pt = svg.createSVGPoint();
    pt.x = clientX;
    pt.y = clientY;
    return pt.matrixTransform(svg.getScreenCTM().inverse());
  }
  function nearestF(r, x, y) {
    var best = r.samples[0];
    var bestD = Infinity;
    r.samples.forEach(function (s) {
      var d = (s.x - x) * (s.x - x) + (s.y - y) * (s.y - y);
      if (d < bestD) { bestD = d; best = s; }
    });
    return best.f;
  }
  function bringToFront(r) {
    if (r.heads.lastChild !== r.g) r.heads.appendChild(r.g);
  }

  function attachDrag(r) {
    var drag = null;
    r.g.addEventListener('pointerdown', function (e) {
      if (e.button !== 0 && e.pointerType === 'mouse') return;
      e.preventDefault();
      // Reorder before capturing: moving a captured element in the DOM drops the capture.
      bringToFront(r);
      r.g.setPointerCapture(e.pointerId);
      drag = { id: e.pointerId, x: e.clientX, y: e.clientY, moved: false };
      r.moved = true; // stop the intro animation for this head
      r.g.classList.add('grabbed');
      r.g.focus({ preventScroll: true });
    });
    r.g.addEventListener('pointermove', function (e) {
      if (!drag || e.pointerId !== drag.id) return;
      if (!drag.moved && Math.hypot(e.clientX - drag.x, e.clientY - drag.y) < 4) return;
      drag.moved = true;
      hideNameTag();
      var p = toSvgPoint(r.svg, e.clientX, e.clientY);
      place(r, nearestF(r, p.x, p.y));
    });
    function end(e) {
      if (!drag || e.pointerId !== drag.id) return;
      var wasClick = !drag.moved && e.type === 'pointerup';
      drag = null;
      r.g.classList.remove('grabbed');
      if (wasClick) toggleNameTag(r);
    }
    r.g.addEventListener('pointerup', end);
    r.g.addEventListener('pointercancel', end);
    r.g.addEventListener('keydown', function (e) {
      var step = { ArrowRight: 0.02, ArrowUp: 0.02, ArrowLeft: -0.02, ArrowDown: -0.02 }[e.key];
      if (step) {
        e.preventDefault();
        r.moved = true;
        bringToFront(r);
        r.g.focus({ preventScroll: true }); // moving a focused element in the DOM drops focus
        place(r, r.f + step);
      } else if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        toggleNameTag(r);
      } else if (e.key === 'Escape') {
        hideNameTag();
      }
    });
  }

  // ---------- name tag (click a head) ----------
  var nameTag = { el: null, runner: null };
  function toggleNameTag(r) {
    if (nameTag.runner === r) { hideNameTag(); return; }
    hideNameTag();
    var tag = document.createElement('div');
    tag.className = 'name-tag';
    tag.setAttribute('role', 'status');
    tag.textContent = r.c.name;
    r.section.querySelector('.track-scroll').appendChild(tag);
    nameTag = { el: tag, runner: r };
    positionNameTag();
  }
  function positionNameTag() {
    var r = nameTag.runner;
    if (!r) return;
    var box = r.section.querySelector('.track-scroll');
    var hb = r.g.querySelector('.ring').getBoundingClientRect();
    var bb = box.getBoundingClientRect();
    nameTag.el.style.left = (hb.left + hb.width / 2 - bb.left + box.scrollLeft) + 'px';
    nameTag.el.style.top = (hb.top - bb.top) + 'px';
  }
  function hideNameTag() {
    if (nameTag.el) nameTag.el.remove();
    nameTag = { el: null, runner: null };
  }
  document.addEventListener('pointerdown', function (e) {
    if (!e.target.closest || !e.target.closest('.head')) hideNameTag();
  });
  window.addEventListener('resize', positionNameTag);

  var allRunners = [];
  function buildAll() {
    hideNameTag();
    setGeometry();
    allRunners = [];
    document.querySelectorAll('.race').forEach(function (section) {
      section.querySelector('.track-scroll').textContent = '';
      allRunners = allRunners.concat(buildTrack(section.dataset.party, section));
    });
  }
  buildAll();
  // Crossing the phone breakpoint redraws the tracks at the other length, back at poll positions.
  narrowQuery.addEventListener('change', function () {
    buildAll();
    allRunners.forEach(function (r) { place(r, r.target); });
  });

  // The race: everyone leaves the start line together and eases into their poll position.
  // A head someone grabs mid-race stops following the animation.
  var raf = null;
  function run() {
    cancelAnimationFrame(raf);
    hideNameTag();
    allRunners.forEach(function (r) { r.moved = false; });
    if (reduceMotion) {
      allRunners.forEach(function (r) { place(r, r.target); });
      return;
    }
    var DURATION = 2600;
    var t0 = null;
    function frame(ts) {
      if (t0 === null) t0 = ts;
      var t = Math.min(1, (ts - t0) / DURATION);
      var e = 1 - Math.pow(1 - t, 3);
      allRunners.forEach(function (r) { if (!r.moved) place(r, r.target * e); });
      if (t < 1) raf = requestAnimationFrame(frame);
    }
    allRunners.forEach(function (r) { place(r, 0); });
    raf = requestAnimationFrame(frame);
  }
  // Final positions first, so the page is complete even before the animation runs.
  allRunners.forEach(function (r) { place(r, r.target); });
  run();
  document.getElementById('replay').addEventListener('click', run);

  document.getElementById('source').textContent =
    'Lane order and starting positions: ' + POLL.source + '. Positions use a square-root scale, so gaps are compressed; each track is scaled to its own field.';
  if (window.TIER_LIST_URL) document.getElementById('nav-tiers').href = window.TIER_LIST_URL;
})();
