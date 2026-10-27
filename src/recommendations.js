function paletteFor(mood, color) {
  const base = {'放鬆自在':['#e9e0cf','#7b8568','#f9f6ee'],'俐落自信':['#343f3b','#d6d3cb','#faf9f4'],'溫柔沉靜':['#c3ada0','#eee6da','#797f6d'],'活力亮眼':['#c4804e','#e9e1cc','#516d79']}[mood];
  return color ? [color,base[1],base[2]] : base;
}
function distance(a,b) { const rgb = x => [1,3,5].map(i => parseInt(x.slice(i,i+2),16)); return Math.hypot(...rgb(a).map((x,i)=>x-rgb(b)[i])); }
function selectItems(wardrobe, fixed, variant, palette, cold, occasion, rain, shape) {
  const selected = Array.isArray(fixed) ? [...fixed] : fixed ? [fixed] : [];
  for (const category of ['上衣','下身','外套','鞋子','配件']) {
    if (selected.some(item => item.category === category) || (category === '外套' && !cold && !rain && occasion !== '上班通勤')) continue;
    const score = item => {
      let value = -Math.min(...palette.map(color => distance(item.color,color))) / 100;
      if (item.thickness === (cold ? '保暖' : '輕薄')) value += 6;
      if (item.occasion === occasion) value += 5;
      if (item.occasion === '不限') value += 1;
      if (shape === '拉長比例' && item.fit === '高腰') value += 3;
      if (shape === '凸顯腰線' && item.fit === '高腰') value += 3;
      if (shape === '平衡肩線' && item.category === '下身' && ['直筒','寬鬆'].includes(item.fit)) value += 3;
      return value;
    };
    const items = wardrobe.filter(item => item.category === category).sort((a,b) => score(b)-score(a));
    const suitable = items.filter(item => !cold || !['上衣','外套'].includes(category) || item.thickness !== '輕薄');
    const candidates = suitable.length ? suitable : items;
    if (candidates.length) selected.push(candidates[variant % Math.min(candidates.length,2)]);
  }
  return selected;
}
export function buildRecommendation(data, fixed, variant, wardrobe = []) {
  const temperature = Number(data.temperature);
  const cold = temperature < 18 || data.weather === '寒冷';
  const warm = temperature >= 28 && !cold;
  const formal = data.occasion === '上班通勤';
  const fixedItems=Array.isArray(fixed)?fixed:fixed?[fixed]:[];
  const palette = paletteFor(data.mood, fixedItems[0]?.color);
  const items = selectItems(wardrobe, fixed, variant, palette, cold, data.occasion, data.weather === '下雨', data.shape);
  const top = cold ? '針織上衣' : formal ? '透氣襯衫' : variant ? '素色襯衫' : '棉質上衣';
  const bottom = formal ? '直筒西裝褲' : variant ? '高腰直筒褲' : '輕鬆寬褲';
  const outer = cold ? '保暖外套' : data.weather === '下雨' ? '輕量防潑水外套' : '薄襯衫外搭';
  const fit = {'自然':'保留活動空間，以合身肩線與自然垂墜的下身建立舒服輪廓。','平衡肩線':'選擇自然落肩或簡潔肩線，用直筒下身平衡整體視覺。','凸顯腰線':'選擇高腰下身，搭配上衣半紮或腰帶，呈現你喜歡的腰線。','拉長比例':'以高腰下身、上短下長的比例和同色鞋款延伸整體線條。'}[data.shape];
  const heightNote = data.height && Number(data.height) < 160 ? '可優先試穿九分下身，避免褲腳堆疊。' : data.height && Number(data.height) >= 180 ? '試穿時留意袖長、褲長與肩線，選擇活動自在的尺寸。' : '';
  const weatherNote = cold ? '以可增減的保暖層次為主，注意頸部與腳部保暖。' : warm ? '優先選擇輕薄透氣的布料，外出留意防曬。' : '使用輕量層次，方便因應室內外溫差。';
  const rainNote = data.weather === '下雨' ? '雨天搭配防滑鞋底與方便收納的雨具，避免拖地褲長。' : data.weather === '晴朗' ? '戶外可加帽子或其他防曬配件。' : '';
  const occasionNote = {'日常出門':'以好走的鞋款與輕便包袋完成日常造型。','上班通勤':'用整齊領口、俐落褲線與簡單包袋，增加正式感。','朋友聚會':'以一件特色配件增加造型記憶點。','約會時光':'利用柔和層次與細節配件，保留舒適也多一點精緻。','戶外走走':'選擇活動空間充足的版型、好走的鞋與輕便背包。'}[data.occasion];
  const moodNote = {'放鬆自在':'以低彩度自然色和柔軟材質營造自在感。','俐落自信':'以深淺對比與簡潔線條增加俐落感。','溫柔沉靜':'以柔和色階和細緻層次呈現沉靜氣氛。','活力亮眼':'選一個亮色作重點，其餘單品保持簡潔。'}[data.mood];
  const categories = ['上衣','下身',...(cold || data.weather === '下雨' || items.some(item => item.category === '外套') ? ['外套'] : [])];
  const defaults = {上衣:top,下身:bottom,外套:outer};
  const pieces = categories.map(category => {
    const item = items.find(item => item.category === category);
    return {category,item,label:item ? item.name : defaults[category]};
  });
  const missing = categories.filter(category => !items.some(item=>item.category===category));
  const searches = pieces.map(piece => piece.item ? [piece.item.thickness,piece.item.fit,piece.category].filter(Boolean).join(' ') : piece.label);
  const warnings = items.filter(item => cold && ['上衣','外套'].includes(item.category) && item.thickness === '輕薄').map(item => `「${item.name}」標示為輕薄，寒冷時請另外加上保暖層。`);
  const fitMatches=items.filter(item=>
    (['拉長比例','凸顯腰線'].includes(data.shape) && item.fit==='高腰') ||
    (data.shape==='平衡肩線' && item.category==='下身' && ['直筒','寬鬆'].includes(item.fit)));
  const fitEvidence=data.shape && data.shape!=='自然' ? fitMatches.length
    ? `本套已選用符合「${data.shape}」的衣物：${fitMatches.map(item=>item.name).join('、')}。`
    : `衣櫥目前沒有符合「${data.shape}」的已標記版型；本套先依天氣與場合挑選，以上版型方向供試穿參考。` : '';
  return {items,pieces,palette,warnings,title:variant ? '提案 02 / 換個角度的日常' : '提案 01 / 剛剛好的你',description:pieces.map(piece => piece.label).join(' ＋ '),fit:fit+' '+heightNote+' '+fitEvidence,weather:weatherNote+rainNote,context:occasionNote+moodNote,missing,searches};
}
