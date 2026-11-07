/* CK - DIGITAL ART – Hell/Dunkel-Schalter und Burger-Menü.
   Ohne JavaScript: helles Design (bzw. System-Einstellung) und Menü immer sichtbar. */
(function () {
  var root = document.documentElement;

  /* ---------- Design über den Seitenwechsel mitnehmen ----------
     In Vorschau-Fenstern und bei lokal geöffneten Dateien teilen Browser den Speicher
     oft nicht zwischen den Seiten. Dort hängen wir das Design an den Link an
     (z. B. galerie.html#dunkel oder index.html#apps--dunkel) und lesen es hier wieder aus. */
  var jumpId = '';
  var hashHasTarget = !!location.hash;
  (function () {
    var m = /^#(?:(.*)--)?(hell|dunkel)$/.exec(location.hash || '');
    if (!m) return;
    var theme = m[2] === 'dunkel' ? 'dark' : 'light';
    try { localStorage.setItem('ck-theme', theme); } catch (e) {}
    try {
      var rest = (window.name || '').replace(/(?:^|;)ck-theme=(dark|light)/, '');
      window.name = (rest ? rest + ';' : '') + 'ck-theme=' + theme;
    } catch (e) {}
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
    var tag = root.getAttribute('data-theme') === 'dark' ? 'dunkel' : 'hell';
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
      var toStart = page === 'index.html' && here !== 'index.html';
      root.classList.remove('enter-right', 'enter-left');
      root.classList.add(toStart ? 'leave-right' : 'leave-left');
      setTimeout(function () { location.href = href; }, 360);
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

  /* ---------- Mausrad: weicher Wechsel direkt in den nächsten Bereich ----------
     Nur auf der Startseite (html.snap), nur mit Maus/Trackpad am Desktop.
     Am Handy übernimmt das CSS-Einrasten. Ist ein Bereich höher als der Bildschirm,
     wird zuerst normal darin gescrollt. */
  (function () {
    if (!root.classList.contains('snap') || !window.matchMedia) return;
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    var sections = Array.prototype.slice.call(document.querySelectorAll('main > section'));
    var header = document.querySelector('.site-header');
    if (!sections.length) return;
    root.classList.add('wheel-nav');

    var busy = false, lockUntil = 0, DURATION = 950;

    function headerH() { return header ? header.offsetHeight : 0; }
    function maxScroll() { return Math.max(0, document.documentElement.scrollHeight - window.innerHeight); }
    function topOf(el) { return Math.round(el.getBoundingClientRect().top + window.pageYOffset - headerH()); }
    function stops() {
      var list = sections.map(topOf);
      var end = maxScroll(); // Seitenende – nur als eigener Halt, wenn deutlich unter dem letzten Bereich
      if (end - list[list.length - 1] > 40) list.push(end);
      else list[list.length - 1] = Math.min(list[list.length - 1], end);
      return list;
    }
    function ease(t) { return t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }

    function animateTo(y) {
      var start = window.pageYOffset, diff = y - start, t0 = null;
      if (Math.abs(diff) < 2) return;
      busy = true;
      function step(ts) {
        if (t0 === null) t0 = ts;
        var p = Math.min(1, (ts - t0) / DURATION);
        window.scrollTo(0, start + diff * ease(p));
        if (p < 1) requestAnimationFrame(step);
        else { busy = false; lockUntil = Date.now() + 350; }
      }
      requestAnimationFrame(step);
    }

    window.addEventListener('wheel', function (e) {
      if (e.ctrlKey) return; // Zoomen nicht stören
      var dir = e.deltaY > 0 ? 1 : e.deltaY < 0 ? -1 : 0;
      if (!dir) return;
      if (busy || Date.now() < lockUntil) { e.preventDefault(); return; }

      var y = window.pageYOffset, vh = window.innerHeight, list = stops();
      // Aktuellen Bereich bestimmen (letzter Haltepunkt oberhalb der Mitte)
      var idx = 0;
      for (var i = 0; i < list.length; i++) if (list[i] <= y + 4) idx = i;

      // Hoher Bereich: erst normal darin weiterscrollen
      var sec = sections[idx];
      if (sec) {
        var r = sec.getBoundingClientRect();
        if (dir > 0 && r.bottom > vh + 4) return;
        if (dir < 0 && r.top < headerH() - 4) return;
      }

      var next = Math.max(0, Math.min(list.length - 1, idx + dir));
      if (dir < 0 && list[idx] < y - 4) next = idx; // zurück an den Anfang des aktuellen Bereichs
      var target = Math.min(list[next], maxScroll());
      if (Math.abs(target - y) < 2) return;
      e.preventDefault();
      animateTo(target);
    }, { passive: false });
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

  /* ---------- Hell / Dunkel ---------- */
  var themeBtn = document.querySelector('.theme-toggle');

  function currentTheme() {
    return root.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
  }
  function applyTheme(theme, save) {
    root.setAttribute('data-theme', theme);
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', theme === 'dark' ? '#0E0E12' : '#F6F6F8');
    if (themeBtn) {
      var toDark = theme !== 'dark';
      themeBtn.setAttribute('aria-label', toDark ? 'Dunkles Design einschalten' : 'Helles Design einschalten');
      themeBtn.setAttribute('aria-pressed', theme === 'dark' ? 'true' : 'false');
    }
    if (save) {
      // Dauerhaft für spätere Besuche …
      try { localStorage.setItem('ck-theme', theme); } catch (e) {}
      // … und zusätzlich für diesen Tab. window.name bleibt beim Seitenwechsel erhalten,
      // auch dort, wo der Browser localStorage nicht teilt (lokale Dateien, Vorschau-Fenster).
      try {
        var rest = (window.name || '').replace(/(?:^|;)ck-theme=(dark|light)/, '');
        window.name = (rest ? rest + ';' : '') + 'ck-theme=' + theme;
      } catch (e) {}
    }
  }
  applyTheme(currentTheme(), false);

  if (themeBtn) {
    themeBtn.addEventListener('click', function () {
      applyTheme(currentTheme() === 'dark' ? 'light' : 'dark', true);
    });
  }

  // System-Einstellung folgen, solange nichts selbst gewählt wurde
  if (window.matchMedia) {
    var sys = window.matchMedia('(prefers-color-scheme: dark)');
    var onSys = function (ev) {
      var saved = /(?:^|;)ck-theme=(dark|light)/.test(window.name || '') ? 'tab' : null;
      if (!saved) { try { saved = localStorage.getItem('ck-theme'); } catch (e) {} }
      if (!saved) applyTheme(ev.matches ? 'dark' : 'light', false);
    };
    if (sys.addEventListener) sys.addEventListener('change', onSys);
    else if (sys.addListener) sys.addListener(onSys);
  }

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
