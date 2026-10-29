(function () {
  'use strict';

  var POLL = window.POLL;
  var SVG_NS = 'http://www.w3.org/2000/svg';

  // Track geometry, in SVG units. Both tracks share the same width so they line up.
  var LANE = 56;          // lane width
  var R0 = 64;            // radius of the inside rail on the turn
  var HEAD_R = 25;        // bubble head radius
  var BACK_SHARE = 0.55;  // stretch into the turn, as a share of the straightaway
  var M = 34;             // margin around the track
  var X_FINISH = 1500;    // finish line x
  var VB_W = 1580;        // viewBox width (leaves a run-out past the finish)
  var F_START = 0.035;    // where a 0% candidate would sit (fraction of the lane)
  var F_LEADER = 0.94;    // where the poll leader sits, just short of the finish

  var COLORS = {
    grass: '#3c8a3d',
    grassStripe: '#45964a',
    dirt: '#b98a5c',
    dirtEdge: '#a77a4f',
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

  // One lane (or the whole track when r is its middle radius): into the turn, around it, down the straightaway.
  function lanePath(cx, cy, xStart, r, xEnd) {
    return 'M ' + xStart + ' ' + (cy - r) +
      ' L ' + cx + ' ' + (cy - r) +
      ' A ' + r + ' ' + r + ' 0 0 0 ' + cx + ' ' + (cy + r) +
      ' L ' + xEnd + ' ' + (cy + r);
  }

  function buildTrack(partyKey, section) {
    var data = POLL[partyKey];
    var field = data.field;
    var n = field.length;
    var outer = R0 + n * LANE;
    var cx = M + outer;
    var cy = M + outer;
    var H = 2 * (outer + M);
    var xStart = cx + Math.round((X_FINISH - cx) * BACK_SHARE);
    var uid = 'trk-' + partyKey;

    section.querySelector('h2').textContent = data.title;
    section.querySelector('.universe').textContent = data.universe;

    var svg = el('svg', {
      viewBox: '0 0 ' + VB_W + ' ' + H,
      role: 'img',
      'aria-label': data.title + ' race, in poll order: ' + field.map(function (c) { return c.name; }).join(', '),
    });

    var defs = el('defs', {}, svg);
    var stripes = el('pattern', { id: uid + '-turf', width: 120, height: 120, patternUnits: 'userSpaceOnUse' }, defs);
    el('rect', { width: 120, height: 120, fill: COLORS.grass }, stripes);
    el('rect', { width: 60, height: 120, fill: COLORS.grassStripe }, stripes);
    var shadow = el('filter', { id: uid + '-shadow', x: '-50%', y: '-50%', width: '200%', height: '200%' }, defs);
    el('feDropShadow', { dx: 0, dy: 3, stdDeviation: 3, 'flood-color': '#000', 'flood-opacity': 0.45 }, shadow);

    // Turf, then the dirt track drawn as one wide stroke along the middle of the lanes.
    el('rect', { width: VB_W, height: H, fill: 'url(#' + uid + '-turf)' }, svg);
    var rMid = R0 + (n * LANE) / 2;
    el('path', {
      d: lanePath(cx, cy, xStart + 46, rMid, VB_W),
      fill: 'none', stroke: COLORS.dirt, 'stroke-width': n * LANE + 8,
    }, svg);

    // Lane lines and rails.
    for (var k = 0; k <= n; k++) {
      var edge = k === 0 || k === n;
      el('path', {
        d: lanePath(cx, cy, xStart + 46, R0 + k * LANE, VB_W),
        fill: 'none',
        stroke: COLORS.rail,
        'stroke-width': edge ? 5 : 2,
        'stroke-opacity': edge ? 1 : 0.6,
      }, svg);
    }

    // Start line across the lanes, and its label in the infield.
    el('line', { x1: xStart, y1: cy - R0, x2: xStart, y2: cy - outer, stroke: '#fff', 'stroke-width': 6 }, svg);
    label(svg, 'START', xStart, cy - R0 + 34);

    // Checkered finish line, green and white.
    var sq = LANE / 3;
    var cols = 3;
    var rows = Math.round((n * LANE) / sq);
    var fx = X_FINISH - (cols * sq) / 2;
    var check = el('g', { 'aria-hidden': 'true' }, svg);
    for (var row = 0; row < rows; row++) {
      for (var col = 0; col < cols; col++) {
        el('rect', {
          x: fx + col * sq, y: cy + R0 + row * sq, width: sq, height: sq,
          fill: (row + col) % 2 ? COLORS.check : '#ffffff',
        }, check);
      }
    }
    label(svg, 'FINISH', X_FINISH, cy + R0 - 22);

    // Lane centerlines, measured for placing heads. Lane 0 (inside) is the poll leader.
    var vmax = Math.max.apply(null, field.map(function (c) { return value(c.pct); }));
    var runners = field.map(function (c, i) {
      var path = el('path', { d: lanePath(cx, cy, xStart, R0 + (i + 0.5) * LANE, X_FINISH), fill: 'none', stroke: 'none' }, svg);
      return {
        c: c,
        path: path,
        len: path.getTotalLength(),
        target: F_START + (F_LEADER - F_START) * (value(c.pct) / vmax),
      };
    });

    // Bubble heads: a shadow, the clipped face, and a white ring. No names.
    runners.forEach(function (r, i) {
      var g = el('g', { class: 'head' }, svg);
      var clip = el('clipPath', { id: uid + '-clip-' + i }, defs);
      el('circle', { r: HEAD_R }, clip);
      el('ellipse', { cx: 0, cy: HEAD_R * 0.92, rx: HEAD_R * 0.8, ry: HEAD_R * 0.28, fill: '#000', 'fill-opacity': 0.28 }, g);
      var face = el('g', { filter: 'url(#' + uid + '-shadow)' }, g);
      el('circle', { r: HEAD_R, fill: '#d9d4cc' }, face);
      el('image', {
        href: 'heads/' + r.c.id + '.jpg',
        x: -HEAD_R, y: -HEAD_R, width: HEAD_R * 2, height: HEAD_R * 2,
        preserveAspectRatio: 'xMidYMid slice',
        'clip-path': 'url(#' + uid + '-clip-' + i + ')',
      }, face);
      el('circle', { r: HEAD_R, fill: 'none', stroke: '#fff', 'stroke-width': 3 }, face);
      r.g = g;
    });

    section.querySelector('.track-scroll').appendChild(svg);
    return runners;
  }

  function label(svg, text, x, y) {
    var t = el('text', {
      x: x, y: y, 'text-anchor': 'middle',
      fill: '#ffffff', 'fill-opacity': 0.85,
      'font-family': "'Alfa Slab One', Rockwell, Georgia, serif",
      'font-size': 30, 'letter-spacing': 3,
    }, svg);
    t.textContent = text;
  }

  function place(r, f) {
    var p = r.path.getPointAtLength(Math.max(0, f) * r.len);
    r.g.setAttribute('transform', 'translate(' + p.x.toFixed(1) + ' ' + p.y.toFixed(1) + ')');
  }

  var allRunners = [];
  document.querySelectorAll('.race').forEach(function (section) {
    allRunners = allRunners.concat(buildTrack(section.dataset.party, section));
  });

  // The race: everyone leaves the start line together and eases into their poll position.
  var raf = null;
  function run() {
    cancelAnimationFrame(raf);
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
      allRunners.forEach(function (r) { place(r, F_START * (1 - e) + r.target * e); });
      if (t < 1) raf = requestAnimationFrame(frame);
    }
    allRunners.forEach(function (r) { place(r, F_START); });
    raf = requestAnimationFrame(frame);
  }
  // Final positions first, so the page is complete even before the animation runs.
  allRunners.forEach(function (r) { place(r, r.target); });
  run();
  document.getElementById('replay').addEventListener('click', run);

  document.getElementById('source').textContent =
    'Lane order and positions: ' + POLL.source + '. Each track is scaled to its own leader.';
  if (window.TIER_LIST_URL) document.getElementById('nav-tiers').href = window.TIER_LIST_URL;
})();
