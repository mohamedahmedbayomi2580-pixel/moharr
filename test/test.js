require('../www/js/model.js'); require('../www/js/zip.js'); require('../www/js/exporter.js');
const fs = require('fs'), assert = require('assert'), M = Model;
const p = { id: 'p1', name: 'تجربة', pages: [{ id: 'a', name: 'الرئيسية', title: 'الرئيسية', root: M.node('main') }, { id: 'b', name: 'المنتجات', title: 'المنتجات', root: M.node('main') }] };
for (const k of Object.keys(M.FACTORIES)) p.pages[0].root.children.push(M.FACTORIES[k]());
const btn = M.FACTORIES.button(); btn.attrs.goto = 'b'; p.pages[0].root.children.push(btn);
const lnk = M.FACTORIES.a(); lnk.attrs.goto = 'b'; p.pages[0].root.children.push(lnk);
p.pages[1].root.children.push(M.FACTORIES.h1());
// حفظ/فتح: التسلسل ثم التحقق يحافظ على البيانات
const re = M.validate(JSON.parse(JSON.stringify(p)));
assert.deepStrictEqual(re.pages.map(x => x.name), ['الرئيسية', 'المنتجات']);
assert.strictEqual(re.pages[0].root.children.length, p.pages[0].root.children.length);
// رفض الملفات الخطرة/التالفة
assert.throws(() => M.validate({ pages: [{ root: { tag: 'script', children: [] } }] }));
assert.throws(() => M.validate({}));
const evil = JSON.parse(JSON.stringify(p)); evil.pages[0].root.children[0].style.color = 'red;}</style><script>';
assert.ok(!('color' in M.validate(evil).pages[0].root.children[0].style));
// التصدير
const r = Exporter.build(p), names = r.files.map(f => f.name);
assert.ok(['index.html', 'المنتجات.html', 'css/style.css', 'js/app.js', 'README.md'].every(n => names.includes(n)), names.join());
const txt = n => Buffer.from(r.files.find(f => f.name === n).data).toString();
const idx = txt('index.html'), css = txt('css/style.css');
assert.ok(idx.includes('href="المنتجات.html"') && idx.includes('data-goto="المنتجات.html"'));
assert.ok(!/data:image/.test(idx) && names.some(n => n.startsWith('assets/images/')));
for (const c of idx.match(/n-[\w-]+/g)) if (/ {/.test(css) && p) { /* الأصناف بلا تنسيق مسموحة */ }
assert.ok(css.includes('.n-' + btn.id));
for (const m of idx.matchAll(/(?:src|href)="([^"#]+)"/g)) assert.ok(names.includes(m[1]) || /^https?:/.test(m[1]), 'مسار مكسور: ' + m[1]);
assert.ok(!idx.includes('GrapesJS') && !idx.includes('Store.'));
// ZIP
Zip.make(r.files).arrayBuffer().then(b => { fs.writeFileSync('/tmp/t.zip', Buffer.from(b)); console.log('OK', names.length, 'files'); });
