import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { expect, it } from 'vitest'
import CartoonHorse from './CartoonHorse'

it('bursts once on a live transformation, never on mount, polling, pause or reconnect',async()=>{
  Object.assign(globalThis,{IS_REACT_ACT_ENVIRONMENT:true})
  const host=document.createElement('div'),root=createRoot(host)
  const render=async(streak:number,paused=false)=>{await act(async()=>{root.render(<CartoonHorse streak={streak} paused={paused} speed={20}/>)})}
  try {
    await render(5)
    expect(host.querySelector('.cartoon-transform')).toBeNull()
    await render(3)
    expect(host.querySelector('.cartoon-horse')?.getAttribute('data-charge')).toBe('3')
    await render(4)
    expect(host.querySelector('.cartoon-horse')?.getAttribute('data-charge')).toBe('4')
    await render(5)
    const burst=host.querySelector('.cartoon-transform')!
    expect(burst).not.toBeNull()
    await render(6)
    expect(host.querySelector('.cartoon-transform')).toBe(burst)
    await render(6,true)
    expect(host.querySelector('.cartoon-horse')?.classList.contains('is-paused')).toBe(true)
    expect(host.querySelector('.cartoon-transform')).toBe(burst)
    await render(6)
    await act(async()=>{burst.dispatchEvent(new Event('animationend',{bubbles:true}))})
    expect(host.querySelector('.cartoon-transform')).toBeNull()
    await render(7)
    expect(host.querySelector('.cartoon-transform')).toBeNull()
    await render(0)
    expect(host.querySelector('.cartoon-energy')).toBeNull()
    await render(4,true)
    await render(5,true)
    await render(5)
    expect(host.querySelector('.cartoon-transform')).toBeNull()
    await render(4)
    await render(5)
    expect(host.querySelector('.cartoon-transform')).not.toBeNull()
  } finally { await act(async()=>root.unmount()) }
})
