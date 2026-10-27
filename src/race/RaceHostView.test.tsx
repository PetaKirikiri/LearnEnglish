import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { renderToStaticMarkup } from 'react-dom/server'
import { expect, it, vi } from 'vitest'
import RaceHostView from './RaceHostView'
import RaceTrack from './RaceTrack'
import type { RaceView } from './types'

const view: RaceView = { id:'room',run:1,stageId:'test',phase:'lobby',round:-1,finish:1600,serverNow:0,motionAt:0,title:'Question words',players:[{id:'one',name:'Peta',lane:0,metres:0,speed:8,answered:false}],opensAt:0,closesAt:0,joinUrl:'http://localhost/join' }
const props = { qr:'data:image/png;base64,a',busy:false,disconnected:false,countdown:0,remaining:10,ready:false,finishTitle:'Peta wins!',onControl:vi.fn(),onReset:vi.fn() }

it('puts horses and meter markers at the same full-course percentage as the field spreads',()=>{
  for (const distances of [[0,0,0,0],[672,448,224,160],[1500,1000,400,120]]) {
    const players=distances.map((metres,lane)=>({...view.players[0],id:String(lane),lane,metres}))
    const html=renderToStaticMarkup(<RaceTrack players={players} finish={1600} laneCount={4} minimal tracking/>)
    const dom=new DOMParser().parseFromString(html,'text/html')
    const dots=dom.querySelectorAll<HTMLElement>('.sprint-course-rider')
    const horses=dom.querySelectorAll<HTMLElement>('.sprint-horse')
    distances.forEach((metres,i)=>{
      expect(horses[i].style.left).toBe(dots[i].style.left)
      expect(parseFloat(horses[i].style.left)).toBeCloseTo(metres/1600*100)
    })
  }
})

it('keeps the minimal race focused on named horses without side statistics or start decorations',()=>{
  const html=renderToStaticMarkup(<RaceTrack players={view.players} finish={1600} laneCount={4} minimal/>)
  expect(html).toContain('sprint-rider-label')
  expect(html).toContain('Peta')
  expect(html.match(/class="sprint-lane"/g)).toHaveLength(4)
  for(const hidden of ['sprint-name','metres','START','sprint-distance','sprint-marker','sprint-trail']) expect(html).not.toContain(hidden)
  expect(html).toContain('sprint-finish')
})

it('shows joining, names and Start before the race, with a small Admin link',()=>{
  const html=renderToStaticMarkup(<RaceHostView {...props} view={view}/>)
  expect(html).toContain('Scan to join this race')
  expect(html).toContain('Peta')
  expect(html).toContain('Start race')
  expect(html).toContain('href="/english/race/admin"')
  expect(html).not.toContain('race-world-track')
})

it('uses the approved world track and animated horses for the classroom race',()=>{
  const players=Array.from({length:10},(_,lane)=>({...view.players[0],id:`rider-${lane}`,lane,name:`Rider ${lane+1}`}))
  const html=renderToStaticMarkup(<RaceHostView {...props} ready view={{...view,players,phase:'answering',round:0,question:{id:'0',english:'How many?',choices:['a','b']}}}/>)
  const dom=new DOMParser().parseFromString(html,'text/html')
  expect(html).toContain('race-fullscreen')
  expect(html).toContain('race-world-track')
  expect(dom.querySelectorAll('.race-world-lane')).toHaveLength(10)
  expect(dom.querySelectorAll('.race-horse-speed')).toHaveLength(10)
  expect(dom.querySelectorAll('.race-world-horse .cartoon-horse')).toHaveLength(10)
  expect(html).toContain('is-running')
  expect(dom.querySelector('.race-live-question')?.textContent).toBe('How many?')
  for(const hidden of ['race-horse-sprite','sprint-lane','sprint-trail','sprint-course-overview','sprint-name','/english/race/admin','Scan to join','race-roster','race-header','metres per correct answer']) expect(html).not.toContain(hidden)
})

it('keeps a returning rider at their earned distance instead of animating from the start',()=>{
  const html=renderToStaticMarkup(<RaceHostView {...props} view={{...view,phase:'finished',round:2,players:[{...view.players[0],metres:800}]}}/>)
  expect(html).toContain('data-metres="800"')
  expect(html).toContain('left:800px')
  expect(html).not.toContain('is-running')
})

