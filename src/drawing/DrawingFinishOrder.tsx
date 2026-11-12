import type {Drawing} from './game'
export default function DrawingFinishOrder({drawings}:{drawings:Drawing[]}){
 const finished=drawings.filter(d=>d.finishRank).sort((a,b)=>a.finishRank!-b.finishRank!)
 const allFinished=finished.length===drawings.length
 return <ol className="dg-finish-order" aria-label="Drawing finish order">{finished.map(d=><li key={d.artist} data-rank={d.finishRank} data-last={allFinished&&d.finishRank===drawings.length&&drawings.length>2}><span className="dg-finish-place">{d.finishRank===1?'1st':d.finishRank===2?'2nd':d.finishRank===3?'3rd':`${d.finishRank}th`}{allFinished&&d.finishRank===drawings.length&&drawings.length>2&&<small>Last</small>}</span><strong>{d.name}</strong>{Boolean(d.finishBonus)&&<span className="dg-finish-points">+{d.finishBonus} ★</span>}</li>)}</ol>
}
