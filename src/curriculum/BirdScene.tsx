import {Fragment, type CSSProperties} from 'react'
import {birdAssetUrl,type BirdFrame,type BirdFocus,type BirdScene as Scene} from './birdArtwork'

const focusPoints:Record<BirdFocus,[number,number,number,number]>={
  whole:[50,50,92,88],subject:[44,48,66,84],action:[62,45,57,50],object:[69,75,49,39],
  state:[49,62,63,58],owner:[48,52,75,80],location:[50,52,95,94],quantity:[52,81,89,30],
  left:[25,52,45,87],right:[75,52,45,87],speech:[49,23,74,44],
}
function SceneFrame({frame}:{frame:BirdFrame}) {
  const point=focusPoints[frame.focus??'whole']
  // The seed is in the beak in this scene, not at the bottom of the picture.
  const [x,y,w,h]=frame.asset==='eating'&&frame.focus==='object'?[65,43,40,36]:point
  return <div className={`bird-scene-frame${frame.small?' bird-scene-small':''}`}>
    <div className="bird-scene-picture">
      <img src={birdAssetUrl(frame.asset)} alt="" width="176" height="176" loading="lazy" decoding="async"/>
      {frame.marker?<span className={`bird-focus bird-focus-${frame.marker}`} style={{'--focus-x':`${x}%`,'--focus-y':`${y}%`,'--focus-w':`${w}%`,'--focus-h':`${h}%`} as CSSProperties}>
        {frame.marker==='question'?<b>?</b>:frame.marker==='check'?<b>✓ / ×</b>:null}
      </span>:null}
    </div>
    {frame.caption?<span className="bird-scene-caption">{frame.caption}</span>:null}
  </div>
}
const relationships={cause:'→',contrast:'↛',together:'+',sequence:'→','same-time':'∥',identity:'↔',choice:'/'}
function Frames({frames,relationship}:{frames:BirdFrame[];relationship?:Scene['relationship']}) {
  return <div className={`bird-scene-frames${relationship?` bird-relation-${relationship}`:''}`}>
    {frames.map((frame,index)=><Fragment key={`${frame.asset}-${index}`}>
      {index>0?<span className="bird-scene-link">{relationship==='same-time'&&frames.length===3&&index===1?'→':relationships[relationship??'sequence']}</span>:null}
      <SceneFrame frame={frame}/>
    </Fragment>)}
  </div>
}
function TimeRail({time}:{time:NonNullable<Scene['time']>}) {
  return <div className={`bird-time-rail bird-time-${time}`}>
    <span className="bird-time-track"/>
    <span className="bird-time-point bird-time-before"/>
    <span className="bird-time-point bird-time-current"/>
    <span className="bird-time-point bird-time-after"/>
    <svg className="bird-time-clock" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="9"/><path d="M12 6v6l4 2"/></svg>
    <span className="bird-time-now">Now</span>
  </div>
}

export default function BirdScene({scene}:{scene:Scene}) {
  return <figure className={`bird-scene${scene.frames.length>1||scene.reality?' bird-scene-sequence':''}`} role="img" aria-label={scene.description} data-visual-target={scene.target}>
    <div aria-hidden="true">
      {scene.reality?<div className="bird-scene-reality"><Frames frames={scene.reality} relationship="sequence"/></div>:null}
      <div className={`bird-scene-story${scene.imagined?' bird-scene-imagined':''}${scene.intention?` bird-intention-${scene.intention}`:''}`}>
        {scene.repeated?<div className="bird-repeat-days"><span>☀</span><span>☀</span><span>☀</span><b>↻</b></div>:null}
        <Frames frames={scene.frames} relationship={scene.relationship}/>
        {scene.certainty?<div className={`bird-certainty bird-certainty-${scene.certainty}`}><i/><i/><i/><b>{scene.certainty==='impossible'?'×':scene.certainty==='possible'?'?':'✓'}</b></div>:null}
        {scene.intention==='permission'?<span className="bird-permission-mark">✓</span>:null}
      </div>
      {scene.time?<TimeRail time={scene.time}/>:null}
    </div>
  </figure>
}
