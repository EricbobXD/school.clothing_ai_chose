const DB_NAME = 'yixu-wardrobe';
function openDatabase() {
  return new Promise((resolve,reject) => {
    const request = indexedDB.open(DB_NAME,1);
    request.onupgradeneeded = () => request.result.createObjectStore('items',{keyPath:'id'});
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
    request.onblocked = () => reject(new Error('請關閉其他衣序分頁後再試。'));
  });
}
async function transaction(mode,operation) {
  const db = await openDatabase();
  return new Promise((resolve,reject) => {
    const tx = db.transaction('items',mode);
    const request = operation(tx.objectStore('items'));
    tx.oncomplete = () => { db.close(); resolve(request?.result); };
    tx.onabort = tx.onerror = () => { db.close(); reject(tx.error || new Error('衣櫥儲存失敗')); };
  });
}
export const loadWardrobe = () => transaction('readonly',store=>store.getAll());
export const saveItems = items => transaction('readwrite',store=>{ for(const {url,...item} of items) store.put(item); });
export const deleteItem = id => transaction('readwrite',store=>store.delete(id));
export const clearWardrobe = () => transaction('readwrite',store=>store.clear());
