'use client';
import {useEffect,useRef} from 'react';
export default function VisitTracker(){const sent=useRef(false);useEffect(()=>{if(sent.current)return;sent.current=true;void fetch('/api/visits',{method:'POST',keepalive:true}).catch(()=>{});},[]);return null;}
