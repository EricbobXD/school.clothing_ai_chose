import { useEffect, useRef, useState } from 'react';
import { buildRecommendation } from './recommendations.js';
import { loadWardrobe, saveItems, deleteItem, clearWardrobe } from './wardrobeStore.js';
import { prepareGarment } from './garmentProcessing.js';
import CropColorDialog from './CropColorDialog.jsx';
import { outfitEligibility } from './outfitEligibility.js';
import WeatherLocation from './WeatherLocation.jsx';
import WardrobePicker from './WardrobePicker.jsx';
import AddGarmentsDialog from './AddGarmentsDialog.jsx';
import AnimatedDisclosure from './AnimatedDisclosure.jsx';
import FeedbackPage from './FeedbackPage.jsx';
const routeFromHash=()=>({ '#closet':'closet','#about':'about','#feedback':'feedback'}[window.location.hash] || 'studio');

const categories=['未分類','上衣','下身','外套','鞋子','配件'];
function ColorDialog({item,onUpdate,disabled,onCrop,onClose}) {
 const dialog=useRef(null);
 useEffect(()=>{dialog.current.showModal();},[]);
 return <dialog className="color-dialog" ref={dialog} onClose={onClose} aria-labelledby="color-title"><h2 id="color-title">衣物主色</h2><div className="item-colors"><button type="button" className="quiet crop-trigger" disabled={disabled} onClick={()=>onCrop()}>框選衣物取色</button><label>主色 <span>{item.colorSource === "crop" ? "框選取色" : item.colorSource === "manual" ? "手動設定" : item.colorSource === "image" ? "照片自動取色" : item.colorSource === "model" ? "模型建議" : "參考色，請確認"}</span><input type="color" disabled={disabled} value={item.color} onChange={event=>onUpdate(item.id,{color:event.target.value,colorSource:"manual"})} /></label><div className="detected-colors">{item.colorAnalysis?.colors?.map(sample=><button type="button" aria-pressed={sample.color===item.color} className="color-candidate" key={sample.color} disabled={disabled} onClick={()=>onUpdate(item.id,{color:sample.color,colorSource:"manual"})} aria-label={"使用顏色 "+sample.color} title={sample.color}><i style={{background:sample.color}} />{Math.round(sample.share*100)}%{sample.white?" 白色":""}</button>)}</div><p className="small">{["white-border-suspected","border-color-suspected"].includes(item.colorAnalysis?.reason)?"占比最高的色群也最集中於邊緣，疑似背景，已改選中央的另一色；可點選原色切回。":"保留前兩個主要色群，可點選切換主色。"} {item.colorAnalysis?.reason === "user-crop" ? "目前色票來自你框選的區域。" : "背景雜亂時，請框選衣物再取色。"}</p></div><button type="button" className="quiet" onClick={onClose}>完成</button></dialog>;
}

