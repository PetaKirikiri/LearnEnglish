import {useEffect,useRef} from 'react'

export default function FullscreenHelp({onClose}:{onClose:()=>void}){
 const dialog=useRef<HTMLDialogElement>(null)
 const iphone=/iPhone|iPod/.test(navigator.userAgent)
 const embedded=/Line\//i.test(navigator.userAgent)
 useEffect(()=>{const node=dialog.current!;if(!node.open)node.showModal()},[])
 return <dialog ref={dialog} className="city-fullscreen-help" onClose={onClose} aria-labelledby="city-fullscreen-title">
  <h2 id="city-fullscreen-title">More room to play</h2>
  {embedded?<p>You’re playing inside LINE. Use the controller here; LINE manages its own browser controls.</p>:iphone?<p>Open Safari’s page menu beside the address bar and choose <strong>Hide Toolbar</strong>.</p>:<p>Your browser didn’t allow fullscreen. Try the expand button again.</p>}
  <button className="city-primary" onClick={()=>dialog.current?.close()}>Got it</button>
 </dialog>
}
