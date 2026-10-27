import test from 'node:test';
import assert from 'node:assert/strict';
import { outfitEligibility } from './outfitEligibility.js';
const data={weather:'晴朗',temperature:'25'};
const basics=[{id:'top',category:'上衣'},{id:'bottom',category:'下身'}];
test('空衣櫥、只有配件、或未分類不能產生',()=>{
  for(const wardrobe of [[],[{category:'配件'}],[{category:'未分類'}],[basics[0]]]) assert.equal(outfitEligibility(wardrobe,data).canGenerate,false);
  assert.deepEqual(outfitEligibility([],data).missing,['上衣','下身']);
});
test('至少上衣加下身；不強制鞋子配件',()=>{
  assert.equal(outfitEligibility(basics,data).canGenerate,true);
});
test('尚未取得氣溫時不當作零度而要求外套',()=>{
  assert.deepEqual(outfitEligibility([], {...data,temperature:''}).required,['上衣','下身']);
});
test('寒冷、低溫與雨天都需要外套',()=>{
  for(const context of [{...data,weather:'寒冷'},{...data,temperature:'15'},{...data,weather:'下雨'}]){
    assert.deepEqual(outfitEligibility(basics,context).missing,['外套']);
    assert.equal(outfitEligibility([...basics,{category:'外套'}],context).canGenerate,true);
  }
});
test('指定不存在或未分類的衣物也會阻擋',()=>{
  assert.equal(outfitEligibility(basics,data,'missing').canGenerate,false);
  assert.equal(outfitEligibility([...basics,{id:'unknown',category:'未分類'}],data,'unknown').canGenerate,false);
  assert.equal(outfitEligibility(basics,data,'top').canGenerate,true);
});
test('可指定跨分類多件，同分類衝突則阻擋',()=>{
  assert.equal(outfitEligibility(basics,data,['top','bottom']).canGenerate,true);
  assert.equal(outfitEligibility([...basics,{id:'top2',category:'上衣'}],data,['top','top2']).canGenerate,false);
});
