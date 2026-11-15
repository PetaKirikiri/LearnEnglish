import {act} from 'react'
import {createRoot} from 'react-dom/client'
import {expect,it,vi} from 'vitest'
import PlaybackButtons from './PlaybackButtons'
import {getPlaybackRate} from './usePlaybackMode'
import {speakEnglish,stopEnglishSpeech} from '../learning/speech'

it('replays at each selected speed, preserves pitch, and shares the preference across controls',async()=>{
 (globalThis as {IS_REACT_ACT_ENVIRONMENT?:boolean}).IS_REACT_ACT_ENVIRONMENT=true
 const players:{playbackRate:number;preservesPitch:boolean}[]=[]
 vi.stubGlobal('Audio',class{
  src='';playbackRate=1;preservesPitch=false;onended=null;onerror=null
  constructor(){players.push(this)}
  pause(){} play(){return Promise.resolve()}
 })
 const host=document.createElement('div'),root=createRoot(host),rates:number[]=[]
 const play=()=>{rates.push(getPlaybackRate());speakEnglish('the hotel','/audio/test.mp3')}
 try{
  await act(async()=>root.render(<><PlaybackButtons onPlay={play}/><PlaybackButtons onPlay={play}/></>))
  expect(host.textContent).not.toMatch(/Slow|Fast/);expect(host.querySelectorAll('.playback-art')).toHaveLength(4)
  const slow=host.querySelector<HTMLButtonElement>('[aria-label="Slow speaking speed"]')!
  const fast=host.querySelector<HTMLButtonElement>('[aria-label="Fast speaking speed"]')!
  await act(async()=>slow.click())
  expect(rates).toEqual([.55]);expect(players[0].playbackRate).toBe(.55);expect(players[0].preservesPitch).toBe(true)
  expect(host.querySelectorAll('[aria-label="Slow speaking speed"][aria-pressed="true"]')).toHaveLength(2)
  await act(async()=>slow.click());expect(rates).toEqual([.55,.55])
  await act(async()=>fast.click());expect(rates).toEqual([.55,.55,1]);expect(players[0].playbackRate).toBe(1)
  expect(localStorage.getItem('englishsuccess:playback-mode')).toBe('normal')
 }finally{stopEnglishSpeech();await act(async()=>root.unmount());vi.unstubAllGlobals()}
})
