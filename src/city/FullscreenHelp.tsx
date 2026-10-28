import {useEffect,useRef} from 'react'

export default function FullscreenHelp({onClose}:{onClose:()=>void}){
 const dialog=useRef<HTMLDialogElement>(null)
 const iphone=/iPhone|iPod/.test(navigator.userAgent)
 const embedded=/Line\//i.test(navigator.userAgent)
 useEffect(()=>{const node=dialog.current!;if(!node.open)node.showModal()},[])
 return <dialog ref={dialog} className="city-fullscreen-help" onClose={onClose} aria-labelledby="city-fullscreen-title">
  <h2 id="city-fullscreen-title">More room to play</h2>
  {iphone?<>
   {embedded&&<p>First, open this page in Safari from LINE’s menu.</p>}
   <p><strong>In Safari:</strong> open the page menu beside the address bar and choose <strong>Hide Toolbar</strong>.</p>
   <p><strong>For an app view:</strong> Share → Add to Home Screen. Enable <strong>Open as Web App</strong> if shown, then launch the saved icon.</p>
  </>:<p>Your browser didn’t allow fullscreen. Try the expand button again, or open this controller in your phone’s main browser.</p>}
  <button className="city-primary" onClick={()=>dialog.current?.close()}>Got it</button>
 </dialog>
}
