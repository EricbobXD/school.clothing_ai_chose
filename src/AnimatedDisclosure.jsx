import {useId,useState} from 'react';
export default function AnimatedDisclosure({title,children}){
  const [open,setOpen]=useState(false),id=useId();
  return <div className={'animated-disclosure'+(open?' expanded':'')}><button type="button" className="disclosure-toggle" aria-expanded={open} aria-controls={id} onClick={()=>setOpen(value=>!value)}><span className="disclosure-arrow" aria-hidden="true">›</span>{title}</button><div className="disclosure-grid" id={id} inert={!open}><div className="disclosure-inner">{children}</div></div></div>;
}
