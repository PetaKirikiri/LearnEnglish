import DrawingSentence from './DrawingSentence'
import DrawingFinishOrder from './DrawingFinishOrder'
import {useEffect,useRef,useState,type PointerEvent,type CSSProperties} from 'react'
import type {Drawing,Game} from './game'
import {useDrawingGame} from './game'
import './drawing.css'
import './drawingHost.css'
import './drawingPresentation.css'
import './drawingVoting.css'
function Picture({drawing}:{drawing?:Drawing}){return drawing?.picture?<img className="dg-picture" src={drawing.picture} alt={`Drawing by ${drawing.name}`}/>:<div className="dg-picture dg-empty"><span aria-hidden="true">✎</span>No drawing submitted</div>}
function Avatar({name,url}:{name:string;url?:string|null}){const [failed,setFailed]=useState(false);const hue=[...name].reduce((n,c)=>n+c.charCodeAt(0),0)%4;return <span className={`dg-avatar dg-avatar-${hue}`} aria-hidden="true">{url&&!failed?<img src={url} alt="" onError={()=>setFailed(true)}/>:name.trim().slice(0,1).toUpperCase()}</span>}
function Coin({children}:{children:React.ReactNode}){return <span className="dg-coin"><i aria-hidden="true">★</i>{children}</span>}
function Scores({game,userId}:{game:Game;userId?:string}){return <ol className="dg-scores">{[...game.scores].sort((a,b)=>b.points-a.points).map((p,i)=><li key={p.id} data-you={p.id===userId}><b className="dg-rank">{i+1}</b><Avatar name={p.name} url={p.avatar}/><strong>{p.name}{p.id===userId&&<small>YOU · คุณ</small>}</strong><Coin>{p.points}</Coin></li>)}</ol>}
function Clock({game,offset}:{game:Game;offset:number}){const [now,setNow]=useState(()=>Date.now());useEffect(()=>{const t=setInterval(()=>setNow(Date.now()),200);return()=>clearInterval(t)},[]);const seconds=Math.max(0,Math.ceil((Date.parse(game.deadline??'')-now-offset)/1000))||0;return <strong className={`dg-clock${seconds<=10?' is-urgent':''}`} aria-label={`${seconds} seconds left`}><span aria-hidden="true">◷</span>{seconds}<small>s</small></strong>}
type HostPlayer={id:string;name:string;avatar?:string|null}
type HostProps={game:Game;error:string;busy:boolean;act:(action:string,payload?:Record<string,unknown>)=>Promise<boolean>;offset:number;players?:HostPlayer[]}
function GameMark({kind}:{kind:'draw'|'guess'|'vote'}){
 return <svg viewBox="0 0 80 80" fill="none" aria-hidden="true" stroke="currentColor" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round">
  {kind==='draw'?<><path d="m48 14 18 18-32 32-24 6 6-24 32-32Z" fill="currentColor" stroke="none"/><path d="m45 28 8 8M18 55l7 7" stroke="var(--mark-cutout,#1877ef)"/><path d="M12 20h14M19 13v14M51 65h17"/></>:kind==='guess'?<><path d="M18 13h44c8 0 12 5 12 13v22c0 8-4 13-12 13H38L19 73V61C9 61 6 56 6 48V26c0-8 4-13 12-13Z" fill="currentColor" stroke="none"/><path d="M31 30c0-13 24-13 24 0 0 8-12 7-12 15" stroke="var(--mark-cutout,#ea5365)"/><circle cx="43" cy="53" r="3" fill="var(--mark-cutout,#ea5365)" stroke="none"/></>:<><path d="M24 12h32v22c0 13-6 20-16 20S24 47 24 34V12Z" fill="currentColor" stroke="none"/><path d="M24 19H11v11c0 10 6 14 16 14M56 19h13v11c0 10-6 14-16 14M40 52v14M25 70h30"/></>}
 </svg>
}
export default function DrawingHost({sessionId,players}:{sessionId:string;players?:HostPlayer[]}){
 const {game,error,busy,act,offset}=useDrawingGame(sessionId,true)
 if(!game)return <section className="dg dg-host"><div className="dg-loading"><GameMark kind="draw"/><h1>Draw & Guess</h1><p role={error?'alert':'status'}>{error||'Opening game…'}</p></div></section>
 return <DrawingHostScreen game={game} error={error} busy={busy} act={act} offset={offset.current} players={players}/>
}
export function DrawingHostScreen({game,error,busy,act,offset,players}:HostProps){
 const current=game.drawings.find(d=>d.artist===game.artist),payload={round:game.round,artist:game.artist}
 const lobby=game.phase==='lobby',finished=game.drawings.filter(d=>d.finishRank).length
 const joined=players??(game.scores.length?game.scores:game.drawings.map(d=>({id:d.artist,name:d.name,avatar:d.avatar})))
 const stage=game.phase==='drawing'?0:game.phase==='guessing'?1:2
 const steps=[{kind:'draw',title:'Draw',caption:'Your word. Your picture.',reward:'Finish first · +3 / +2 / +1'},{kind:'guess',title:'Guess',caption:'Say it out loud.',reward:'Correct answer · +1'},{kind:'vote',title:'Vote',caption:'Pick your favourite.',reward:'Best picture · +3'}] as const
 const setup=<div className="dg-launch-bar"><button className="dg-primary dg-launch" disabled={busy||joined.length===0} onClick={()=>void act('start',{round:game.round,seconds:60})}>{busy?'Starting…':game.round?'Start next round':'Start drawing'}<span aria-hidden="true">→</span></button></div>
 return <section className={`dg dg-host dg-host-${game.phase}`}>
  {game.phase!=='guessing'&&<header className="dg-game-header"><div><small>CLASSROOM PLAY</small><h1>Draw <span>&</span> Guess</h1></div><span className="dg-round-pill">{game.round?`Round ${String(game.round).padStart(2,'0')}`:'Let’s play'}</span></header>}
  {error&&<p role="alert">{error}</p>}
  {!lobby&&<DrawingFinishOrder drawings={game.drawings}/>}
  {lobby?<>
   <div className="dg-game-tiles">{steps.map((step,i)=><article className={`dg-game-tile dg-tile-${step.kind}`} key={step.kind}><div className="dg-tile-art"><span className="dg-tile-number">0{i+1}</span><GameMark kind={step.kind}/></div><div className="dg-tile-caption"><h2>{step.title}</h2><p>{step.caption}</p><small>{step.reward}</small></div></article>)}</div>
   {joined.length>0&&<div className="dg-player-strip" aria-label="Class students">{joined.map(p=><span className="dg-player-chip" key={p.id}><Avatar name={p.name} url={p.avatar}/><strong>{p.name}</strong></span>)}</div>}
   {setup}
  </>:<>
   {game.phase!=='guessing'&&<ol className="dg-host-stages" aria-label="Game progress">{steps.map((step,i)=><li key={step.kind} aria-current={stage===i?'step':undefined} data-done={stage>i}><GameMark kind={step.kind}/><span>{step.title}</span></li>)}</ol>}
   {game.phase==='drawing'&&<section className="dg-round-stage dg-drawing-wait"><div className="dg-drawing-heading"><div><small>DRAW ON YOUR PHONE</small><h2>Make your word a picture.</h2></div><Clock game={game} offset={offset}/></div><div className="dg-finish-progress"><span><b>{finished}</b> / {game.drawings.length} finished</span><progress value={finished} max={Math.max(1,game.drawings.length)} aria-label="Finished drawings"/></div><div className="dg-drawing-players">{game.drawings.map(d=><article key={d.artist} data-finished={Boolean(d.finishRank)}><Avatar name={d.name} url={d.avatar}/><strong>{d.name}</strong><span>{d.finishRank?`#${d.finishRank} · Ready`:'Drawing…'}</span>{Boolean(d.finishBonus)&&<Coin>+{d.finishBonus}</Coin>}</article>)}</div></section>}
   {game.phase==='guessing'&&<section className="dg-round-stage dg-host-guess"><div className="dg-guess-copy"><div className="dg-question"><DrawingSentence/></div><div className="dg-answer"><DrawingSentence answer={game.revealed?current?.english:null}/></div>{current?.awarded&&<p className="dg-host-award"><Coin>+1</Coin>{game.scores.find(s=>s.id===current.awarded)?.name}</p>}</div><figure className="dg-host-picture"><Picture drawing={current}/><figcaption>{current?.name}</figcaption></figure><div className="dg-actions">{!game.revealed&&<button disabled={busy} onClick={()=>void act('reveal',payload)}>Reveal</button>}<button className="dg-primary" disabled={busy} onClick={()=>void act('next',payload)}>Next →</button></div></section>}
   {(game.phase==='voting'||game.phase==='results')&&<section className="dg-round-stage dg-host-gallery"><div className="dg-gallery-heading"><div><small>{game.phase==='voting'?'VOTE ON YOUR PHONE':'ROUND COMPLETE'}</small><h2>{game.phase==='voting'?'ใครวาดภาพได้ดีที่สุด?':'Best picture'}</h2></div>{game.phase==='voting'&&<div className="dg-actions"><strong>{game.voteCount} / {game.drawings.length} votes</strong><button disabled={busy} onClick={()=>void act('finish',{round:game.round})}>Finish voting</button></div>}</div><div className="dg-gallery">{game.drawings.map(d=><article key={d.artist} data-winner={d.winner}><Picture drawing={d}/><div className="dg-gallery-person"><Avatar name={d.name} url={d.avatar}/><strong>{d.name}</strong>{d.winner&&<Coin>+3</Coin>}</div></article>)}</div>{game.phase==='voting'?<></>:<><h2 className="dg-score-title">Leaderboard</h2><Scores game={game}/>{setup}</>}</section>}
  </>}
 </section>
}
export function DrawingStudent({game,userId,busy,error,act,offset}:{game:Game;userId:string;busy:boolean;error:string;act:(a:string,p?:Record<string,unknown>)=>Promise<boolean>;offset:number}){
 const mine=game.drawings.find(d=>d.artist===userId),current=game.drawings.find(d=>d.artist===game.artist)
 return <main className={`dg dg-phone is-${game.phase}`}>
 {error&&<p role="alert">{error}</p>}
 {game.phase==='lobby'&&<Waiting/>}
 {game.phase==='drawing'&&(mine?.finishRank?<Finished rank={mine.finishRank} bonus={mine.finishBonus??0}/>:mine?<section className="dg-studio"><div className="dg-prompt"><div><h1>{mine.thai}</h1></div><Clock game={game} offset={offset}/></div><DrawingPad key={game.round} storageKey={`drawing:${userId}:${game.round}:${game.deadline}`} initial={mine.picture} deadline={Date.parse(game.deadline!)-offset} save={picture=>act('save',{round:game.round,picture})} complete={picture=>act('complete',{round:game.round,picture})}/></section>:<Waiting/>)}
 {game.phase==='guessing'&&(game.artist===userId&&!game.revealed?<AwardPanel game={game} userId={userId} busy={busy} act={act}/>:<Waiting message={current?.awarded?`+1 · ${game.scores.find(s=>s.id===current.awarded)?.name??''}`:undefined}/>)}
 {game.phase==='voting'&&<VotingPanel game={game} userId={userId} busy={busy} act={act}/>}
 {game.phase==='results'&&<Waiting/>}
 </main>
}
function Finished({rank,bonus}:{rank:number;bonus:number}){return <section className="dg-finished"><h1>Done · เสร็จแล้ว</h1><strong>#{rank}{bonus>0?` · +${bonus} ★`:''}</strong><Waiting/></section>}
function Waiting({message}:{message?:string}){return <section className="dg-waiting">{message&&<strong role="status">{message}</strong>}<h1>Look at the screen</h1><p>รอดูบนจอ</p></section>}
type Actions={game:Game;userId:string;busy:boolean;act:(a:string,p?:Record<string,unknown>)=>Promise<boolean>}
function AwardPanel({game,userId,busy,act}:Actions){return <section className="dg-name-screen"><h1>Who got it right?</h1><p>ใครตอบถูก?</p><div className="dg-name-buttons">{game.drawings.filter(d=>d.artist!==userId).map(d=><button disabled={busy} key={d.artist} onClick={()=>void act('award',{round:game.round,artist:game.artist,learner:d.artist})}>{d.name}</button>)}</div>{game.drawings.length===1&&<Waiting/>}</section>}
function VotingPanel({game,userId,busy,act}:Actions){const mine=game.drawings.some(d=>d.artist===userId),chosen=game.drawings.find(d=>d.artist===game.vote);return <section className="dg-name-screen"><h1>Favourite picture?</h1><p>ชอบภาพของใคร?</p>{chosen?<><strong className="dg-choice-saved" role="status">✓ {chosen.name}</strong><Waiting/></>:<div className="dg-name-buttons">{game.drawings.filter(d=>d.artist!==userId&&d.picture).map(d=><button disabled={busy||!mine} key={d.artist} onClick={()=>void act('vote',{round:game.round,artist:d.artist})}>{d.name}</button>)}</div>}{game.drawings.length===1&&<Waiting/>}</section>}
const colours=[['#182c4a','Ink'],['#ef4444','Red'],['#2563eb','Blue'],['#16a34a','Green'],['#f5b700','Yellow'],['#ffffff','Eraser']]
function DrawingPad({initial,storageKey,save,complete,deadline}:{initial:string;storageKey:string;save:(p:string)=>Promise<boolean>;complete:(p:string)=>Promise<boolean>;deadline:number}){
 const pendingSave=useRef<Promise<boolean>|null>(null),finishing=useRef(false)
 const [submitting,setSubmitting]=useState(false),[hasInk,setHasInk]=useState(Boolean(initial))
 const canvas=useRef<HTMLCanvasElement>(null),space=useRef<HTMLDivElement>(null),drawing=useRef<number|null>(null),last=useRef({x:0,y:0}),dirty=useRef(false),saving=useRef(false),saveRef=useRef(save),history=useRef<string[]>([]),edited=useRef(false)
 const [color,setColor]=useState('#182c4a'),[width,setWidth]=useState(5),[status,setStatus]=useState(''),[ended,setEnded]=useState(false),[size,setSize]=useState({width:320,height:240})
 useEffect(()=>{saveRef.current=save},[save])
 function paintImage(img:CanvasImageSource,w:number,h:number){const c=canvas.current!,ctx=c.getContext('2d')!,scale=Math.min(c.width/w,c.height/h);ctx.fillStyle='#fff';ctx.fillRect(0,0,c.width,c.height);ctx.drawImage(img,(c.width-w*scale)/2,(c.height-h*scale)/2,w*scale,h*scale)}
 useEffect(()=>{const node=space.current!;const resize=()=>{const c=canvas.current!,w=Math.max(1,Math.round(node.clientWidth)),h=Math.max(1,Math.round(node.clientHeight));if(c.width===w&&c.height===h)return;const old=document.createElement('canvas');old.width=c.width;old.height=c.height;old.getContext('2d')!.drawImage(c,0,0);c.width=w;c.height=h;paintImage(old,old.width,old.height);setSize({width:w,height:h});if(edited.current)dirty.current=true};const observer=new ResizeObserver(resize);observer.observe(node);resize();return()=>observer.disconnect()},[])

 async function flush(){if(!dirty.current||saving.current||finishing.current||Date.now()>=deadline)return;saving.current=true;dirty.current=false;const picture=canvas.current!.toDataURL('image/png');try{sessionStorage.setItem(storageKey,picture)}catch{/* Drawing remains in memory if browser storage is full. */}setStatus('Saving…');pendingSave.current=saveRef.current(picture);const ok=await pendingSave.current;if(!ok)dirty.current=true;setStatus(ok?'Saved ✓':'Retrying…');saving.current=false}
 useEffect(()=>{const c=canvas.current!,ctx=c.getContext('2d')!;ctx.fillStyle='#fff';ctx.fillRect(0,0,c.width,c.height);let stored:string|null=null;try{stored=sessionStorage.getItem(storageKey)}catch{/* Storage can be unavailable in private browsers. */}const picture=stored||initial;if(picture){const img=new Image();img.onload=()=>{if(!edited.current){paintImage(img,img.naturalWidth,img.naturalHeight);setHasInk(true);if(stored&&stored!==initial)dirty.current=true}};img.src=picture}
 const timer=setInterval(()=>{setEnded(Date.now()>=deadline);void flush()},250);return()=>clearInterval(timer)
 // A new round remounts this canvas. Server polling must never repaint live strokes.
 // eslint-disable-next-line react-hooks/exhaustive-deps
 },[])
 function point(e:PointerEvent<HTMLCanvasElement>){const r=e.currentTarget.getBoundingClientRect();return {x:(e.clientX-r.left)*e.currentTarget.width/r.width,y:(e.clientY-r.top)*e.currentTarget.height/r.height}}
 function stroke(e:PointerEvent<HTMLCanvasElement>){if(drawing.current!==e.pointerId||finishing.current||Date.now()>=deadline)return;const ctx=canvas.current!.getContext('2d')!,p=point(e);ctx.strokeStyle=color;ctx.lineWidth=width;ctx.lineCap='round';ctx.lineJoin='round';ctx.beginPath();ctx.moveTo(last.current.x,last.current.y);ctx.lineTo(p.x,p.y);ctx.stroke();last.current=p;dirty.current=true}
 function down(e:PointerEvent<HTMLCanvasElement>){if(finishing.current||Date.now()>=deadline||drawing.current!==null)return;e.preventDefault();e.currentTarget.setPointerCapture(e.pointerId);history.current.push(e.currentTarget.toDataURL());if(history.current.length>20)history.current.shift();drawing.current=e.pointerId;edited.current=true;setHasInk(true);last.current=point(e);const ctx=e.currentTarget.getContext('2d')!;ctx.fillStyle=color;ctx.beginPath();ctx.arc(last.current.x,last.current.y,width/2,0,Math.PI*2);ctx.fill();dirty.current=true}
 function up(e:PointerEvent<HTMLCanvasElement>){if(drawing.current===e.pointerId){drawing.current=null;void flush()}}
 function undo(){if(finishing.current||Date.now()>=deadline)return;const prev=history.current.pop();if(prev){const img=new Image();img.onload=()=>{paintImage(img,img.naturalWidth,img.naturalHeight);dirty.current=true;void flush()};img.src=prev}}
 async function done(){if(finishing.current||!hasInk||Date.now()>=deadline)return;finishing.current=true;setSubmitting(true);drawing.current=null;try{await pendingSave.current;const ok=await complete(canvas.current!.toDataURL('image/png'));if(!ok){finishing.current=false;setSubmitting(false)}}catch{finishing.current=false;setSubmitting(false);setStatus('Retrying…')}}
 return <div className="dg-pad-workspace"><div className="dg-canvas-space" ref={space}><canvas ref={canvas} width={640} height={480} style={size} className="dg-pad" aria-label="Draw your secret word" onPointerDown={down} onPointerMove={stroke} onPointerUp={up} onPointerCancel={up}/></div><button className="dg-done" disabled={ended||submitting||!hasInk} onClick={()=>void done()}>{submitting?'Sending…':'Ready · เสร็จแล้ว ✓'}</button><fieldset className="dg-tools" disabled={ended||submitting}><div className="dg-palette">{colours.map(([c,name])=><button key={c} className="dg-swatch" aria-label={name==='Eraser'?name:`${name} pen`} aria-pressed={color===c} style={{'--swatch':c} as CSSProperties} onClick={()=>setColor(c)}>{name==='Eraser'?'⌫':color===c?'✓':''}</button>)}</div><div className="dg-tool-actions"><button aria-label={`Brush size: ${width===5?'Fine':width===12?'Thick':'Wide'}`} onClick={()=>setWidth(width===5?12:width===12?28:5)}><span className="dg-brush-dot" style={{width:Math.min(width+3,24),height:Math.min(width+3,24)}}/>{width===5?'Fine':width===12?'Thick':'Wide'}</button><button onClick={undo}>↶ Undo</button></div></fieldset>{(ended||status==='Retrying…')&&<p className="dg-save" role="status">{ended?'Time’s up! · หมดเวลา':'Saving failed · กำลังลองอีกครั้ง'}</p>}</div>
}
