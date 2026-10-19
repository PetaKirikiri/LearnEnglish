import { curriculumSchema, type Curriculum } from './schema'
import { installHotelCatalogue } from '../hotel/course'
import { scopeCurriculum, type LearningCourse } from './courseScope'

type Config = { url: string; anonKey: string }
type Cache = Pick<Storage, 'getItem' | 'setItem'>
let current: Curriculum | undefined
let catalogue: Curriculum | undefined
export function getCurriculum() { return current }
export function installCurriculum(value: unknown) {
  const snapshot = curriculumSchema.parse(value)
  catalogue = snapshot
  installSnapshot(snapshot)
  return snapshot
}
export function selectLearningCourse(course: LearningCourse) {
  if (!catalogue) throw new Error('Curriculum unavailable')
  installSnapshot(scopeCurriculum(catalogue, course), course)
}
function installSnapshot(snapshot: Curriculum, course?: LearningCourse) {
  // Validate first; never half-install a failed network/cache snapshot.
  const ordered = [...snapshot.courseSkills].sort((a,b)=>a.order-b.order)
  installHotelCatalogue(snapshot.questions, ordered.map(row=>({
    id:row.skill, name:snapshot.skills.find(s=>s.id===row.nodeId)!.title,
    prerequisites:snapshot.version===2?snapshot.courseSkills.filter(s=>snapshot.skills.find(n=>n.id===row.nodeId)!.prerequisites.includes(s.nodeId)).map(s=>s.skill):[],
  })), course)
  current = snapshot
}

export async function loadCurriculumDatabase(config: Config, storage: Cache, request: typeof fetch = fetch): Promise<'database'|'cache'> {
  if (!config.url || !config.anonKey) throw new Error('Language database is not configured')
  const origin = new URL(config.url)
  if (origin.protocol !== 'https:') throw new Error('Language database requires HTTPS')
  const key = `englishsuccess:curriculum:v2:${origin.origin}`
  try {
    const response = await request(`${origin.origin}/rest/v1/rpc/englishsuccess_curriculum_v2`, {
      method:'POST', headers:{apikey:config.anonKey,Authorization:`Bearer ${config.anonKey}`,'Content-Type':'application/json'},
      body:'{}',signal:AbortSignal.timeout(10000),
    })
    if (!response.ok) throw new Error('Curriculum is unavailable')
    const data = installCurriculum(await response.json())
    try { storage.setItem(key, JSON.stringify(data)) } catch { /* Fresh data still works in private mode. */ }
    return 'database'
  } catch (error) {
    try { installCurriculum(JSON.parse(storage.getItem(key) ?? 'null')); return 'cache' }
    catch { throw error }
  }
}

let pending: Promise<'database'|'cache'> | undefined
export function initializeCurriculum() {
  pending ??= loadCurriculumDatabase({url:import.meta.env.VITE_LANGUAGE_SUPABASE_URL?.trim()??'',anonKey:import.meta.env.VITE_LANGUAGE_SUPABASE_ANON_KEY?.trim()??''},localStorage)
    .catch(error=>{pending=undefined;throw error})
  return pending
}
