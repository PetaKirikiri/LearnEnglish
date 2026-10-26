// Packaging only: no artwork is drawn or reconstructed here.
// Run with the path to an installed sharp package as the first argument.
import {readFile,mkdir,stat} from 'node:fs/promises'
import {pathToFileURL} from 'node:url'
import path from 'node:path'
const sharp=(await import(pathToFileURL(process.argv[2]).href)).default
const folder=path.resolve('public/images/fimo/bird-scenes')
const manifest=JSON.parse(await readFile(path.resolve('src/fimo/bird-artwork-generation.json'),'utf8'))
await mkdir(folder,{recursive:true})
const composites=[]
for(const [index,asset] of manifest.assets.entries()){
  const metadata=await sharp(asset.source).metadata()
  if(!metadata.hasAlpha) throw new Error(`No transparency: ${asset.id}`)
  await sharp(asset.source).resize(512,512,{fit:'inside',withoutEnlargement:true}).webp({quality:88,alphaQuality:100}).toFile(path.join(folder,asset.file))
  const thumb=await sharp(path.join(folder,asset.file)).resize(180,180,{fit:'contain',background:'#fffaf0'}).png().toBuffer()
  const left=index%6*200,top=Math.floor(index/6)*210
  composites.push({input:thumb,left:left+10,top})
  // Labels are solely for the contact-sheet review, never app artwork.
  const label=Buffer.from(`<svg width="200" height="28"><text x="100" y="18" text-anchor="middle" font-family="sans-serif" font-size="12">${asset.id}</text></svg>`)
  composites.push({input:label,left,top:top+180})
}
await sharp({create:{width:1200,height:Math.ceil(manifest.assets.length/6)*210,channels:4,background:'#fffaf0'}}).composite(composites).png().toFile('/tmp/bird-artwork-contact.png')
const bytes=await Promise.all(manifest.assets.map(async a=>(await stat(path.join(folder,a.file))).size))
console.log(`${manifest.assets.length} transparent assets, ${Math.round(bytes.reduce((a,b)=>a+b,0)/1024)} KiB total. Contact sheet: /tmp/bird-artwork-contact.png`)
