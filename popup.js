/*!
 * popup-notice.js
 * Shows the popup message you set in admin.html > "Popup Message".
 *
 * HOW TO USE — add ONE line just before </body> on each page:
 *
 *   attendance.html : <script src="popup-notice.js" data-page="attendance"></script>
 *   register.html   : <script src="popup-notice.js" data-page="register"></script>
 *   dashboard.html  : <script src="popup-notice.js" data-page="dashboard"></script>
 *
 * The popup only appears if it is switched ON in admin and that page is ticked.
 * It never blocks or breaks the page: if the server can't be reached, nothing shows.
 */
(function () {
  'use strict';

  // Same attendance-system Apps Script Web App URL the other pages use
  // (NOT the banner one). Update here if you ever redeploy with a new URL.
  var API_URL = 'https://script.google.com/macros/s/AKfycbzYiUzTQijI7gJwVIu6RWPVNS8IQGIOJkIYKfkgjdmAb_3JXhP_Z6ANDDoEhOs8wkSO/exec';

  var me = document.currentScript || document.querySelector('script[src*="popup-notice"]');
  var PAGE = (me && me.getAttribute('data-page')) || '';
  var MANUAL = !!(me && me.hasAttribute('data-manual')); // admin preview: don't auto-fetch

  var STYLE_ID = 'pn-styles';
  var OVERLAY_ID = 'pn-overlay';

  function injectStyles() {
    if (document.getElementById(STYLE_ID)) return;
    var css =
      '@keyframes pn-fade{from{opacity:0}to{opacity:1}}' +
      '@keyframes pn-pop{from{opacity:0;transform:translateY(8px) scale(.98)}to{opacity:1;transform:none}}' +
      '#' + OVERLAY_ID + '{position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(16,26,46,.55);' +
        'display:flex;align-items:center;justify-content:center;padding:20px;z-index:2147483000;' +
        'animation:pn-fade .18s ease;-webkit-tap-highlight-color:transparent}' +
      '.pn-box{position:relative;box-sizing:border-box;background:#fff;color:#1f2937;border-radius:14px;' +
        'max-width:420px;width:100%;max-height:85vh;overflow-y:auto;padding:28px 24px 22px;' +
        'border-top:5px solid #2563eb;box-shadow:0 12px 40px rgba(16,26,46,.3);' +
        'font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;animation:pn-pop .2s ease;text-align:left}' +
      '.pn-x{position:absolute;top:8px;right:10px;width:32px;height:32px;border:0;background:transparent;' +
        'color:#6b7280;font-size:24px;line-height:1;cursor:pointer;border-radius:8px;padding:0}' +
      '.pn-x:hover{background:#f4f6fb;color:#1f2937}' +
      '.pn-title{margin:0 28px 10px 0;font-size:1.15rem;font-weight:700;line-height:1.3;color:#101a2e}' +
      '.pn-msg{margin:0 0 20px;font-size:.95rem;line-height:1.6;white-space:pre-wrap;word-wrap:break-word;overflow-wrap:anywhere}' +
      '.pn-actions{display:flex;flex-wrap:wrap}' +
      '.pn-btn{box-sizing:border-box;flex:1 1 120px;margin:0 8px 8px 0;padding:12px 16px;border-radius:8px;' +
        'font-size:.92rem;font-weight:600;text-align:center;text-decoration:none;cursor:pointer;font-family:inherit;line-height:1.2}' +
      '.pn-btn:last-child{margin-right:0}' +
      '.pn-btn-primary{background:#2563eb;color:#fff;border:1px solid #2563eb}' +
      '.pn-btn-secondary{background:#fff;color:#2563eb;border:1px solid #2563eb}' +
      '.pn-btn:hover{filter:brightness(.95)}' +
      '.pn-btn:focus-visible,.pn-x:focus-visible{outline:2px solid #2563eb;outline-offset:2px}';
    var style = document.createElement('style');
    style.id = STYLE_ID;
    style.appendChild(document.createTextNode(css));
    (document.head || document.documentElement).appendChild(style);
  }

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text; // textContent only — message text is never parsed as HTML
    return n;
  }

  // ---- "show only once per device" memory (localStorage may be blocked; that's fine) ----
  function seenKey() { return 'pn_seen_' + PAGE; }
  function getSeen() { try { return window.localStorage.getItem(seenKey()); } catch (e) { return null; } }
  function setSeen(v) { try { window.localStorage.setItem(seenKey(), String(v)); } catch (e) { /* ignore */ } }

  function show(cfg, opts) {
    opts = opts || {};
    var message = cfg && String(cfg.message || '').trim();
    if (!message) return;

    var old = document.getElementById(OVERLAY_ID);
    if (old && old.parentNode) old.parentNode.removeChild(old);

    injectStyles();

    var prevFocus = document.activeElement;
    var root = document.documentElement;
    var prevOverflow = root.style.overflow;
    root.style.overflow = 'hidden';

    var overlay = el('div');
    overlay.id = OVERLAY_ID;

    var box = el('div', 'pn-box');
    box.setAttribute('role', 'dialog');
    box.setAttribute('aria-modal', 'true');

    var title = String(cfg.title || '').trim();
    if (title) {
      var h = el('h2', 'pn-title', title);
      h.id = 'pn-title';
      box.setAttribute('aria-labelledby', 'pn-title');
      box.appendChild(h);
    } else {
      box.setAttribute('aria-label', 'Message');
    }

    var xBtn = el('button', 'pn-x', '\u00d7');
    xBtn.type = 'button';
    xBtn.setAttribute('aria-label', 'Close');
    box.insertBefore(xBtn, box.firstChild);

    box.appendChild(el('p', 'pn-msg', message));

    var actions = el('div', 'pn-actions');
    var linkUrl = String(cfg.linkUrl || '').trim();
    if (/^https?:\/\//i.test(linkUrl)) {
      var a = el('a', 'pn-btn pn-btn-primary', String(cfg.linkLabel || '').trim() || 'Learn more');
      a.href = linkUrl;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      actions.appendChild(a);
    }
    var okBtn = el('button', 'pn-btn ' + (actions.childNodes.length ? 'pn-btn-secondary' : 'pn-btn-primary'), actions.childNodes.length ? 'Close' : 'OK');
    okBtn.type = 'button';
    actions.appendChild(okBtn);
    box.appendChild(actions);

    overlay.appendChild(box);
    document.body.appendChild(overlay);

    function close() {
      document.removeEventListener('keydown', onKey, true);
      if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
      root.style.overflow = prevOverflow;
      if (prevFocus && prevFocus.focus) { try { prevFocus.focus(); } catch (e) { /* ignore */ } }
    }

    function onKey(e) {
      var key = e.key || e.keyCode;
      if (key === 'Escape' || key === 27) { close(); return; }
      if (key === 'Tab' || key === 9) {
        var f = box.querySelectorAll('a[href],button');
        if (!f.length) return;
        var first = f[0], last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    }

    xBtn.addEventListener('click', close);
    okBtn.addEventListener('click', close);
    overlay.addEventListener('click', function (e) { if (e.target === overlay) close(); });
    document.addEventListener('keydown', onKey, true);
    okBtn.focus();

    if (!opts.preview && cfg.showOnce) setSeen(cfg.version);
  }

  // ---- fetch the config (JSONP — the backend's doGet already supports it) ----
  function fetchConfig(cb) {
    var name = '__pnCb' + Date.now() + Math.floor(Math.random() * 1e6);
    var s = document.createElement('script');
    var done = false;
    function finish() {
      done = true;
      window[name] = function () {};           // a late reply becomes a harmless no-op
      if (s.parentNode) s.parentNode.removeChild(s);
    }
    var timer = setTimeout(function () { if (!done) finish(); }, 10000);
    window[name] = function (data) {
      if (done) return;
      clearTimeout(timer);
      finish();
      cb(data);
    };
    s.onerror = function () { if (!done) { clearTimeout(timer); finish(); } };
    s.async = true;
    s.src = API_URL + '?action=getPopupConfig&callback=' + name + '&_=' + Date.now();
    (document.head || document.documentElement).appendChild(s);
  }

  function init() {
    if (MANUAL || !PAGE) return;
    fetchConfig(function (data) {
      var p = data && data.success && data.popup;
      if (!p || !p.enabled) return;
      if (!p.pages || p.pages.indexOf(PAGE) === -1) return;
      if (p.showOnce && getSeen() === String(p.version)) return;
      show(p, {});
    });
  }

  // Used by the admin page's "Preview" button.
  window.PopupNotice = {
    show: function (cfg) { show(cfg, { preview: true }); }
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();