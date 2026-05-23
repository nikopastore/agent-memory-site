// Static assets bundled into the generated site.
// Pure strings so they survive `tsc` and ship inside dist/.

export const CSS = `:root {
  color-scheme: light dark;
  --bg: #0b1020;
  --fg: #eef2ff;
  --muted: #9aa4bf;
  --card: #121a33;
  --border: #26314f;
  --link: #8bd3ff;
  --link-hover: #b8e3ff;
  --code-bg: #050814;
  --warn: #ffb454;
  --redacted: #6b7280;
}
@media (prefers-color-scheme: light) {
  :root {
    --bg: #f8fafc;
    --fg: #0f172a;
    --muted: #475569;
    --card: #ffffff;
    --border: #e2e8f0;
    --link: #1d4ed8;
    --link-hover: #1e40af;
    --code-bg: #f1f5f9;
  }
}
* { box-sizing: border-box; }
html, body { margin: 0; }
body { font: 16px/1.6 system-ui, -apple-system, sans-serif; background: var(--bg); color: var(--fg); }
header, footer { padding: 1rem 2rem; background: color-mix(in srgb, var(--bg) 70%, black); border-bottom: 1px solid var(--border); }
footer { border-top: 1px solid var(--border); border-bottom: none; color: var(--muted); font-size: .875rem; }
nav { display: flex; gap: 1rem; align-items: center; flex-wrap: wrap; }
nav a { color: var(--link); text-decoration: none; }
nav a:hover { color: var(--link-hover); }
nav .brand { font-weight: 600; color: var(--fg); margin-right: auto; }
main { max-width: 1100px; margin: 0 auto; padding: 2rem; }
h1, h2, h3 { line-height: 1.25; }
h1 { margin-top: 0; }
a { color: var(--link); }
a:hover { color: var(--link-hover); }
section, article, aside { background: var(--card); border: 1px solid var(--border); border-radius: 16px; padding: 1.25rem; margin: 1rem 0; }
code, pre { background: var(--code-bg); border-radius: 8px; }
code { padding: .1em .3em; }
pre { padding: 1rem; overflow: auto; }
pre code { padding: 0; }
dl { display: grid; grid-template-columns: max-content 1fr; gap: .25rem 1rem; color: var(--muted); margin: 0; }
dt { font-weight: 500; }
dd { margin: 0; }
ul.note-list { list-style: none; padding: 0; }
ul.note-list li { padding: .5rem 0; border-bottom: 1px solid var(--border); }
ul.note-list li:last-child { border-bottom: none; }
ul.note-list small { color: var(--muted); margin-left: .5rem; }
.search-wrap { margin: 1.5rem 0; }
.search-wrap input {
  width: 100%; padding: .75rem 1rem; font-size: 1rem;
  background: var(--card); color: var(--fg);
  border: 1px solid var(--border); border-radius: 12px;
}
.search-wrap input:focus { outline: 2px solid var(--link); outline-offset: 2px; }
#search-results { margin-top: 1rem; }
#search-results .result { padding: .75rem; border-radius: 8px; }
#search-results .result:hover { background: color-mix(in srgb, var(--card) 80%, var(--link) 5%); }
#search-results .result .title { font-weight: 500; }
#search-results .result .snippet { color: var(--muted); font-size: .875rem; }
#search-results .result mark { background: color-mix(in srgb, var(--link) 30%, transparent); color: var(--fg); padding: 0 .15em; border-radius: 3px; }
.empty { color: var(--muted); font-style: italic; }
.cat-counts { display: flex; flex-wrap: wrap; gap: .5rem; color: var(--muted); font-size: .875rem; }
.cat-counts span { padding: .15rem .5rem; border-radius: 999px; background: var(--card); border: 1px solid var(--border); }
.redacted-link, .blocked-image { color: var(--redacted); font-style: italic; padding: 0 .15em; border-radius: 3px; background: color-mix(in srgb, var(--redacted) 18%, transparent); }
.wiki-link { border-bottom: 1px dashed currentColor; }
a[data-blocked] { color: var(--redacted); text-decoration: line-through; cursor: not-allowed; }
.copy-btn { float: right; font-size: .75rem; padding: .25rem .5rem; border: 1px solid var(--border); border-radius: 8px; background: transparent; color: var(--muted); cursor: pointer; }
.copy-btn:hover { color: var(--fg); }
.copy-btn.copied { color: #4ade80; }
.tag { display: inline-block; padding: .1rem .5rem; border-radius: 999px; background: color-mix(in srgb, var(--link) 15%, transparent); color: var(--link); font-size: .75rem; margin-right: .25rem; text-decoration: none; }
.warn { color: var(--warn); }
footer .links a { margin-right: 1rem; }
@media (max-width: 640px) {
  main { padding: 1rem; }
  header, footer { padding: 1rem; }
}
`;

