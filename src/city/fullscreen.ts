type SafariDocument = Document & { webkitFullscreenElement?: Element; webkitFullscreenEnabled?: boolean }
type SafariElement = HTMLElement & { webkitRequestFullscreen?: () => Promise<void> | void }

export function controllerExpanded() {
 const doc=document as SafariDocument
 return Boolean(doc.fullscreenElement||doc.webkitFullscreenElement||
  (navigator as Navigator & {standalone?:boolean}).standalone||
  window.matchMedia('(display-mode: standalone)').matches||window.matchMedia('(display-mode: fullscreen)').matches)
}

export function subscribeControllerExpanded(update:()=>void) {
 const queries=['(display-mode: standalone)','(display-mode: fullscreen)'].map(value=>window.matchMedia(value))
 document.addEventListener('fullscreenchange',update)
 document.addEventListener('webkitfullscreenchange',update)
 queries.forEach(query=>query.addEventListener('change',update))
 return ()=>{document.removeEventListener('fullscreenchange',update);document.removeEventListener('webkitfullscreenchange',update);queries.forEach(query=>query.removeEventListener('change',update))}
}

// Invoke directly from a tap: awaiting room/network work first loses user activation.
export async function enterControllerFullscreen():Promise<'entered'|'unsupported'|'denied'> {
 const doc=document as SafariDocument, root=document.documentElement as SafariElement
 if(!controllerExpanded()){
  try{
   if(doc.fullscreenEnabled&&root.requestFullscreen)await root.requestFullscreen({navigationUI:'hide'})
   else if(doc.webkitFullscreenEnabled&&root.webkitRequestFullscreen)await root.webkitRequestFullscreen()
   else return 'unsupported'
  }catch{return 'denied'}
 }
 // Failure to lock orientation must not turn successful fullscreen into a failure.
 try{await (screen.orientation as ScreenOrientation & {lock?:(value:string)=>Promise<void>})?.lock?.('landscape')}catch{/* Manual rotation remains available. */}
 return 'entered'
}
