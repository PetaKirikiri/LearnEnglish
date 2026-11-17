import { useEffect, useRef, useState } from 'react'
import { recogniseHomeworkAccount } from '../auth/homeworkLine'
import { supabase } from '../lib/supabase'
import { emptyBoard, merge, move, offers, production } from './tableEngine'
import type { Board, Tile } from './tableEngine'
import type { Word } from './wordGrammar'
import { taughtWords } from './curriculumPool'
import './wordBattle.css'

export type Game = { board: Board; shop: (Tile | null)[]; gold: number; tier: number; time: number; rival: Board; rivalGold: number; rivalShop: boolean[]; active: boolean }
const first = (): Game => ({ board: emptyBoard(), shop: [{id:1,word:'the',rank:0},{id:2,word:'doctor',rank:0},{id:3,word:'is',rank:0},{id:4,word:'reading',rank:0}], gold:8, tier:1, time:0, rival:emptyBoard(), rivalGold:8, rivalShop:[true,true,true,true], active:false })
const ranks = ['','★','★★']
export default function WordBattle({online}:{online?:{game:Game;code:string;host:boolean;opponent:string;income:number;busy:boolean;starting:number;send:(action:string,body?:Record<string,unknown>)=>Promise<void>}}={}) {
  const [localGame,setGame] = useState<Game>(first)
  const game=online?.game??localGame
  const [selected,setSelected] = useState<{kind:'shop'|'board';index:number}|null>(null)
  const [help,setHelp] = useState(false)
  const [notice,setNotice] = useState('')
  const id = useRef(100)
  const account = useRef('guest')
  const saveFailed = useRef(false)
  const [storageError,setStorageError] = useState(false)
  const drag = useRef<{kind:'shop'|'board';index:number;x:number;y:number}|null>(null)
  const skipClick = useRef(false)
  const [dragView,setDragView] = useState<{kind:'shop'|'board';index:number;tile:Tile;x:number;y:number;width:number;height:number;target:number|null;selling:boolean;blocked:boolean}|null>(null)
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
    if(online || !game.active || finished)return
    const timer=window.setInterval(()=>setGame(old=>{
      if(old.time>=300)return old
      const time=old.time+1
      if(time%10!==0)return {...old,time}
      const score=production(old.board)
      const rival=[...old.rival]
      // A visible, slow bot buys one card per tick, completing a simple sentence.
      const botWords: Word[]=['I','am','reading','books','you','are','holding','the','book']
      const turn=Math.floor(time/10)-1
      const positions=[0,1,2,3,7,8,9,10,11]
      const shop=[...old.rivalShop]
      if(turn<botWords.length){rival[positions[turn]]={id:10000+turn,word:botWords[turn],rank:0};shop[turn%4]=false}
      if(turn%4===3)shop.fill(true)
      try {
        const key=`word-battle:tables:${account.current}`
        const history=JSON.parse(localStorage.getItem(key)??'[]')
        localStorage.setItem(key,JSON.stringify([...history,{at:Date.now(),groups:score.groups}].slice(-100)))
      }catch{saveFailed.current=true}
      return {...old,time,gold:old.gold+1+score.net,rival,rivalShop:shop,rivalGold:old.rivalGold+1+production(old.rival).net-(turn<botWords.length?1:0)}
    }),1000)
    return ()=>window.clearInterval(timer)
  },[game.active,finished,!!online])
  useEffect(()=>{if(saveFailed.current)setStorageError(true)},[game.time])
  useEffect(()=>{if(!notice)return;const timer=window.setTimeout(()=>setNotice(''),2600);return()=>window.clearTimeout(timer)},[notice])
  function place(source:{kind:'shop'|'board';index:number},target:number){
    if(finished)return
    if(online){void online.send(source.kind==='shop'?'buy':'move',{from:source.index,to:target});setSelected(null);return}
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
    if(online){void online.send('sell',{from:index});setSelected(null);return}
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
  function pointerMove(event:React.PointerEvent<HTMLButtonElement>){
    const source=drag.current
    if(!source||Math.hypot(event.clientX-source.x,event.clientY-source.y)<6)return
    const tile=source.kind==='shop'?game.shop[source.index]:game.board[source.index]
    if(!tile)return
    event.preventDefault()
    const hit=document.elementFromPoint(event.clientX,event.clientY)?.closest('[data-slot]')
    const target=hit?Number(hit.getAttribute('data-slot')):null
    const table=document.querySelector('.wt-board.you')?.getBoundingClientRect()
    const rect=event.currentTarget.getBoundingClientRect()
    setDragView({kind:source.kind,index:source.index,tile,x:event.clientX,y:event.clientY,width:rect.width,height:rect.height,target,selling:source.kind==='board'&&!!table&&event.clientY>table.bottom+12,blocked:source.kind==='shop'&&target!==null&&!!game.board[target]})
  }
  function cancelDrag(){drag.current=null;setDragView(null)}
  function pointerUp(event:React.PointerEvent<HTMLButtonElement>){
    const source=drag.current;drag.current=null;setDragView(null)
    if(!source || Math.hypot(event.clientX-source.x,event.clientY-source.y)<10)return
    skipClick.current=true
    const target=document.elementFromPoint(event.clientX,event.clientY)?.closest('[data-slot]')
    if(target){place(source,Number(target.getAttribute('data-slot')));return}
    const table=document.querySelector('.wt-board.you')?.getBoundingClientRect()
    if(source.kind==='board' && table && event.clientY>table.bottom+12)sell(source.index)
  }
  function shopClick(index:number){if(skipClick.current){skipClick.current=false;return}setSelected(old=>old?.kind==='shop'&&old.index===index?null:{kind:'shop',index})}
  return <main className="wt">
    <header className="wt-controls"><span className="wt-time">{Math.floor((300-game.time)/60)}:{String((300-game.time)%60).padStart(2,'0')}</span><button onClick={()=>setHelp(!help)} aria-label="Rules">?</button><button disabled={game.tier>=3||game.gold<game.tier*5||finished} onClick={()=>{if(online)void online.send('tier');else setGame(old=>({...old,gold:old.gold-old.tier*5,tier:old.tier+1}))}}>Tier {game.tier} ↑ <small>{game.tier<3?game.tier*5:'MAX'}</small></button><strong className={game.gold<0?'negative':''}>● {game.gold}</strong><button disabled={game.gold<1||finished} onClick={()=>{if(online)void online.send('refresh');else setGame(old=>({...old,gold:old.gold-1,shop:offers(old.tier,()=>id.current++,old.board)}));setSelected(null)}}>↻ 1</button>{online?<small>{online.code}</small>:<button onClick={()=>setGame(old=>({...old,active:!old.active}))} disabled={finished}>{game.active?'Ⅱ':'▶'}</button>}</header>
    <aside className="wt-shop rival" aria-label="Opponent offers">{game.rivalShop.map((present,i)=><div key={i} className={`wt-offer back ${present?'':'vacant'}`} aria-label={present?'Face-down opponent offer':'Opponent bought this offer'}/>)}</aside>
    <section className="wt-table">
      <div className="wt-income rival"><span>{online?.opponent??'Opponent'} · {game.rivalGold} ●</span><b>{(online?.income??1+rivalOutput.net)>=0?'+':''}{online?.income??1+rivalOutput.net} / tick</b></div>
      <div className="wt-board rival" aria-label="Opponent table">{game.rival.map((card,i)=><div key={i} className={`wt-slot ${card?'back':''}`} aria-label={card?'Opponent card, face down':'Empty opponent slot'}/>)}</div>
      <div className="wt-divider"><span>{10-game.time%10}s</span><div><i style={{width:`${(game.time%10)*10}%`}}/></div><b className={1+output.net<0?'negative':''}>{1+output.net>=0?'+':''}{1+output.net} ●</b></div>
      <div className="wt-board you" aria-label="Your table">{game.board.map((card,i)=><button key={i} data-slot={i} className={`wt-slot ${card?(output.values[i]>0?'good':'bad'):''} ${card?.rank===1?'silver':card?.rank===2?'gold':''} ${selected?.kind==='board'&&selected.index===i?'chosen':''} ${dragView?.kind==='board'&&dragView.index===i?'drag-source':''} ${dragView?.target===i?(dragView.blocked?'drop-blocked':'drop-target'):''}`} aria-label={`Slot ${i+1}${card?`: ${card.word}`:''}`} aria-pressed={selected?.kind==='board'&&selected.index===i} disabled={finished} onClick={()=>clickSlot(i)} onPointerDown={event=>{if(card)pointerDown(event,'board',i)}} onPointerMove={pointerMove} onPointerUp={pointerUp} onPointerCancel={cancelDrag}>{card&&<><span>{card.word}</span><small>{ranks[card.rank]}</small></>}</button>)}</div>
      <div className="wt-bottom"><span className={output.net<0?'negative':'positive'}>{output.net>=0?'+':''}{output.net} words · +1 base</span><button disabled={selected===null} onClick={()=>setSelected(null)}>×</button>{storageError&&<span role="alert">History could not save</span>}</div>
    </section>
    <aside className="wt-shop you" aria-label="Your offers">{game.shop.map((card,i)=><button key={i} className={`wt-offer ${card?.rank===1?'silver':card?.rank===2?'gold':''} ${selected?.kind==='shop'&&selected.index===i?'chosen':''} ${dragView?.kind==='shop'&&dragView.index===i?'drag-source':''}`} aria-label={card?`Buy ${card.word} for 1 gold`:'Empty offer'} disabled={!card||game.gold<1||finished} onClick={()=>shopClick(i)} onPointerDown={event=>{if(card)pointerDown(event,'shop',i)}} onPointerMove={pointerMove} onPointerUp={pointerUp} onPointerCancel={cancelDrag}>{card&&<><span>{card.word}</span><small>{ranks[card.rank]} ● 1</small></>}</button>)}</aside>
    {dragView&&<><div className={`wt-drag-ghost ${dragView.selling?'selling':''} ${dragView.tile.rank===1?'silver':dragView.tile.rank===2?'gold':''}`} style={{left:dragView.x,top:dragView.y,width:Math.max(68,dragView.width),height:Math.max(45,dragView.height)}} aria-hidden="true"><span>{dragView.tile.word}</span><small>{dragView.selling?'Sell −1':ranks[dragView.tile.rank]}</small></div>{dragView.kind==='board'&&<div className={`wt-sell-edge ${dragView.selling?'active':''}`}>Sell −1</div>}</>}
    {notice&&<div className="wt-toast" role="status">{notice}</div>}
    {(!game.active||finished)&&!help&&<div className="wt-pause">{online&&!finished?<strong>Starting in {online.starting}…</strong>:<>{finished&&<h2>{game.gold===game.rivalGold?'Draw':game.gold>game.rivalGold?'You win!':'Opponent wins'}</h2>}{(!online||online.host)?<button onClick={()=>{if(online){void online.send('rematch');return}if(finished){setGame(first());setSelected(null)}else setGame(old=>({...old,active:true}))}}>{finished?'Play again':game.time?'Resume':'Play'}</button>:<span>Waiting for host…</span>}{finished&&<span>You {game.gold} · {online?.opponent??'Opponent'} {game.rivalGold}</span>}</>}</div>}
    {help&&<div className="wt-help"><button onClick={()=>setHelp(false)}>×</button><p>Drag offers into empty slots, or tap a word then a slot. Move cards to arrange them. Empty slots split groups. Sentences continue from the last slot of the top row into the first slot below.</p><p>Green groups earn gold every 10 seconds. Red words cost 1 each. You also get 1 base gold per tick. Gold can fall below zero.</p><p>Refresh 1 · Buy 1 · Sell 1. To sell, drag below your table. You can sell even in debt. Pause with Ⅱ.</p><p>Three identical words merge into silver; three silvers into gold. Higher tavern tiers can offer silver/gold words. Upgrade costs 5 then 10. Silver/gold words add +1/+2 to a valid group’s tick.</p><p>{taughtWords.length} words: lesson 1–7 nouns and connecting words, with the app’s expanded verb catalogue for today’s test. Match is/are/am to the subject. Extend combinations with the connecting words already in those lessons, such as to and at.</p><p>Five minutes. Your opponent’s cards stay hidden. Highest gold wins. Online games use a shared server clock; the host starts the match when both players join.</p></div>}
  </main>
}
