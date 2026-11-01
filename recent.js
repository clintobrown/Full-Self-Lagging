// Shows the truck's last tickets in purple under the "From past TS tickets" banner.
// Data: tickets/<truck-id>.json. Jira checkpoint: if that file is missing or older
// than 24h, the box tells the user to log into Jira and refresh it (see README).
(function(){
  var cache = {};
  var STALE_MS = 24 * 60 * 60 * 1000;
  var JIRA = 'https://jira.int.aurora.tech/issues/?jql=';
  function esc(s){ return String(s == null ? '' : s).replace(/[&<>"]/g, function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]; }); }
  function truckId(){ var p = document.querySelector('.pill.truck'); return p ? p.textContent.trim().toLowerCase() : ''; }
  function jiraLink(t){ return JIRA + encodeURIComponent('project = DTP AND summary ~ "' + t + '" ORDER BY created DESC'); }
  function findBanner(){
    var all = document.querySelectorAll('main *'), hit = null;
    for (var i = 0; i < all.length; i++) { if (all[i].textContent.indexOf('From past TS tickets') >= 0) hit = all[i]; }
    if (!hit) return null;
    return hit.textContent.indexOf('DTP') >= 0 ? hit : hit.parentElement;
  }
  function addStyle(){
    if (document.getElementById('rt-style')) return;
    var s = document.createElement('style'); s.id = 'rt-style';
    s.textContent = '.rt-box{margin:8px 0 0;padding:10px 12px;border-left:4px solid #9D4EDD;background:rgba(157,78,221,.10);border-radius:6px}'
    + '.rt-title{font-weight:900;font-size:16px;color:#9D4EDD;margin-bottom:4px}'
    + '.rt-box ul{margin:0;padding-left:20px}'
    + '.rt-box li{color:#9D4EDD;font-size:16px;margin:4px 0}'
    + '.rt-none{font-style:italic;opacity:.75}'
    + '.rt-warn{color:#9D4EDD;font-weight:800;font-size:15px;margin:4px 0;padding:6px 8px;border:2px dashed #9D4EDD;border-radius:6px}'
    + '.rt-foot{color:#9D4EDD;font-size:14px;margin-top:6px;opacity:.9}'
    + '.rt-box a{color:#9D4EDD;font-weight:800;text-decoration:underline}';
    document.head.appendChild(s);
  }
  function draw(){
    if (document.getElementById('rt-box')) return;
    var b = findBanner(), t = truckId();
    if (!b || !t) return;
    if (!(t in cache)) {
      cache[t] = null;
      fetch('./tickets/' + encodeURIComponent(t) + '.json').then(function(r){ return r.ok ? r.json() : {}; })
      .then(function(j){ cache[t] = j || {}; draw(); }).catch(function(){ cache[t] = {}; draw(); });
      return;
    }
    var d = cache[t];
    if (!d) return;
    var list = (d.tickets || []).slice(0, 5);
    var age = d.updated ? Date.now() - Date.parse(d.updated) : Infinity;
    var stale = !list.length || !(age < STALE_MS);
    addStyle();
    var html = '<div class="rt-title">Last ' + (list.length || 5) + ' tickets · ' + esc(t) + '</div>';
    if (stale) html += '<div class="rt-warn">' + (list.length ? 'Ticket history is over 24h old.' : 'No ticket history loaded for this truck.')
    + ' Jira checkpoint: log into Jira and refresh before troubleshooting.</div>';
    if (list.length) html += '<ul>' + list.map(function(k){
      return '<li><b>' + esc(k.key) + '</b> · ' + esc(k.date) + ' — Discrepancy: ' + esc(k.discrepancy)
      + ' · Resolution: ' + (k.resolution ? esc(k.resolution) : '<span class="rt-none">No resolution recorded</span>') + '</li>';
    }).join('') + '</ul>';
    html += '<div class="rt-foot">' + (d.updated ? 'Updated ' + esc(d.updated) + ' · ' : '')
    + '<a href="' + jiraLink(t) + '" target="_blank" rel="noopener">Open last tickets in Jira</a></div>';
    var box = document.createElement('div'); box.id = 'rt-box'; box.className = 'rt-box';
    box.innerHTML = html;
    b.insertAdjacentElement('afterend', box);
  }
  new MutationObserver(draw).observe(document.body, {childList: true, subtree: true});
  draw();
})();
