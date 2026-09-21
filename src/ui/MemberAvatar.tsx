import { useState } from 'react'

export default function MemberAvatar({ name, url, size = 36 }: { name: string; url?: string | null; size?: number }) {
  const [failedUrl, setFailedUrl] = useState<string | null>(null)
  const photo = url?.startsWith('https://') && url !== failedUrl ? url : null
  return <span aria-hidden="true" className="member-avatar inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#e8eadf] text-sm font-semibold text-[#526044]" style={{ width: size, height: size }}>
    {photo ? <img src={photo} alt="" width={size} height={size} className="h-full w-full object-cover" referrerPolicy="no-referrer" onError={() => setFailedUrl(photo)} /> : <span data-initial={name.trim().slice(0, 1).toUpperCase()} className="before:content-[attr(data-initial)]" />}
  </span>
}
