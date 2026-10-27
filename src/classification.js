const options = {
  category:['上衣','下身','外套','鞋子','配件'],
  fit:['自然','合身','寬鬆','直筒','高腰'],
  thickness:['適中','輕薄','保暖'],
  occasion:['不限','日常出門','上班通勤','朋友聚會','約會時光','戶外走走'],
};
export function normalizePrediction(prediction) {
  if (!prediction || typeof prediction !== 'object') throw new Error('無效的辨識結果');
  const result = {};
  for(const [field,values] of Object.entries(options)) {
    if(values.includes(prediction[field])) result[field]=prediction[field];
  }
  if(/^#[0-9a-f]{6}$/i.test(prediction.color || '')) result.color=prediction.color;
  if(typeof prediction.notes==='string') result.notes=prediction.notes.slice(0,1000);
  if(!result.category) throw new Error('辨識結果缺少有效分類');
  return result;
}
// Inject a trusted adapter when a model provider is chosen. No network requests
// are made by default. Adapter receives the original Blob and returns fields
// accepted by normalizePrediction. Credentials belong on a backend.
export async function classifyGarment(file,adapter) {
  if(!adapter) return {status:'not-configured',fields:{}};
  try {
    return {status:'predicted',fields:normalizePrediction(await adapter(file))};
  } catch {
    return {status:'failed',fields:{}};
  }
}
