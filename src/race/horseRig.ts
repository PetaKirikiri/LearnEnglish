import { AnimationClip, Quaternion, Vector3 } from 'three'
import type { HorseMood } from './horseGait'

// Pose the connected skeleton, retaining every authored body/limb keyframe.
// No independent image, legs, or bobbing layer is composited onto the horse.
export type HorsePose = HorseMood | 'super'
const posture: Record<HorsePose, Record<string, number>> = {
  confident: { Neck1: -.35, Neck2: -.10, Head: .12 },
  steady: { Neck1: .18, Neck2: .08, Head: -.08 },
  struggling: { Neck1: -.65, Neck2: -.28, Head: -.35 },
  super: { Torso3: -.12, Neck1: -.48, Neck2: -.12, Head: .40 },
}
export function makePostureClip(source: AnimationClip, mood: HorsePose): AnimationClip {
  const clip = source.clone()
  clip.name = `Gallop-${mood}`
  for (const track of clip.tracks) {
    const bone = track.name.replace('.quaternion', '')
    const angle = posture[mood][bone]
    if (angle === undefined || !track.name.endsWith('.quaternion')) continue
    const offset = new Quaternion().setFromAxisAngle(new Vector3(1, 0, 0), angle)
    const rotation = new Quaternion()
    for (let i = 0; i < track.values.length; i += 4) {
      rotation.fromArray(track.values, i).multiply(offset).normalize().toArray(track.values, i)
    }
  }
  return clip
}
