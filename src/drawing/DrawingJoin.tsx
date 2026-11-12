import {useEffect,useState} from 'react'
import QRCode from 'qrcode'
import './drawing.css'
export default function DrawingJoin({url,title='Scan to join'}:{url:string;title?:string}){
 const [qr,setQr]=useState('')
 useEffect(()=>{let active=true;void QRCode.toDataURL(url,{width:420,margin:3}).then(value=>{if(active)setQr(value)}).catch(()=>{if(active)setQr('')});return()=>{active=false}},[url])
 return <section className="dg-join"><h1>{title}</h1>{qr&&<img src={qr} width="280" height="280" alt={title}/>}<a href={url}>Open on this phone →</a></section>
}
