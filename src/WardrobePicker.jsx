import {useEffect,useRef,useState} from 'react';
export default function WardrobePicker({items,selected,onConfirm,onClose,onUpdate,disabled}) {
  const dialog=useRef(null),classification=useRef(null);
  const [draft,setDraft]=useState(selected),[filter,setFilter]=useState('全部');
  const [pending,setPending]=useState(null),[category,setCategory]=useState('上衣'),[error,setError]=useState('');
  useEffect(()=>{dialog.current.showModal();},[]);
  useEffect(()=>{if(pending)classification.current?.focus();},[pending]);
  function select(item){setDraft(current=>current.includes(item.id)?current.filter(id=>id!==item.id):[...current.filter(id=>items.find(other=>other.id===id)?.category!==item.category),item.id]);}
  function toggle(item){if(item.category==='未分類'){setPending(item);setCategory('上衣');setError('');return;}select(item);}
  async function classify(){
    const saved=await onUpdate(pending.id,{category});
    if(!saved){setError('分類未儲存成功，請重試。');return;}
    setDraft(current=>[...current.filter(id=>id!==pending.id && items.find(other=>other.id===id)?.category!==category),pending.id]);setPending(null);
  }
  return <dialog className="picker-dialog" ref={dialog} onClose={onClose} onCancel={event=>{if(disabled)event.preventDefault();}} aria-labelledby="picker-title"><h2 id="picker-title">今天想穿哪些？</h2><p>勾選單品；每類最多一件。未分類衣物會先請你選擇分類。</p><label>篩選分類<select value={filter} onChange={event=>setFilter(event.target.value)}>{['全部','上衣','下身','外套','鞋子','配件','未分類'].map(value=><option key={value}>{value}</option>)}</select></label>{pending&&<section className="classify-prompt" role="region" aria-label="請先分類衣物"><strong>先為「{pending.name}」選擇分類</strong><label>衣物分類<select ref={classification} value={category} disabled={disabled} onChange={event=>setCategory(event.target.value)}>{['上衣','下身','外套','鞋子','配件'].map(value=><option key={value}>{value}</option>)}</select></label><div className="dialog-actions"><button type="button" className="quiet" disabled={disabled} onClick={()=>setPending(null)}>取消</button><button type="button" className="primary" disabled={disabled} onClick={classify}>{disabled?'儲存中…':'儲存分類並勾選'}</button></div><p role="alert">{error}</p></section>}<div className="picker-grid">{items.filter(item=>filter==='全部'||item.category===filter).map(item=><label key={item.id} className={'picker-item'+(draft.includes(item.id)?' selected':'')}><input type="checkbox" checked={draft.includes(item.id)} disabled={disabled} onChange={()=>toggle(item)} /><img src={item.url} alt={item.name} /><span>{item.name}</span><small>{item.category==='未分類'?'點選後先分類':item.category}</small></label>)}</div>{!items.length&&<p>衣櫥還沒有衣物，請先上傳。</p>}<div className="dialog-actions"><button type="button" className="quiet" disabled={disabled} onClick={()=>setDraft([])}>取消全部勾選</button><button type="button" className="quiet" disabled={disabled} onClick={onClose}>返回</button><button type="button" className="primary" disabled={disabled||Boolean(pending)} onClick={()=>{onConfirm(draft);onClose();}}>確認 {draft.length} 件</button></div></dialog>;
}
