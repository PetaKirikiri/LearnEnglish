import {act} from 'react'
import {createRoot} from 'react-dom/client'
import {afterEach,expect,it,vi} from 'vitest'
import DrawingPreview from './DrawingPreview'
vi.mock('qrcode',()=>({default:{toDataURL:vi.fn().mockResolvedValue('data:image/png;base64,AA')}}))
vi.mock('./DrawingGame',()=>({DrawingStudent:({game,act:action}:{game:{phase:string;drawings:{artist:string;finishRank?:number;finishBonus?:number}[]};act:(a:string,p:Record<string,unknown>)=>Promise<boolean>})=><><span data-phase={game.phase}>{game.phase}</span><button onClick={()=>void action('complete',{picture:'data:image/png;base64,AA'})}>Done</button><output>{game.drawings.find(d=>d.artist==='preview')?.finishRank}:{game.drawings.find(d=>d.artist==='preview')?.finishBonus}</output></>}))
afterEach(()=>{vi.useRealTimers();history.replaceState(null,'','/')})
it('keeps the QR open without starting a round before scanning',async()=>{
 vi.useFakeTimers();history.replaceState(null,'','/english/game/preview');const el=document.createElement('div'),root=createRoot(el)
 await act(async()=>root.render(<DrawingPreview/>));await act(async()=>vi.advanceTimersByTime(90000))
 expect(el.querySelector('img')?.alt).toBe('Scan to try the game');expect(el.querySelector('a')?.href).toContain('/english/game/preview?phone=1');expect(el.querySelector('[data-phase]')).toBeNull()
 await act(async()=>root.unmount())
})
it('starts the phone flow after opening the scanned link',async()=>{
 vi.useFakeTimers();history.replaceState(null,'','/english/game/preview?phone=1');const el=document.createElement('div'),root=createRoot(el)
 await act(async()=>root.render(<DrawingPreview/>));expect(el.querySelector('[data-phase]')?.textContent).toBe('lobby');await act(async()=>vi.advanceTimersByTime(3000));expect(el.querySelector('[data-phase]')?.textContent).toBe('drawing');expect(el.querySelector('img,a')).toBeNull()
 await act(async()=>root.unmount())
})

for(const [delay,rank,bonus] of [[0,1,3],[21000,2,2],[41000,3,1]])it(`awards preview rank ${rank} after ${delay}ms`,async()=>{
 vi.useFakeTimers();history.replaceState(null,'','/english/game/preview?phone=1');const el=document.createElement('div'),root=createRoot(el)
 await act(async()=>root.render(<DrawingPreview/>));await act(async()=>vi.advanceTimersByTime(3000));await act(async()=>vi.advanceTimersByTime(delay));await act(async()=>el.querySelector<HTMLButtonElement>('button')!.click());expect(el.querySelector('output')?.textContent).toBe(`${rank}:${bonus}`);await act(async()=>root.unmount())
})
