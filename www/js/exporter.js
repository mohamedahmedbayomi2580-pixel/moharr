(function (g) {
  const VOID = new Set(['img', 'input', 'hr']);
  const esc = s => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const slug = s => String(s).trim().toLowerCase().replace(/[^\w\u0600-\u06FF]+/g, '-').replace(/^-|-$/g, '') || 'page';
  const BASE = '*, *::before, *::after { box-sizing: border-box; }\nbody { margin: 0; font-family: Tahoma, Arial, sans-serif; direction: rtl; }\nimg { max-width: 100%; }\n';
  const APPJS = `'use strict';
// منطق المشروع: أضف هنا الربط مع قاعدة البيانات أو الـ API.
// لا تضع مفاتيح سرية هنا؛ أدرها من خادم خلفي آمن.
document.addEventListener('click', function (e) {
  var t = e.target.closest('[data-goto]');
  if (t) location.href = t.getAttribute('data-goto');
});
document.querySelectorAll('form').forEach(function (f) {
  f.addEventListener('submit', function (e) {
    e.preventDefault();
    // TODO: أرسل بيانات النموذج إلى الخادم هنا
  });
});
`;
  function build(project, opt = {}) {
    const p = Model.validate(project), enc = new TextEncoder();
    const files = [], css = [], warnings = [], slugs = {}, used = new Set(), imgs = new Map(), pagesHtml = {};
    p.pages.forEach((pg, i) => { let s = i ? slug(pg.name) : 'index', b = s, k = 2; while (used.has(s)) s = b + '-' + k++; used.add(s); slugs[pg.id] = s; });
    const cls = n => 'n-' + n.id;
    function asset(src) {
      const m = /^data:image\/([\w+.-]+);base64,(.+)$/.exec(src);
      if (!m || opt.preview) return src;
      if (imgs.has(src)) return imgs.get(src);
      const ext = { jpeg: 'jpg', 'svg+xml': 'svg' }[m[1]] || m[1];
      const path = 'assets/images/img-' + (imgs.size + 1) + '.' + ext;
      const bin = atob(m[2]), u = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i);
      files.push({ name: path, data: u }); imgs.set(src, path); return path;
    }
    function html(n, ind) {
      const e = Object.entries(n.style);
      if (e.length) css.push('.' + cls(n) + ' {\n' + e.map(([k, v]) => '  ' + k + ': ' + v + ';').join('\n') + '\n}');
      const a = ['class="' + cls(n) + '"'];
      for (const [k, v] of Object.entries(n.attrs)) {
        if (k === 'goto' || (k === 'href' && n.attrs.goto)) continue;
        if (k === 'href' && /^\s*javascript:/i.test(v)) continue;
        if (k === 'src') { a.push('src="' + esc(asset(v)) + '"'); continue; }
        a.push(k + '="' + esc(v) + '"');
      }
      if (n.attrs.goto) {
        const t = slugs[n.attrs.goto];
        if (!t) warnings.push('عنصر يشير إلى صفحة محذوفة (' + n.tag + ')');
        else a.push(n.tag === 'a' ? 'href="' + t + '.html"' : 'data-goto="' + t + '.html"');
      }
      if (n.tag === 'button' && !n.attrs.type) a.push('type="button"');
      if (n.tag === 'img' && !n.attrs.alt) warnings.push('صورة بدون نص بديل (alt)');
      const pad = '  '.repeat(ind), open = '<' + n.tag + ' ' + a.join(' ') + '>';
      if (VOID.has(n.tag)) return pad + open;
      if (!n.children.length) return pad + open + esc(n.text) + '</' + n.tag + '>';
      return pad + open + (n.text ? esc(n.text) : '') + '\n' + n.children.map(c => html(c, ind + 1)).join('\n') + '\n' + pad + '</' + n.tag + '>';
    }
    p.pages.forEach(pg => { pagesHtml[pg.id] = { slug: slugs[pg.id], title: pg.title, body: html(pg.root, 2) }; });
    const doc = (pg, head, tail) => '<!DOCTYPE html>\n<html lang="ar" dir="rtl">\n<head>\n  <meta charset="UTF-8">\n  <meta name="viewport" content="width=device-width, initial-scale=1">\n  <title>' + esc(pg.title) + '</title>\n' + head + '</head>\n<body>\n' + pg.body + '\n' + tail + '</body>\n</html>\n';
    const cssText = BASE + '\n' + css.join('\n\n') + '\n';
    if (opt.preview) {
      const pg = pagesHtml[opt.pageId] || Object.values(pagesHtml)[0];
      return { html: doc(pg, '  <style>' + cssText + '</style>\n', '') };
    }
    for (const pg of Object.values(pagesHtml)) files.push({ name: pg.slug + '.html', data: enc.encode(doc(pg, '  <link rel="stylesheet" href="css/style.css">\n', '  <script src="js/app.js"></script>\n')) });
    files.push({ name: 'css/style.css', data: enc.encode(cssText) });
    files.push({ name: 'js/app.js', data: enc.encode(APPJS) });
    files.push({ name: 'README.md', data: enc.encode('# ' + p.name + '\n\nمشروع واجهات ثابت (HTML/CSS/JS) مُصدَّر من My UI Builder.\n\n## التشغيل\nافتح `index.html` في المتصفح مباشرة، أو شغّل خادمًا محليًا: `npx serve .`\n\n## الملفات\n- `*.html` صفحات المشروع\n- `css/style.css` التنسيقات (لكل عنصر class بصيغة `n-<id>`)\n- `js/app.js` الجافاسكربت (التنقل بين الصفحات ومنع إرسال النماذج الافتراضي)\n- `assets/images` الصور\n\n## ملاحظة\nلا يوجد ربط بقاعدة بيانات؛ أضفه في `js/app.js` عبر REST API من خادم آمن، ولا تضع مفاتيح سرية في ملفات الواجهة.\n') });
    return { files, warnings: [...new Set(warnings)] };
  }
  g.Exporter = { build };
})(globalThis);
