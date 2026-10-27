import test from 'node:test';
import assert from 'node:assert/strict';
import { buildRecommendation } from './recommendations.js';

const base = {temperature:'25',weather:'晴朗',occasion:'日常出門',mood:'放鬆自在',shape:'自然',height:'170'};
test('情境、身形與心情會影響建議', () => {
  assert.equal(buildRecommendation(base,undefined,0).missing.length,2);
  assert.match(buildRecommendation({...base,weather:'寒冷'},undefined,0).description,/保暖外套/);
  assert.match(buildRecommendation({...base,weather:'下雨'},undefined,0).weather,/防滑/);
  assert.match(buildRecommendation({...base,occasion:'上班通勤'},undefined,0).description,/西裝褲/);
  assert.match(buildRecommendation({...base,shape:'凸顯腰線'},undefined,0).fit,/高腰/);
  assert.notDeepEqual(buildRecommendation(base,undefined,0).palette,buildRecommendation({...base,mood:'活力亮眼'},undefined,0).palette);
});
test('兩個提案都保留指定衣物與其主色', () => {
  const fixed={id:'fixed',category:'下身',name:'test.png',color:'#123456',url:'blob:test'};
  const wardrobe=[fixed,{id:'top',category:'上衣',color:'#e9e0cf'}];
  for(const variant of [0,1]) {
    const result=buildRecommendation(base,fixed,variant,wardrobe);
    assert.ok(result.items.some(item=>item.id==='fixed'));
    assert.equal(result.palette[0],'#123456');
    assert.equal(result.missing.length,0);
  }
});
test('雨天會選取外套，文字描述與實際照片一致', () => {
  const wardrobe = [
    {id:'t',name:'我的條紋上衣.png',category:'上衣',color:'#eeeeee',fit:'寬鬆',thickness:'適中',occasion:'不限'},
    {id:'j',name:'我的雨衣.png',category:'外套',color:'#777777',fit:'自然',thickness:'輕薄',occasion:'不限'},
  ];
  const result = buildRecommendation({...base,weather:'下雨'},undefined,0,wardrobe);
  assert.ok(result.items.some(item=>item.id==='j'));
  assert.match(result.description,/我的條紋上衣.png/);
  assert.match(result.description,/我的雨衣.png/);
  assert.doesNotMatch(result.description,/棉質上衣/);
});
test('寒冷時優先保暖；指定輕薄衣物仍保留並提醒', () => {
  const thin={id:'thin',name:'薄上衣',category:'上衣',color:'#eeeeee',thickness:'輕薄',occasion:'不限'};
  const warm={...thin,id:'warm',name:'厚上衣',thickness:'保暖'};
  const data={...base,weather:'寒冷',temperature:'10'};
  assert.equal(buildRecommendation(data,undefined,0,[thin,warm]).items[0].id,'warm');
  const fixed=buildRecommendation(data,thin,0,[thin,warm]);
  assert.equal(fixed.items[0].id,'thin');
  assert.match(fixed.warnings[0],/保暖層/);
});
test('場合與版型標籤影響衣物排序', () => {
  const casual={id:'casual',name:'日常褲',category:'下身',color:'#e9e0cf',fit:'自然',thickness:'適中',occasion:'日常出門'};
  const office={...casual,id:'office',name:'通勤褲',fit:'高腰',occasion:'上班通勤'};
  assert.equal(buildRecommendation({...base,occasion:'上班通勤',shape:'拉長比例'},undefined,0,[casual,office]).items[0].id,'office');
});
test('多件指定衣物在兩套都保留',()=>{
  const fixed=[{id:'top',name:'指定上衣',category:'上衣',color:'#ffffff'},{id:'bottom',name:'指定褲',category:'下身',color:'#333333'}];
  for(const variant of [0,1])assert.deepEqual(buildRecommendation(base,fixed,variant,fixed).items.map(item=>item.id),['top','bottom']);
});
test('平衡肩線會偏好直筒下身，結果說明實際符合情況',()=>{
  const pants=[{id:'a',name:'合身褲',category:'下身',fit:'合身',color:'#7b8568'},{id:'b',name:'直筒褲',category:'下身',fit:'直筒',color:'#7b8568'}];
  const result=buildRecommendation({...base,shape:'平衡肩線'},undefined,0,pants);
  assert.equal(result.items[0].id,'b');assert.match(result.fit,/本套已選用.*直筒褲/);
  assert.match(buildRecommendation({...base,shape:'凸顯腰線'},undefined,0,pants).fit,/目前沒有符合/);
});
