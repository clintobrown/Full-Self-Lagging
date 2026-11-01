// Colors the DTP numbers in the "From past TS tickets" banner purple (each opens that
// ticket in Jira) and adds a "Truck History More Details" button that opens this
// truck's DTP tickets in Jira, newest first. No saved ticket copies, so nothing goes stale.
(function(){
  var JIRA = 'https://jira.int.aurora.tech/';
  function truckId(){ var p = document.querySelector('.pill.truck'); return p ? p.textContent.trim().toLowerCase() : ''; }
  function historyLink(t){ return JIRA + 'issues/?jql=' + encodeURIComponent('project = DTP AND summary ~ "' + t + '" ORDER BY created DESC'); }
  function findBanner(){
    var all = document.querySelectorAll('main *'), hit = null;
    for (var i = 0; i < all.length; i++) { if (all[i].textContent.indexOf('From past TS tickets') >= 0) hit = all[i]; }
    if (!hit) return null;
    return hit.textContent.indexOf('DTP') >= 0 ? hit : hit.parentElement;
  }
  function addStyle(){
    if (document.getElementById('rt-style')) return;
    var s = document.createElement('style'); s.id = 'rt-style';
    s.textContent = '.rt-dtp{color:#9D4EDD;font-weight:800;text-decoration:underline}'
    + '.rt-row{margin-top:10px}'
    + '.rt-btn{display:inline-flex;align-items:center;min-height:48px;padding:0 16px;border-radius:999px;border:2px solid #9D4EDD;background:rgba(157,78,221,.10);color:#9D4EDD;font-weight:800;font-size:16px;text-decoration:none}';
    document.head.appendChild(s);
  }
  function linkDtps(b){
    var w = document.createTreeWalker(b, NodeFilter.SHOW_TEXT), n, list = [];
    while ((n = w.nextNode())) { if (/DTP-\d+/.test(n.nodeValue) && !n.parentNode.closest('a')) list.push(n); }
    list.forEach(function(n){
      var s = n.nodeValue, re = /DTP-\d+/g, m, i = 0, f = document.createDocumentFragment();
      while ((m = re.exec(s))) {
        f.appendChild(document.createTextNode(s.slice(i, m.index)));
        var a = document.createElement('a'); a.className = 'rt-dtp'; a.href = JIRA + 'browse/' + m[0];
        a.target = '_blank'; a.rel = 'noopener'; a.textContent = m[0];
        f.appendChild(a); i = re.lastIndex;
      }
      f.appendChild(document.createTextNode(s.slice(i)));
      n.parentNode.replaceChild(f, n);
    });
  }
  function draw(){
    var b = findBanner(), t = truckId();
    if (!b || !t || b.getAttribute('data-rt') === t) return;
    b.setAttribute('data-rt', t);
    addStyle();
    linkDtps(b);
    var row = document.createElement('div'); row.className = 'rt-row';
    var btn = document.createElement('a'); btn.className = 'rt-btn'; btn.href = historyLink(t);
    btn.target = '_blank'; btn.rel = 'noopener'; btn.textContent = 'Truck History More Details';
    row.appendChild(btn); b.appendChild(row);
  }
  new MutationObserver(draw).observe(document.body, {childList: true, subtree: true});
  draw();
})();
