import { useEffect, useState } from 'react'
import {supabase} from '../lib/supabase'

export default function MemberAvatar({ name, url, size = 36 }: { name: string; url?: string | null; size?: number }) {
  const [failedUrl, setFailedUrl] = useState<string | null>(null)
  const [signed, setSigned] = useState<{source:string;url:string}|null>(null)
  useEffect(()=>{
    const prefix='storage://english-learner-avatars/'
    if(!url?.startsWith(prefix))return
    let active=true
    const path=url.slice(prefix.length)
    if(!path||path.includes('..'))return
    void supabase.storage.from('english-learner-avatars').createSignedUrl(path,300)
      .then(({data,error})=>{if(active&&!error&&data?.signedUrl)setSigned({source:url,url:data.signedUrl})})
      .catch(()=>{/* Fall back to initials when private storage is unavailable. */})
    return()=>{active=false}
  },[url])
  const candidate=url?.startsWith('storage://')?(signed?.source===url?signed.url:null):url
  const photo = candidate?.startsWith('https://') && candidate !== failedUrl ? candidate : null
  return <span aria-hidden="true" className="member-avatar inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#e8eadf] text-sm font-semibold text-[#526044]" style={{ width: size, height: size }}>
    {photo ? <img src={photo} alt="" width={size} height={size} className="h-full w-full object-cover" referrerPolicy="no-referrer" onError={() => setFailedUrl(photo)} /> : <span data-initial={name.trim().slice(0, 1).toUpperCase()} className="before:content-[attr(data-initial)]" />}
  </span>
}