function ItemEditor({item,onUpdate,onRemove,disabled}) {
  const [cropping,setCropping]=useState(false),[colorOpen,setColorOpen]=useState(false);
  const [notes,setNotes]=useState(item.notes || "");
  return <div className="item"><div className="item-photo"><img src={item.url} alt={item.name} /><button type="button" className="main-color-dot" style={{background:item.color}} aria-label={"查看或修改主色 "+item.color} title="查看／修改主色" onClick={()=>setColorOpen(true)} /></div><button type="button" disabled={disabled} onClick={()=>onRemove(item.id)} aria-label={'移除 '+item.name}>×</button><p>{item.name}</p><div className="item-hashtags">{[["category",item.category],["fit",item.fit],["thickness",item.thickness],["occasion",item.occasion]].filter(([,value])=>value && !["未設定","不限"].includes(value)).map(([field,value])=><span className={"item-badge tag-"+field} key={field}>#{value}</span>)}</div><p className="small">{item.reviewed?"已人工調整":item.processing?.classification==="predicted"?"模型預填 · 請確認":item.processing?.classification==="failed"?"辨識失敗 · 可手動補充":"待辨識 · 模型尚未設定"}</p><AnimatedDisclosure title="確認／調整衣物資料"><fieldset disabled={disabled}>{[['category','分類',categories],['fit','版型',['未設定','自然','合身','寬鬆','直筒','高腰']],['thickness','厚薄',['未設定','適中','輕薄','保暖']],['occasion','適用場合',['不限','日常出門','上班通勤','朋友聚會','約會時光','戶外走走']]].map(([field,label,options])=><label key={field}>{label}<select value={item[field]} onChange={event=>onUpdate(item.id,{[field]:event.target.value})}>{options.map(value=><option key={value}>{value}</option>)}</select></label>)}<label>備註<textarea rows={3} maxLength={1000} value={notes} placeholder="例如：容易皺、適合搭哪件衣物…" onChange={event=>setNotes(event.target.value)} onBlur={()=>{if(notes!==(item.notes || ""))onUpdate(item.id,{notes});}} /></label></fieldset></AnimatedDisclosure>{colorOpen && <ColorDialog item={item} onUpdate={onUpdate} disabled={disabled} onCrop={()=>setCropping(true)} onClose={()=>setColorOpen(false)} />}{cropping && <CropColorDialog item={item} onSave={onUpdate} onClose={()=>setCropping(false)} />}</div>;
}

function Outfit({ proposal: p }) {
  return <article className="outfit"><h3>{p.title}</h3><p><strong>衣物組合</strong></p><div className="outfit-images">{p.items.map(item => <figure key={item.id}><img src={item.url} alt={item.name} /><figcaption>{item.name}<br />{[item.fit,item.thickness,item.occasion].filter(Boolean).join(' · ')}</figcaption></figure>)}</div><p>{p.description}</p>{p.missing.length > 0 && <p>建議補充（尚無照片）：{p.pieces.filter(piece => !piece.item).map(piece => piece.label).join('、')}</p>}<p><strong>版型理由</strong><br />{p.fit}</p><p>{p.weather}</p>{p.warnings.map(warning => <p className="outfit-warning" key={warning}>{warning}</p>)}<p><strong>配色與場合</strong><br />{p.context}</p><div className="palette">{p.palette.map((color,i) => <i key={i} style={{background:color}} title={color} />)}</div><p><strong>看看相似款式</strong></p>{p.searches.map((term,i) => <a key={i} target="_blank" rel="noopener noreferrer" href={'https://www.google.com/search?tbm=shop&q='+encodeURIComponent(term)}>{term} ↗</a>)}</article>;
}
function Results({ result }) {
  const { data, fixed, proposals } = result;
  return <><p className="eyebrow">YOUR DAILY STYLE EDIT</p><h2>今天的你，剛剛好。</h2><p>{data.weather} · {data.temperature}°C / {data.occasion}<br />{data.mood}{fixed?.length > 0 && ' · 已指定 '+fixed.map(item=>item.name).join('、')}{data.location && <><br />天氣來源：{data.location} · {data.weatherTime?.replace('T',' ')}</>}</p><Outfit proposal={proposals[0]} /><details className="alternative"><summary>看看另一種搭法</summary><p className="small">衣物較少時，兩套可能使用相同單品。</p><Outfit proposal={proposals[1]} /></details><div className="result-note">依衣物資料與配色提供建議；模型預填資料可隨時校正。<br />賣場連結為搜尋結果。</div></>;
}

export default function App({ classifier } = {}) {
  const [wardrobe, setWardrobe] = useState([]);
  const [page,setPage]=useState(routeFromHash);
  const [closetFilter,setClosetFilter]=useState("全部");
  useEffect(()=>{window.scrollTo({top:0,behavior:"instant"});},[page]);
  useEffect(()=>{const change=()=>{setPage(routeFromHash());};window.addEventListener("hashchange",change);return()=>window.removeEventListener("hashchange",change);},[]);
  const [loading,setLoading]=useState(true);
  const [saving,setSaving]=useState(false);
  const [clearMode,setClearMode]=useState(false);
  const [anchor, setAnchor] = useState([]);
  const [picking,setPicking]=useState(false),[weatherReset,setWeatherReset]=useState(0);
  const [shape,setShape]=useState('自然');
  const [uploading, setUploading] = useState(false);
  const [status, setStatus] = useState('');
  const [result, setResult] = useState(null);
  const [context,setContext]=useState({weather:"晴朗",temperature:""});
  const [adding,setAdding]=useState(false);
  const weatherReady=context.temperature!=="" && Number.isFinite(Number(context.temperature));
  const eligibility=outfitEligibility(wardrobe,context,anchor);
  const busy=loading||uploading||saving;
  function changeForm(event){const {name,value}=event.target;if(name==="weather"||name==="temperature")setContext(current=>({...current,[name]:value,location:undefined,time:undefined}));if(name==="shape")setShape(value);invalidate();}
  const formRef = useRef(null), dialogRef = useRef(null), resultRef = useRef(null), sidebarRef = useRef(null);
  const epochRef = useRef(0), urlsRef = useRef(new Set());
  useEffect(() => {
    let active=true;
    loadWardrobe().then(items=>{
      if(!active) return;
      setWardrobe(items.map(item=>{const url=URL.createObjectURL(item.blob);urlsRef.current.add(url);return {...item,url};}));
    }).catch(()=>{if(active)setStatus('無法讀取本機衣櫥，請確認瀏覽器允許網站儲存資料。');}).finally(()=>{if(active)setLoading(false);});
    return ()=>{active=false;epochRef.current++;urlsRef.current.forEach(url=>URL.revokeObjectURL(url));urlsRef.current.clear();};
  }, []);
  useEffect(() => { if (result && window.innerWidth < 621) resultRef.current.scrollIntoView({behavior:'smooth',block:'start'}); }, [result]);
  function invalidate() { if (result) { setResult(null); setStatus('設定已變更，請重新產生穿搭提案。'); } }
  function release(url) { URL.revokeObjectURL(url); urlsRef.current.delete(url); }
  async function addFiles(event) {
    const input=event.target, files=[...input.files], epoch=epochRef.current;
    setUploading(true); const added=[], errors=[];
    for(const file of files) {
      if(!['image/jpeg','image/png','image/webp'].includes(file.type)||file.size>5*1024*1024){errors.push(file.name+'：請選擇 5 MB 以下的 JPG、PNG 或 WebP。');continue;}
      try {added.push(await prepareGarment(file,classifier));} catch {errors.push(file.name+'：圖片無法讀取。');}
    }
    try {
      if(epoch!==epochRef.current)return;
      await saveItems(added);
      const records=added.map(item=>{const url=URL.createObjectURL(item.blob);urlsRef.current.add(url);return {...item,url};});
      setWardrobe(current=>[...current,...records]);invalidate();
      setStatus(errors.join(' ') || '已儲存至本機衣櫥；可展開單件衣物調整資料。');
    } catch {setStatus('衣物未儲存成功，可能儲存空間不足或瀏覽器禁止儲存。請重試。');}
    finally {setUploading(false);input.value='';}
  }
  async function removeItem(id) {
    setSaving(true);
    try {await deleteItem(id);const item=wardrobe.find(item=>item.id===id);if(item)release(item.url);setWardrobe(current=>current.filter(item=>item.id!==id));setAnchor(current=>current.filter(value=>value!==id));invalidate();}
    catch {setStatus('刪除失敗，衣物仍保留，請重試。');} finally {setSaving(false);}
  }
  async function updateItem(id,patch) {
    const item=wardrobe.find(item=>item.id===id);if(!item)return;
    setSaving(true);
    try {await saveItems([{...item,...patch,reviewed:true}]);setWardrobe(current=>current.map(item=>item.id===id?{...item,...patch,reviewed:true}:item));invalidate();setStatus('');return true;}
    catch {setStatus('修改未儲存成功，請重試。');return false;}finally{setSaving(false);}
  }
  function generate(event) {
    event.preventDefault();
    if(!weatherReady){setStatus("請先查詢地點天氣，或使用手動備用設定。");return;}
    if (uploading || loading || saving) { setStatus('圖片正在處理，請稍後再產生搭配。'); return; }
    const data = Object.fromEntries(new FormData(formRef.current));
    const fixed = anchor.map(id=>wardrobe.find(item=>item.id===id)).filter(Boolean);
    if(context.location){data.location=context.location;data.weatherTime=context.time;}
    const check=outfitEligibility(wardrobe,data,anchor);
    if(!check.canGenerate){setResult(null);setStatus(check.missing.length?"請先加入並分類："+check.missing.join("、"):"請確認指定衣物分類。");return;}
    if(fixed?.category==='未分類'){setStatus('請先展開這件衣物的資料並選擇分類，再作為搭配核心。');return;}
    setResult({data,fixed,proposals:[0,1].map(variant => buildRecommendation(data,fixed,variant,wardrobe))});
    setStatus('已產生搭配；可展開查看另一種搭法。');
  }
  async function reset() {
    if(clearMode){
      setSaving(true);
      try {await clearWardrobe();wardrobe.forEach(item=>release(item.url));setWardrobe([]);setAnchor([]);setResult(null);setStatus('本機衣櫥已清空。');dialogRef.current.close();}
      catch {setStatus('清空失敗，衣櫥仍保留，請重試。');}finally{setSaving(false);}
      return;
    }
    setAnchor([]);setResult(null);setContext({weather:'晴朗',temperature:''});setShape('自然');setWeatherReset(value=>value+1);formRef.current.reset();
    setStatus('已重置今天的設定，衣櫥已保留。');dialogRef.current.close();
  }

return (<>
{adding && <AddGarmentsDialog onFiles={addFiles} onClose={()=>setAdding(false)} />}
{picking && <WardrobePicker items={wardrobe} selected={anchor} onConfirm={ids=>{setAnchor(ids);invalidate();}} onUpdate={updateItem} disabled={saving} onClose={()=>setPicking(false)} />}
<header className="app-header"><button type="button" className="brand brand-toggle" aria-label="衣序，開啟側邊選單" aria-haspopup="dialog" onClick={()=>sidebarRef.current.showModal()}>☰ <span className="brand-name">衣序</span></button><nav className="header-tabs" aria-label="頁面導覽"><a href="#studio" aria-current={page==="studio"?"page":undefined}>穿搭建議</a><a href="#closet" aria-current={page==="closet"?"page":undefined}>我的衣櫥</a></nav><button className="quiet" id="reset" onClick={()=>{setClearMode(false);dialogRef.current.showModal();}} disabled={uploading || saving || loading} title="重設天氣、場合、心情及指定單品；衣櫥不會刪除">↺ 重設搭配條件</button></header><dialog className="sidebar-dialog" ref={sidebarRef} aria-labelledby="sidebar-title" onClick={event=>{if(event.target===sidebarRef.current)sidebarRef.current.close();}}><div className="sidebar-top"><h2 id="sidebar-title">衣序</h2><button type="button" className="quiet" aria-label="關閉選單" onClick={()=>sidebarRef.current.close()}>×</button></div><nav aria-label="主要導覽"><a href="#studio" onClick={()=>sidebarRef.current.close()}>穿搭工作室 ↗</a><a href="#closet" aria-current={page==="closet"?"page":undefined} onClick={()=>sidebarRef.current.close()}>我的衣櫥 ↗</a><a href="#about" onClick={()=>sidebarRef.current.close()}>關於我們 ↗</a><a href="#feedback" onClick={()=>sidebarRef.current.close()}>回饋 ↗</a></nav><p className="small">從你的衣櫥，找到今天的搭配。</p></dialog>
<main>
<div hidden={page!=="studio"}>

<div className="workspace dashboard" id="studio"><form id="styling-form" ref={formRef} onSubmit={generate} onChange={changeForm}>
<section className="panel"><div className="panel-heading"><span className="number">01</span><div><h3>今天的活動與心情</h3><p>先決定情境，再選今天想穿的單品。</p></div></div><div className="daily-context"><div className="fields"><label>活動場合<select name="occasion"><option>日常出門</option><option>上班通勤</option><option>朋友聚會</option><option>約會時光</option><option>戶外走走</option></select></label><label>今天的心情<select name="mood"><option>放鬆自在</option><option>俐落自信</option><option>溫柔沉靜</option><option>活力亮眼</option></select></label></div></div><WeatherLocation key={weatherReset} onApply={data=>{setContext(data);invalidate();}} /><div className="weather-summary" aria-live="polite">{weatherReady?<><strong>{context.weather} · {context.temperature}°C</strong><span>{context.location || "手動設定"}</span></>:<span>選擇地點後，自動帶入天氣與氣溫</span>}</div><details className="manual-weather"><summary>無法查詢？使用手動設定</summary><fieldset><legend>天氣狀況</legend><div className="choices"><label><input type="radio" name="weather" value="晴朗" checked={context.weather==="晴朗"} onChange={()=>{}} /><span>☀ 晴朗</span></label><label><input type="radio" name="weather" value="陰天" checked={context.weather==="陰天"} onChange={()=>{}} /><span>☁ 陰天</span></label><label><input type="radio" name="weather" value="下雨" checked={context.weather==="下雨"} onChange={()=>{}} /><span>☂ 下雨</span></label><label><input type="radio" name="weather" value="寒冷" checked={context.weather==="寒冷"} onChange={()=>{}} /><span>❄ 寒冷</span></label></div></fieldset><label>氣溫 <span>°C</span><input name="temperature" type="number" min="-30" max="50" value={context.temperature} onChange={()=>{}} /></label></details></section><details className="panel profile-settings"><summary>個人設定 <span>選填 · 身高與版型偏好</span></summary><div className="profile-content"><div className="fields"><label>身高 <span>cm</span><input name="height" type="number" min="80" max="250" placeholder="例如 170" /></label></div><label>你的身形偏好<select name="shape" value={shape} onChange={()=>{}}><option value="自然">不指定，依舒適度搭配</option><option value="平衡肩線">希望平衡肩線</option><option value="凸顯腰線">希望凸顯腰線</option><option value="拉長比例">希望拉長整體比例</option></select></label><p className="small">身高只提供長度試穿提醒，不用來判定身形或尺寸。</p><p className="preference-impact">{shape==="自然"?"依天氣、場合與配色選衣，不額外偏好版型。":shape==="平衡肩線"?"挑選下身時，優先直筒或寬鬆版型。":"挑選衣物時，優先高腰版型。"} 結果會說明本套是否有選中符合偏好的衣物；需先有對應的衣物標籤。</p></div></details>
<section className="panel outfit-source" id="wardrobe"><div className="panel-heading"><span className="number">02</span><div><h3>從衣櫥開始搭配</h3><p>自由選幾件，或讓衣序幫你補齊。</p></div><a className="manage-link" href="#closet">管理衣櫥 ↗</a></div><div className="source-switch" role="group" aria-label="搭配方式"><button type="button" aria-pressed={!anchor.length} disabled={busy} onClick={()=>{setAnchor([]);invalidate();}}>衣櫥自動搭配</button><button type="button" aria-pressed={anchor.length>0} disabled={busy} onClick={()=>setPicking(true)}>指定想穿的單品 {anchor.length>0 && '· '+anchor.length}</button></div><div className="source-caption"><strong>{anchor.length?'已指定 '+anchor.length+' 件單品':'你的衣櫥，共 '+wardrobe.length+' 件'}</strong><span>{anchor.length?'指定單品會保留在兩套提案中。':'依照今天的情境，自動挑選合適組合。'}</span></div>{wardrobe.length>0?<div className="studio-garments">{(anchor.length?anchor.map(id=>wardrobe.find(item=>item.id===id)).filter(Boolean):wardrobe.slice(0,6)).map(item=><button type="button" key={item.id} disabled={busy} aria-label={'選擇搭配單品，目前顯示 '+item.name} onClick={()=>setPicking(true)}><div><img src={item.url} alt={item.name}/><i style={{background:item.color}}/></div><span>{item.name}</span><small>{item.category}</small></button>)}</div>:<button type="button" className="source-empty" disabled={busy} onClick={()=>setAdding(true)}><span>＋</span><strong>加入第一件衣物</strong><small>從相簿上傳，或直接拍照</small></button>}<div className="source-actions"><button type="button" className="quiet" disabled={busy || !wardrobe.length} onClick={()=>setPicking(true)}>打開衣櫥選單品</button><button type="button" className="add-garment-button" disabled={busy} onClick={()=>setAdding(true)}>＋ 新增衣物</button></div>{wardrobe.some(item=>item.category==='未分類')&&<p className="source-hint">{wardrobe.filter(item=>item.category==='未分類').length} 件待分類 · 選取時可直接補上分類</p>}<p className="small source-footnote">衣物照片保存在此瀏覽器。分類模型尚未連線，資料可在衣櫥頁校正。</p></section><div className="generation-bar"><div id="eligibility" className="eligibility" aria-live="polite"><div className="readiness"><strong>{weatherReady && eligibility.canGenerate ? '✓ 已準備好' : '完成以下項目即可搭配'}</strong><div className="readiness-steps"><a className={weatherReady?'done':'todo'} href="#studio" onClick={()=>{document.querySelector('.weather-location')?.scrollIntoView({behavior:'smooth',block:'center'});document.querySelector('.weather-location input')?.focus();}}><span>{weatherReady?'✓':'1'}</span>{weatherReady?'天氣已就緒':'查詢地點天氣'}</a><button type="button" className={eligibility.missing.length?'todo':'done'} disabled={busy} onClick={()=>setPicking(true)}><span>{eligibility.missing.length?'2':'✓'}</span>{eligibility.missing.length?'補充分類：'+eligibility.missing.join('、'):'衣物組合已齊'}</button>{eligibility.anchorInvalid&&<button type="button" className="todo" onClick={()=>setPicking(true)}>檢查指定單品</button>}</div></div></div><button className="primary generate" type="submit" aria-describedby="eligibility" disabled={busy || !weatherReady || !eligibility.canGenerate}>{busy?"處理衣櫥中…":"產生我的穿搭提案"}<span>✦</span></button></div></form>
{result && <aside><section className="result panel ready" id="result" ref={resultRef} aria-live="polite"><Results result={result} /></section></aside>}</div>

</div>
{page==='closet'&&<section className="closet-page"><div className="page-heading"><div><p className="eyebrow">YOUR WARDROBE</p><h1>我的衣櫥</h1><p>{wardrobe.length} 件衣物 · 依分類整理</p></div><button type="button" className="add-garment-button" disabled={busy} onClick={()=>setAdding(true)}>＋ 新增衣物</button></div><div className="closet-utilities"><span>讓每件衣服都有自己的位置。</span><button type="button" className="quiet" disabled={busy || !wardrobe.length} onClick={()=>{setClearMode(true);dialogRef.current.showModal();}}>清空衣櫥</button></div><nav className="closet-filters" aria-label="衣櫥分類">{['全部',...categories].map(category=><button type="button" className="quiet" key={category} aria-pressed={closetFilter===category} onClick={()=>setClosetFilter(category)}>{category} <span>{category==='全部'?wardrobe.length:wardrobe.filter(item=>item.category===category).length}</span></button>)}</nav>{loading?<p>正在讀取衣櫥…</p>:!wardrobe.length?<div className="closet-empty">衣櫥還是空的，加入第一件喜歡的衣服吧。</div>:categories.filter(category=>closetFilter==='全部'||closetFilter===category).map(category=>{const items=wardrobe.filter(item=>item.category===category);return items.length?<section className="closet-group" key={category}><h2>{category}<span>{items.length} 件</span></h2><div className="closet-grid">{items.map(item=><ItemEditor key={item.id} item={item} onUpdate={updateItem} onRemove={removeItem} disabled={busy}/>)}</div></section>:closetFilter!=='全部'?<p key={category}>這個分類還沒有衣物。</p>:null;})}</section>}
{page==='about'&&<section className="info-page"><p className="eyebrow">ABOUT YIXU</p><h1>關於衣序</h1><p className="about-lead">從自己的衣櫥出發，把每一天穿得更自在。</p><div className="about-grid"><article className="panel"><h2>我們在做什麼</h2><p>衣序是一個持續開發中的穿搭專案，結合天氣、場合、心情與版型偏好，協助你重新發現既有衣物的搭配方式。</p></article><article className="panel"><h2>資料由你掌握</h2><p>照片與衣物資料保存在此瀏覽器，不會同步到其他裝置。清除網站資料會移除衣櫥；模型辨識與去背目前尚未啟用。</p></article></div><a className="quiet" href="#feedback">分享你的建議 ↗</a></section>}
{page==='feedback'&&<FeedbackPage/>}
</main><footer className="site-footer"><div><a className="brand" href="#studio">衣序<span>YIXU</span></a><p>穿得舒服，也穿得像自己。</p></div><nav aria-label="頁尾導覽"><a href="#about">關於我們</a><a href="#feedback">回饋</a></nav><div className="footer-meta"><span>衣櫥保存在本機瀏覽器</span><span>© 2026 YIXU</span></div></footer>{status && /失敗|無法|不足|請先|未儲存|以下/.test(status) && <div className="error-notice" role="alert"><span>{status}</span><button type="button" aria-label="關閉提示" onClick={()=>setStatus('')}>×</button></div>}<dialog id="reset-dialog" ref={dialogRef}><h2>{clearMode?"清空本機衣櫥？":"重設搭配條件？"}</h2><p>{clearMode?"這會刪除此瀏覽器保存的所有衣物照片與標籤，無法復原。":"這會重置今天的設定與搭配結果，保留衣櫥照片及標籤。"}</p><div className="dialog-actions"><button id="cancel-reset" onClick={() => dialogRef.current.close()} className="quiet">保留資料</button><button id="confirm-reset" onClick={reset} disabled={saving} className="primary">{saving?"處理中…":clearMode?"確認清空衣櫥":"重置今天設定"}</button></div></dialog>
</>);
}
