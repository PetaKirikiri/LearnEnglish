// Build delivery-sized copies; keep generated alpha and full-resolution masters.
// macOS asset-authoring utility, not part of the deploy build.
import { readdirSync, mkdirSync, statSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const source = fileURLToPath(new URL('../public/images/fimo/', import.meta.url))
const target = path.join(source, 'thumbs')
mkdirSync(target, { recursive: true })
const files = readdirSync(source).filter(name => /^word-[a-z-]+\.png$/.test(name))
for (const file of files) {
  execFileSync('/usr/bin/sips', ['--resampleHeightWidthMax', '256', path.join(source,file), '--out', path.join(target,file)], { stdio:'ignore' })
}
const total = files.reduce((sum,file) => sum + statSync(path.join(target,file)).size, 0)
console.log(`${files.length} transparent icon thumbnails; ${(total/1024/1024).toFixed(2)} MB total`)
