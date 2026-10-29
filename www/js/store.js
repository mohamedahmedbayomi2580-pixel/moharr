const Store = (() => {
  let db;
  const open = () => db ? Promise.resolve(db) : new Promise((res, rej) => {
    const r = indexedDB.open('my-ui-builder', 1);
    r.onupgradeneeded = () => r.result.createObjectStore('projects', { keyPath: 'id' });
    r.onsuccess = () => res(db = r.result); r.onerror = () => rej(r.error);
  });
  const tx = (mode, f) => open().then(d => new Promise((res, rej) => {
    const t = d.transaction('projects', mode), q = f(t.objectStore('projects'));
    t.oncomplete = () => res(q.result); t.onerror = () => rej(t.error);
  }));
  return { list: () => tx('readonly', s => s.getAll()), get: id => tx('readonly', s => s.get(id)), put: p => tx('readwrite', s => s.put(p)), del: id => tx('readwrite', s => s.delete(id)) };
})();
