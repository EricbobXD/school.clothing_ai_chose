import 'fake-indexeddb/auto';
import test from 'node:test';
import assert from 'node:assert/strict';
import { loadWardrobe, saveItems, deleteItem, clearWardrobe } from './wardrobeStore.js';

test('衣櫥保存原圖與標籤，可重新讀取、修改、刪除與清空',async()=>{
  await clearWardrobe();
  const item={id:'sample',name:'衣物.png',blob:new Blob(['image'],{type:'image/png'}),category:'未分類',url:'blob:temporary'};
  await saveItems([item]);
  let records=await loadWardrobe();
  assert.equal(records.length,1);
  assert.equal(records[0].category,'未分類');
  assert.equal(await records[0].blob.text(),'image');
  assert.equal(records[0].url,undefined);
  await saveItems([{...records[0],category:'上衣',fit:'寬鬆'}]);
  records=await loadWardrobe();
  assert.equal(records[0].category,'上衣');
  assert.equal(records[0].fit,'寬鬆');
  await deleteItem('sample');
  assert.deepEqual(await loadWardrobe(),[]);
  await saveItems([item,{...item,id:'another'}]);
  await clearWardrobe();
  assert.deepEqual(await loadWardrobe(),[]);
});
