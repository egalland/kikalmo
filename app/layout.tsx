import type { Metadata } from 'next';
import './globals.css';
import './puppet.css';
import './answer-reveal.css';
import './emotes.css';
export const metadata:Metadata={title:'Sans voyelles — Les mots ont disparu. À vous de jouer.',description:'20 secondes, des consonnes et un déclic. Un jeu de culture générale multijoueur.'};
export default function Layout({children}:{children:React.ReactNode}){return <html lang="fr"><head>{["/puppets/v2/heads.webp","/puppets/v2/hair.webp","/puppets/v2/outfits.webp","/puppets/v2/noses.webp","/puppets/eyes.webp?v=5","/puppets/mouth.webp?v=5","/puppets/parts.webp?v=5"].map(src=><link key={src} rel="preload" as="image" href={src}/>)}</head><body>{children}</body></html>}
