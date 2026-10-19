'use client';
import {useEffect,useRef} from 'react';
import {Expand,X} from 'lucide-react';
type Art={url?:string|null;page?:string|null};
export default function AnswerReveal({question,label,art,onImageError}:{question?:{answer?:string;hint?:string;hintSource?:string;words:number;theme:string};label?:string;art:Art|null;onImageError:()=>void}){
 const dialog=useRef<HTMLDialogElement>(null);
 const hasImage=!!art?.url;
 const loading=art===null&&question?.theme!=='expressions';
 useEffect(()=>{dialog.current?.close();},[art?.url,question?.answer]);
 return <div className="answer-reveal">
  <div className="category-chip">{label}<span>•</span>{question?.words} mot{question?.words!==1?'s':''}</div>
  <div className={'answer-reveal-layout '+(!hasImage&&!loading?'answer-text-only':'')}>
   {(hasImage||loading)&&<div className="answer-media-slot">
    {hasImage?<button type="button" className="answer-media-button" onClick={()=>dialog.current?.showModal()} aria-label={'Agrandir l’illustration : '+question?.answer}>
     <img referrerPolicy="no-referrer" key={art!.url} src={art!.url!} alt={question?.answer||'Illustration de la réponse'} onError={onImageError}/>
     <span className="answer-media-expand"><Expand size={14}/> Agrandir</span>
    </button>:<div className="answer-media-loading" role="status"><span className="image-loading"/><span>Chargement de l’illustration…</span></div>}
   </div>}
   <div className="answer-reveal-copy"><span className="eyebrow">C’ÉTAIT…</span><h2>{question?.answer}</h2><p>{question?.hint}</p>
    {question?.hintSource&&<small className="clue-credit">Indice adapté de <a href={question.hintSource} target="_blank" rel="noreferrer">{question.hintSource.startsWith('https://fr.wiktionary.org/')?'Wiktionnaire':'Wikipédia'} ↗</a> · <a href="https://creativecommons.org/licenses/by-sa/4.0/" target="_blank" rel="noreferrer">CC BY-SA</a></small>}
    {hasImage&&art?.page&&<a className="image-credit" href={art.page} target="_blank" rel="noreferrer">Image : source et crédits ↗</a>}
    {!hasImage&&!loading&&question?.theme!=='expressions'&&<small className="answer-no-image">Aucune illustration disponible pour cette réponse.</small>}
   </div>
  </div>
  {hasImage&&<dialog className="answer-image-dialog" ref={dialog} aria-label={'Illustration : '+question?.answer} onClick={e=>{if(e.target===e.currentTarget)dialog.current?.close()}}>
   <form method="dialog"><button autoFocus type="submit" className="answer-image-close" aria-label="Fermer l’illustration"><X size={22}/></button></form>
   <img referrerPolicy="no-referrer" src={art!.url!} alt={question?.answer||'Illustration de la réponse'}/><p>{question?.answer}</p>
  </dialog>}
 </div>;
}
