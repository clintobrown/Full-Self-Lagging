// Shows the truck's last tickets in purple under the "From past TS tickets" banner.
// Data: tickets/<truck-id>.json. No file for a truck = nothing shown.
(function(){
  var cache = {};
  function esc(s){ return String(s == null ? '' : s).replace(/[&<>"]/g, function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]; }); }
  function truckId(){ var p = document.querySelector('.pill.truck'); return p ? p.textContent.trim().toLowerCase() : ''; }
  function findBanner(){
    var all = document.querySelectorAll('main *'), hit = null;
    for (var i = 0; i < all.length; i++) { if (all[i].textContent.indexOf('From past TS tickets') >= 0) hit = all[i]; }
    if (!hit) return null;
    return hit.textContent.indexOf('DTP') >= 0 ? hit : hit.parentElement;
  }
  function addStyle(){
    if (document.getElementById('rt-style')) return;
    var s = document.createElement('style'); s.id = 'rt-style';
    s.textContent = '.rt-box{margin:8px 0 0;padding:10px 12px;border-left:4px solid #7B2CBF;background:rgba(123,44,191,.08);border-radius:6px}'
    + '.rt-title{font-weight:900;font-size:16px;color:#7B2CBF;margin-bottom:4px}'
    + '.rt-box ul{margin:0;padding-left:20px}'
    + '.rt-box li{color:#7B2CBF;font-size:16px;margin:4px 0}'
    + '.rt-none{font-style:italic;opacity:.75}'
    + '[data-theme="night"] .rt-title,[data-theme="night"] .rt-box li{color:#C77DFF}'
    + '[data-theme="night"] .rt-box{border-left-color:#C77DFF}';
    document.head.appendChild(s);
  }
  function draw(){
    if (document.getElementById('rt-box')) return;
    var b = findBanner(), t = truckId();
    if (!b || !t) return;
    if (!(t in cache)) {
      cache[t] = null;
      fetch('./tickets/' + encodeURIComponent(t) + '.json').then(function(r){ return r.ok ? r.json() : {tickets: []}; })
      .then(function(j){ cache[t] = j; draw(); }).catch(function(){ cache[t] = {tickets: []}; });
      return;
    }
    var d = cache[t];
    if (!d || !d.tickets || !d.tickets.length) return;
    addStyle();
    var box = document.createElement('div'); box.id = 'rt-box'; box.className = 'rt-box';
    box.innerHTML = '<div class="rt-title">Last ' + Math.min(5, d.tickets.length) + ' tickets · ' + esc(t) + '</div><ul>'
    + d.tickets.slice(0, 5).map(function(k){
      return '<li><b>' + esc(k.key) + '</b> · ' + esc(k.date) + ' — Discrepancy: ' + esc(k.discrepancy)
      + ' · Resolution: ' + (k.resolution ? esc(k.resolution) : '<span class="rt-none">No resolution recorded</span>') + '</li>';
    }).join('') + '</ul>';
    b.insertAdjacentElement('afterend', box);
  }
  new MutationObserver(draw).observe(document.body, {childList: true, subtree: true});
  draw();
})();
