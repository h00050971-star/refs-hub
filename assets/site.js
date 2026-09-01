
function toast(msg, isError){
  var el = document.getElementById('toastbox');
  if(!el){
    el = document.createElement('div');
    el.id = 'toastbox';
    el.style.cssText = 'position:fixed;bottom:70px;right:16px;background:#1c1c1c;border:1px solid #333;border-radius:8px;padding:10px 14px;font-size:13px;z-index:60;max-width:280px;';
    document.body.appendChild(el);
  }
  el.style.color = isError ? '#ff8080' : '#7ee787';
  el.textContent = msg;
  el.style.display = 'block';
  clearTimeout(el._t);
  el._t = setTimeout(function(){ el.style.display = 'none'; }, 5000);
}
function getSelected(){
  try { return JSON.parse(localStorage.getItem('selected_reels')||'[]'); } catch(e){ return []; }
}
function setSelected(arr){ localStorage.setItem('selected_reels', JSON.stringify(arr)); updateSelCount(); }
function clearSelection(){
  setSelected([]);
  document.querySelectorAll('.selchk').forEach(function(c){ c.checked = false; });
}
function toggleSel(sc, checked){
  var sel = getSelected();
  var i = sel.indexOf(sc);
  if(checked && i===-1) sel.push(sc);
  if(!checked && i!==-1) sel.splice(i,1);
  setSelected(sel);
}
function restoreSelUI(){
  var sel = getSelected();
  document.querySelectorAll('.selchk').forEach(function(chk){
    chk.checked = sel.indexOf(chk.dataset.sc) !== -1;
  });
  updateSelCount();
}
function updateSelCount(){
  var el = document.getElementById('selcount');
  if(el) el.textContent = getSelected().length;
}
async function downloadSelectedTranscripts(){
  var sel = getSelected();
  if(!sel.length){ toast('Ничего не выбрано', true); return; }
  toast('Собираю тексты (' + sel.length + ')...');
  var parts = [];
  var errors = 0;
  for (var i=0;i<sel.length;i++){
    var sc = sel[i];
    try {
      var res = await fetch('../media/' + sc + '_export.txt');
      var text = res.ok ? await res.text() : '(текст недоступен)';
      if(!res.ok) errors++;
      parts.push('=== ' + sc + ' ===\n' + text.trim() + '\n');
    } catch(e){
      errors++;
      parts.push('=== ' + sc + ' ===\n(ошибка загрузки)\n');
    }
  }
  var blob = new Blob([parts.join('\n')], {type:'text/plain;charset=utf-8'});
  var a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'transcripts_selected.txt';
  document.body.appendChild(a);
  a.click();
  a.remove();
  toast(errors ? ('Файл скачан, но ' + errors + ' из ' + sel.length + ' без текста') : 'Файл скачан ✓', errors > 0);
}
var SITE_BASE = 'https://h00050971-star.github.io/refs-hub';
var _urlMapCache = null;
async function getUrlMap(){
  if(_urlMapCache) return _urlMapCache;
  try {
    var res = await fetch('../assets/urls.json');
    _urlMapCache = res.ok ? await res.json() : {};
  } catch(e){ _urlMapCache = {}; }
  return _urlMapCache;
}
async function downloadDesignBrief(){
  var sel = getSelected();
  if(!sel.length){ toast('Ничего не выбрано', true); return; }
  toast('Собираю ТЗ (' + sel.length + ')...');
  var urlMap = await getUrlMap();
  var parts = [];
  var missing = 0;
  for (var i=0;i<sel.length;i++){
    var sc = sel[i];
    var meta = urlMap[sc] || {};
    var block = '=== ' + sc + ' ===\n';
    if(meta.ref_code) block += 'Реф: ' + meta.ref_code + '\n';
    block += 'Оригинал: ' + (meta.url || 'н/д') + '\n';
    var nImg = meta.images || 0;
    if(nImg > 0){
      block += 'Картинки:\n';
      for (var j=0;j<nImg;j++){
        block += SITE_BASE + '/media/' + sc + '_' + j + '.jpg\n';
      }
    }
    try {
      var res = await fetch('../media/' + sc + '_design.txt');
      var text = res.ok ? (await res.text()).trim() : '';
      if(!text) missing++;
      block += '\n' + (text || '(дизайн-описание недоступно для этого поста)') + '\n';
    } catch(e){
      missing++;
      block += '\n(ошибка загрузки дизайн-описания)\n';
    }
    parts.push(block);
  }
  var blob = new Blob([parts.join('\n')], {type:'text/plain;charset=utf-8'});
  var a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'tz_dizain_karuselei.txt';
  document.body.appendChild(a);
  a.click();
  a.remove();
  toast(missing ? ('ТЗ скачано, но ' + missing + ' из ' + sel.length + ' без дизайн-описания (ещё не сгенерировано)') : 'ТЗ скачано ✓ — передай файл агенту-дизайнеру в Клоде', missing > 0);
}
var _refIndexCache = null;
async function getRefIndex(){
  if(_refIndexCache) return _refIndexCache;
  var base = location.pathname.includes('/pages/') ? '../' : '';
  try {
    var res = await fetch(base + 'assets/ref_index.json');
    _refIndexCache = res.ok ? await res.json() : {};
  } catch(e){ _refIndexCache = {}; }
  return _refIndexCache;
}
async function searchByRefCode(){
  var input = document.getElementById('refcodeInput');
  var val = (input.value || '').trim().toUpperCase();
  if(!val){ toast('Введи код, например REF-00042', true); return; }
  var idx = await getRefIndex();
  var info = idx[val];
  if(!info){ toast('Код не найден: ' + val, true); return; }
  var base = location.pathname.includes('/pages/') ? '' : 'pages/';
  location.href = base + info.page + '#card-' + val;
}
function highlightFromHash(){
  if(location.hash && location.hash.indexOf('#card-') === 0){
    var el = document.querySelector(location.hash);
    if(el){
      el.scrollIntoView({behavior:'smooth', block:'center'});
      el.classList.add('hl');
      setTimeout(function(){ el.classList.remove('hl'); }, 4000);
    } else {
      toast('Карточка ' + location.hash.replace('#card-','') + ' не найдена на этой странице', true);
    }
  }
}
function toggleAccordion(group){
  ['refs','theory','millionniki'].forEach(function(g){
    var el = document.getElementById('acc-' + g);
    var label = document.getElementById('label-' + g);
    if(!el) return;
    var open = (g === group);
    el.classList.toggle('collapsed', !open);
    if(label){
      var arrow = label.querySelector('.acc-arrow');
      if(arrow) arrow.textContent = open ? '▾' : '▸';
    }
  });
}
async function _collectSelectedTexts(label){
  var sel = getSelected();
  if(!sel.length){ toast('Ничего не выбрано', true); return null; }
  toast(label + ' (' + sel.length + ')...');
  var parts = [];
  var errors = 0;
  for (var i=0;i<sel.length;i++){
    var sc = sel[i];
    try {
      var res = await fetch('../media/' + sc + '_export.txt');
      var text = res.ok ? (await res.text()).trim() : '';
      if(!res.ok || !text) errors++;
      if(text) parts.push(text);
    } catch(e){
      errors++;
    }
  }
  if(!parts.length){ toast('Нет текста ни у одного выбранного', true); return null; }
  return {text: parts.join('\n\n'), errors: errors, total: sel.length};
}
function _downloadForSufler(text, filenamePrefix){
  var blob = new Blob([text], {type:'text/plain;charset=utf-8'});
  var a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filenamePrefix + '_' + Date.now() + '.txt';
  document.body.appendChild(a);
  a.click();
  a.remove();
}
async function sendToTeleprompter(){
  var res = await _collectSelectedTexts('Собираю тексты на суфлёр');
  if(!res) return;
  _downloadForSufler(res.text, 'na_sufler');
  clearSelection();
  toast(res.errors ? ('Отправлено, но ' + res.errors + ' из ' + res.total + ' без текста') : 'Отправлено на суфлёр ✓ (суфлёр должен быть открыт на компе)', res.errors > 0);
}
async function addToTeleprompter(){
  var res = await _collectSelectedTexts('Собираю тексты для добавления в суфлёр');
  if(!res) return;
  _downloadForSufler(res.text, 'dobavit_sufler');
  clearSelection();
  toast(res.errors ? ('Добавлено, но ' + res.errors + ' из ' + res.total + ' без текста') : 'Добавлено в суфлёр ✓ (суфлёр должен быть открыт на компе)', res.errors > 0);
}
function getShotSet(){
  try { return JSON.parse(localStorage.getItem('shot_items')||'{}'); } catch(e){ return {}; }
}
function setShotLocal(key, val){
  var s = getShotSet();
  if(val) s[key] = true; else delete s[key];
  localStorage.setItem('shot_items', JSON.stringify(s));
}
function toggleShot(key, btn){
  var cur = getShotSet()[key] === true;
  var next = !cur;
  setShotLocal(key, next);
  var card = document.getElementById('card-' + key) || (btn ? btn.closest('.card') : null);
  if(!card){
    document.querySelectorAll('.card[data-shotkey]').forEach(function(c){
      if(c.dataset.shotkey === key) card = c;
    });
  }
  if(card) card.classList.toggle('shot', next);
  if(btn) btn.innerHTML = next ? '&#8635;' : '&#10005;';
  var blob = new Blob([next ? 'mark' : 'unmark'], {type:'text/plain;charset=utf-8'});
  var a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'snyato--refs-hub--' + key + '--' + Date.now() + '.txt';
  document.body.appendChild(a);
  a.click();
  a.remove();
  toast(next ? 'Отмечено «Снято» ✓' : 'Метка «Снято» снята ✓');
}
function restoreShotUI(){
  var shots = getShotSet();
  document.querySelectorAll('.card[data-shotkey]').forEach(function(card){
    var key = card.dataset.shotkey;
    if(!(key in shots)) return;
    var next = shots[key] === true;
    card.classList.toggle('shot', next);
    var btn = card.querySelector('.shotbtn');
    if(btn) btn.innerHTML = next ? '&#8635;' : '&#10005;';
  });
}
function sortCards(dir){
  var grid = document.querySelector('.grid');
  if(!grid) return;
  var cards = Array.prototype.slice.call(grid.children);
  cards.sort(function(a,b){
    var da = a.dataset.date || '';
    var db = b.dataset.date || '';
    if(dir === 'desc') return da < db ? 1 : (da > db ? -1 : 0);
    return da > db ? 1 : (da < db ? -1 : 0);
  });
  cards.forEach(function(c){ grid.appendChild(c); });
  var descBtn = document.getElementById('sort-desc');
  var ascBtn = document.getElementById('sort-asc');
  if(descBtn) descBtn.classList.toggle('active', dir === 'desc');
  if(ascBtn) ascBtn.classList.toggle('active', dir === 'asc');
}
function sortByShot(mode){
  var grid = document.querySelector('.grid');
  if(!grid) return;
  var cards = Array.prototype.slice.call(grid.children);
  cards.sort(function(a,b){
    var sa = a.classList.contains('shot') ? 1 : 0;
    var sb = b.classList.contains('shot') ? 1 : 0;
    return mode === 'shot' ? (sb - sa) : (sa - sb);
  });
  cards.forEach(function(c){ grid.appendChild(c); });
  var unshotBtn = document.getElementById('sort-unshot');
  var shotBtn = document.getElementById('sort-shot');
  if(unshotBtn) unshotBtn.classList.toggle('active', mode === 'unshot');
  if(shotBtn) shotBtn.classList.toggle('active', mode === 'shot');
}
/* ---------- добавление рефа в контент-план "Тема" (client-hub) ---------- */
var TEMA_BASE = 'https://h00050971-star.github.io/client-hub/pages/';
var GH_TOKEN_KEY = 'gh_pat_client_hub';
var _temaMetaCache = null;
async function getTemaMeta(){
  if(_temaMetaCache) return _temaMetaCache;
  try {
    var res = await fetch(TEMA_BASE + 'tema_plan_data.js', {cache:'no-store'});
    var text = await res.text();
    var fakeWindow = {};
    (new Function('window', text))(fakeWindow);
    _temaMetaCache = { meta: fakeWindow.PLAN_META || {kinds:[]}, days: fakeWindow.PLAN_DAYS || [] };
  } catch(e){ _temaMetaCache = { meta:{kinds:[]}, days:[] }; }
  return _temaMetaCache;
}
function ghToken(promptIfMissing){
  var t = localStorage.getItem(GH_TOKEN_KEY);
  if(!t && promptIfMissing){
    t = window.prompt('Нужен GitHub-токен (fine-grained PAT на репозиторий client-hub, права Contents: Read & Write):');
    if(t) localStorage.setItem(GH_TOKEN_KEY, t.trim());
  }
  return t ? t.trim() : '';
}
function b64ToUtf8(b64){
  var bin = atob(b64.replace(/\n/g,''));
  var bytes = new Uint8Array(bin.length);
  for(var i=0;i<bin.length;i++) bytes[i]=bin.charCodeAt(i);
  return new TextDecoder('utf-8').decode(bytes);
}
function utf8ToB64(str){
  var bytes = new TextEncoder().encode(str), bin='';
  bytes.forEach(function(b){ bin += String.fromCharCode(b); });
  return btoa(bin);
}
var _planTargetKey = null;
var _planTargetMedia = null;
var _planTargetRefLink = null;
async function openPlanModal(key, btn){
  _planTargetKey = key;
  var urlMap = await getUrlMap();
  var meta = urlMap[key] || {};
  var capText = '';
  try {
    var r = await fetch('../media/' + key + '_export.txt');
    if(r.ok) capText = (await r.text()).trim();
  } catch(e){}
  var tema = await getTemaMeta();
  var days = tema.days || [];
  var kinds = tema.meta.kinds || [];
  if(!days.length){ toast('Не удалось загрузить план Тема (нет доступа к client-hub)', true); return; }

  if(meta.video){
    _planTargetMedia = { type:'video', url: SITE_BASE + '/media/' + key + '.mp4' };
  } else if(meta.images > 0){
    var mUrls = [];
    for(var mi=0; mi<meta.images; mi++) mUrls.push(SITE_BASE + '/media/' + key + '_' + mi + '.jpg');
    _planTargetMedia = { type:'images', urls: mUrls };
  } else {
    _planTargetMedia = { type:'missing' };
  }
  var pageFile = location.pathname.split('/').pop();
  _planTargetRefLink = SITE_BASE + '/pages/' + pageFile + '#card-' + (meta.ref_code || key);

  var modal = document.getElementById('planModal');
  if(!modal){
    modal = document.createElement('div');
    modal.id = 'planModal';
    modal.className = 'planmodal';
    document.body.appendChild(modal);
  }
  var defKind = meta.def_kind || (kinds[0] && kinds[0].k);
  var dayOpts = days.map(function(d){ return '<option value="'+d.d+'">'+d.d+' ('+d.w+')</option>'; }).join('');
  var kindOpts = kinds.map(function(k){ return '<option value="'+k.k+'"'+(k.k===defKind?' selected':'')+'>'+k.emoji+' '+k.label+'</option>'; }).join('');
  var esc = function(t){ return String(t==null?'':t).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); };
  var hookDefault = (meta.ref_code ? meta.ref_code + ': ' : '') + (capText ? capText.slice(0,80) : ('реф ' + key));
  var scriptDefault = 'Реф: ' + (meta.ref_code||key) + (meta.url ? ('\nОригинал: ' + meta.url) : '') + (capText ? ('\n\n' + capText) : '');
  modal.innerHTML =
    '<div class="planmodal-box">' +
      '<h3>Добавить в контент-план (Тема)</h3>' +
      '<label>Дата</label><select id="pm-date">' + dayOpts + '</select>' +
      '<label>Тип</label><select id="pm-kind">' + kindOpts + '</select>' +
      '<label>Хук</label><input type="text" id="pm-hook" value="' + esc(hookDefault) + '">' +
      '<label>Текст/заметка</label><textarea id="pm-script" rows="6">' + esc(scriptDefault) + '</textarea>' +
      '<div class="planmodal-btns">' +
        '<button onclick="savePlanItem()">Сохранить</button>' +
        '<button class="cancel" onclick="closePlanModal()">Отмена</button>' +
      '</div>' +
    '</div>';
  modal.classList.add('open');
}
function closePlanModal(){
  var modal = document.getElementById('planModal');
  if(modal) modal.classList.remove('open');
}
async function savePlanItem(){
  var date = document.getElementById('pm-date').value;
  var kind = document.getElementById('pm-kind').value;
  var hook = document.getElementById('pm-hook').value.trim();
  var script = document.getElementById('pm-script').value.trim();
  if(!hook){ toast('Хук не может быть пустым', true); return; }
  var token = ghToken(true);
  if(!token){ toast('Нет токена - не сохранено', true); return; }
  var GH_API = 'https://api.github.com/repos/h00050971-star/client-hub/contents/pages/tema_plan_state.json';
  toast('Сохраняю...');
  try {
    var sha = null, state = { done:{}, own:{}, edits:{} };
    var res = await fetch(GH_API, { headers:{Accept:'application/vnd.github+json'}, cache:'no-store' });
    if(res.status === 200){
      var data = await res.json();
      sha = data.sha;
      state = JSON.parse(b64ToUtf8(data.content));
    } else if(res.status !== 404){
      throw new Error('HTTP ' + res.status);
    }
    if(!state.own) state.own = {};
    if(!state.own[date]) state.own[date] = [];
    state.own[date].push({ k: kind, h: hook, s: script, media: _planTargetMedia, ref_link: _planTargetRefLink });
    var payload = JSON.stringify(state, null, 1);
    function doPut(shaVal){
      return fetch(GH_API, {
        method:'PUT',
        headers:{ Authorization:'Bearer ' + token, Accept:'application/vnd.github+json' },
        body: JSON.stringify({ message:'add from refs-hub: ' + _planTargetKey, content: utf8ToB64(payload), sha: shaVal || undefined, branch:'main' })
      });
    }
    var putRes = await doPut(sha);
    if(putRes.status === 409 || putRes.status === 422){
      var r2 = await fetch(GH_API, { headers:{ Authorization:'Bearer ' + token, Accept:'application/vnd.github+json' } });
      if(!r2.ok) throw new Error('не смог обновить sha перед повтором: HTTP ' + r2.status);
      var d2 = await r2.json();
      if(!d2.sha) throw new Error('сервер не вернул sha при повторе');
      putRes = await doPut(d2.sha);
    }
    if(!putRes.ok){
      var err = await putRes.json();
      throw new Error(err.message || putRes.status);
    }
    closePlanModal();
    toast('Добавлено в план Тема на ' + date + ' ✓');
  } catch(e){
    toast('Не сохранил: ' + e.message, true);
  }
}
function loadLazyVideo(v){
  if(!v || v.src || !v.dataset.src) return;
  v.preload = 'metadata';
  v.src = v.dataset.src;
  v.removeAttribute('data-src');
}
function lazyPlayVideo(vid){
  var v = document.getElementById(vid);
  if(!v) return;
  loadLazyVideo(v);
  v.play();
}
var lazyVideoObserver = ('IntersectionObserver' in window) ? new IntersectionObserver(function(entries){
  entries.forEach(function(entry){
    if(entry.isIntersecting){
      loadLazyVideo(entry.target);
      lazyVideoObserver.unobserve(entry.target);
    }
  });
}, { rootMargin: '800px 0px' }) : null;
function initLazyVideos(){
  document.querySelectorAll('video.lazyvideo[data-src]').forEach(function(v){
    if(lazyVideoObserver) lazyVideoObserver.observe(v);
    else loadLazyVideo(v);
  });
}
document.addEventListener('DOMContentLoaded', function(){
  restoreSelUI();
  restoreShotUI();
  sortCards('desc');
  highlightFromHash();
  initLazyVideos();
});
