// @vitest-environment happy-dom
import {act} from 'react'
import {createRoot} from 'react-dom/client'
import {afterEach,expect,it,vi} from 'vitest'
import CityPage from './CityPage'
const connection=vi.hoisted(()=>({state:null,credentials:null,status:'idle',error:'',connect:vi.fn(),send:vi.fn()}))
vi.mock('./useCityConnection',()=>({useCityConnection:()=>connection}))
vi.mock('./useCityPrediction',()=>({useCityPrediction:()=>({prediction:null,move:vi.fn(),stale:false})}))
vi.mock('../lib/supabase',()=>({supabase:{auth:{getSession:async()=>({data:{session:{access_token:'test'}}})}}}))
vi.mock('../hotel/accountHandoff',()=>({finishHotelReturn:async()=>({id:'student'})}))
vi.mock('../auth/homeworkLine',()=>({homeworkLiffId:'test',recogniseHomeworkAccount:vi.fn()}))
vi.mock('./CityCanvas',()=>({default:()=>null}))
vi.mock('./Joystick',()=>({default:()=>null}))
Object.assign(globalThis,{IS_REACT_ACT_ENVIRONMENT:true})
afterEach(()=>{vi.useRealTimers();vi.unstubAllGlobals()})
it('waits and rechecks automatically without a join button or redundant sign-in link',async()=>{
 vi.useFakeTimers()
 history.replaceState(null,'','/english/city/controller')
 vi.stubGlobal('matchMedia',()=>({matches:false,addEventListener:vi.fn(),removeEventListener:vi.fn()}))
 const request=vi.fn().mockResolvedValue({ok:false,status:409,json:async()=>({error:'No city game is running.'})})
 vi.stubGlobal('fetch',request)
 const host=document.createElement('div');document.body.append(host);const root=createRoot(host)
 try{
  await act(async()=>root.render(<CityPage/>))
  expect(host.textContent).toContain('No city game is running.')
  expect(host.querySelector('button')).toBeNull()
  expect(host.querySelector('a')).toBeNull()
  expect(request).toHaveBeenCalledTimes(1)
  await act(async()=>vi.advanceTimersByTimeAsync(3000))
  expect(request).toHaveBeenCalledTimes(2)
 }finally{await act(async()=>root.unmount());host.remove()}
})
