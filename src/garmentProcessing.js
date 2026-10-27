import { classifyGarment } from './classification.js';
import { extractColorAnalysis } from './dominantColor.js';
export async function prepareGarment(file, classifier) {
  const image = new Image();
  const preview = URL.createObjectURL(file);
  let color = null;
  let colorAnalysis = null;
  try {
    image.src = preview; await image.decode();
    try { colorAnalysis = extractColorAnalysis(image); color = colorAnalysis.primary; } catch { /* Keep the image editable if Canvas extraction fails. */ }
  }
  finally { URL.revokeObjectURL(preview); }
  const prediction = await classifyGarment(file,classifier);
  return {
    id:crypto.randomUUID(),name:file.name,blob:file,
    category:'未分類',fit:'未設定',thickness:'未設定',occasion:'不限',notes:'',
    ...prediction.fields,
    color:color || prediction.fields.color || '#78816a',
    colorSource:color ? 'image' : prediction.fields.color ? 'model' : 'default',
    colorAnalysis,
    processing:{classification:prediction.status,backgroundRemoval:'not-configured',colorExtraction:color ? 'completed' : 'failed'},
    prediction:prediction.fields,reviewed:false,
  };
}
