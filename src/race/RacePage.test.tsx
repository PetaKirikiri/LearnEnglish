import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { expect, it, vi } from 'vitest'
import type { RaceView } from './types'
import RacePage from './RacePage'

const connection = vi.hoisted(()=>({view:undefined as RaceView|undefined,now:1000}))
vi.mock('./connection',()=>({
  HOST_KEY:'test-host',raceRequest:vi.fn(),savedRace:vi.fn(),
  useRaceConnection:()=>({credentials:{room:'AAAAAAAAAA',token:'player'},view:connection.view,now:connection.now,connection:'',sync:vi.fn(),remember:vi.fn(),forget:vi.fn(),currentRound:{current:'test'}}),
}))
it('shows the exact active phone prompt, keeps it after answering, and replaces it next round',async()=>{
  Object.assign(globalThis,{IS_REACT_ACT_ENVIRONMENT:true})
  history.replaceState(null,'','/english/race/join/AAAAAAAAAA')
  connection.view={id:'AAAAAAAAAA',run:1,stageId:'test',phase:'answering',round:0,finish:6000,serverNow:1000,motionAt:1000,title:'Test',players:[],opensAt:1000,closesAt:11000,question:{id:'0',english:'Where the hotel?',choices:['Correct','Wrong']},me:{id:'player'}}
  const host=document.createElement('div'),root=createRoot(host)
  document.body.append(host)
  const render=async()=>act(async()=>root.render(<RacePage/>))
  try {
    await render()
    expect(host.querySelector('.controller-question')?.textContent).toBe('Where the hotel?')
    expect(host.querySelector('.controller-question')?.getAttribute('lang')).toBe('en')
    connection.view={...connection.view,me:{id:'player',choice:1}}
    await render()
    expect(host.querySelector('.controller-question')?.textContent).toBe('Where the hotel?')
    connection.view={...connection.view,round:1,question:{id:'1',english:'Where are my keys?',choices:['กุญแจของฉันอยู่ที่ไหน','กุญแจของคุณอยู่ที่ไหน']},me:{id:'player'}}
    await render()
    expect(host.querySelector('.controller-question')?.textContent).toBe('Where are my keys?')
    connection.now=500
    await render()
    expect(host.querySelector('.controller-question')).toBeNull()
    connection.now=1000
    connection.view={...connection.view,phase:'finished'}
    await render()
    expect(host.querySelector('.controller-question')).toBeNull()
  } finally {await act(async()=>root.unmount());host.remove();history.replaceState(null,'','/')}
})
