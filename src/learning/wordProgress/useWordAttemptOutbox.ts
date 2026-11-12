import {useCallback,useEffect,useRef,useState} from 'react'
import {flushWordAttempts,queueAttempt} from './store'
import type {WordAttempt} from './model'
/** Background delivery only: recording a classroom encounter never reloads a word bank. */
export function useWordAttemptOutbox(userId?:string){
 const [error,setError]=useState(false),active=useRef(userId)
 const retry=useCallback(async()=>{if(!userId)return;try{await flushWordAttempts(userId);if(active.current===userId)setError(false)}catch{if(active.current===userId)setError(true)}},[userId])
 useEffect(()=>{active.current=userId;void retry();const timer=setInterval(()=>void retry(),30000);window.addEventListener('online',retry);window.addEventListener('focus',retry);return()=>{active.current=undefined;clearInterval(timer);window.removeEventListener('online',retry);window.removeEventListener('focus',retry)}},[retry,userId])
 const record=useCallback((attempt:WordAttempt)=>{if(!userId)return;queueAttempt(userId,attempt);void retry()},[userId,retry])
 return {record,retry,error}
}