it('uses the same golden streak threshold as the phone and freezes horses when disconnected',()=>{
  const players=[4,5].map((streak,lane)=>({...view.players[0],id:String(lane),lane,streak}))
  const html=renderToStaticMarkup(<RaceHostView {...props} ready disconnected view={{...view,players,phase:'answering',round:0}}/>)
  const dom=new DOMParser().parseFromString(html,'text/html')
  const horses=dom.querySelectorAll('.cartoon-horse')
  expect(horses[0].classList.contains('is-powered')).toBe(false)
  expect(horses[1].classList.contains('is-powered')).toBe(true)
  expect([...horses].every(horse=>horse.classList.contains('is-paused'))).toBe(true)
})

it('shows answer progress without any Reveal control',()=>{
  const html=renderToStaticMarkup(<RaceHostView {...props} view={{...view,phase:'answering',round:0}}/>)
  expect(html).toContain('0 / 1 answered')
  expect(html).not.toContain('Reveal')
})

it('keeps the result and takes the teacher to Admin for the next race',()=>{
  const html=renderToStaticMarkup(<RaceHostView {...props} ready view={{...view,phase:'finished',round:2}}/>)
  const dom=new DOMParser().parseFromString(html,'text/html')
  expect(dom.querySelector('.race-live-question')?.textContent).toBe('Peta wins!')
  expect(dom.querySelector('.race-next-race')?.getAttribute('href')).toBe('/english/race/admin')
  expect(dom.querySelector('.race-next-race')?.textContent).toBe('Next race →')
  expect(dom.querySelector('.race-host-admin')?.textContent).toBe('Admin')
  expect(html).not.toContain('is-running')
  expect(html).not.toContain('New race')
})

it('offers a working audio retry after autoplay is blocked and stops audio on finish',async()=>{
  Object.assign(globalThis,{IS_REACT_ACT_ENVIRONMENT:true})
  vi.stubGlobal('ResizeObserver',class{observe(){} disconnect(){}})
  const play=vi.spyOn(HTMLMediaElement.prototype,'play').mockRejectedValueOnce(new Error('Autoplay blocked')).mockResolvedValue(undefined)
  const pause=vi.spyOn(HTMLMediaElement.prototype,'pause').mockImplementation(()=>{})
  const host=document.createElement('div')
  document.body.append(host)
  const root=createRoot(host)
  const active:RaceView={...view,players:[],phase:'answering',round:0,question:{id:'q',english:'Where is the ball?',audioUrl:'/audio/race-holiday/test.wav',choices:['a','b']}}
  try {
    await act(async()=>{root.render(<RaceHostView {...props} ready view={active}/>)})
    expect(play).toHaveBeenCalledTimes(1)
    const retry=[...host.querySelectorAll('button')].find(button=>button.textContent==='Retry audio')
    expect(retry).toBeTruthy()
    await act(async()=>{retry!.click()})
    expect(play).toHaveBeenCalledTimes(2)
    expect(host.textContent).not.toContain('Retry audio')
    await act(async()=>{root.render(<RaceHostView {...props} ready view={{...active,phase:'finished'}}/>)})
    expect(pause).toHaveBeenCalled()
    expect(play).toHaveBeenCalledTimes(2)
    expect(host.textContent).not.toContain('Sound on')
  } finally {
    await act(async()=>{root.unmount()})
    host.remove()
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  }
})

it('passes full streaks into the shared cartoon renderer for charge and growing power',()=>{
  const players=[3,4,5,12].map((streak,lane)=>({...view.players[0],id:String(lane),lane,streak,speed:20+lane*5}))
  const dom=new DOMParser().parseFromString(renderToStaticMarkup(<RaceHostView {...props} ready view={{...view,players,phase:'answering',round:12}}/>),'text/html')
  const horses=[...dom.querySelectorAll('.cartoon-horse')]
  expect(horses.map(h=>h.getAttribute('data-charge'))).toEqual(['3','4','0','0'])
  expect(horses.map(h=>h.getAttribute('data-power-level'))).toEqual(['0','0','1','8'])
})
