import {buildMeaningArtwork} from './birdMeaningScenes'

// Authored visual meanings, not keyword guesses. Reuse Pip's identity and actual
// states; time, viewpoint and hypothetical frames carry the grammatical change.
export const birdAssets = {
  'name-blank':'Pip wearing an empty name badge',
  'name-filled':'Pip wearing a name badge that says Pip',
  neutral:'Pip, a brown and cream sparrow',
  eating:'Pip nibbling a sunflower seed',
  hungry:'Hungry Pip rubbing his tummy beside an untouched seed',
  finished:'Satisfied Pip beside an empty seed shell',
  waiting:'Pip with a closed beak beside an untouched seed',
  origin:'Pip with a suitcase and the Thai flag',
  'origin-question':'An unknown home country on a globe, with an arrow from that starting place towards Pip and his suitcase',
  'origin-answer':'Thailand shown as the starting country on a globe, with an arrow from Thailand towards Pip and his suitcase',
  'ownership-question':'A seed is linked to an unknown owner; the question is on the owner, not the seed',
  'location-question':'Possible positions of the bird above or beside a visible seed',
  able:'The cover is lifted away and Pip can reach the seed, but has not eaten it',
  'need-food':'A weak hungry Pip needs the seed to regain energy',
  'want-eat':'Pip imagines himself eating the seed in a thought bubble',
  arriving:'A person steps in through a doorway; the bird’s state is shown separately',
  'leave-seed':'A hand puts a seed down beside Pip',
  'advice-eat':'A person gently recommends the seed to hungry Pip',
  'permission-self':'The person holding the seed points to themself and asks permission to feed Pip',
  'request-help':'The speaker asks the other person to offer the seed to Pip',
  speaking:'A woman speaks to an attentive listener; her speech bubble has no contents yet',
  owner:'Pip holding his own seed close to his chest',
  'plural-eating':'Three birds eating seeds',
  above:'Pip flying directly above a seed',
  unable:'Pip cannot reach the seed under a glass cover',
  flying:'Pip flying away',
  'he-sees-her':'The male bird looks at the female bird, who faces away',
  'she-sees-him':'The female bird looks at the male bird, who faces away',
  feeding:'A person offers a seed to Pip',
  'no-feeding':'A hand signals stop before feeding Pip',
  'three-seeds':'Pip with exactly three seeds',
  'little-food':'A small amount of food in Pip’s mostly empty bowl',
  'big-small':'A large bird on the left and a small bird on the right',
  equal:'Two birds of the same size',
  seed:'An intact sunflower seed',
  near:'A hand points to one bird close by',
  far:'A hand points to one bird far away',
  'near-plural':'A hand points to three birds close by',
  'far-plural':'A hand points to three birds far away',
  'wants-person':'Pip offers a seed for a person to eat',
  shell:'An empty seed shell, with the edible seed gone',
  reporter:'A woman tells a man something about Pip',
  'only-bird':'Only Pip eats; the rabbit does not eat',
  'only-seed':'Pip eats a seed, leaving the berry and leaf untouched',
  scarce:'One tiny seed in a large empty bowl',
  person:'The person who arrives or returns',
} as const
export type BirdAsset = keyof typeof birdAssets
export const birdAssetUrl = (asset:BirdAsset) => asset==='person'
  ? '/images/fimo/thumbs/word-person.png'
  : `/images/fimo/bird-scenes/${asset}.webp`

export type BirdFocus = 'whole'|'subject'|'action'|'object'|'state'|'owner'|'location'|'quantity'|'left'|'right'|'speech'
export type BirdFrame = {asset:BirdAsset;caption?:string;focus?:BirdFocus;marker?:'question'|'check'|'focus';small?:boolean}
export type BirdScene = {
  frames:BirdFrame[]
  description:string
  connector?:string
  imagined?:boolean
  unknown?:boolean
  badge?:string
  time?:'past'|'present'|'future'
  repeated?:boolean
  relationship?:'cause'|'contrast'|'together'|'sequence'|'same-time'|'identity'|'choice'
  certainty?:'possible'|'likely'|'impossible'
  intention?:'thought'|'recommendation'|'requirement'|'permission'|'speech'
  reality?:BirdFrame[]
  target?:string
}
export type BirdPair = {question:BirdScene;answer:BirdScene}
export const birdArtwork = buildMeaningArtwork(birdAssets)
export function artworkForBird(nodeId:string,meaning:string):BirdPair {
  const artwork=birdArtwork[nodeId]?.[meaning]
  if(!artwork) throw new Error(`Missing bird illustration: ${nodeId}/${meaning}`)
  return artwork
}
