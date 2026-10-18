export type Feedback={kind:string;title:string;text:string};
export default function GuessFeedback({feedback,fallback='Écris ta réponse puis valide.'}:{feedback:Feedback|null;fallback?:string}){
 const f=feedback||{kind:'idle',title:'À toi de jouer',text:fallback};
 const icon=f.kind==='correct'?'✓':f.kind==='incorrect'?'✕':f.kind==='close'?'≈':f.kind==='error'?'!':f.kind==='sending'?'…':'→';
 return <div className="guess-feedback" data-kind={f.kind} role="status" aria-live="polite" aria-atomic="true"><span className="guess-feedback-icon" aria-hidden="true">{icon}</span><div><strong>{f.title}</strong><span>{f.text}</span></div></div>;
}
