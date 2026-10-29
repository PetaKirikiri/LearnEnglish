import {supabase} from '../lib/supabase'
export const EXPERIENCED_PRACTICE_POINTS=600
export function practiceStartingRound(points:number):1|3{
 return Number.isFinite(points)&&points>=EXPERIENCED_PRACTICE_POINTS?3:1
}
/** Read the same English-only all-time awards used by the scoreboard. */
export async function loadPracticeStartingRound(userId:string):Promise<1|3>{
 const {data,error}=await supabase.rpc('english_success_leaderboard',{p_period:'all'})
 if(error)throw error
 if(!data||!Array.isArray(data.rows))throw new Error('Score unavailable')
 const own=data.rows.find((row:{id:string})=>row.id===userId)
 if(own&&(!Number.isFinite(own.points)||own.points<0))throw new Error('Score unavailable')
 return practiceStartingRound(own?.points??0)
}
