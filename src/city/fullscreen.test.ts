import {afterEach,beforeEach,describe,expect,it,vi} from 'vitest'
import {controllerExpanded,enterControllerFullscreen} from './fullscreen'

describe('controller fullscreen',()=>{
 const request=vi.fn(),lock=vi.fn()
 beforeEach(()=>{
  request.mockReset().mockResolvedValue(undefined);lock.mockReset().mockResolvedValue(undefined)
  vi.stubGlobal('document',{fullscreenEnabled:true,documentElement:{requestFullscreen:request}})
  vi.stubGlobal('window',{matchMedia:()=>({matches:false})})
  vi.stubGlobal('navigator',{})
  vi.stubGlobal('screen',{orientation:{lock}})
 })
 afterEach(()=>vi.unstubAllGlobals())
 it('requests fullscreen synchronously within the join or expand tap',async()=>{
  const result=enterControllerFullscreen()
  expect(request).toHaveBeenCalledWith({navigationUI:'hide'})
  expect(await result).toBe('entered');expect(lock).toHaveBeenCalledWith('landscape')
 })
 it('returns guidance for unsupported browsers instead of silently succeeding',async()=>{
  vi.stubGlobal('document',{fullscreenEnabled:false,documentElement:{}})
  expect(await enterControllerFullscreen()).toBe('unsupported');expect(lock).not.toHaveBeenCalled()
 })
 it('returns guidance after rejection and allows another user-triggered attempt',async()=>{
  request.mockRejectedValueOnce(new Error('Not allowed'))
  expect(await enterControllerFullscreen()).toBe('denied')
  expect(await enterControllerFullscreen()).toBe('entered')
 })
 it('supports Safari prefixed fullscreen',async()=>{
  vi.stubGlobal('document',{webkitFullscreenEnabled:true,documentElement:{webkitRequestFullscreen:request}})
  expect(await enterControllerFullscreen()).toBe('entered');expect(request).toHaveBeenCalledOnce()
 })
 it('recognises installed standalone apps and does not request fullscreen again',async()=>{
  vi.stubGlobal('navigator',{standalone:true})
  expect(controllerExpanded()).toBe(true);expect(await enterControllerFullscreen()).toBe('entered');expect(request).not.toHaveBeenCalled()
 })
 it('keeps successful fullscreen when orientation lock is unavailable',async()=>{
  lock.mockRejectedValue(new Error('Unsupported'))
  expect(await enterControllerFullscreen()).toBe('entered')
 })
 it('recognises browser exit so the expand control can return',()=>{
  const doc={fullscreenElement:{},documentElement:{requestFullscreen:request}}
  vi.stubGlobal('document',doc);expect(controllerExpanded()).toBe(true)
  vi.stubGlobal('document',{...doc,fullscreenElement:null});expect(controllerExpanded()).toBe(false)
 })
})
