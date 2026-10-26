// @vitest-environment node
import { readFileSync } from 'node:fs'
import { beforeAll, describe, expect, it } from 'vitest'
import { AnimationMixer, SkinnedMesh, Vector3 } from 'three'
import { GLTFLoader, type GLTF } from 'three/addons/loaders/GLTFLoader.js'
import { clone } from 'three/addons/utils/SkeletonUtils.js'
import { makePostureClip } from './horseRig'
import { horseMoods, horseStyles } from './horseGait'

let rig: GLTF
beforeAll(async () => {
  const bytes = readFileSync('public/images/race/horse-rigged.glb')
  rig = await new GLTFLoader().parseAsync(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength), '')
})
describe('connected horse animation', () => {
  it('uses a skinned horse and an authored whole-body gallop', () => {
    let skins = 0
    rig.scene.traverse(object => { if (object instanceof SkinnedMesh) skins++ })
    expect(skins).toBeGreaterThan(0)
    const gallop = rig.animations.find(clip => clip.name === 'Gallop')!
    expect(gallop).toBeDefined()
    expect(gallop.tracks.map(track => track.name)).toEqual(expect.arrayContaining([
      'Body.position', 'Body.quaternion', 'Neck1.quaternion',
      'FrontUpperLegL.quaternion', 'FrontUpperLegR.quaternion',
      'BackUpperLegL.quaternion', 'BackUpperLegR.quaternion',
    ]))
  })
  it('preserves every gait track and never modifies the source animation', () => {
    const gallop = rig.animations.find(clip => clip.name === 'Gallop')!
    const original = gallop.tracks.map(track => Array.from(track.values))
    for (const mood of [...horseMoods, 'super'] as const) {
      const clip = makePostureClip(gallop, mood)
      expect(clip.duration).toBe(gallop.duration)
      expect(clip.tracks.map(track => track.name)).toEqual(gallop.tracks.map(track => track.name))
      clip.tracks.forEach((track, i) => {
        if (!/^(Neck1|Neck2|Head)\.quaternion$/.test(track.name) && !(mood === 'super' && track.name === 'Torso3.quaternion')) expect(Array.from(track.values)).toEqual(original[i])
        expect(Array.from(track.values).every(Number.isFinite)).toBe(true)
      })
    }
    expect(gallop.tracks.map(track => Array.from(track.values))).toEqual(original)
  })
  it('changes whole-body motion over time and separates the three silhouettes', () => {
    const gallop = rig.animations.find(clip => clip.name === 'Gallop')!
    const headHeights: number[] = []
    for (const mood of horseMoods) {
      const model = clone(rig.scene)
      const mixer = new AnimationMixer(model)
      mixer.clipAction(makePostureClip(gallop, mood)).play()
      mixer.setTime(.2)
      model.updateMatrixWorld(true)
      headHeights.push(model.getObjectByName('Head')!.getWorldPosition(new Vector3()).y)
      const body = model.getObjectByName('Body')!
      const position = body.position.clone()
      const leg = model.getObjectByName('FrontUpperLegL')!
      const rotation = leg.quaternion.clone()
      mixer.setTime(.35)
      expect(body.position.distanceTo(position)).toBeGreaterThan(.001)
      expect(leg.quaternion.angleTo(rotation)).toBeGreaterThan(.01)
      mixer.uncacheRoot(model)
    }
    expect(headHeights[1] - headHeights[0]).toBeGreaterThan(.4)
    expect(headHeights[0] - headHeights[2]).toBeGreaterThan(.4)
    expect(horseStyles.confident.cadence).toBeGreaterThan(horseStyles.steady.cadence)
    expect(horseStyles.steady.cadence).toBeGreaterThan(horseStyles.struggling.cadence)
  })
})
