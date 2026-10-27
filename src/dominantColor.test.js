import test from 'node:test';
import assert from 'node:assert/strict';
import { dominantColorFromPixels, isStrictWhite, analyzeColors } from './dominantColor.js';

test('保留白衣與黑衣的主色',()=>{
  assert.equal(dominantColorFromPixels([255,255,255,255]),'#ffffff');
  assert.equal(dominantColorFromPixels([0,0,0,255]),'#000000');
});
test('忽略透明背景與幾乎透明的邊緣',()=>{
  assert.equal(dominantColorFromPixels([255,255,255,0,255,0,0,100,12,32,50,255]),'#0c2032');
  assert.equal(dominantColorFromPixels([255,255,255,0]),null);
  assert.equal(dominantColorFromPixels([]),null);
});
test('取最大色群而非混合整張圖片的平均值',()=>{
  assert.equal(dominantColorFromPixels([200,20,20,255,204,24,24,255,20,20,240,255]),'#ca1616');
});
test('同一色群以透明度加權，輸出有效色碼',()=>{
  assert.equal(dominantColorFromPixels([16,32,48,255,20,36,52,128]),'#112131');
});
test('白色要求所有通道至少245，且色差不超過6',()=>{
  assert.equal(isStrictWhite(255,255,255),true);
  assert.equal(isStrictWhite(245,245,251),true);
  assert.equal(isStrictWhite(244,244,244),false);
  assert.equal(isStrictWhite(245,245,252),false);
  assert.equal(isStrictWhite(255,250,240),false);
});
test('白色不再與同一舊色桶中的淺灰或米色合併',()=>{
  const red=[200,20,20,255];
  assert.equal(dominantColorFromPixels([
    255,255,255,255, 241,241,241,255, 255,250,240,255,
    ...red,...red,
  ]),'#c81414');
});
test('多個真正白色像素仍形成白色色群，保留實際平均色',()=>{
  assert.equal(dominantColorFromPixels([255,255,255,255,245,245,245,255,200,20,20,255]),'#fafafa');
});
test('相近藍色色群合併，白色保留為第二色',()=>{
  const pixels=[20,40,150,255,30,45,160,255,255,255,255,255];
  const result=analyzeColors(pixels);
  assert.equal(result.colors.length,2);
  assert.equal(result.colors[0].share,2/3);
  assert.equal(result.colors[1].white,true);
  assert.equal(result.primary,result.colors[0].color);
});
test('白色集中邊緣且非白色比例足夠才略過白色主色',()=>{
  const pixels=[];let center=0;
  for(let y=0;y<10;y++)for(let x=0;x<10;x++){
    const edge=x===0||y===0||x===9||y===9;
    const red=!edge && center++<24;
    pixels.push(...(red?[200,20,20,255]:[255,255,255,255]));
  }
  const result=analyzeColors(pixels,10,10);
  assert.equal(result.colors[0].white,true);
  assert.equal(result.primary,'#c81414');
  assert.equal(result.reason,'white-border-suspected');
  assert.equal(analyzeColors(pixels).primary,'#ffffff');
});
test('幾乎全白與非邊緣白色保留白色主色',()=>{
  const pixels=Array.from({length:100},(_,i)=>i<96?[255,255,255,255]:[200,20,20,255]).flat();
  assert.equal(analyzeColors(pixels,10,10).primary,'#ffffff');
  const noBorderWhite=Array.from({length:100},(_,i)=>{
    const x=i%10,y=Math.floor(i/10);return x===0||y===0||x===9||y===9?[200,20,20,255]:[255,255,255,255];
  }).flat();
  assert.equal(analyzeColors(noBorderWhite,10,10).primary,'#ffffff');
});
test('任何顏色過度集中於邊框時，可改選中央色群',()=>{
  const pixels=[];let center=0;
  for(let y=0;y<10;y++)for(let x=0;x<10;x++){
    const edge=x===0||y===0||x===9||y===9;
    pixels.push(...(!edge && center++<24?[200,20,20,255]:[20,40,180,255]));
  }
  const result=analyzeColors(pixels,10,10);
  assert.equal(result.primary,'#c81414');
  assert.equal(result.reason,'border-color-suspected');
  assert.equal(result.colors[0].color,'#1428b4');
  assert.equal(result.colors[0].edgeShare,1);
  assert.equal(result.colors[1].centerShare,24/64);
  assert.equal(analyzeColors(pixels).primary,'#1428b4');
});
test('占比高但沒有中央替代色證據，不應排除衣物主色',()=>{
  const pixels=Array.from({length:100},(_,i)=>i<95?[0,0,0,255]:[200,20,20,255]).flat();
  assert.equal(analyzeColors(pixels,10,10).primary,'#000000');
  const uniform=Array.from({length:100},()=>[20,40,180,255]).flat();
  assert.equal(analyzeColors(uniform,10,10).primary,'#1428b4');
});
test('超過九成的背景色仍可排除，不再要求主色介於70%到90%',()=>{
  const pixels=[];
  for(let y=0;y<10;y++)for(let x=0;x<10;x++){
    const central=x>=4&&x<=5&&y>=3&&y<=6;
    pixels.push(...(central?[200,20,20,255]:[20,40,180,255]));
  }
  const result=analyzeColors(pixels,10,10);
  assert.equal(result.colors[0].share,0.92);
  assert.equal(result.primary,'#c81414');
});
test('主色不足70%但同時占比與邊緣最多時，也優先中央另一色',()=>{
  const pixels=[];
  for(let y=0;y<10;y++)for(let x=0;x<10;x++){
    const central=x>=2&&x<=7&&y>=2&&y<=7;
    pixels.push(...(central?[200,20,20,255]:[20,40,180,255]));
  }
  assert.equal(analyzeColors(pixels,10,10).primary,'#c81414');
});
