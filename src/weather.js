export function weatherLabel(code) {
  if([71,73,75,77,85,86].includes(code)) return '寒冷';
  if(code>=51) return '下雨';
  return code<=1?'晴朗':'陰天';
}
async function readJSON(url,signal) {
  const response=await fetch(url,{signal});
  if(!response.ok)throw new Error('天氣服務暫時無法使用，請手動填寫。');
  return response.json();
}
export async function searchPlaces(name,signal) {
  const data=await readJSON('https://geocoding-api.open-meteo.com/v1/search?'+new URLSearchParams({name,count:'5',language:'zh',format:'json'}),signal);
  return data.results || [];
}
export async function getWeather(latitude,longitude,signal) {
  const data=await readJSON('https://api.open-meteo.com/v1/forecast?'+new URLSearchParams({latitude,longitude,current:'temperature_2m,weather_code',timezone:'auto'}),signal);
  if(!Number.isFinite(data.current?.temperature_2m)||!Number.isFinite(data.current?.weather_code))throw new Error('天氣資料不完整，請手動填寫。');
  return {temperature:String(Math.round(data.current.temperature_2m)),weather:weatherLabel(data.current.weather_code),time:data.current.time};
}
