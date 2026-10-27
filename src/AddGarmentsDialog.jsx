import {useEffect,useRef} from 'react';
export default function AddGarmentsDialog({onFiles,onClose}){
  const dialog=useRef(null);
  useEffect(()=>{dialog.current.showModal();},[]);
  function chosen(event){if(event.target.files.length){onFiles(event);onClose();}}
  return <dialog className="add-dialog" ref={dialog} onClose={onClose} aria-labelledby="add-title"><h2 id="add-title">新增衣物</h2><p>選擇加入方式，照片會自動取色並保存於本機。</p><div className="add-options"><label className="add-option">↥<strong>選擇照片</strong><span>可一次加入多張</span><input className="visually-hidden" type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={chosen}/></label><label className="add-option">▣<strong>拍照加入</strong><span>依裝置支援開啟相機</span><input className="visually-hidden" type="file" accept="image/jpeg,image/png,image/webp" capture="environment" onChange={chosen}/></label></div><p className="small">每張最多 5 MB · JPG、PNG、WebP</p><button type="button" className="quiet" onClick={onClose}>取消</button></dialog>;
}
