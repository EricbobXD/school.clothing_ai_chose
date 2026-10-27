import test from 'node:test';
import assert from 'node:assert/strict';
import {weatherLabel,getWeather,searchPlaces} from './weather.js';
test('天氣代碼保留降雨優先，雪天列寒冷',()=>{
  assert.equal(weatherLabel(0),'晴朗');assert.equal(weatherLabel(3),'陰天');
  assert.equal(weatherLabel(61),'下雨');assert.equal(weatherLabel(95),'下雨');assert.equal(weatherLabel(73),'寒冷');
});
test('查詢參數、資料解析與錯誤處理',async()=>{
  const original=globalThis.fetch;
  try {
    globalThis.fetch=async url=>{assert.match(url,/current=temperature_2m%2Cweather_code/);return {ok:true,json:async()=>({current:{temperature_2m:19.6,weather_code:61,time:'2026-10-25T12:00'}})};};
    assert.deepEqual(await getWeather(25,121),{temperature:'20',weather:'下雨',time:'2026-10-25T12:00'});
    globalThis.fetch=async()=>({ok:true,json:async()=>({})});
    assert.deepEqual(await searchPlaces('台北'),[]);
    await assert.rejects(()=>getWeather(25,121),/不完整/);
    globalThis.fetch=async()=>({ok:false});await assert.rejects(()=>getWeather(25,121),/暫時無法使用/);
  }finally{globalThis.fetch=original;}
});
