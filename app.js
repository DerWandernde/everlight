/* EVERLIGHT WebApp. Keine Abhängigkeiten, keine externen Anfragen. */
(function () {
  'use strict';

  var CFG = window.EVERLIGHT_CONFIG || {};
  var UI = CFG.ui || {};
  var KEY_PROGRESS = 'everlight_progress_v1';
  var KEY_STORY = 'everlight_story_cache_v1';
  var KEY_PREFS = 'everlight_prefs_v1';
  var RING = 2 * Math.PI * 44;

  var memory = {};
  var storageOk = true;
  var app = document.getElementById('app');
  var STORY = null;

  function t(key) { return UI[key] != null ? UI[key] : ''; }

  /* ---------- Speicher ---------- */

  function lsGet(k) {
    try { return window.localStorage.getItem(k); }
    catch (e) { storageOk = false; return Object.prototype.hasOwnProperty.call(memory, k) ? memory[k] : null; }
  }
  function lsSet(k, v) {
    try { window.localStorage.setItem(k, v); }
    catch (e) { storageOk = false; memory[k] = v; }
  }
  function lsDel(k) {
    try { window.localStorage.removeItem(k); } catch (e) { /* ignorieren */ }
    delete memory[k];
  }
  (function probe() {
    try { window.localStorage.setItem('_everlight_probe', '1'); window.localStorage.removeItem('_everlight_probe'); }
    catch (e) { storageOk = false; }
  })();

  function loadState() {
    var raw = lsGet(KEY_PROGRESS), s = null;
    if (raw) { try { s = JSON.parse(raw); } catch (e) { s = null; } }
    if (!s || typeof s !== 'object') s = {};
    s.v = 1;
    s.done = s.done || {};
    s.states = s.states || {};
    s.st = s.st || {};
    s.final = s.final || { attempts: 0, lockedUntil: 0 };
    s.ending = s.ending || null;
    s.bypass = !!s.bypass;
    s.started = s.started || null;
    return s;
  }
  var S = loadState();
  function save() { lsSet(KEY_PROGRESS, JSON.stringify(S)); }
  function stOf(id) {
    if (!S.st[id]) S.st[id] = { opened: false, solved: false, hints: 0, attempts: 0, codeSolved: false, decided: false, choice: null, zusatz: false };
    return S.st[id];
  }

  function loadPrefs() {
    var p = null;
    try { p = JSON.parse(lsGet(KEY_PREFS) || 'null'); } catch (e) { p = null; }
    return p && typeof p === 'object' ? p : {};
  }
  var PREFS = loadPrefs();
  function savePrefs() { lsSet(KEY_PREFS, JSON.stringify(PREFS)); }
  function applyPrefs() {
    var theme = PREFS.theme;
    if (!theme) {
      theme = (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) ? 'light' : 'dark';
    }
    document.documentElement.setAttribute('data-theme', theme);
    var size = PREFS.size || 18;
    document.documentElement.style.setProperty('--fs', size + 'px');
  }
  applyPrefs();

  /* ---------- Hilfsfunktionen ---------- */

  function h(tag, props, kids) {
    var e = document.createElement(tag);
    if (props) {
      Object.keys(props).forEach(function (k) {
        var v = props[k];
        if (v === null || v === undefined) return;
        if (k === 'class') e.className = v;
        else if (k === 'text') e.textContent = v;
        else if (k.slice(0, 2) === 'on') e.addEventListener(k.slice(2), v);
        else e.setAttribute(k, v);
      });
    }
    (kids || []).forEach(function (c) {
      if (c === null || c === undefined) return;
      e.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
    });
    return e;
  }

  function paras(list, cls) {
    var f = document.createDocumentFragment();
    (list || []).forEach(function (p) { f.appendChild(h('p', { class: cls || null, text: p })); });
    return f;
  }

  function norm(s) {
    var x = String(s == null ? '' : s);
    if (x.normalize) x = x.normalize('NFD').replace(/[̀-ͯ]/g, '');
    return x.toLowerCase().replace(/ß/g, 'ss').replace(/[\s\-_.,;:'"„“”‚‘’]/g, '');
  }

  function symbolSvg(cls) {
    var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('class', cls || 'sym');
    svg.setAttribute('viewBox', '0 0 100 100');
    svg.setAttribute('aria-hidden', 'true');
    var use = document.createElementNS('http://www.w3.org/2000/svg', 'use');
    use.setAttribute('href', '#rune');
    svg.appendChild(use);
    return svg;
  }

  function shake(node) {
    node.classList.remove('shake');
    void node.offsetWidth;
    node.classList.add('shake');
  }

  /* ---------- Geschichte laden und lesen ---------- */

  var SECTIONS = {};
  ['text', 'aufgabe', 'antwort', 'hinweis', 'geloest', 'code-text', 'code-geloest', 'entscheidung', 'zusatz',
    'ja', 'nein', 'danach', 'weiter', 'belohnung', 'symbol', 'ende-1', 'ende-2', 'ende-3', 'ende-4', 'ende-5']
    .forEach(function (n) { SECTIONS[n] = true; });

  function loadStory() {
    return fetch('story.txt', { cache: 'no-store' })
      .then(function (r) {
        if (!r.ok) throw new Error('http ' + r.status);
        return r.text();
      })
      .then(function (txt) { lsSet(KEY_STORY, txt); return txt; })
      .catch(function (err) {
        var c = lsGet(KEY_STORY);
        if (c) return c;
        throw err;
      });
  }

  function parseStory(raw) {
    raw = String(raw).replace(/^﻿/, '').replace(/\r\n?/g, '\n');
    var blocks = {}, order = [], cur = null, sec = null;
    raw.split('\n').forEach(function (line) {
      var tl = line.trim();
      if (tl.indexOf('//') === 0) return;
      var hm = /^##\s+(START|STA-?\d{1,2})\b\s*(?:\|\s*(.*))?$/i.exec(tl);
      if (hm) {
        var id = hm[1].toUpperCase();
        if (id !== 'START') id = 'STA-' + ('0' + parseInt(id.replace(/\D/g, ''), 10)).slice(-2);
        cur = { id: id, header: {}, sections: {} };
        if (hm[2]) cur.header.titel = hm[2].trim();
        blocks[id] = cur;
        if (id !== 'START' && order.indexOf(id) < 0) order.push(id);
        sec = null;
        return;
      }
      if (!cur) return;
      var sm = /^\[([A-Za-zäöüÄÖÜß0-9-]+)\]$/.exec(tl);
      if (sm && SECTIONS[sm[1].toLowerCase()]) {
        sec = sm[1].toLowerCase();
        cur.sections[sec] = cur.sections[sec] || [];
        return;
      }
      if (sec === null) {
        var kv = /^([A-Za-zäöüÄÖÜß-]+)\s*:\s*(.*)$/.exec(tl);
        if (kv) cur.header[kv[1].toLowerCase()] = kv[2].trim();
        return;
      }
      cur.sections[sec].push(tl);
    });

    order.sort(function (a, b) { return parseInt(a.slice(4), 10) - parseInt(b.slice(4), 10); });
    var stations = {};
    order.forEach(function (id) { stations[id] = buildStation(blocks[id]); });
    return { start: blocks.START ? buildStart(blocks.START) : null, stations: stations, order: order };
  }

  function lines(sec, name) {
    return (sec[name] || []).filter(function (l) { return l !== ''; });
  }

  function kvLines(list, keys) {
    var out = {}, lastKey = null;
    list.forEach(function (l) {
      var m = /^([A-Za-zäöüÄÖÜß-]+)\s*:\s*(.*)$/.exec(l);
      if (m && keys.indexOf(m[1].toLowerCase()) >= 0) {
        lastKey = m[1].toLowerCase();
        out[lastKey] = [m[2].trim()];
      } else if (lastKey === 'info') {
        out.info.push(l);
      }
    });
    return out;
  }

  function splitHints(raw) {
    var groups = [], cur = [];
    (raw || []).forEach(function (l) {
      if (/^-{3,}$/.test(l)) { if (cur.length) groups.push(cur); cur = []; }
      else if (l !== '') cur.push(l);
    });
    if (cur.length) groups.push(cur);
    return groups;
  }

  function buildStart(b) {
    return { text: lines(b.sections, 'text'), symbol: lines(b.sections, 'symbol'), titel: b.header.titel || '' };
  }

  function buildStation(b) {
    var sec = b.sections, hd = b.header;
    var st = {
      id: b.id,
      num: parseInt(b.id.slice(4), 10),
      title: hd.titel || '',
      typ: (hd.typ || 'ruhe').toLowerCase(),
      kapitel: hd.kapitel || '',
      bild: hd.bild || '',
      audio: hd.audio || '',
      code: (hd.code || '').toLowerCase() === 'schuppen',
      weiterZu: (function (v) {
        var m = /^STA-?(\d{1,2})$/i.exec(v || '');
        return m ? 'STA-' + ('0' + parseInt(m[1], 10)).slice(-2) : '';
      })(hd['weiter-zu']),
      text: lines(sec, 'text'),
      aufgabe: lines(sec, 'aufgabe'),
      antworten: lines(sec, 'antwort'),
      hinweise: splitHints(sec.hinweis),
      geloest: lines(sec, 'geloest'),
      codeText: lines(sec, 'code-text'),
      codeGeloest: lines(sec, 'code-geloest'),
      ja: lines(sec, 'ja'),
      nein: lines(sec, 'nein'),
      danach: lines(sec, 'danach'),
      weiter: lines(sec, 'weiter'),
      belohnung: lines(sec, 'belohnung'),
      ende: {},
      entscheidung: null,
      zusatz: null
    };
    for (var i = 1; i <= 5; i++) st.ende[i] = lines(sec, 'ende-' + i);

    var d = kvLines(lines(sec, 'entscheidung'), ['zustand', 'frage', 'ja', 'nein']);
    if (d.zustand && d.frage) {
      st.entscheidung = {
        zustand: d.zustand[0].toUpperCase(),
        frage: d.frage[0],
        ja: (d.ja && d.ja[0]) || 'Ja',
        nein: (d.nein && d.nein[0]) || 'Nein'
      };
    }
    var z = kvLines(lines(sec, 'zusatz'), ['frage', 'info']);
    if (z.info && z.info.join('')) {
      st.zusatz = { frage: (z.frage && z.frage[0]) || t('extraButton'), info: z.info.filter(Boolean) };
    }
    return st;
  }

  /* ---------- Zustände und Enden ---------- */

  function stateKey() {
    var k = '';
    for (var i = 1; i <= 5; i++) {
      var v = S.states['ZUS-0' + i];
      if (v === undefined || v === null) return null;
      k += v ? '1' : '0';
    }
    return k;
  }
  function computeEnding() {
    var k = stateKey();
    return k ? (CFG.endings && CFG.endings[k]) || null : null;
  }
  function refreshEnding() { S.ending = computeEnding(); }

  /* ---------- Reihenfolge ---------- */

  function isUnlocked(id) {
    if (!CFG.enforceOrder || S.bypass) return true;
    var i = STORY.order.indexOf(id);
    if (i <= 0 || S.done[id]) return true;
    return !!S.done[STORY.order[i - 1]];
  }
  function currentId() {
    for (var i = 0; i < STORY.order.length; i++) { if (!S.done[STORY.order[i]]) return STORY.order[i]; }
    return STORY.order[STORY.order.length - 1];
  }

  /* ---------- Seitenrahmen ---------- */

  var brandTaps = [];

  function frame(chapterLabel, children) {
    app.innerHTML = '';
    var wrap = h('div', { class: 'wrap' });
    var brand = h('button', { class: 'brand', type: 'button', id: 'brand', text: 'Everlight', 'aria-label': 'Everlight', onclick: onBrandTap });
    wrap.appendChild(h('header', { class: 'top' }, [brand, chapterLabel ? h('span', { class: 'chapter', text: chapterLabel }) : null]));
    if (!storageOk) wrap.appendChild(h('div', { class: 'banner', role: 'alert', text: t('storageWarning') }));
    children.forEach(function (c) { if (c) wrap.appendChild(c); });
    wrap.appendChild(footer());
    app.appendChild(wrap);
  }

  function footer() {
    function setTheme(v) { PREFS.theme = v; savePrefs(); applyPrefs(); }
    function setSize(d) { PREFS.size = Math.max(15, Math.min(26, (PREFS.size || 18) + d)); savePrefs(); applyPrefs(); }
    return h('div', { class: 'foot' }, [
      h('button', { class: 'btn', type: 'button', text: t('themeDark'), onclick: function () { setTheme('dark'); } }),
      h('button', { class: 'btn', type: 'button', text: t('themeLight'), onclick: function () { setTheme('light'); } }),
      h('button', { class: 'btn', type: 'button', text: t('sizeSmaller'), 'aria-label': 'Schrift kleiner', onclick: function () { setSize(-1); } }),
      h('button', { class: 'btn', type: 'button', text: t('sizeLarger'), 'aria-label': 'Schrift größer', onclick: function () { setSize(1); } })
    ]);
  }

  function onBrandTap() {
    var now = Date.now();
    brandTaps = brandTaps.filter(function (x) { return now - x < 5000; });
    brandTaps.push(now);
    if (brandTaps.length >= 7) { brandTaps = []; adminGate(); }
  }

  function scrollTo(id) {
    var node = id ? document.getElementById(id) : null;
    if (node && node.scrollIntoView) node.scrollIntoView({ behavior: 'smooth', block: 'start' });
    else window.scrollTo(0, 0);
  }

  /* ---------- Startseite ---------- */

  function renderStart() {
    var st = STORY.start || { text: [], symbol: [], titel: '' };
    var kids = [];
    kids.push(h('h1', { text: st.titel || 'Everlight' }));
    kids.push(h('div', { class: 'story' }, [paras(st.text)]));
    if (st.symbol.length) {
      kids.push(h('div', { class: 'card' }, [
        h('div', { class: 'decision-head' }, [symbolSvg('sym'), h('div', {}, [paras(st.symbol)])])
      ]));
    }
    var hasProgress = STORY.order.some(function (id) { return S.done[id]; });
    var go = hasProgress ? currentId() : STORY.order[0];
    kids.push(h('button', {
      class: 'btn primary wide', type: 'button',
      text: hasProgress ? t('continueButton') : t('startButton'),
      onclick: function () {
        if (!S.started) { S.started = Date.now(); save(); }
        location.hash = '#' + go;
      }
    }));
    frame('', kids);
    window.scrollTo(0, 0);
  }

  function renderMessage(title, text, buttonLabel, onClick) {
    var kids = [h('h1', { text: title })];
    if (text) kids.push(h('p', { text: text }));
    if (buttonLabel) kids.push(h('button', { class: 'btn primary', type: 'button', text: buttonLabel, onclick: onClick }));
    frame('', kids);
    window.scrollTo(0, 0);
  }

  /* ---------- Station ---------- */

  function renderStation(id, focusId) {
    var st = STORY.stations[id];
    if (!isUnlocked(id)) {
      renderMessage(t('blockedTitle'), t('blockedText'), t('blockedButton'), function () { location.hash = '#' + currentId(); });
      return;
    }
    var ss = stOf(id);
    var kids = [];
    if (st.title) kids.push(h('h1', { text: st.title }));

    if (st.bild) {
      kids.push(h('div', { class: 'media' }, [h('img', { src: st.bild, alt: '', loading: 'lazy' })]));
    }
    if (st.audio) {
      kids.push(h('div', { class: 'media' }, [h('audio', { controls: 'controls', preload: 'none', src: st.audio, 'aria-label': t('listen') })]));
    }

    var mainText = st.text;
    if (st.id === STORY.order[STORY.order.length - 1] || st.ende[1].length || st.ende[2].length) {
      var endNum = null;
      var e = S.ending || computeEnding();
      if (e) endNum = parseInt(String(e).replace(/\D/g, ''), 10);
      if (endNum && st.ende[endNum] && st.ende[endNum].length) mainText = st.text.concat(st.ende[endNum]);
    }
    kids.push(h('div', { class: 'story' }, [paras(mainText)]));

    var needTask = st.antworten.length > 0 || st.aufgabe.length > 0;
    var taskDone = !needTask || ss.solved;
    var codeDone = !st.code || ss.codeSolved;
    var decisionDone = !st.entscheidung || ss.decided;

    // Stationen mit Aufgabe, Code oder Entscheidung zeigen erst den Text.
    // Ein Weiter-Knopf öffnet danach den interaktiven Teil.
    var needInteraction = needTask || st.code || !!st.entscheidung;
    var opened = ss.opened || ss.solved || ss.codeSolved || ss.decided;
    var firstId = needTask ? 'blk-task' : (st.code ? 'blk-code' : 'blk-decision');
    if (needInteraction && !opened) {
      kids.push(h('button', {
        class: 'btn primary wide', type: 'button', id: 'gate-btn', text: t('nextLabel'),
        onclick: function () { ss.opened = true; save(); renderStation(id, firstId); }
      }));
      frame(st.kapitel ? t('chapter') + ' ' + st.kapitel : '', kids);
      scrollTo(focusId);
      return;
    }

    if (needTask) kids.push(taskCard(st, ss));
    if (taskDone && st.code) kids.push(codeCard(st, ss));
    if (taskDone && codeDone && st.entscheidung) kids.push(decisionCard(st, ss));

    var complete = taskDone && codeDone && decisionDone;
    if (complete) {
      if (!S.done[id]) { S.done[id] = true; save(); }
      var tail = [];
      if (st.typ === 'kleine' && st.antworten.length) {
        tail.push(h('div', { class: 'card story', id: 'blk-reward' }, [paras(st.belohnung.length ? st.belohnung : [t('rewardDefault')])]));
      }
      if (st.entscheidung && ss.decided) {
        var outcome = ss.choice === 'ja' ? st.ja : st.nein;
        if (outcome.length) tail.push(h('div', { class: 'story', id: 'blk-outcome' }, [paras(outcome)]));
      }
      if (st.danach.length) tail.push(h('div', { class: 'story' }, [paras(st.danach)]));
      // Mit weiter-zu dient der Abschnitt [weiter] als Beschriftung des Knopfes, sonst als Textkarte.
      if (st.weiter.length && !st.weiterZu) tail.push(h('div', { class: 'card story' }, [paras(st.weiter)]));
      tail.forEach(function (n) { kids.push(n); });
      if (st.weiterZu && STORY.stations[st.weiterZu]) {
        kids.push(h('button', {
          class: 'btn primary wide', type: 'button', id: 'next-btn', text: st.weiter.join(' ') || t('nextLabel'),
          onclick: function () { location.hash = '#' + st.weiterZu; }
        }));
      }
    }

    frame(st.kapitel ? t('chapter') + ' ' + st.kapitel : '', kids);
    scrollTo(focusId);
  }

  function taskCard(st, ss) {
    var card = h('section', { class: 'card', id: 'blk-task' });
    card.appendChild(h('h2', { text: t('taskTitle') }));
    card.appendChild(paras(st.aufgabe));

    if (ss.solved) {
      card.appendChild(h('p', { class: 'ok', text: t('solved') }));
      if (st.geloest.length) card.appendChild(h('div', { class: 'story' }, [paras(st.geloest)]));
      return card;
    }

    if (!st.antworten.length) {
      card.appendChild(h('button', {
        class: 'btn primary wide', type: 'button', text: t('taskDone'),
        onclick: function () { ss.solved = true; save(); renderStation(st.id, 'blk-task'); }
      }));
      return card;
    }

    var input = h('input', {
      type: 'text', class: 'answer', autocomplete: 'off', autocapitalize: 'off', autocorrect: 'off',
      spellcheck: 'false', placeholder: t('answerPlaceholder'), 'aria-label': t('answerPlaceholder')
    });
    var msg = h('p', { class: 'msg', role: 'status' });
    var form = h('form', { class: 'task-form', novalidate: 'novalidate' }, [
      input, msg, h('button', { class: 'btn primary wide', type: 'submit', text: t('check') })
    ]);
    form.addEventListener('submit', function (ev) {
      ev.preventDefault();
      var v = norm(input.value);
      if (!v) return;
      ss.attempts += 1;
      var ok = st.antworten.some(function (a) { return norm(a) === v; });
      if (ok) { ss.solved = true; save(); renderStation(st.id, 'blk-task'); }
      else { save(); msg.textContent = t('wrong'); shake(card); input.focus(); }
    });
    card.appendChild(form);

    if (st.hinweise.length) card.appendChild(hintArea(st, ss));
    return card;
  }

  function hintArea(st, ss) {
    var box = h('div', { class: 'hints' });
    function draw() {
      box.innerHTML = '';
      for (var i = 0; i < ss.hints && i < st.hinweise.length; i++) {
        box.appendChild(h('div', { class: 'hint' }, [h('b', { text: t('hintLabel') + ' ' + (i + 1) }), paras(st.hinweise[i])]));
      }
      if (ss.hints < st.hinweise.length) {
        box.appendChild(h('button', {
          class: 'btn', type: 'button',
          text: t('hint') + ' (' + (ss.hints + 1) + '/' + st.hinweise.length + ')',
          onclick: function () { ss.hints += 1; save(); draw(); }
        }));
      }
    }
    draw();
    return box;
  }

  /* ---------- Schuppen-Code ---------- */

  function codeCard(st, ss) {
    var card = h('section', { class: 'card', id: 'blk-code' });
    card.appendChild(h('h2', { text: t('codeTitle') }));
    card.appendChild(paras(st.codeText));

    if (ss.codeSolved) {
      card.appendChild(h('p', { class: 'ok', text: t('solved') }));
      if (st.codeGeloest.length) card.appendChild(h('div', { class: 'story' }, [paras(st.codeGeloest)]));
      return card;
    }

    var len = String(CFG.finalCode || '').length || 5;
    var input = h('input', {
      type: 'text', class: 'answer code', inputmode: 'numeric', pattern: '[0-9]*', maxlength: String(len),
      autocomplete: 'off', placeholder: t('codePlaceholder'), 'aria-label': t('codePlaceholder')
    });
    var msg = h('p', { class: 'msg', role: 'status' });
    var btn = h('button', { class: 'btn primary wide', type: 'submit', text: t('check') });
    var form = h('form', { novalidate: 'novalidate' }, [input, msg, btn]);

    var timer = null;
    function lockedNow() { return Date.now() < (S.final.lockedUntil || 0); }
    function refreshLock() {
      if (lockedNow()) {
        btn.disabled = true;
        msg.textContent = t('codeLocked');
        clearTimeout(timer);
        timer = setTimeout(function () { btn.disabled = false; msg.textContent = ''; }, S.final.lockedUntil - Date.now() + 50);
      }
    }
    refreshLock();

    form.addEventListener('submit', function (ev) {
      ev.preventDefault();
      if (lockedNow()) { refreshLock(); return; }
      var digits = input.value.replace(/\D/g, '');
      if (!digits) return;
      if (digits === String(CFG.finalCode)) {
        ss.codeSolved = true; save(); renderStation(st.id, 'blk-code');
        return;
      }
      S.final.attempts += 1;
      var n = S.final.attempts, text = t('codeWrong');
      (CFG.codeTiers || []).slice().sort(function (a, b) { return a.after - b.after; }).forEach(function (tier) {
        if (n >= tier.after) text = tier.text;
      });
      if (CFG.codeLockAfter && n >= CFG.codeLockAfter) {
        S.final.lockedUntil = Date.now() + (CFG.codeLockSeconds || 60) * 1000;
        text = t('codeLocked');
      }
      save();
      msg.textContent = text;
      input.value = '';
      shake(card);
      refreshLock();
      if (!lockedNow()) input.focus();
    });
    card.appendChild(form);
    return card;
  }

  /* ---------- Entscheidung ---------- */

  function decisionCard(st, ss) {
    var d = st.entscheidung;
    var card = h('section', { class: 'card', id: 'blk-decision' });
    card.appendChild(h('div', { class: 'decision-head' }, [symbolSvg('sym'), h('h2', { text: t('decisionTitle') })]));
    card.appendChild(h('p', { text: d.frage }));
    if (ss.decided) {
      card.appendChild(h('p', { class: 'choice-line', text: t('yourChoice') + ': ' + (ss.choice === 'ja' ? d.ja : d.nein) }));
      return card;
    }
    card.appendChild(h('p', { class: 'note', text: t('decisionNote') }));
    card.appendChild(h('div', { class: 'row' }, [
      h('button', { class: 'btn', type: 'button', text: d.ja, onclick: function () { openConfirm(st, 'ja'); } }),
      h('button', { class: 'btn', type: 'button', text: d.nein, onclick: function () { openConfirm(st, 'nein'); } })
    ]));
    return card;
  }

  var openModal = null;
  function closeModal() {
    if (openModal) { openModal.remove(); openModal = null; }
    document.body.style.overflow = '';
  }
  function modal(contentNodes, cls) {
    closeModal();
    var box = h('div', { class: 'dialog ' + (cls || ''), role: 'dialog', 'aria-modal': 'true' }, contentNodes);
    var ov = h('div', { class: 'overlay' }, [box]);
    document.body.appendChild(ov);
    document.body.style.overflow = 'hidden';
    openModal = ov;
    return box;
  }

  function openConfirm(st, choice) {
    var d = st.entscheidung;
    var label = choice === 'ja' ? d.ja : d.nein;

    var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 100 100');
    svg.setAttribute('aria-hidden', 'true');
    function circle(cls) {
      var c = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      c.setAttribute('cx', '50'); c.setAttribute('cy', '50'); c.setAttribute('r', '44');
      c.setAttribute('fill', 'none'); c.setAttribute('stroke-width', '4');
      c.setAttribute('class', cls);
      return c;
    }
    var bg = circle('ring-bg');
    var ring = circle('ring');
    ring.setAttribute('stroke-dasharray', String(RING));
    ring.setAttribute('stroke-dashoffset', String(RING));
    ring.setAttribute('transform', 'rotate(-90 50 50)');
    var g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    g.setAttribute('class', 'core');
    var use = document.createElementNS('http://www.w3.org/2000/svg', 'use');
    use.setAttribute('href', '#rune');
    use.setAttribute('x', '20'); use.setAttribute('y', '20'); use.setAttribute('width', '60'); use.setAttribute('height', '60');
    g.appendChild(use);
    svg.appendChild(bg); svg.appendChild(ring); svg.appendChild(g);

    var holdBtn = h('button', { class: 'hold', type: 'button', id: 'hold', 'aria-label': t('confirmHold') }, []);
    holdBtn.appendChild(svg);

    var extraBox = h('div', {});
    var kids = [
      h('h2', { text: t('confirmTitle') }),
      h('p', { class: 'q', text: d.frage }),
      h('p', { class: 'pick', text: label }),
      holdBtn,
      h('p', { class: 'center note', text: t('confirmHold') }),
      extraBox
    ];
    if (st.zusatz) {
      kids.push(h('div', { class: 'center' }, [
        h('button', {
          class: 'btn', type: 'button', text: st.zusatz.frage,
          onclick: function (ev) {
            ev.currentTarget.remove();
            extraBox.appendChild(h('div', { class: 'card story' }, [paras(st.zusatz.info)]));
            stOf(st.id).zusatz = true; save();
          }
        })
      ]));
    }
    kids.push(h('div', { class: 'center', style: 'margin-top:12px' }, [
      h('button', { class: 'btn', type: 'button', text: t('confirmBack'), onclick: closeModal })
    ]));
    modal(kids, 'confirm');

    var raf = null, start = 0, holding = false, finished = false;
    function tick() {
      var p = Math.min(1, (performance.now() - start) / (CFG.holdMs || 2000));
      ring.setAttribute('stroke-dashoffset', String(RING * (1 - p)));
      if (p >= 1) { finish(); return; }
      raf = requestAnimationFrame(tick);
    }
    function begin(ev) {
      if (ev && ev.preventDefault) ev.preventDefault();
      if (holding || finished) return;
      holding = true; start = performance.now();
      holdBtn.classList.add('holding');
      raf = requestAnimationFrame(tick);
    }
    function cancel() {
      if (!holding || finished) return;
      holding = false;
      cancelAnimationFrame(raf);
      ring.setAttribute('stroke-dashoffset', String(RING));
      holdBtn.classList.remove('holding');
    }
    function finish() {
      finished = true;
      cancelAnimationFrame(raf);
      applyDecision(st, choice);
    }
    holdBtn.addEventListener('pointerdown', function (ev) {
      try { holdBtn.setPointerCapture(ev.pointerId); } catch (e) { /* ignorieren */ }
      begin(ev);
    });
    ['pointerup', 'pointercancel', 'pointerleave', 'lostpointercapture'].forEach(function (n) { holdBtn.addEventListener(n, cancel); });
    holdBtn.addEventListener('contextmenu', function (ev) { ev.preventDefault(); });
    holdBtn.addEventListener('keydown', function (ev) { if (ev.key === ' ' || ev.key === 'Enter') begin(ev); });
    holdBtn.addEventListener('keyup', function (ev) { if (ev.key === ' ' || ev.key === 'Enter') cancel(); });
  }

  function applyDecision(st, choice) {
    var ss = stOf(st.id);
    ss.decided = true;
    ss.choice = choice;
    S.states[st.entscheidung.zustand] = (choice === 'ja');
    refreshEnding();
    save();
    closeModal();
    renderStation(st.id, 'blk-decision');
  }

  /* ---------- Admin ---------- */

  function adminGate() {
    if (!CFG.adminCode) return;
    var input = h('input', { type: 'password', class: 'field', inputmode: 'numeric', autocomplete: 'off', 'aria-label': 'Code' });
    var msg = h('p', { class: 'msg' });
    var form = h('form', { novalidate: 'novalidate' }, [
      h('h2', { text: 'Admin' }), input, msg,
      h('div', { class: 'row' }, [
        h('button', { class: 'btn primary', type: 'submit', text: 'OK' }),
        h('button', { class: 'btn', type: 'button', text: t('confirmBack'), onclick: closeModal })
      ])
    ]);
    form.addEventListener('submit', function (ev) {
      ev.preventDefault();
      if (input.value === String(CFG.adminCode)) openAdmin();
      else { msg.textContent = t('wrong'); input.value = ''; }
    });
    modal([form]);
    input.focus();
  }

  function currentHashId() {
    var m = /^#?(STA)-?(\d{1,2})$/i.exec(decodeURIComponent(location.hash || ''));
    return m ? 'STA-' + ('0' + parseInt(m[2], 10)).slice(-2) : null;
  }

  function openAdmin() {
    var kids = [h('h2', { text: 'Admin' })];

    // Springen
    var sel = h('select', { class: 'field', 'aria-label': 'Station' });
    STORY.order.forEach(function (id) {
      var st = STORY.stations[id];
      sel.appendChild(h('option', { value: id, text: id + (st.title ? ' ' + st.title : '') + (S.done[id] ? ' (erledigt)' : '') }));
    });
    var here = currentHashId();
    if (here) sel.value = here;
    kids.push(h('div', { class: 'admin-sec' }, [
      h('h3', { text: 'Station' }), sel,
      h('div', { class: 'row' }, [
        h('button', { class: 'btn primary', type: 'button', text: 'Öffnen', onclick: function () { closeModal(); location.hash = '#' + sel.value; if (currentHashId() === sel.value) route(); } }),
        h('button', { class: 'btn', type: 'button', text: 'Bis hierher erledigt', onclick: function () {
          var idx = STORY.order.indexOf(sel.value);
          STORY.order.forEach(function (id, i) { if (i < idx) S.done[id] = true; });
          save(); closeModal(); location.hash = '#' + sel.value; route();
        } }),
        h('button', { class: 'btn', type: 'button', text: 'Station zurücksetzen', onclick: function () {
          delete S.st[sel.value]; delete S.done[sel.value]; save(); closeModal(); route();
        } })
      ])
    ]));

    // Zustände
    var grid = h('div', { class: 'states' });
    function drawStates() {
      grid.innerHTML = '';
      for (var i = 1; i <= 5; i++) {
        (function (zid) {
          var cur = S.states[zid];
          function setTo(v) {
            if (v === null) delete S.states[zid]; else S.states[zid] = v;
            refreshEnding(); save(); drawStates(); drawEnding();
          }
          grid.appendChild(h('span', { text: zid }));
          grid.appendChild(h('span', { class: 'seg' }, [
            h('button', { class: 'btn' + (cur === true ? ' on' : ''), type: 'button', text: 'Ja', onclick: function () { setTo(true); } }),
            h('button', { class: 'btn' + (cur === false ? ' on' : ''), type: 'button', text: 'Nein', onclick: function () { setTo(false); } }),
            h('button', { class: 'btn' + (cur === undefined ? ' on' : ''), type: 'button', text: 'offen', onclick: function () { setTo(null); } })
          ]));
        })('ZUS-0' + i);
      }
    }
    var endingLine = h('p', { class: 'note' });
    function drawEnding() { endingLine.textContent = 'Ende: ' + (computeEnding() || 'noch nicht bestimmt'); }
    drawStates(); drawEnding();
    kids.push(h('div', { class: 'admin-sec' }, [h('h3', { text: 'Zustände' }), grid, endingLine]));

    // Optionen
    var cb = h('input', { type: 'checkbox', id: 'bypass' });
    cb.checked = !!S.bypass;
    cb.addEventListener('change', function () { S.bypass = cb.checked; save(); });
    kids.push(h('div', { class: 'admin-sec' }, [
      h('h3', { text: 'Optionen' }),
      h('label', { for: 'bypass' }, [cb, ' Reihenfolge-Sperre aufheben']),
      h('p', { class: 'note', text: 'Falsche Codeeingaben: ' + S.final.attempts }),
      h('button', { class: 'btn', type: 'button', text: 'Codesperre und Zähler zurücksetzen', onclick: function () { S.final = { attempts: 0, lockedUntil: 0 }; save(); closeModal(); route(); } })
    ]));

    // NFC-Links
    var base = location.href.split('#')[0];
    var linkBox = h('div', { class: 'links' });
    STORY.order.forEach(function (id) {
      var url = base + '#' + id;
      linkBox.appendChild(h('div', {}, [
        h('span', { text: id + '  ' + url }),
        h('button', { class: 'btn', type: 'button', text: 'Kopieren', onclick: function (ev) {
          var b = ev.currentTarget;
          if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(url).then(function () { b.textContent = 'Kopiert'; }, function () { b.textContent = 'Fehler'; });
          } else { b.textContent = 'Nicht möglich'; }
        } })
      ]));
    });
    kids.push(h('div', { class: 'admin-sec' }, [h('h3', { text: 'NFC-Links' }), linkBox]));

    // Export / Import
    var ta = h('textarea', { class: 'field', 'aria-label': 'Fortschritt' });
    ta.value = JSON.stringify(S);
    kids.push(h('div', { class: 'admin-sec' }, [
      h('h3', { text: 'Fortschritt sichern oder wiederherstellen' }), ta,
      h('div', { class: 'row' }, [
        h('button', { class: 'btn', type: 'button', text: 'Aus Feld laden', onclick: function () {
          try { var o = JSON.parse(ta.value); lsSet(KEY_PROGRESS, JSON.stringify(o)); S = loadState(); closeModal(); route(); }
          catch (e) { ta.value = 'Ungültig: ' + e.message; }
        } }),
        h('button', { class: 'btn', type: 'button', text: 'Alles löschen', onclick: function () {
          if (window.confirm('Gesamten Fortschritt auf diesem Telefon löschen?')) {
            lsDel(KEY_PROGRESS); S = loadState(); closeModal(); location.hash = ''; route();
          }
        } })
      ])
    ]));

    kids.push(h('div', { class: 'admin-sec center' }, [h('button', { class: 'btn primary', type: 'button', text: 'Schließen', onclick: closeModal })]));
    modal(kids, 'admin');
  }

  /* ---------- Routing ---------- */

  function route() {
    if (!STORY) return;
    closeModal();
    var raw = decodeURIComponent((location.hash || '').replace(/^#/, '')).trim().toUpperCase();
    if (!raw || raw === 'START') { renderStart(); return; }
    var m = /^STA-?(\d{1,2})$/.exec(raw);
    var id = m ? 'STA-' + ('0' + parseInt(m[1], 10)).slice(-2) : null;
    if (!id || !STORY.stations[id]) { renderMessage(t('notFound'), '', t('startButton'), function () { location.hash = ''; }); return; }
    renderStation(id);
  }

  function boot() {
    loadStory().then(function (txt) {
      STORY = parseStory(txt);
      if (!STORY.order.length) throw new Error('Keine Stationen in story.txt');
      refreshEnding();
      window.addEventListener('hashchange', route);
      route();
    }).catch(function () {
      app.innerHTML = '';
      app.appendChild(h('div', { class: 'wrap' }, [
        h('p', { text: t('loadError') }),
        h('button', { class: 'btn primary', type: 'button', text: t('retry'), onclick: function () { location.reload(); } })
      ]));
    });
  }

  if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost' || location.hostname === '127.0.0.1')) {
    window.addEventListener('load', function () {
      navigator.serviceWorker.register('sw.js').catch(function () { /* ignorieren */ });
    });
  }

  boot();
})();
