/* CK - DIGITAL ART – Effektfarbe, Bereichs-Steuerung, Seitenwechsel und Burger-Menü.
   Ohne JavaScript: dunkles Design in Lila und Menü immer sichtbar. */
(function () {
  var root = document.documentElement;

  /* ---------- Effektfarbe über den Seitenwechsel mitnehmen ----------
     In Vorschau-Fenstern und bei lokal geöffneten Dateien teilen Browser den Speicher
     oft nicht zwischen den Seiten. Dort hängen wir die Farbe an den Link an
     (z. B. galerie.html#mint oder index.html#apps--mint) und lesen sie hier wieder aus. */
  var ACCENTS = /^(lila|tuerkis|orange|rot|mint|weiss)$/;
  function saveAccent(key) {
    try { localStorage.setItem('ck-accent', key); } catch (e) {}
    try {
      var rest = (window.name || '').replace(/(?:^|;)ck-accent=[a-z]+/, '');
      window.name = (rest ? rest + ';' : '') + 'ck-accent=' + key;
    } catch (e) {}
  }
  var jumpId = '';
  var hashHasTarget = !!location.hash;
  (function () {
    var m = /^#(?:(.*)--)?(lila|tuerkis|orange|rot|mint|weiss)$/.exec(location.hash || '');
    if (!m) return;
    saveAccent(m[2]);
    jumpId = m[1] || '';
    hashHasTarget = !!jumpId;
    try { history.replaceState(null, '', location.pathname + location.search + (jumpId ? '#' + jumpId : '')); } catch (e) {}
    if (jumpId) {
      var el = document.getElementById(jumpId);
      if (el) requestAnimationFrame(function () { el.scrollIntoView({ block: 'start' }); });
    }
  })();

  function mustCarryTheme() {
    if (location.protocol === 'file:') return true;
    try { if (window.self !== window.top) return true; } catch (e) { return true; }
    try { localStorage.setItem('ck-test', '1'); localStorage.removeItem('ck-test'); } catch (e) { return true; }
    return false;
  }
  document.addEventListener('click', function (e) {
    var a = e.target.closest ? e.target.closest('a[href]') : null;
    if (!a || !mustCarryTheme()) return;
    var href = a.getAttribute('href');
    if (/^[a-z]+:/i.test(href) || href.charAt(0) === '#' || href.charAt(0) === '/') return; // extern, mailto, gleiche Seite
    var parts = href.split('#');
    var page = parts[0];
    if (!/\.html$/i.test(page)) return;
    var here = location.pathname.split('/').pop() || 'index.html';
    if (page === here) return;
    var tag = root.getAttribute('data-accent') || 'lila';
    a.setAttribute('href', page + '#' + (parts[1] ? parts[1] + '--' : '') + tag);
    // Link nach dem Klick wieder zurücksetzen (für Zurück-Taste / erneutes Klicken)
    setTimeout(function () { a.setAttribute('href', href); }, 0);
  }, true);

  /* ---------- Fußzeilenhöhe messen (für Kontakt + Fußzeile = ein Bildschirm) ---------- */
  (function () {
    var foot = document.querySelector('.site-footer');
    if (!foot) return;
    function measure() { root.style.setProperty('--footer-h', foot.offsetHeight + 'px'); }
    measure();
    window.addEventListener('resize', measure);
    window.addEventListener('load', measure);
  })();

  function cameFromStart() {
    try {
      if (!document.referrer || history.length < 2) return false;
      var ref = document.referrer.split('#')[0].split('?')[0];
      var dir = location.href.split('#')[0].split('?')[0].replace(/[^\/]*$/, '');
      if (ref.indexOf(dir) !== 0) return false;                 // andere Seite / anderer Ordner
      var page = ref.slice(dir.length);
      return page === '' || page === 'index.html';
    } catch (e) { return false; }
  }

  /* ---------- Seitenwechsel mit Animation ----------
     Zur Unterseite: aktuelle Seite zieht nach links weg, neue fliegt von rechts ein.
     Zurück zur Startseite: umgekehrt. */
  (function () {
    var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var here = location.pathname.split('/').pop() || 'index.html';

    // Einflug-Klasse nach dem Einfliegen entfernen
    setTimeout(function () { root.classList.remove('enter-right', 'enter-left'); }, 700);

    // Zurück-Taste des Browsers (Seite aus dem Zwischenspeicher): Zustand zurücksetzen
    window.addEventListener('pageshow', function (ev) {
      if (ev.persisted) root.classList.remove('leave-left', 'leave-right', 'enter-right', 'enter-left');
    });

    if (reduce) return;
    document.addEventListener('click', function (e) {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      var a = e.target.closest ? e.target.closest('a[href]') : null;
      if (!a || a.target === '_blank' || a.hasAttribute('download')) return;
      var href = a.getAttribute('href');
      if (/^[a-z]+:/i.test(href) || href.charAt(0) === '#') return;
      var page = href.split('#')[0];
      if (!/\.html$/i.test(page) || page === here) return;
      e.preventDefault();
      // Zurück-Knopf (und Zurück-Wisch): kam man von der eigenen Startseite, im Browser-Verlauf
      // zurückgehen – so passt danach auch die Zurück-Taste des Handys.
      var goBack = a.classList.contains('back-link') && cameFromStart();
      var leave = function () { if (goBack) history.back(); else location.href = href; };
      if (root.classList.contains('swiped')) { leave(); return; } // schon weggewischt
      var toStart = page === 'index.html' && here !== 'index.html';
      root.classList.remove('enter-right', 'enter-left');
      root.classList.add(toStart ? 'leave-right' : 'leave-left');
      setTimeout(leave, 360);
    });
  })();

  /* ---------- Neue Seite oben beginnen ----------
     Wird eine Seite neu aufgerufen (nicht per Zurück-Taste) und hat kein Sprungziel,
     startet sie oben. Hilft vor allem in eingebetteten Ansichten (z. B. Vorschau-Fenstern),
     die sonst die alte Scroll-Position behalten. */
  (function () {
    if (hashHasTarget) return;
    var nav = performance && performance.getEntriesByType ? performance.getEntriesByType('navigation')[0] : null;
    if (nav && nav.type === 'back_forward') return;
    window.scrollTo(0, 0);
    var top = document.getElementById('inhalt') || document.body;
    if (top && top.scrollIntoView) {
      try { top.scrollIntoView({ block: 'start', behavior: 'auto' }); } catch (e) { top.scrollIntoView(true); }
      window.scrollTo(0, 0);
    }
  })();

  /* ---------- Bereiche ein- und ausblenden ----------
     Ein Bereich gilt als sichtbar, sobald er gut ein Drittel des Bildschirms füllt.
     Bei „Weniger Bewegung“ oder alten Browsern bleibt alles einfach sichtbar. */
  (function () {
    var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce || !('IntersectionObserver' in window)) return;
    var sections = document.querySelectorAll('main > section');
    if (!sections.length) return;
    root.classList.add('fx');
    var steps = [];
    for (var i = 0; i <= 20; i++) steps.push(i / 20);
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        var vh = window.innerHeight || document.documentElement.clientHeight;
        var shown = en.isIntersecting && (en.intersectionRatio >= 0.35 || en.intersectionRect.height >= vh * 0.35);
        en.target.classList.toggle('is-visible', shown);
      });
    }, { threshold: steps });
    for (var j = 0; j < sections.length; j++) io.observe(sections[j]);
  })();

  /* ---------- Bereichs-Steuerung: Mausrad, Wischen und Tasten einheitlich ----------
     Auf allen Seiten (html.snap): eine Bewegung = weicher Wechsel in den nächsten Bereich.
     Ist ein Bereich höher als der Bildschirm, wird zuerst normal darin gescrollt.
     Auf Unterseiten: Wisch mit dem Finger von links nach rechts = Zurück-Pfeil.
     Bei „Weniger Bewegung“ bleibt normales Scrollen. */
  (function () {
    if (!root.classList.contains('snap') || !window.matchMedia) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    var sections = Array.prototype.slice.call(document.querySelectorAll('main > section'));
    var header = document.querySelector('.site-header');
    var menuBtn = document.querySelector('.menu-toggle');
    if (!sections.length) return;
    root.classList.add('wheel-nav');

    var busy = false, lockUntil = 0, DURATION = 900;

    function headerH() {
      if (!header) return 0;
      var pos = window.getComputedStyle(header).position;
      return (pos === 'sticky' || pos === '-webkit-sticky' || pos === 'fixed') ? header.offsetHeight : 0;
    }
    function maxScroll() { return Math.max(0, document.documentElement.scrollHeight - window.innerHeight); }
    function topOf(el) { return Math.round(el.getBoundingClientRect().top + window.pageYOffset - headerH()); }
    function stops() {
      var list = sections.map(topOf);
      if (list[0] < 40) list[0] = 0; // erster Bereich = ganz oben
      var end = maxScroll();
      if (end - list[list.length - 1] > 40) list.push(end);
      else list[list.length - 1] = Math.min(list[list.length - 1], end);
      return list;
    }
    function ease(t) { return t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }
    function menuOpen() { return menuBtn && menuBtn.getAttribute('aria-expanded') === 'true'; }

    function animateTo(y) {
      var start = window.pageYOffset, diff = y - start, t0 = null;
      if (Math.abs(diff) < 2) return;
      busy = true;
      function step(ts) {
        if (t0 === null) t0 = ts;
        var p = Math.min(1, (ts - t0) / DURATION);
        window.scrollTo(0, start + diff * ease(p));
        if (p < 1) requestAnimationFrame(step);
        else { busy = false; lockUntil = Date.now() + 300; }
      }
      requestAnimationFrame(step);
    }

    // Liefert das Ziel für eine Richtung – oder null, wenn normal gescrollt werden soll
    function targetFor(dir) {
      var y = window.pageYOffset, vh = window.innerHeight, list = stops(), hh = headerH();
      var idx = 0;
      for (var i = 0; i < list.length; i++) if (list[i] <= y + 4) idx = i;
      var sec = sections[idx];
      if (sec) {
        var r = sec.getBoundingClientRect();
        if (dir > 0 && r.bottom > vh + 4) return null;   // hoher Bereich: erst darin weiter
        if (dir < 0 && r.top < hh - 4) return null;      // hoher Bereich: erst nach oben darin
      }
      var next = Math.max(0, Math.min(list.length - 1, idx + dir));
      if (dir < 0 && list[idx] < y - 4) next = idx;
      var target = Math.min(list[next], maxScroll());
      return Math.abs(target - y) < 2 ? null : target;
    }

    /* Mausrad / Trackpad */
    window.addEventListener('wheel', function (e) {
      if (e.ctrlKey || menuOpen()) return;
      var dir = e.deltaY > 0 ? 1 : e.deltaY < 0 ? -1 : 0;
      if (!dir) return;
      if (busy || Date.now() < lockUntil) { e.preventDefault(); return; }
      var t = targetFor(dir);
      if (t === null) return;
      e.preventDefault();
      animateTo(t);
    }, { passive: false });

    /* Sprünge innerhalb der Seite (z. B. Kreis-Navigation) weich mit Ein-/Ausblenden */
    document.addEventListener('click', function (e) {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      var a = e.target.closest ? e.target.closest('a[href^="#"]') : null;
      if (!a || a.classList.contains('skip-link')) return;
      var id = a.getAttribute('href').slice(1);
      var target = id && document.getElementById(id);
      if (!target || sections.indexOf(target) === -1) return;
      e.preventDefault();
      if (busy) return;
      animateTo(Math.min(topOf(target), maxScroll()));
      try { if (location.hash !== '#' + id) history.pushState({ ck: id }, '', '#' + id); } catch (err) {}
    });

    /* Zurück-Taste (Handy/Browser) innerhalb der Startseite: weich zum vorherigen Bereich */
    window.addEventListener('popstate', function () {
      var id = (location.hash || '').slice(1);
      var target = id ? document.getElementById(id) : null;
      if (id && (!target || sections.indexOf(target) === -1)) return;
      animateTo(target ? Math.min(topOf(target), maxScroll()) : 0);
    });

    /* Tasten: Pfeil, Bild auf/ab, Leertaste, Pos1/Ende */
    document.addEventListener('keydown', function (e) {
      if (e.altKey || e.ctrlKey || e.metaKey || menuOpen()) return;
      var tag = (e.target && e.target.tagName) || '';
      if (/^(INPUT|TEXTAREA|SELECT|BUTTON)$/.test(tag) || (e.target && e.target.isContentEditable)) return;
      var dir = 0, k = e.key;
      if (k === 'ArrowDown' || k === 'PageDown' || (k === ' ' && !e.shiftKey)) dir = 1;
      else if (k === 'ArrowUp' || k === 'PageUp' || (k === ' ' && e.shiftKey)) dir = -1;
      else if (k === 'Home') { e.preventDefault(); animateTo(0); return; }
      else if (k === 'End') { e.preventDefault(); animateTo(maxScroll()); return; }
      if (!dir) return;
      if (busy) { e.preventDefault(); return; }
      var t = targetFor(dir);
      if (t === null) return;
      e.preventDefault();
      animateTo(t);
    });

    /* Wischen (Handy / Tablet)
       Senkrecht: stufenloses, normales Scrollen (kein Einrasten).
       Waagerecht auf Unterseiten: Seite folgt dem Finger nach rechts;
       ab ca. 35 % der Breite oder per schnellem Wisch geht es zurück. */
    var tx = 0, ty = 0, mode = '', dragX = 0;
    var backLink = document.querySelector('.back-link');
    var movers = Array.prototype.slice.call(document.querySelectorAll('main'));
    var THRESHOLD = 0.35, MIN_FLICK = 60, FLICK_SPEED = 0.45; // Anteil der Breite, px, px pro ms
    var samples = [];

    function setDrag(x, withTransition) {
      var w = window.innerWidth || 1;
      var p = Math.max(0, Math.min(1, x / w));
      movers.forEach(function (el) {
        el.style.transition = withTransition ? 'transform .32s cubic-bezier(.22,.61,.36,1), opacity .32s ease' : 'none';
        el.style.transform = x ? 'translateX(' + x + 'px)' : '';
        el.style.opacity = x ? String(1 - p * 0.7) : '';
      });
    }
    function clearDrag() {
      movers.forEach(function (el) { el.style.transition = ''; el.style.transform = ''; el.style.opacity = ''; });
    }

    window.addEventListener('touchstart', function (e) {
      if (e.touches.length !== 1 || menuOpen() || root.classList.contains('swiped')) { mode = 'ignore'; return; }
      tx = e.touches[0].clientX; ty = e.touches[0].clientY;
      mode = ''; dragX = 0; samples = [];
      // Rand-Geste des Browsers (iPhone „Zurück“ vom linken Rand) nicht stören
      if (tx < 24) mode = 'ignore';
    }, { passive: true });

    window.addEventListener('touchmove', function (e) {
      if (mode === 'ignore' || mode === 'native' || e.touches.length !== 1) return;
      var dx = e.touches[0].clientX - tx, dy = e.touches[0].clientY - ty;
      if (!mode) {
        if (Math.abs(dx) < 10 && Math.abs(dy) < 10) return;
        // Nur waagerecht nach rechts und nur auf Unterseiten mit Zurück-Pfeil
        mode = (backLink && dx > 0 && Math.abs(dx) > Math.abs(dy) * 1.4) ? 'drag' : 'native';
        if (mode === 'native') return;
      }
      if (mode === 'drag') {
        if (e.cancelable) e.preventDefault(); // beim seitlichen Ziehen nicht senkrecht scrollen
        dragX = Math.max(0, dx);
        var now = Date.now();
        samples.push({ x: dragX, t: now });
        while (samples.length > 2 && now - samples[0].t > 100) samples.shift();
        setDrag(dragX, false);
      }
    }, { passive: false });

    function endDrag() {
      if (mode !== 'drag') { mode = ''; return; }
      mode = '';
      var w = window.innerWidth || 1;
      // Geschwindigkeit der letzten ~100 ms (positiv = nach rechts)
      var v = 0;
      if (samples.length > 1) {
        var a = samples[0], b = samples[samples.length - 1];
        v = (b.x - a.x) / Math.max(1, b.t - a.t);
      }
      var goingBack = v < -0.15;                                // zurückgezogen: abbrechen
      var farEnough = dragX >= w * THRESHOLD;                   // langsam weit genug gezogen
      var flick = dragX >= MIN_FLICK && v >= FLICK_SPEED;       // schneller Wisch
      if (!goingBack && (farEnough || flick)) {
        // Weg schieben, dann zurück zur Startseite
        root.classList.add('swiped');
        setDrag(w, true);
        setTimeout(function () { backLink.click(); }, 300);
      } else {
        // Zurück an den Platz
        setDrag(0, true);
        setTimeout(clearDrag, 340);
      }
    }
    window.addEventListener('touchend', endDrag, { passive: true });
    window.addEventListener('touchcancel', endDrag, { passive: true });

    // Zurück-Taste des Browsers: Wisch-Zustand zurücksetzen
    window.addEventListener('pageshow', function (ev) {
      if (ev.persisted) { root.classList.remove('swiped'); clearDrag(); }
    });

    // Wurde während eines Wechsels gedreht/die Größe geändert: auf nächsten Halt ausrichten
    var rt = null;
    var finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    window.addEventListener('resize', function () {
      if (!finePointer) return;
      clearTimeout(rt);
      rt = setTimeout(function () {
        if (busy) return;
        var y = window.pageYOffset, list = stops(), best = list[0];
        for (var i = 0; i < list.length; i++) if (Math.abs(list[i] - y) < Math.abs(best - y)) best = list[i];
        var sec = null;
        for (var j = 0; j < sections.length; j++) if (Math.abs(topOf(sections[j]) - best) < 2) sec = sections[j];
        if (sec && sec.offsetHeight <= window.innerHeight + 4 && Math.abs(best - y) < window.innerHeight * 0.5) window.scrollTo(0, best);
      }, 250);
    });
  })();

  /* ---------- Aktiver Bereich im Menü ----------
     Auf der Startseite wird der Menüpunkt des Bereichs, der gerade zu sehen ist, lila. */
  (function () {
    var links = document.querySelectorAll('.nav a[data-section]');
    if (!links.length) return;
    var header = document.querySelector('.site-header');
    var map = [];
    for (var i = 0; i < links.length; i++) {
      var sec = document.getElementById(links[i].getAttribute('data-section'));
      if (sec) map.push({ link: links[i], sec: sec });
    }
    if (!map.length) return;
    // Nach Reihenfolge auf der Seite sortieren (das Menü hat CK in der Mitte)
    map.sort(function (a, b) {
      return a.sec.compareDocumentPosition(b.sec) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1;
    });
    var ticking = false;
    function update() {
      ticking = false;
      var line = (header ? header.offsetHeight : 0) + window.innerHeight * 0.35;
      var active = map[0];
      for (var j = 0; j < map.length; j++) {
        if (map[j].sec.getBoundingClientRect().top <= line) active = map[j];
      }
      // Ganz unten angekommen: letzten Bereich (Kontakt) markieren
      if (window.innerHeight + window.pageYOffset >= document.documentElement.scrollHeight - 2) {
        active = map[map.length - 1];
      }
      for (var n = 0; n < map.length; n++) {
        var on = map[n] === active;
        map[n].link.classList.toggle('is-active', on);
        if (on) map[n].link.setAttribute('aria-current', 'location');
        else map[n].link.removeAttribute('aria-current');
      }
    }
    function onScroll() { if (!ticking) { ticking = true; requestAnimationFrame(update); } }
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    update();
  })();

  /* ---------- Rückkehr zum Startbereich: nur der kleine Effekt ----------
     Verlässt man den Startbereich und kommt zurück (Scrollen, Menü, CK in der Fußzeile),
     pulsiert der Inhalt 2× leicht. Das volle Intro läuft nur beim ersten Laden/Aktualisieren. */
  (function () {
    var hero = document.getElementById('start');
    var hub = hero && hero.querySelector('.hub');
    if (!hub || !('IntersectionObserver' in window)) return;
    var introEnds = root.classList.contains('intro-seen') ? 0 : Date.now() + 6000;
    var away = false;
    new IntersectionObserver(function (entries) {
      var en = entries[0];
      var visible = en.isIntersecting && en.intersectionRatio >= 0.6;
      if (!visible) { if (en.intersectionRatio < 0.2) away = true; return; }
      if (!away || Date.now() < introEnds) return;
      away = false;
      hub.classList.remove('pulse-again');
      void hub.offsetWidth; // Animation neu starten
      hub.classList.add('pulse-again');
    }, { threshold: [0, 0.2, 0.6, 1] }).observe(hero);
    hub.addEventListener('animationend', function (e) {
      if (e.target === hub && e.animationName === 'ck-soft-pulse') hub.classList.remove('pulse-again');
    });
  })();

  /* ---------- Effektfarbe wählen (Kreis-Knopf mit Dropdown) ---------- */
  (function () {
    var toggle = document.querySelector('.accent-toggle');
    var menu = document.getElementById('farbwahl');
    if (!toggle || !menu) return;
    var items = Array.prototype.slice.call(menu.querySelectorAll('button[data-accent]'));

    function mark(key) {
      items.forEach(function (it) { it.setAttribute('aria-checked', it.getAttribute('data-accent') === key ? 'true' : 'false'); });
    }
    function open(state) {
      menu.hidden = !state;
      toggle.setAttribute('aria-expanded', state ? 'true' : 'false');
      if (state) {
        var cur = menu.querySelector('[aria-checked="true"]') || items[0];
        cur.focus({ preventScroll: true });
      }
    }
    mark(root.getAttribute('data-accent') || 'lila');

    toggle.addEventListener('click', function (e) {
      e.stopPropagation();
      open(menu.hidden);
    });
    items.forEach(function (it, i) {
      it.addEventListener('click', function () {
        var key = it.getAttribute('data-accent');
        if (!ACCENTS.test(key)) return;
        root.setAttribute('data-accent', key);
        mark(key);
        saveAccent(key);
        open(false);
        toggle.focus({ preventScroll: true });
      });
      it.addEventListener('keydown', function (e) {
        if (e.key === 'ArrowDown') { e.preventDefault(); items[(i + 1) % items.length].focus({ preventScroll: true }); }
        else if (e.key === 'ArrowUp') { e.preventDefault(); items[(i - 1 + items.length) % items.length].focus({ preventScroll: true }); }
      });
    });
    document.addEventListener('click', function (e) {
      if (!menu.hidden && !menu.contains(e.target) && e.target !== toggle) open(false);
    });
    document.addEventListener('keydown', function (e) {
      if ((e.key === 'Escape' || e.key === 'Esc') && !menu.hidden) { open(false); toggle.focus({ preventScroll: true }); }
    });
  })();

  /* ---------- Schnellmenü oben rechts ----------
     Auf der Startseite erst sichtbar, wenn der Startkreis verlassen ist; auf Unterseiten immer.
     Öffnen: Bereiche fliegen nacheinander ein. Bereich wählen: wieder zum Burger. */
  (function () {
    var menu = document.getElementById('schnellmenue');
    if (!menu) return;
    var toggle = menu.querySelector('.quick-toggle');
    var list = menu.querySelector('.quick-nav');
    var closeTimer = null;

    function isOpen() { return toggle.getAttribute('aria-expanded') === 'true'; }
    function openMenu() {
      clearTimeout(closeTimer);
      menu.classList.remove('is-closing');
      list.hidden = false;
      void list.offsetWidth; // Startzustand übernehmen, damit die Einflug-Animation läuft
      menu.classList.add('is-open');
      toggle.setAttribute('aria-expanded', 'true');
      toggle.setAttribute('aria-label', 'Menü schließen');
    }
    function closeMenu() {
      if (!isOpen()) return;
      menu.classList.remove('is-open');
      menu.classList.add('is-closing');
      toggle.setAttribute('aria-expanded', 'false');
      toggle.setAttribute('aria-label', 'Menü öffnen');
      closeTimer = setTimeout(function () { list.hidden = true; menu.classList.remove('is-closing'); }, 320);
    }

    toggle.addEventListener('click', function (e) {
      e.stopPropagation();
      if (isOpen()) closeMenu(); else openMenu();
    });
    list.addEventListener('click', function (e) {
      if (e.target.closest && e.target.closest('a')) closeMenu();
    });
    document.addEventListener('click', function (e) {
      if (isOpen() && !menu.contains(e.target)) closeMenu();
    });
    document.addEventListener('keydown', function (e) {
      if ((e.key === 'Escape' || e.key === 'Esc') && isOpen()) { closeMenu(); toggle.focus({ preventScroll: true }); }
    });

    // Startseite: Burger nur außerhalb des Startkreises
    var hero = document.getElementById('start');
    if (hero && menu.classList.contains('is-hidden')) {
      if (!('IntersectionObserver' in window)) { menu.classList.remove('is-hidden'); return; }
      new IntersectionObserver(function (entries) {
        var visible = entries[0].isIntersecting && entries[0].intersectionRatio >= 0.5;
        menu.classList.toggle('is-hidden', visible);
        if (visible) closeMenu();
      }, { threshold: [0, 0.5, 1] }).observe(hero);
    }
  })();

  /* ---------- Burger-Menü ---------- */
  var btn = document.querySelector('.menu-toggle');
  var nav = document.getElementById('hauptmenue');
  if (!btn || !nav) return;

  function setOpen(open) {
    btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    btn.setAttribute('aria-label', open ? 'Menü schließen' : 'Menü öffnen');
    nav.classList.toggle('is-open', open);
  }
  btn.addEventListener('click', function () {
    setOpen(btn.getAttribute('aria-expanded') !== 'true');
  });
  nav.addEventListener('click', function (e) {
    var link = e.target.closest ? e.target.closest('a') : null;
    if (!link) return;
    var wasOpen = btn.getAttribute('aria-expanded') === 'true';
    setOpen(false);

    // Sprungziel auf derselben Seite: erst Menü schließen, dann springen.
    // Sonst rechnet der Browser mit dem offenen Menü und landet zu weit unten.
    var href = link.getAttribute('href') || '';
    var hashPos = href.indexOf('#');
    if (!wasOpen || hashPos === -1) return;
    var page = href.slice(0, hashPos);
    var here = location.pathname.split('/').pop() || 'index.html';
    if (page && page !== here) return;
    var target = document.getElementById(href.slice(hashPos + 1));
    if (!target) return;
    e.preventDefault();
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        target.scrollIntoView({ block: 'start' });
        try { history.replaceState(null, '', '#' + target.id); } catch (err) {}
      });
    });
  });
  document.addEventListener('keydown', function (e) {
    if ((e.key === 'Escape' || e.key === 'Esc') && btn.getAttribute('aria-expanded') === 'true') {
      setOpen(false);
      btn.focus();
    }
  });
  if (window.matchMedia) {
    var mq = window.matchMedia('(min-width: 769px)');
    var onMq = function (ev) { if (ev.matches) setOpen(false); };
    if (mq.addEventListener) mq.addEventListener('change', onMq);
    else if (mq.addListener) mq.addListener(onMq);
  }
})();
