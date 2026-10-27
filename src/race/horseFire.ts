import * as THREE from 'three'

// World-space flowing locks start at the animated neck/tail bones every frame.
// Their roots never slide independently of the galloping skeleton.
export function makeFireHair(model: THREE.Object3D, scene: THREE.Scene) {
  const group = new THREE.Group()
  group.visible = false
  scene.add(group)
  const material = new THREE.MeshStandardMaterial({ color: '#ffe580', emissive: '#ffb619', emissiveIntensity: 1.1, roughness: .65, side: THREE.DoubleSide })
  const locks: { bone: THREE.Object3D; mesh: THREE.Mesh; length: number; width: number; lift: number; phase: number; offset: number }[] = []
  const segments = 18
  for (let i = 0; i < 10; i++) {
    const tail = i >= 5
    const bone = model.getObjectByName(tail ? 'Tail1' : ['Neck1', 'Neck2', 'Neck3', 'Head', 'Neck2'][i])
    if (!bone) continue
    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array((segments + 1) * 6), 3))
    const indices: number[] = []
    for (let j = 0; j < segments; j++) { const a = j * 2; indices.push(a, a + 1, a + 2, a + 1, a + 3, a + 2) }
    geometry.setIndex(indices)
    const mesh = new THREE.Mesh(geometry, material)
    mesh.frustumCulled = false
    group.add(mesh)
    locks.push({ bone, mesh, length: tail ? 4.6 + (i % 3) * .3 : 3.4 + i * .2, width: tail ? .16 : .19, lift: tail ? .15 + (i - 5) * .1 : .4 + i * .06, phase: i * 1.7, offset: (i % 5 - 2) * .09 })
  }
  const root = new THREE.Vector3()
  return {
    update(active: boolean, time: number, power = 1) {
      group.visible = active
      if (!active) return
      model.updateMatrixWorld(true)
      for (const lock of locks) {
        lock.bone.getWorldPosition(root)
        const position = lock.mesh.geometry.getAttribute('position') as THREE.BufferAttribute
        for (let j = 0; j <= segments; j++) {
          const t = j / segments
          const wave = Math.sin(time * 9 - t * 7 + lock.phase) * t * .3
          const y = root.y + Math.sin(t * Math.PI * .7) * lock.lift + wave
          const z = root.z - lock.length * (1 + Math.log2(Math.max(1, power)) * .12) * t
          const half = lock.width * Math.sin(Math.PI * (.12 + .88 * t)) * (1 - t * .6)
          for (let side = 0; side < 2; side++) position.setXYZ(j * 2 + side, root.x + lock.offset + Math.sin(t * 5 + time * 5 + lock.phase) * t * .12, y + (side ? half : -half), z)
        }
        position.needsUpdate = true
        lock.mesh.geometry.computeVertexNormals()
      }
    },
    dispose() { scene.remove(group); locks.forEach(lock => lock.mesh.geometry.dispose()); material.dispose() },
  }
}
