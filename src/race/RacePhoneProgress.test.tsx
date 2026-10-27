import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { expect, it } from 'vitest'
import RacePhoneProgress from './RacePhoneProgress'
import type { RacePlayer } from './types'

it('uses the same course scale for everyone, highlights me and keeps stable lanes through overtakes',async()=>{
  Object.assign(globalThis,{IS_REACT_ACT_ENVIRONMENT:true})
  const host=document.createElement('div'),root=createRoot(host)
  const rider=(id:string,lane:number,metres:number):RacePlayer=>({id,name:id,lane,metres,speed:10,answered:false})
  const positions=()=>Array.from(host.querySelectorAll<HTMLElement>('[role=progressbar]')).map(row=>[row.dataset.player,row.style.getPropertyValue('--progress')])
  try {
    await act(async()=>root.render(<RacePhoneProgress players={[rider('Bea',1,500),rider('Alex',0,1000)]} finish={2000} me="Bea"/>))
    expect(positions()).toEqual([['Alex','50%'],['Bea','25%']])
    expect(host.querySelector('.is-me')?.getAttribute('aria-label')).toBe('Bea (คุณ)')
    await act(async()=>root.render(<RacePhoneProgress players={[rider('Bea',1,2100),rider('Alex',0,1500)]} finish={2000} me="Bea"/>))
    expect(positions()).toEqual([['Alex','75%'],['Bea','100%']])
    expect(host.querySelectorAll('.phone-progress-name')).toHaveLength(2)
  } finally {await act(async()=>root.unmount())}
})
