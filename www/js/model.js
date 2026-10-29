(function (g) {
  const TAGS = new Set('main div section header footer nav form h1 h2 h3 p span a button img input textarea label hr table thead tbody tr th td ul li'.split(' '));
  const VOID = new Set(['img', 'input', 'hr']);
  const CONT = new Set(['main', 'div', 'section', 'header', 'footer', 'nav', 'form', 'td', 'th', 'li', 'ul', 'label']);
  const ATTRS = new Set(['id', 'src', 'href', 'alt', 'placeholder', 'name', 'type', 'goto', 'rows']);
  let c = 0;
  const uid = () => 'e' + Date.now().toString(36) + (c++).toString(36) + Math.random().toString(36).slice(2, 5);
  const node = (tag, text = '', style = {}, attrs = {}, children = []) => ({ id: uid(), tag, text, style, attrs, children });
  const PH = 'data:image/svg+xml;base64,' + btoa('<svg xmlns="http://www.w3.org/2000/svg" width="300" height="180"><rect width="100%" height="100%" fill="#dde3ea"/><text x="50%" y="50%" fill="#789" font-size="18" text-anchor="middle">Image</text></svg>');
  const th = t => node('th', t, { border: '1px solid #ddd', padding: '8px', 'text-align': 'right', background: '#f3f4f6' });
  const td = t => node('td', t, { border: '1px solid #ddd', padding: '8px', 'text-align': 'right' });
  const row = () => node('tr', '', {}, {}, [td('خلية'), td('خلية'), td('خلية')]);
  const input = () => node('input', '', { padding: '8px', border: '1px solid #ccc', 'border-radius': '4px' }, { placeholder: 'اكتب هنا', name: 'field', type: 'text' });
  const btn = (t, type) => node('button', t, { padding: '10px 20px', 'background-color': '#2563eb', color: '#fff', border: '0', 'border-radius': '6px', cursor: 'pointer' }, type ? { type } : {});
  const FACTORIES = {
    h1: () => node('h1', 'عنوان رئيسي', { margin: '0 0 12px' }),
    p: () => node('p', 'فقرة نصية. عدّل النص من لوحة الخصائص.', { margin: '0 0 12px', 'line-height': '1.7' }),
    button: () => btn('زر'),
    a: () => node('a', 'رابط', { color: '#2563eb' }, { href: '#' }),
    img: () => node('img', '', { 'max-width': '100%' }, { src: PH, alt: 'صورة' }),
    hr: () => node('hr', '', { border: '0', 'border-top': '1px solid #ddd', margin: '16px 0' }),
    div: () => node('div', '', { padding: '16px' }),
    row: () => node('div', '', { display: 'flex', gap: '12px', padding: '8px', 'flex-wrap': 'wrap' }),
    card: () => node('div', '', { padding: '16px', border: '1px solid #e5e7eb', 'border-radius': '8px', 'background-color': '#fff', 'box-shadow': '0 1px 3px rgba(0,0,0,.1)' }, {}, [node('h3', 'عنوان البطاقة', { margin: '0 0 8px' }), node('p', 'محتوى البطاقة', { margin: '0' })]),
    header: () => node('header', '', { padding: '16px', 'background-color': '#1f2937', color: '#fff' }, {}, [node('h2', 'اسم الموقع', { margin: '0' })]),
    nav: () => node('nav', '', { display: 'flex', gap: '16px', padding: '12px 16px', 'background-color': '#f3f4f6' }, {}, [node('a', 'الرئيسية', {}, { href: '#' }), node('a', 'عن الموقع', {}, { href: '#' })]),
    footer: () => node('footer', 'جميع الحقوق محفوظة', { padding: '16px', 'text-align': 'center', 'background-color': '#f3f4f6' }),
    input: input,
    textarea: () => node('textarea', '', { padding: '8px', border: '1px solid #ccc', 'border-radius': '4px' }, { placeholder: 'نص طويل', name: 'message', rows: '4' }),
    form: () => node('form', '', { display: 'flex', 'flex-direction': 'column', gap: '10px', 'max-width': '360px' }, {}, [input(), btn('إرسال', 'submit')]),
    table: () => node('table', '', { width: '100%', 'border-collapse': 'collapse' }, {}, [
      node('thead', '', {}, {}, [node('tr', '', {}, {}, [th('العمود 1'), th('العمود 2'), th('العمود 3')])]),
      node('tbody', '', {}, {}, [row(), row()])])
  };
  const PALETTE = [
    ['نصوص وأزرار', [['عنوان', 'h1'], ['فقرة', 'p'], ['زر', 'button'], ['رابط', 'a'], ['صورة', 'img'], ['فاصل', 'hr']]],
    ['حاويات', [['حاوية', 'div'], ['صف أفقي', 'row'], ['بطاقة', 'card'], ['ترويسة', 'header'], ['شريط تنقل', 'nav'], ['تذييل', 'footer']]],
    ['نماذج وجداول', [['حقل نص', 'input'], ['نص طويل', 'textarea'], ['نموذج', 'form'], ['جدول', 'table']]]
  ];
  function cleanNode(n, d) {
    if (!n || typeof n !== 'object' || d > 50) throw new Error('بنية عنصر غير صالحة');
    if (!TAGS.has(n.tag)) throw new Error('وسم غير مسموح: ' + n.tag);
    const o = { id: String(n.id || uid()).replace(/[^\w-]/g, '') || uid(), tag: n.tag, text: typeof n.text === 'string' ? n.text : '', attrs: {}, style: {}, children: [] };
    for (const [k, v] of Object.entries(n.attrs || {})) if (ATTRS.has(k) && typeof v === 'string') o.attrs[k] = v;
    for (const [k, v] of Object.entries(n.style || {})) if (/^[a-z-]+$/.test(k) && typeof v === 'string' && v.trim() && !/[{};<>]/.test(v)) o.style[k] = v.trim();
    if (!VOID.has(o.tag)) o.children = (Array.isArray(n.children) ? n.children : []).map(x => cleanNode(x, d + 1));
    return o;
  }
  function validate(p) {
    if (!p || typeof p !== 'object' || !Array.isArray(p.pages) || !p.pages.length) throw new Error('ملف المشروع غير صالح: لا توجد صفحات');
    const ids = new Set();
    return {
      id: String(p.id || uid()), name: String(p.name || 'مشروع'), updated: Number(p.updated) || Date.now(),
      pages: p.pages.map(pg => {
        const id = String(pg.id || uid()); if (ids.has(id)) throw new Error('معرّف صفحة مكرر');
        ids.add(id);
        const root = cleanNode(pg.root, 0); if (root.tag !== 'main') throw new Error('جذر الصفحة يجب أن يكون main');
        return { id, name: String(pg.name || 'صفحة'), title: String(pg.title || pg.name || 'صفحة'), root };
      })
    };
  }
  g.Model = { node, uid, FACTORIES, PALETTE, CONT, VOID, validate };
})(globalThis);
