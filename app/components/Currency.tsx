import {CURRENCY_LABELS,type Currency as CurrencyType} from '../../lib/cosmetics';
/** A shared textile token, decorative when accompanied by a currency name or amount. */
export function CurrencyIcon({currency,className=''}:{currency:CurrencyType;className?:string}){
 return <img className={'wool-token wool-token-'+currency+' '+className} src={'/branding/textile/'+(currency==='room'?'piece':'etoile')+'.webp'} width="32" height="32" alt="" aria-hidden="true" draggable={false}/>;
}
export function CurrencyAmount({currency,amount}:{currency:CurrencyType;amount:number|string}){
 return <span className="wool-amount" role="img" aria-label={String(amount)+' '+CURRENCY_LABELS[currency].toLocaleLowerCase('fr')}><CurrencyIcon currency={currency}/><span aria-hidden="true">{amount}</span></span>;
}
