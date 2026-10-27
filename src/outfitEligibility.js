export function outfitEligibility(wardrobe, data, anchor = '') {
  const required=['上衣','下身'];
  const hasTemperature=data.temperature!=='' && data.temperature!=null && Number.isFinite(Number(data.temperature));
  if(data.weather==='寒冷' || data.weather==='下雨' || (hasTemperature && Number(data.temperature)<18)) required.push('外套');
  const missing=required.filter(category=>!wardrobe.some(item=>item.category===category));
  const ids=Array.isArray(anchor)?anchor:anchor?[anchor]:[];
  const fixed=ids.map(id=>wardrobe.find(item=>item.id===id));
  const anchorInvalid=fixed.some(item=>!item || item.category==='未分類') || new Set(fixed.map(item=>item?.category)).size!==fixed.length;
  return {required,missing,anchorInvalid,canGenerate:missing.length===0 && !anchorInvalid};
}
