import { useEffect, useRef, useState } from 'react';
import { analyzeColors } from './dominantColor.js';

export default function CropColorDialog({item,onSave,onClose}) {
  const dialog=useRef(null),image=useRef(null),start=useRef(null);
  const [rect,setRect]=useState(item.colorCrop || {x:0,y:0,width:100,height:100});
  const [error,setError]=useState(''),[busy,setBusy]=useState(false),[ready,setReady]=useState(false);
  useEffect(()=>{dialog.current.showModal();},[]);
  function point(event) {
    const bounds=event.currentTarget.getBoundingClientRect();
    return {x:Math.max(0,Math.min(100,(event.clientX-bounds.left)/bounds.width*100)),y:Math.max(0,Math.min(100,(event.clientY-bounds.top)/bounds.height*100))};
  }
  function move(event) {
    if(!start.current)return;
    const p=point(event),a=start.current;
    setRect({x:Math.min(a.x,p.x),y:Math.min(a.y,p.y),width:Math.abs(p.x-a.x),height:Math.abs(p.y-a.y)});
  }
  async function apply() {
    if(!ready || rect.width<1 || rect.height<1){setError('請框選至少 1% 寬與高的範圍。');return;}
    setBusy(true);setError('');
    try {
      const img=image.current;
      const width=img.naturalWidth*rect.width/100,height=img.naturalHeight*rect.height/100;
      const scale=Math.min(1,64/Math.max(width,height));
      const canvas=document.createElement('canvas');
      canvas.width=Math.max(1,Math.round(width*scale));canvas.height=Math.max(1,Math.round(height*scale));
      const ctx=canvas.getContext('2d',{willReadFrequently:true});
      ctx.drawImage(img,img.naturalWidth*rect.x/100,img.naturalHeight*rect.y/100,width,height,0,0,canvas.width,canvas.height);
      // The selected region is user-specified garment content. Do not apply
      // background-border substitution again inside this region.
      const analysis=analyzeColors(ctx.getImageData(0,0,canvas.width,canvas.height).data);
      if(!analysis.primary)throw new Error('選取範圍沒有可辨識的顏色，請重新框選。');
      const saved=await onSave(item.id,{color:analysis.primary,colorSource:'crop',colorAnalysis:{...analysis,reason:'user-crop'},colorCrop:rect});
      if(saved)onClose();else setError('儲存失敗，請重試。');
    } catch(error){setError(error.message || '取色失敗，請重試。');}finally{setBusy(false);}
  }
  function adjust(field,value) {
    setRect(current=>{
      const next={...current,[field]:Number(value)};
      next.width=Math.min(next.width,100-next.x);next.height=Math.min(next.height,100-next.y);
      return next;
    });
  }
  return <dialog ref={dialog} className="crop-dialog" onCancel={event=>{if(busy)event.preventDefault();}} onClose={onClose} aria-labelledby="crop-title"><h2 id="crop-title">框選衣物，重新取色</h2><p>拖曳框選衣物，盡量避開背景。也可以用下方滑桿微調。</p><div className="crop-stage" onPointerDown={event=>{if(!ready||busy)return;event.preventDefault();start.current=point(event);event.currentTarget.setPointerCapture(event.pointerId);}} onPointerMove={move} onPointerUp={event=>{move(event);start.current=null;}} onPointerCancel={()=>{start.current=null;}}><img ref={image} src={item.url} alt={item.name} draggable={false} onLoad={()=>setReady(true)} onError={()=>setError('無法載入照片。')} /><div className="crop-selection" style={{left:rect.x+'%',top:rect.y+'%',width:rect.width+'%',height:rect.height+'%'}} /></div><fieldset disabled={busy} className="crop-sliders">{[['x','左側位置',0,99],['y','上側位置',0,99],['width','寬度',1,100-rect.x],['height','高度',1,100-rect.y]].map(([field,label,min,max])=><label key={field}>{label} {Math.round(rect[field])}%<input type="range" min={min} max={Math.max(min,max)} step="0.1" value={rect[field]} onChange={event=>adjust(field,event.target.value)} /></label>)}</fieldset><p className="small">只重新計算主色與候選色，不會裁掉或覆寫原圖。</p><p role="status">{error}</p><div className="dialog-actions"><button type="button" className="quiet" disabled={busy} onClick={onClose}>取消</button><button type="button" className="primary" disabled={!ready||busy} onClick={apply}>{busy?'儲存中…':'使用此範圍取色'}</button></div></dialog>;
}
