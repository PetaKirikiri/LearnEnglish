import { useEffect, useRef, useState } from 'react'
import { recogniseHomeworkAccount } from '../auth/homeworkLine'
import { supabase } from '../lib/supabase'
import { emptyBoard, merge, move, offers, production } from './tableEngine'
import type { Board, Tile } from './tableEngine'
import type { Word } from './engine'
import './wordBattle.css'

type Game = { board: Board; shop: (Tile | null)[]; gold: number; tier: number; time: number; rival: Board; rivalGold: number; rivalShop: boolean[]; active: boolean }
const first = (): Game => ({ board: emptyBoard(), shop: [{id:1,word:'the',rank:0},{id:2,word:'dog',rank:0},{id:3,word:'runs',rank:0}], gold:8, tier:1, time:0, rival:emptyBoard(), rivalGold:8, rivalShop:[true,true,true], active:false })
const ranks = ['','★','★★']
export default function WordBattle() {
  const [game,setGame] = useState<Game>(first)
  const [selected,setSelected] = useState<{kind:'shop'|'board';index:number}|null>(null)
  const [help,setHelp] = useState(false)
  const [notice,setNotice] = useState('')
  const id = useRef(100)
  const account = useRef('guest')
  const saveFailed = useRef(false)
  const [storageError,setStorageError] = useState(false)
  const drag = useRef<{kind:'shop'|'board';index:number;x:number;y:number}|null>(null)
  const skipClick = useRef(false)
  const output=production(game.board)
  const rivalOutput=production(game.rival)
  const finished=game.time>=300
  useEffect(()=>{
    void supabase.auth.getSession().then(({data})=>{account.current=data.session?.user.id??'guest'})
    const {data}=supabase.auth.onAuthStateChange((_event,session)=>{account.current=session?.user.id??'guest'})
    if(/Line\//i.test(navigator.userAgent)||new URLSearchParams(location.search).has('liff.state'))void recogniseHomeworkAccount().catch(()=>setNotice('LINE sign-in unavailable. You can still play.'))
    return ()=>data.subscription.unsubscribe()
  },[])
  useEffect(()=>{
    if(!game.active || finished)return
    const timer=window.setInterval(()=>setGame(old=>{
      const time=old.time+1
      if(time%10!==0)return {...old,time}
      const score=production(old.board)
      const rival=[...old.rival]
      // A visible, slow bot buys one card per tick, completing a simple sentence.
      const botWords: Word[]=['the','cat','sleeps','a','dog','runs']
      const turn=Math.floor(time/10)-1
      const positions=[0,1,2,7,8,9]
      const shop=[...old.rivalShop]
      if(turn<6){rival[positions[turn]]={id:10000+turn,word:botWords[turn],rank:0};shop[turn%3]=false}
      if(turn%3===2)shop.fill(true)
      try {
        const key=`word-battle:tables:${account.current}`
        const history=JSON.parse(localStorage.getItem(key)??'[]')
        localStorage.setItem(key,JSON.stringify([...history,{at:Date.now(),groups:score.groups}].slice(-100)))
      }catch{saveFailed.current=true}
      return {...old,time,gold:old.gold+1+score.net,rival,rivalShop:shop,rivalGold:old.rivalGold+1+production(old.rival).net-(turn<6?1:0)}
    }),1000)
    return ()=>window.clearInterval(timer)
  },[game.active,finished])
  useEffect(()=>{if(saveFailed.current)setStorageError(true)},[game.time])
  useEffect(()=>{if(!notice)return;const timer=window.setTimeout(()=>setNotice(''),2600);return()=>window.clearTimeout(timer)},[notice])
  function place(source:{kind:'shop'|'board';index:number},target:number){
    if(finished)return
    setGame(old=>{
      if(source.kind==='board')return {...old,board:move(old.board,source.index,target)}
      const card=old.shop[source.index]
      if(!card || old.gold<1 || old.board[target])return old
      const board=[...old.board];board[target]=card
      const shop=[...old.shop];shop[source.index]=null
      return {...old,gold:old.gold-1,board:merge(board),shop}
    });setSelected(null)
  }
  function sell(index:number){
    setGame(old=>{if(!old.board[index]||finished)return old;const board=[...old.board];board[index]=null;return {...old,board,gold:old.gold-1}});setSelected(null);setNotice('Sold · −1 gold')
  }
  function clickSlot(index:number){
    if(skipClick.current){skipClick.current=false;return}
    if(selected){place(selected,index);return}
    if(game.board[index])setSelected({kind:'board',index})
  }
  function pointerDown(event:React.PointerEvent<HTMLButtonElement>,kind:'shop'|'board',index:number){
    drag.current={kind,index,x:event.clientX,y:event.clientY};skipClick.current=false;event.currentTarget.setPointerCapture(event.pointerId)
  }
  function pointerUp(event:React.PointerEvent<HTMLButtonElement>){
    const source=drag.current;drag.current=null
    if(!source || Math.hypot(event.clientX-source.x,event.clientY-source.y)<10)return
    skipClick.current=true
    const target=document.elementFromPoint(event.clientX,event.clientY)?.closest('[data-slot]')
    if(target){place(source,Number(target.getAttribute('data-slot')));return}
    const table=document.querySelector('.wt-board.you')?.getBoundingClientRect()
    if(source.kind==='board' && table && event.clientY>table.bottom+12)sell(source.index)
  }
  function shopClick(index:number){if(skipClick.current){skipClick.current=false;return}setSelected(old=>old?.kind==='shop'&&old.index===index?null:{kind:'shop',index})}
  return <main className="wt">
    <header className="wt-controls"><span className="wt-time">{Math.floor((300-game.time)/60)}:{String((300-game.time)%60).padStart(2,'0')}</span><button onClick={()=>setHelp(!help)} aria-label="Rules">?</button><button disabled={game.tier>=3||game.gold<game.tier*5||finished} onClick={()=>setGame(old=>({...old,gold:old.gold-old.tier*5,tier:old.tier+1}))}>Tier {game.tier} ↑ <small>{game.tier<3?game.tier*5:'MAX'}</small></button><strong className={game.gold<0?'negative':''}>● {game.gold}</strong><button disabled={game.gold<1||finished} onClick={()=>{setGame(old=>({...old,gold:old.gold-1,shop:offers(old.tier,()=>id.current++)}));setSelected(null)}}>↻ 1</button><button onClick={()=>setGame(old=>({...old,active:!old.active}))} disabled={finished}>{game.active?'Ⅱ':'▶'}</button></header>
    <aside className="wt-shop rival" aria-label="Opponent offers">{game.rivalShop.map((present,i)=><div key={i} className={`wt-offer back ${present?'':'vacant'}`} aria-label={present?'Face-down opponent offer':'Opponent bought this offer'}/>)}</aside>
    <section className="wt-table">
      <div className="wt-income rival"><span>Opponent · {game.rivalGold} ●</span><b>{1+rivalOutput.net>=0?'+':''}{1+rivalOutput.net} / tick</b></div>
      <div className="wt-board rival" aria-label="Opponent table">{game.rival.map((card,i)=><div key={i} className={`wt-slot ${card?'back':''}`} aria-label={card?'Opponent card, face down':'Empty opponent slot'}/>)}</div>
      <div className="wt-divider"><span>{10-game.time%10}s</span><div><i style={{width:`${(game.time%10)*10}%`}}/></div><b className={1+output.net<0?'negative':''}>{1+output.net>=0?'+':''}{1+output.net} ●</b></div>
      <div className="wt-board you" aria-label="Your table">{game.board.map((card,i)=><button key={i} data-slot={i} className={`wt-slot ${card?(output.values[i]>0?'good':'bad'):''} ${card?.rank===1?'silver':card?.rank===2?'gold':''} ${selected?.kind==='board'&&selected.index===i?'chosen':''}`} aria-label={`Slot ${i+1}${card?`: ${card.word}`:''}`} aria-pressed={selected?.kind==='board'&&selected.index===i} disabled={finished} onClick={()=>clickSlot(i)} onPointerDown={event=>{if(card)pointerDown(event,'board',i)}} onPointerUp={pointerUp} onPointerCancel={()=>{drag.current=null}}>{card&&<><span>{card.word}</span><small>{ranks[card.rank]}</small></>}</button>)}</div>
      <div className="wt-bottom"><span className={output.net<0?'negative':'positive'}>{output.net>=0?'+':''}{output.net} words · +1 base</span><button disabled={selected===null} onClick={()=>setSelected(null)}>×</button>{storageError&&<span role="alert">History could not save</span>}</div>
    </section>
    <aside className="wt-shop you" aria-label="Your offers">{game.shop.map((card,i)=><button key={i} className={`wt-offer ${card?.rank===1?'silver':card?.rank===2?'gold':''} ${selected?.kind==='shop'&&selected.index===i?'chosen':''}`} aria-label={card?`Buy ${card.word} for 1 gold`:'Empty offer'} disabled={!card||game.gold<1||finished} onClick={()=>shopClick(i)} onPointerDown={event=>{if(card)pointerDown(event,'shop',i)}} onPointerUp={pointerUp} onPointerCancel={()=>{drag.current=null}}>{card&&<><span>{card.word}</span><small>{ranks[card.rank]} ● 1</small></>}</button>)}</aside>
    {notice&&<div className="wt-toast" role="status">{notice}</div>}
    {(!game.active||finished)&&!help&&<div className="wt-pause"><button onClick={()=>{if(finished){setGame(first());setSelected(null)}else setGame(old=>({...old,active:true}))}}>{finished?'Play again':game.time?'Resume':'Play'}</button>{finished&&<span>You {game.gold} · Opponent {game.rivalGold}</span>}</div>}
    {help&&<div className="wt-help"><button onClick={()=>setHelp(false)}>×</button><p>Drag offers into empty slots, or tap a word then a slot. Move cards to arrange them. Empty slots split groups; rows score separately.</p><p>Green groups earn gold every 10 seconds. Red words cost 1 each. You also get 1 base gold per tick. Gold can fall below zero.</p><p>Refresh 1 · Buy 1 · Sell 1. To sell, drag below your table. You can sell even in debt. Pause with Ⅱ.</p><p>Three identical words merge into silver; three silvers into gold. Higher tavern tiers can offer silver/gold words. Upgrade costs 5 then 10. Silver/gold words add +1/+2 to a valid group’s tick.</p><p>12 words: the, a, big, small, dog, cat, fish, runs, sleeps, eats, quickly, slowly. Noun phrases and complete sentences score; “runs quickly” works too.</p><p>Five minutes. The slow bot’s cards stay hidden. Highest gold wins.</p></div>}
  </main>
}
