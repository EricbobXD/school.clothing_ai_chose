import test from 'node:test';
import assert from 'node:assert/strict';
import {classifyGarment,normalizePrediction} from './classification.js';

test('未設定模型時不發送請求，也不偽造預測',async()=>{
  assert.deepEqual(await classifyGarment(new Blob()),{status:'not-configured',fields:{}});
});
test('模型結果只接受合法欄位，保留可編輯備註',async()=>{
  const file=new Blob(['photo']);
  const result=await classifyGarment(file,async received=>{
    assert.equal(received,file);
    return {category:'上衣',fit:'寬鬆',occasion:'上班通勤',notes:'可能是襯衫',color:'#123456',id:'untrusted'};
  });
  assert.equal(result.status,'predicted');
  assert.equal(result.fields.notes,'可能是襯衫');
  assert.equal(result.fields.id,undefined);
  assert.equal(normalizePrediction({category:'上衣',fit:'不合法',color:'invalid'}).fit,undefined);
});
test('模型錯誤或無效分類回報失敗，可保留原圖進行人工處理',async()=>{
  assert.equal((await classifyGarment(new Blob(),async()=>{throw new Error('offline');})).status,'failed');
  assert.equal((await classifyGarment(new Blob(),async()=>({category:'unknown'}))).status,'failed');
});