export const SEARCH_JS = `(function(){
  var input = document.getElementById('search-input');
  var results = document.getElementById('search-results');
  if (!input || !results) return;
  var index = null;
  var indexUrl = input.dataset.index || 'search-index.json';
  function loadIndex(cb){
    if (index) return cb(index);
    fetch(indexUrl).then(function(r){ return r.json(); }).then(function(j){ index = Array.isArray(j) ? j : (j.notes || []); cb(index); }).catch(function(){ results.innerHTML = '<p class="empty">Search index unavailable.</p>'; });
  }
  function escapeHtml(s){ return String(s).replace(/[&<>"']/g, function(c){ return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c]; }); }
  function highlight(text, terms){
    if (!terms.length) return escapeHtml(text);
    var pattern = new RegExp('(' + terms.map(function(t){ return t.replace(/[.*+?^\${}()|[\\]\\\\]/g, '\\\\$&'); }).join('|') + ')', 'gi');
    return escapeHtml(text).replace(pattern, '<mark>$1</mark>');
  }
  function score(note, terms){
    var s = 0;
    var hay = (note.title + ' ' + (note.tags || []).join(' ') + ' ' + (note.text || '')).toLowerCase();
    for (var i = 0; i < terms.length; i++) {
      var t = terms[i].toLowerCase();
      if (!t) continue;
      if (note.title && note.title.toLowerCase().indexOf(t) >= 0) s += 10;
      if ((note.tags || []).some(function(x){ return String(x).toLowerCase().indexOf(t) >= 0; })) s += 5;
      var idx = hay.indexOf(t);
      if (idx >= 0) s += 1;
    }
    return s;
  }
  function snippet(text, terms){
    if (!text) return '';
    var lower = text.toLowerCase();
    var pos = -1;
    for (var i = 0; i < terms.length; i++) { var p = lower.indexOf(terms[i].toLowerCase()); if (p >= 0) { pos = p; break; } }
    if (pos < 0) return text.slice(0, 160);
    var start = Math.max(0, pos - 60);
    return (start > 0 ? '…' : '') + text.slice(start, start + 160) + (text.length > start + 160 ? '…' : '');
  }
  function render(q){
    if (!q.trim()) { results.innerHTML = ''; return; }
    loadIndex(function(items){
      var terms = q.toLowerCase().split(/\\s+/).filter(Boolean);
      var ranked = items.map(function(n){ return { n: n, s: score(n, terms) }; }).filter(function(x){ return x.s > 0; }).sort(function(a,b){ return b.s - a.s; }).slice(0, 20);
      if (!ranked.length) { results.innerHTML = '<p class="empty">No results for "' + escapeHtml(q) + '".</p>'; return; }
      results.innerHTML = ranked.map(function(r){
        return '<a class="result" href="' + escapeHtml(r.n.path || '#') + '">' +
               '<div class="title">' + highlight(r.n.title || r.n.id, terms) + '</div>' +
               '<div class="snippet">' + highlight(snippet(r.n.text || '', terms), terms) + '</div>' +
               '</a>';
      }).join('');
    });
  }
  var t;
  input.addEventListener('input', function(e){ clearTimeout(t); t = setTimeout(function(){ render(e.target.value); }, 50); });
  // pre-warm on focus
  input.addEventListener('focus', function(){ loadIndex(function(){}); });
})();`;

export const COPY_JS = `(function(){
  document.querySelectorAll('[data-copy-target]').forEach(function(btn){
    btn.addEventListener('click', function(){
      var sel = btn.getAttribute('data-copy-target');
      var el = document.querySelector(sel);
      if (!el) return;
      var fmt = btn.getAttribute('data-copy-format') || 'text';
      var content;
      if (fmt === 'markdown') {
        var title = el.querySelector('h1, h2, h3'); var body = el.cloneNode(true);
        body.querySelectorAll('.copy-btn').forEach(function(b){ b.remove(); });
        content = (title ? '# ' + title.textContent.trim() + '\\n\\n' : '') + body.textContent.trim();
      } else {
        var clone = el.cloneNode(true);
        clone.querySelectorAll('.copy-btn').forEach(function(b){ b.remove(); });
        content = clone.textContent.trim();
      }
      navigator.clipboard.writeText(content).then(function(){
        var orig = btn.textContent;
        btn.textContent = 'Copied'; btn.classList.add('copied');
        setTimeout(function(){ btn.textContent = orig; btn.classList.remove('copied'); }, 1200);
      });
    });
  });
})();`;

export const FAVICON_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="14" fill="#1d4ed8"/><path d="M16 20h32v6H16zM16 30h32v6H16zM16 40h22v6H16z" fill="#fff"/><circle cx="46" cy="43" r="6" fill="#8bd3ff"/></svg>`;

export const NOT_FOUND_BODY = `<h1>Not found</h1><p>That note isn't part of this memory bundle.</p><p><a href="index.html">Back to dashboard</a></p>`;
