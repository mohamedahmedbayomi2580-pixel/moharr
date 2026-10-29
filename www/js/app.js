(() => {
  'use strict';
  const $ = s => document.querySelector(s), M = Model;
  const h = (t, p = {}, ...k) => { const e = document.createElement(t); Object.assign(e, p); e.append(...k); return e; };
  const clone = o => JSON.parse(JSON.stringify(o));
  let P, sel = null, pageId, hist = [], hi = -1, saveT, imgTarget = null;
  const status = t => $('#status').textContent = t;
  const page = () => P.pages.find(p => p.id === pageId) || P.pages[0];
  const find = (n, id, par = null) => { if (n.id === id) return { n, par }; for (const c of n.children) { const r = find(c, id, n); if (r) return r; } return null; };
  const fresh = name => ({ id: M.uid(), name: name || 'مشروع جديد', updated: Date.now(), pages: [{ id: M.uid(), name: 'الرئيسية', title: 'الرئيسية', root: M.node('main') }] });
  function reId(n) { n.id = M.uid(); n.children.forEach(reId); return n; }

  // ---- التاريخ والحفظ ----
  function commit() { hist = hist.slice(0, hi + 1); hist.push(JSON.stringify(P)); if (hist.length > 100) hist.shift(); hi = hist.length - 1; changed(); render(); }
  function changed() { status('غير محفوظ…'); clearTimeout(saveT); saveT = setTimeout(save, 1200); }
  async function save() { clearTimeout(saveT); P.updated = Date.now(); try { await Store.put(clone(P)); status('تم الحفظ ' + new Date().toLocaleTimeString('ar-EG')); } catch (e) { status('فشل الحفظ: ' + e.message); alert('فشل الحفظ: ' + e.message); } }
  function load(p) { P = p; pageId = P.pages[0].id; sel = null; hist = [JSON.stringify(P)]; hi = 0; render(); status('جاهز'); }
  function undo(d) { const i = hi + d; if (i < 0 || i >= hist.length) return; hi = i; P = JSON.parse(hist[i]); if (!P.pages.some(p => p.id === pageId)) pageId = P.pages[0].id; if (sel && !find(page().root, sel)) sel = null; changed(); render(); }

  // ---- العرض ----
  function dom(n) {
    const e = document.createElement(n.tag); e.dataset.nid = n.id;
    for (const [k, v] of Object.entries(n.style)) e.style.setProperty(k, v);
    const A = n.attrs;
    if (n.tag === 'img') { e.src = A.src || ''; e.alt = A.alt || ''; }
    if (A.placeholder) e.placeholder = A.placeholder;
    if (n.tag === 'input' || n.tag === 'textarea') e.readOnly = true;
    if (n.text) e.append(n.text);
    n.children.forEach(c => e.append(dom(c)));
    if (n.id === sel) e.classList.add('sel');
    return e;
  }
  function render() {
    $('#canvas').replaceChildren(dom(page().root));
    $('#bUndo').disabled = hi <= 0; $('#bRedo').disabled = hi >= hist.length - 1;
    renderPages(); renderProps();
  }
  function renderPages() {
    const box = $('#pages'), s = h('select', { onchange: e => { pageId = e.target.value; sel = null; render(); } });
    P.pages.forEach((p, i) => s.append(h('option', { value: p.id, selected: p.id === pageId, textContent: (i ? '' : '⌂ ') + p.name })));
    box.replaceChildren(h('div', { className: 'grp', textContent: 'المشروع: ' + P.name }), s, h('div', { className: 'bar' },
      h('button', { textContent: '+ صفحة', onclick: () => { const n = prompt('اسم الصفحة'); if (!n) return; const p = { id: M.uid(), name: n, title: n, root: M.node('main') }; P.pages.push(p); pageId = p.id; sel = null; commit(); } }),
      h('button', { textContent: 'إعادة تسمية', onclick: () => { const n = prompt('الاسم الجديد', page().name); if (n) { page().name = n; page().title = n; commit(); } } }),
      h('button', { textContent: 'نسخ', onclick: () => { const p = clone(page()); p.id = M.uid(); p.name += ' (نسخة)'; reId(p.root); P.pages.push(p); pageId = p.id; commit(); } }),
      h('button', { textContent: 'حذف', onclick: () => { if (P.pages.length < 2) return alert('لا يمكن حذف الصفحة الوحيدة'); if (!confirm('حذف الصفحة؟')) return; P.pages = P.pages.filter(p => p.id !== pageId); pageId = P.pages[0].id; sel = null; commit(); } }),
      h('button', { textContent: 'جعلها الرئيسية', onclick: () => { const i = P.pages.findIndex(p => p.id === pageId); P.pages.unshift(...P.pages.splice(i, 1)); commit(); } })));
  }
  const SF = [['العرض', 'width'], ['الارتفاع', 'height'], ['أدنى ارتفاع', 'min-height'], ['أقصى عرض', 'max-width'], ['هامش داخلي', 'padding'], ['هامش خارجي', 'margin'], ['لون النص', 'color', 1], ['لون الخلفية', 'background-color', 1], ['حجم الخط', 'font-size'], ['وزن الخط', 'font-weight'], ['محاذاة النص', 'text-align'], ['الحدود', 'border'], ['الزوايا', 'border-radius'], ['الظل', 'box-shadow'], ['الشفافية', 'opacity'], ['display', 'display'], ['flex-direction', 'flex-direction'], ['gap', 'gap'], ['justify-content', 'justify-content'], ['align-items', 'align-items'], ['flex-wrap', 'flex-wrap']];
  function renderProps() {
    const box = $('#fields'); box.replaceChildren();
    const f = sel && find(page().root, sel);
    if (!f) { box.append(h('p', { textContent: 'اختر عنصرًا من مساحة التصميم لتعديل خصائصه.' })); return; }
    const n = f.n, field = (label, val, cb, el = 'input') => { const i = h(el, { value: val || '' }); i.onchange = () => cb(i.value); box.append(h('label', { className: 'f' }, label, i)); return i; };
    box.append(h('div', { className: 'grp', textContent: 'العنصر: ' + n.tag }));
    box.append(h('div', { className: 'bar' },
      h('button', { textContent: '↑', title: 'للأعلى', onclick: () => mv(-1) }), h('button', { textContent: '↓', title: 'للأسفل', onclick: () => mv(1) }),
      h('button', { textContent: 'تكرار', onclick: dup }), h('button', { textContent: 'حذف', onclick: del })));
    if (!M.VOID.has(n.tag)) field('النص', n.text, v => { n.text = v; commit(); }, 'textarea');
    const at = (k, label) => field(label, n.attrs[k], v => { v ? n.attrs[k] = v : delete n.attrs[k]; commit(); });
    at('id', 'المعرّف (id)');
    if (n.tag === 'img') { box.append(h('button', { textContent: 'رفع صورة…', onclick: () => { imgTarget = n.id; $('#fImg').click(); } })); at('alt', 'نص بديل (alt)'); }
    if (n.tag === 'a') at('href', 'الرابط (href)');
    if (n.tag === 'a' || n.tag === 'button') {
      const s = h('select'); s.append(h('option', { value: '', textContent: '— بدون انتقال —' }));
      P.pages.forEach(p => s.append(h('option', { value: p.id, textContent: p.name, selected: n.attrs.goto === p.id })));
      s.onchange = () => { s.value ? n.attrs.goto = s.value : delete n.attrs.goto; commit(); };
      box.append(h('label', { className: 'f' }, 'الانتقال إلى صفحة', s));
    }
    if (n.tag === 'input' || n.tag === 'textarea') { at('name', 'الاسم البرمجي (name)'); at('placeholder', 'نص إرشادي'); }
    if (n.tag === 'input' || n.tag === 'button') at('type', 'النوع (type)');
    box.append(h('div', { className: 'grp', textContent: 'التنسيق' }));
    SF.forEach(([label, k, color]) => {
      const i = h('input', { value: n.style[k] || '' }), set = v => { v ? n.style[k] = v : delete n.style[k]; commit(); };
      i.onchange = () => set(i.value.trim());
      const row = h('div', { className: 'cr' }, i);
      if (color) { const c = h('input', { type: 'color' }); c.onchange = () => set(c.value); row.append(c); }
      box.append(h('label', { className: 'f' }, label, row));
    });
  }

  // ---- عمليات ----
  const isCont = n => M.CONT.has(n.tag);
  function add(key, targetId) {
    const f = find(page().root, targetId || sel || page().root.id) || find(page().root, page().root.id);
    let t = f.n; if (!isCont(t)) t = f.par || page().root;
    const nn = M.FACTORIES[key](); t.children.push(nn); sel = nn.id; commit();
  }
  function mv(d) { const f = sel && find(page().root, sel); if (!f || !f.par) return; const a = f.par.children, i = a.indexOf(f.n), j = i + d; if (j < 0 || j >= a.length) return; [a[i], a[j]] = [a[j], a[i]]; commit(); }
  function dup() { const f = sel && find(page().root, sel); if (!f || !f.par) return; const c = reId(clone(f.n)); f.par.children.splice(f.par.children.indexOf(f.n) + 1, 0, c); sel = c.id; commit(); }
  function del() { const f = sel && find(page().root, sel); if (!f || !f.par) return; f.par.children.splice(f.par.children.indexOf(f.n), 1); sel = null; commit(); }

  // ---- نوافذ ----
  const modal = (t, ...c) => { $('#mt').textContent = t; $('#mb').replaceChildren(...c); $('#modal').hidden = false; };
  $('#mx').onclick = () => $('#modal').hidden = true;
  async function openDlg() {
    const list = (await Store.list()).sort((a, b) => b.updated - a.updated);
    modal('المشاريع المحفوظة', ...(list.length ? list.map(p => h('div', { className: 'row' }, h('span', { textContent: p.name + ' — ' + new Date(p.updated).toLocaleString('ar-EG') }), h('span', {},
      h('button', { textContent: 'فتح', onclick: () => { try { load(M.validate(p)); $('#modal').hidden = true; } catch (e) { alert('مشروع تالف: ' + e.message); } } }),
      h('button', { textContent: 'نسخ', onclick: async () => { const c = clone(p); c.id = M.uid(); c.name += ' (نسخة)'; await Store.put(c); openDlg(); } }),
      h('button', { textContent: 'حذف', onclick: async () => { if (confirm('حذف المشروع نهائيًا؟')) { await Store.del(p.id); openDlg(); } } })))) : [h('p', { textContent: 'لا توجد مشاريع محفوظة بعد. (الحفظ محلي على هذا الجهاز فقط ولا يتزامن بين الأجهزة.)' })]));
  }
  function exportBuild() { try { return Exporter.build(P); } catch (e) { alert('فشل التصدير: ' + e.message); return null; } }
  async function saveFile(name, blob) {
    const C = window.Capacitor;
    if (C && C.isNativePlatform && C.isNativePlatform() && C.Plugins && C.Plugins.Filesystem) {
      const b64 = await new Promise(r => { const f = new FileReader(); f.onload = () => r(f.result.split(',')[1]); f.readAsDataURL(blob); });
      await C.Plugins.Filesystem.writeFile({ path: name, data: b64, directory: 'CACHE' });
      const u = await C.Plugins.Filesystem.getUri({ path: name, directory: 'CACHE' });
      await C.Plugins.Share.share({ title: name, url: u.uri }); return;
    }
    const a = h('a', { href: URL.createObjectURL(blob), download: name }); document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 5000);
  }
  const fname = () => P.name.replace(/[^\w\u0600-\u06FF-]+/g, '_') || 'project';

  // ---- ربط الأحداث ----
  const cv = $('#canvas');
  cv.addEventListener('click', e => { e.preventDefault(); const el = e.target.closest('[data-nid]'); sel = el ? el.dataset.nid : null; render(); });
  cv.addEventListener('dragover', e => { e.preventDefault(); cv.querySelectorAll('.over').forEach(x => x.classList.remove('over')); const el = e.target.closest('[data-nid]'); el && el.classList.add('over'); });
  cv.addEventListener('dragleave', () => cv.querySelectorAll('.over').forEach(x => x.classList.remove('over')));
  cv.addEventListener('drop', e => { e.preventDefault(); const k = e.dataTransfer.getData('text/plain'), el = e.target.closest('[data-nid]'); if (M.FACTORIES[k]) add(k, el && el.dataset.nid); });
  M.PALETTE.forEach(([g, items]) => { $('#pal').append(h('div', { className: 'grp', textContent: g })); items.forEach(([l, k]) => $('#pal').append(h('button', { className: 'it', textContent: l, draggable: true, title: 'اسحب إلى التصميم أو انقر للإضافة', ondragstart: e => e.dataTransfer.setData('text/plain', k), onclick: () => add(k) }))); });
  $('#bNew').onclick = async () => { const n = prompt('اسم المشروع الجديد (مشروع فارغ)', 'مشروع جديد'); if (n) { load(fresh(n)); await save(); } };
  $('#bOpen').onclick = openDlg; $('#bSave').onclick = save;
  $('#bUndo').onclick = () => undo(-1); $('#bRedo').onclick = () => undo(1);
  $('#dev').onchange = e => cv.style.width = e.target.value;
  $('#bPrev').onclick = () => { const r = Exporter.build(P, { preview: true, pageId }); modal('معاينة: ' + page().name, h('iframe', { sandbox: '', srcdoc: r.html })); };
  $('#bCode').onclick = () => { const r = exportBuild(); if (!r) return; const dec = new TextDecoder(), txt = r.files.filter(f => /\.(html|css|js|md)$/.test(f.name));
    const s = h('select'), ta = h('textarea', { readOnly: true }); txt.forEach(f => s.append(h('option', { textContent: f.name })));
    s.onchange = () => ta.value = dec.decode(txt.find(f => f.name === s.value).data); s.onchange();
    modal('الكود المُصدَّر', s, ta, h('button', { textContent: 'نسخ الكود', onclick: () => navigator.clipboard.writeText(ta.value).then(() => status('تم النسخ')) })); };
  $('#bExp').onclick = async () => { const r = exportBuild(); if (!r) return; await saveFile(fname() + '.zip', Zip.make(r.files)); status('تم التصدير (' + r.files.length + ' ملف)'); if (r.warnings.length) alert('تنبيهات:\n- ' + r.warnings.join('\n- ')); };
  $('#bBak').onclick = () => saveFile(fname() + '.backup.json', new Blob([JSON.stringify(P, null, 1)], { type: 'application/json' }));
  $('#bImp').onclick = () => $('#fImp').click();
  $('#fImp').onchange = async e => { const f = e.target.files[0]; e.target.value = ''; if (!f) return; try { const p = M.validate(JSON.parse(await f.text())); p.id = M.uid(); load(p); await save(); } catch (er) { alert('ملف غير صالح: ' + er.message); } };
  $('#fImg').onchange = e => { const f = e.target.files[0]; e.target.value = ''; if (!f || !imgTarget) return; if (f.size > 5e6) return alert('الصورة أكبر من 5MB');
    const r = new FileReader(); r.onload = () => { const x = find(page().root, imgTarget); if (x) { x.n.attrs.src = r.result; commit(); } }; r.readAsDataURL(f); };
  document.addEventListener('keydown', e => {
    const typing = /INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName), k = e.key.toLowerCase(), c = e.ctrlKey || e.metaKey;
    if (c && k === 's') { e.preventDefault(); save(); } else if (typing) return;
    else if (c && k === 'z') { e.preventDefault(); undo(-1); } else if (c && k === 'y') { e.preventDefault(); undo(1); }
    else if (c && k === 'd') { e.preventDefault(); dup(); } else if (k === 'delete') del();
  });
  window.addEventListener('beforeunload', e => { if (/غير محفوظ/.test($('#status').textContent)) { save(); e.preventDefault(); } });
  (async () => { try { const l = (await Store.list()).sort((a, b) => b.updated - a.updated); load(l.length ? M.validate(l[0]) : fresh()); if (!l.length) await save(); } catch (e) { load(fresh()); status('تعذر فتح التخزين المحلي: ' + e.message); } })();
})();
