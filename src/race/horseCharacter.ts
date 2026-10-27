import * as THREE from 'three'

// Facial pieces are attached in the head bone's local space, so they follow
// the same skeleton as the neck and body rather than floating over the sprite.
export function makeHorseCharacter(model: THREE.Object3D) {
  model.updateMatrixWorld(true)
  const head = model.getObjectByName('Head')
  const bounds = (name: RegExp) => {
    const box = new THREE.Box3(), v = new THREE.Vector3()
    model.traverse(object => {
      if (!(object instanceof THREE.SkinnedMesh)) return
      const material = Array.isArray(object.material) ? object.material[0] : object.material
      if (!name.test(material.name)) return
      for (let i = 0; i < object.geometry.attributes.position.count; i++) {
        object.getVertexPosition(i, v).applyMatrix4(object.matrixWorld)
        if (v.x < 0) box.expandByPoint(v)
      }
    })
    return box
  }
  const eyes = bounds(/Eye/), muzzle = bounds(/Muzzle/)
  const group = new THREE.Group()
  const materials: THREE.Material[] = [], geometries: THREE.BufferGeometry[] = []
  const paint = (colour: string) => { const m = new THREE.MeshStandardMaterial({ color: colour, roughness: .5 }); materials.push(m); return m }
  const white = paint('#fff8e8'), dark = paint('#261e26'), brown = paint('#613c29')
  const ball = (material: THREE.Material, position: THREE.Vector3, scale: THREE.Vector3) => {
    const geometry = new THREE.SphereGeometry(1, 24, 16); geometries.push(geometry)
    const mesh = new THREE.Mesh(geometry, material);mesh.position.copy(position);mesh.scale.copy(scale);group.add(mesh);return mesh
  }
  const centre = eyes.isEmpty() ? new THREE.Vector3(-.27,3.6,1.7) : eyes.getCenter(new THREE.Vector3())
  centre.x -= .06
  const eye = ball(white, centre, new THREE.Vector3(.13,.24,.29))
  const pupil = ball(dark, centre.clone().add(new THREE.Vector3(-.12,0,.08)), new THREE.Vector3(.07,.14,.14))
  ball(white,centre.clone().add(new THREE.Vector3(-.18,.06,.1)),new THREE.Vector3(.025,.045,.04))
  const brow = ball(brown, centre.clone().add(new THREE.Vector3(-.035,.29,0)),new THREE.Vector3(.1,.055,.32))
  const mouthCentre = muzzle.isEmpty() ? centre.clone().add(new THREE.Vector3(0,-.4,.6)) : muzzle.getCenter(new THREE.Vector3())
  mouthCentre.x = Math.min(mouthCentre.x,centre.x) - .045
  mouthCentre.y -= .09
  const smileGeo = new THREE.TubeGeometry(new THREE.CatmullRomCurve3([new THREE.Vector3(0,.06,-.22), new THREE.Vector3(0,-.06,0), new THREE.Vector3(0,.09,.23)]),16,.025,8,false);geometries.push(smileGeo)
  const smile = new THREE.Mesh(smileGeo,dark);smile.position.copy(mouthCentre);group.add(smile)
  const puffPaint = paint('#dce7d1')
  puffPaint.transparent = true; puffPaint.opacity = .55
  const puffs = Array.from({ length: 3 }, (_, i) => ball(puffPaint, mouthCentre.clone(), new THREE.Vector3(.06,.06,.06).multiplyScalar(1+i*.3)))
  const cough = ball(dark,mouthCentre,new THREE.Vector3(.04,.1,.08));cough.visible=false
  model.add(group);model.updateMatrixWorld(true)
  // The group was authored in world coordinates; attach through the inverse
  // root matrix before moving it beneath the head bone.
  model.remove(group);group.updateMatrixWorld(true)
  head?.attach(group)
  return {
    update(struggling: boolean, time: number) {
      const breath = (time % 2) / 2
      puffs.forEach((puff, i) => {
        const t = (breath + i * .16) % 1
        puff.visible = struggling && t < .65
        puff.position.copy(mouthCentre).add(new THREE.Vector3(-.03, .05 + t*.2, .2+t*.7))
        puff.scale.setScalar(.04 + t*.14)
      })
      eye.scale.y = struggling ? .14 : .24
      pupil.scale.y = struggling ? .075 : .14
      brow.rotation.x = struggling ? -.35 : .18
      smile.visible = !struggling; cough.visible = struggling
      cough.scale.y = .06 + (struggling ? Math.max(0,Math.sin(time*5))*.075 : 0)
    },
    dispose() { group.removeFromParent(); materials.forEach(m=>m.dispose());geometries.forEach(g=>g.dispose()) },
  }
}
