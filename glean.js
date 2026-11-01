// Truck history from Glean, opened from the "Truck history" button (no auto-open, so it doesn't cover the recent tickets box). Searches Glean for the truck's recent
// DTP tickets. If the operator isn't signed into Glean, Glean's own sign-in prompt
// shows inside the panel. Lives outside #app so render() doesn't wipe it each step.
(function(){
  var CFG = {
    backend: 'https://aurora-be.glean.com/',
    sdk: 'https://app.glean.com/embedded-search-latest.min.js',
    extra: 'DTP updated:past_month',
    filters: [{ key: 'app', value: 'jira' }]
  };
  var JIRA = 'https://jira.int.aurora.tech/issues/?jql=';
  var sdkP = null, autoFor = null, renderedFor = null, panel, fab;
  function truckId(){ var p = document.querySelector('.pill.truck'); return p ? p.textContent.trim().toLowerCase() : ''; }
  function jiraLink(t){ return JIRA + encodeURIComponent('project = DTP AND summary ~ "' + t + '" ORDER BY created DESC'); }
  function $(id){ return document.getElementById(id); }
  function msg(t){ $('gl-msg').textContent = t; $('gl-msg').hidden = !t; }
  function loadSdk(){
    if (window.GleanWebSDK) return Promise.resolve(window.GleanWebSDK);
    if (sdkP) return sdkP;
    sdkP = new Promise(function(res, rej){
      var s = document.createElement('script'); s.src = CFG.sdk; s.async = true;
      s.onload = function(){ window.GleanWebSDK ? res(window.GleanWebSDK) : rej(); };
      s.onerror = function(){ sdkP = null; rej(); };
      document.head.appendChild(s);
    });
    return sdkP;
  }
  function build(){
    if (panel) return;
    var st = document.createElement('style');
    st.textContent = '#gl-panel{position:fixed;left:0;right:0;bottom:0;height:50vh;z-index:20;background:var(--bg);border-top:2px solid var(--neon,#39ff88);box-shadow:0 -8px 30px rgba(0,0,0,.5);display:flex;flex-direction:column}'
    + '#gl-panel[hidden],#gl-fab[hidden],#gl-msg[hidden]{display:none}'
    + '.gl-head{display:flex;align-items:center;gap:10px;padding:10px 12px;border-bottom:1px solid var(--line)}'
    + '.gl-head b{flex:1;font-size:18px;color:var(--neon,#39ff88)}'
    + '#gl-msg{padding:10px 12px;font-size:16px;font-weight:700;color:var(--sig,#ffb000)}'
    + '#gl-results{flex:1;min-height:0}'
    + '.gl-foot{padding:8px 12px calc(8px + env(safe-area-inset-bottom,0px));font-size:15px;border-top:1px solid var(--line)}'
    + '.gl-foot a{color:var(--neon,#39ff88);font-weight:800}'
    + '#gl-fab{position:fixed;right:12px;bottom:96px;z-index:19;min-height:52px;padding:0 16px;border-radius:999px;border:1px solid var(--neon,#39ff88);background:var(--card);color:var(--neon,#39ff88);font-weight:800;font-size:17px}';
    document.head.appendChild(st);
    fab = document.createElement('button'); fab.id = 'gl-fab'; fab.textContent = 'Truck history'; fab.hidden = true;
    panel = document.createElement('section'); panel.id = 'gl-panel'; panel.hidden = true;
    panel.setAttribute('aria-label', 'Truck history from Glean');
    panel.innerHTML = '<div class="gl-head"><b id="gl-title">Truck history</b><button class="hbtn" id="gl-close">Close</button></div>'
    + '<div id="gl-msg" hidden></div><div id="gl-results"></div>'
    + '<div class="gl-foot"><a id="gl-jira" target="_blank" rel="noopener">Open DTP tickets in Jira instead</a></div>';
    document.body.appendChild(fab); document.body.appendChild(panel);
    fab.onclick = open; $('gl-close').onclick = hide;
  }
  function open(){ panel.hidden = false; fab.hidden = true; search(truckId()); }
  function hide(){ panel.hidden = true; fab.hidden = !truckId(); }
  function search(t){
    if (!t || renderedFor === t) return;
    $('gl-title').textContent = 'Truck history · ' + t;
    $('gl-jira').href = jiraLink(t);
    if (!navigator.onLine) { msg('Offline. Truck history needs signal.'); return; }
    msg('Loading truck history…');
    loadSdk().then(function(sdk){
      var box = $('gl-results'); box.innerHTML = '';
      sdk.renderSearchResults(box, {
        backend: CFG.backend,
        query: '"' + t + '" ' + CFG.extra,
        initialFilters: CFG.filters,
        hideAutocomplete: true
      });
      renderedFor = t; msg('');
    }).catch(function(){
      msg("Couldn't reach Glean (network/VPN, or this site isn't allow-listed in Glean). Use the Jira link below.");
    });
  }
  function tick(){
    build();
    var t = truckId();
    if (!t) { panel.hidden = true; fab.hidden = true; autoFor = null; return; }
    if (t !== autoFor) { autoFor = t; hide(); }
    else if (panel.hidden) fab.hidden = false;
  }
  new MutationObserver(tick).observe($('app'), { childList: true, subtree: true });
  window.addEventListener('online', function(){ if (panel && !panel.hidden) { renderedFor = null; search(truckId()); } });
  tick();
})();
