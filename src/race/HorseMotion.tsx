import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { clone } from 'three/addons/utils/SkeletonUtils.js'
import { horseStyles, type HorseMood } from './horseGait'
import { makePostureClip, type HorsePose } from './horseRig'
import { makeFireHair } from './horseFire'
import { makeHorseCharacter } from './horseCharacter'
import { mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js'
import './horsePower.css'
import { GOLDEN_MIN_SPEED, GOLDEN_SPEED, MIN_SPEED, MAX_SPEED } from './rules'

let rigRequest: ReturnType<GLTFLoader['loadAsync']> | undefined
function loadRig() {
  rigRequest ??= new GLTFLoader().loadAsync('/images/race/horse-rigged.glb').catch(error => {
    rigRequest = undefined
    throw error
  })
  return rigRequest
}

export default function HorseMotion({ mood, paused = false, slow = false, speed, onFire = false, power = 1, charge = 0 }: { mood: HorseMood; paused?: boolean; slow?: boolean; speed?: number; onFire?: boolean; power?: number; charge?: number }) {
  const container = useRef<HTMLDivElement>(null)
  const controls = useRef({ mood, paused, slow, speed, onFire, power, charge })
  const [error, setError] = useState(false)
  useEffect(() => { controls.current = { mood, paused, slow, speed, onFire, power, charge } }, [mood, paused, slow, speed, onFire, power, charge])
  useEffect(() => {
    const element = container.current
    if (!element) return
    let renderer: THREE.WebGLRenderer
    try { renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true }) }
    catch {
      const reportFailure = window.setTimeout(() => setError(true), 0)
      return () => window.clearTimeout(reportFailure)
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5))
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFSoftShadowMap
    renderer.setClearColor(0x000000, 0)
    element.appendChild(renderer.domElement)
    const scene = new THREE.Scene()
    const camera = new THREE.OrthographicCamera(-5, 5, 5, -1, .1, 100)
    camera.position.set(-15, 4.8, 0)
    camera.lookAt(0, 2.2, 0)
    scene.add(new THREE.HemisphereLight(0xfff5e5, 0x6d9989, 1.8))
    const key = new THREE.DirectionalLight(0xffe1b1, 2.4)
    key.position.set(-5, 9, 5)
    key.castShadow = true
    key.shadow.mapSize.set(512, 512)
    Object.assign(key.shadow.camera, { left: -6, right: 6, top: 6, bottom: -6 })
    key.shadow.normalBias = .04
    scene.add(key)
    const fill = new THREE.DirectionalLight(0xc3e4ff, 1.4)
    fill.position.set(4, 5, -4)
    scene.add(fill)
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(30, 30), new THREE.ShadowMaterial({ opacity: .25 }))
    ground.rotation.x = -Math.PI / 2
    ground.receiveShadow = true
    // Keep the transparent sprite free of a rectangular shadow receiver.
    ground.visible = false
    const resize = () => {
      // Layout size excludes the shared race-camera transform. Keep enough
      // texture resolution for a horse that may zoom back in after a replay.
      const width = element.clientWidth, height = element.clientHeight
      if (!width || !height) return
      const resolution = Math.max(1, 180 / width)
      renderer.setSize(width * 1.5 * resolution, height * resolution, false)
      Object.assign(renderer.domElement.style, { width: '150%', height: '100%', position: 'absolute', left: '-50%', top: '0' })
      const aspect = width / height
      camera.left = -5.4 * aspect
      camera.right = 2.7 * aspect
      camera.top = 2.7
      camera.bottom = -2.7
      camera.updateProjectionMatrix()
    }
    const observer = new ResizeObserver(resize)
    observer.observe(element)
    resize()
    let disposed = false
    let mixer: THREE.AnimationMixer | undefined
    let model: THREE.Object3D | undefined
    const materials: THREE.Material[] = []
    const coats: { material: THREE.MeshStandardMaterial; colour: THREE.Color; emissive: THREE.Color; intensity: number }[] = []
    let character: ReturnType<typeof makeHorseCharacter> | undefined
    const smoothGeometry: THREE.BufferGeometry[] = []
    let fireHair: ReturnType<typeof makeFireHair> | undefined
    let fiery = false
    let lastPower = 0
    let hairTime = 0
    const actions = new Map<HorsePose, THREE.AnimationAction>()
    let activeMood: HorsePose = controls.current.onFire ? 'super' : controls.current.mood
    const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)')
    void loadRig().then(gltf => {
      if (disposed) return
      model = clone(gltf.scene)
      model.traverse(object => {
        if (!(object instanceof THREE.Mesh)) return
        object.castShadow = true
        const geometry = object.geometry.clone()
        geometry.deleteAttribute('normal')
        object.geometry = mergeVertices(geometry, .00001)
        geometry.dispose()
        object.geometry.computeVertexNormals()
        smoothGeometry.push(object.geometry)
        const paint = (original: THREE.Material) => {
          const material = original.clone()
          if (material instanceof THREE.MeshStandardMaterial) {
            material.metalness = 0
            material.roughness = .82
            if (!/Eye|Hooves|Muzzle/.test(material.name)) coats.push({ material, colour: material.color.clone(), emissive: material.emissive.clone(), intensity: material.emissiveIntensity })
          }
          materials.push(material)
          return material
        }
        object.material = Array.isArray(object.material) ? object.material.map(paint) : paint(object.material)
      })
      scene.add(model)
      fireHair = makeFireHair(model, scene)
      character = makeHorseCharacter(model)
      mixer = new THREE.AnimationMixer(model)
      const gallop = gltf.animations.find(clip => clip.name === 'Gallop')
      if (!gallop) throw new Error('Horse model has no gallop animation')
      for (const state of ['confident', 'steady', 'struggling', 'super'] as const) {
        actions.set(state, mixer.clipAction(makePostureClip(gallop, state)))
      }
      actions.get(activeMood)!.play()
      mixer.update(.2)
    }).catch(() => { if (!disposed) setError(true) })
    let frame = 0
    let last = performance.now()
    const animate = (now: number) => {
      const delta = Math.min((now - last) / 1000, .05)
      last = now
      const settings = controls.current
      const pulse = settings.charge === 3 ? (now % 2800 < 110) : settings.charge === 4 ? (now % 600 < 180) : false
      const glowing = settings.onFire || (!settings.paused && pulse)
      if (model && (glowing !== fiery || settings.power !== lastPower)) {
        fiery = glowing
        lastPower = settings.power
        model.scale.z = fiery ? 1.08 : 1
        for (const coat of coats) {
          coat.material.color.copy(fiery ? new THREE.Color(coat.material.name === 'Hair' ? '#fff4ad' : '#eab247') : coat.colour)
          coat.material.emissive.copy(fiery ? new THREE.Color('#ffb326') : coat.emissive)
          coat.material.emissiveIntensity = fiery ? .12 + Math.min(.15, Math.log2(settings.power + 1) * .04) : coat.intensity
        }
      }
      if (mixer) {
        const pose = settings.onFire ? 'super' : settings.mood
        if (pose !== activeMood) {
          const previous = actions.get(activeMood)!
          const next = actions.get(pose)!
          next.reset()
          next.time = previous.time
          next.play().crossFadeFrom(previous, .25, false)
          activeMood = pose
        }
        const cadence = settings.onFire
          ? settings.speed === undefined ? 1.85 : 1.3 + .55 * Math.max(0, Math.min(1, (settings.speed - GOLDEN_MIN_SPEED) / (GOLDEN_SPEED - GOLDEN_MIN_SPEED)))
          : settings.speed === undefined ? horseStyles[settings.mood].cadence : .45 + .7 * Math.max(0, Math.min(1, (settings.speed - MIN_SPEED) / (MAX_SPEED - MIN_SPEED)))
        const rate = (cadence + (settings.onFire ? Math.min(.65, Math.log2(settings.power) * .15) : 0)) * (settings.slow ? .25 : 1)
        mixer.update(settings.paused || motionPreference.matches ? 0 : delta * rate)
        if (!settings.paused && !motionPreference.matches) hairTime += delta * rate
        fireHair?.update(settings.onFire, hairTime, settings.power)
        character?.update(settings.mood === 'struggling' && !settings.onFire, hairTime)
      }
      renderer.render(scene, camera)
      frame = requestAnimationFrame(animate)
    }
    frame = requestAnimationFrame(animate)
    return () => {
      disposed = true
      cancelAnimationFrame(frame)
      observer.disconnect()
      mixer?.stopAllAction()
      if (model) mixer?.uncacheRoot(model)
      model?.traverse(object => { if (object instanceof THREE.SkinnedMesh) object.skeleton.dispose() })
      materials.forEach(material => material.dispose())
      fireHair?.dispose()
      character?.dispose()
      smoothGeometry.forEach(g => g.dispose())
      ground.geometry.dispose()
      ground.material.dispose()
      renderer.dispose()
      renderer.forceContextLoss()
      renderer.domElement.remove()
    }
  }, [])
  return <div className={`horse-motion${onFire ? ' horse-motion-fire' : charge === 3 ? ' horse-charge-3' : charge === 4 ? ' horse-charge-4' : ''}`} style={{ animationPlayState: paused ? 'paused' : 'running', overflow: 'visible', '--power-strength': 1 + Math.log2(Math.max(1, power)) * .15 } as React.CSSProperties} ref={container} role="img" aria-label={onFire ? 'Super-fast golden horse with flowing mane and tail' : `${horseStyles[mood].label}: full-body galloping horse`}>
    {onFire && <span className="horse-power-burst" aria-hidden="true"/>}
    {error && <span role="alert">The horse could not load. Please reload this page.</span>}
  </div>
}
