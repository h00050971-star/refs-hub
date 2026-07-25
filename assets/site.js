
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
  if(!sel.length){ alert('Ничего не выбрано'); return; }
  var parts = [];
  for (var i=0;i<sel.length;i++){
    var sc = sel[i];
    try {
      var res = await fetch('../media/' + sc + '.txt');
      var text = res.ok ? await res.text() : '(транскрипт недоступен)';
      parts.push('=== ' + sc + ' ===\n' + text.trim() + '\n');
    } catch(e){
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
}
function toggleAccordion(group){
  ['refs','theory'].forEach(function(g){
    var el = document.getElementById('acc-' + g);
    if(!el) return;
    var open = (g === group);
    el.classList.toggle('collapsed', !open);
    var arrow = el.parentElement.querySelector('.acc-arrow');
    if(arrow) arrow.textContent = open ? '▾' : '▸';
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
document.addEventListener('DOMContentLoaded', function(){
  restoreSelUI();
  sortCards('desc');
});
