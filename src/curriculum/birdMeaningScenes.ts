import type {BirdAsset, BirdFocus, BirdFrame, BirdPair, BirdScene} from './birdArtwork'

// Every dialogue has an authored question target. No neutral-bird fallback.
// Pictures can share a world, but the relationship being asked about must be
// visible. Time, evidence, viewpoint and imagined alternatives are storyboards.
export function buildMeaningArtwork(assets:Record<BirdAsset,string>):Record<string,Record<string,BirdPair>> {
  const f=(asset:BirdAsset,caption?:string):BirdFrame=>({asset,caption})
  const s=(asset:BirdAsset):BirdScene=>({frames:[f(asset)],description:assets[asset]})
  const time=(art:BirdScene,when:NonNullable<BirdScene['time']>):BirdScene=>({...art,time:when,description:`${when}: ${art.description}`})
  const now=(asset:BirdAsset)=>time(s(asset),'present')
  const past=(asset:BirdAsset)=>time(s(asset),'past')
  const future=(asset:BirdAsset)=>time(s(asset),'future')
  const seq=(description:string,frames:BirdFrame[],relationship:BirdScene['relationship']='sequence'):BirdScene=>({description,frames,relationship})
  const loop=(asset:BirdAsset):BirdScene=>({...seq(`The same ${assets[asset]} on three different days`,[f(asset),f(asset),f(asset)]),repeated:true})
  const thought=(art:BirdScene):BirdScene=>({...art,imagined:true,intention:'thought',description:`Imagined, not observed: ${art.description}`})
  const intention=(art:BirdScene,kind:NonNullable<BirdScene['intention']>):BirdScene=>({...art,intention:kind,description:`${kind}: ${art.description}`})
  const certainty=(art:BirdScene,kind:NonNullable<BirdScene['certainty']>):BirdScene=>({...art,certainty:kind,description:`${kind}: ${art.description}`})
  const focus=(art:BirdScene,target:string,part:BirdFocus='whole',index=0,marker:BirdFrame['marker']='focus'):BirdScene=>({
    ...art,target,description:`${target}: ${art.description}`,
    frames:art.frames.map((frame,i)=>i===index?{...frame,focus:part,marker}:frame),
  })
  const ask=(art:BirdScene,target:string,part:BirdFocus='whole',index=0)=>focus(art,target,part,index,'question')
  const check=(art:BirdScene,target:string,part:BirdFocus='whole',index=0)=>focus(art,target,part,index,'check')
  const pair=(answer:BirdScene,question:BirdScene):BirdPair=>({answer,question})
  const observe=(answer:BirdScene,target:string,part:BirdFocus='whole',index=0)=>pair(answer,ask(answer,target,part,index))
  const verify=(answer:BirdScene,target:string,part:BirdFocus='whole',index=0)=>pair(answer,check(answer,target,part,index))
  const location=s('location-question')
  const owner=s('ownership-question')
  const completed=seq('Eating is finished; the empty shell is visible now',[f('eating'),f('finished')])
  const unfinished=seq('The seed is still intact; eating has not happened',[f('waiting'),f('waiting')])
  const atArrival=(state:BirdAsset,when:'past'|'future')=>time(seq('The person arrives while this action is in progress',[f('arriving'),f(state)],'same-time'),when)
  const beforeArrival=(when:'past'|'future')=>time(seq('Eating finishes first; the person arrives afterwards',[f('finished'),f('arriving')]),when)
  const cause=seq('Hunger leads to eating',[f('hungry'),f('eating')],'cause')
  const contrast=seq('Hunger but no eating: the seed stays intact',[f('hungry'),f('waiting')],'contrast')
  const alternative=(art:BirdScene,reality:BirdFrame[]):BirdScene=>({...thought(art),reality,description:`Reality: ${reality.map(x=>assets[x.asset]).join(' then ')}. Alternative: ${art.description}`})
  const permission=intention(s('feeding'),'permission')
  const imaginedMeal=thought(now('eating'))
  return {
    'meeting-names':{'Its name':pair(s('name-filled'),s('name-blank'))},
    'meeting-origins':{'Origin':pair(s('origin-answer'),s('origin-question'))},
    'meeting-people':{
      'What it is':observe(focus(s('neutral'),'Identify this animal'),'What kind of creature is this?','whole'),
      'Checking':verify(focus(s('neutral'),'Check the bird’s identity'),'Is this creature a bird?'),
    },
    'meeting-belongings':{'Belonging':pair(focus(s('owner'),'The owner holds his own seed','owner'),owner)},
    'first-actions':{
      'One bird':observe(now('eating'),'What action is the single bird doing?','action'),
      'More than one':observe(now('plural-eating'),'What action are all three birds doing?','action'),
    },
    'first-negatives':{
      'Happening':verify(now('eating'),'Is seed-eating happening now?','action'),
      'Not happening':pair(now('waiting'),check(now('eating'),'Is seed-eating happening now?','action')),
    },
    'be-forms':{
      'A statement':verify(s('hungry'),'Is the bird hungry? Notice its empty tummy','state'),
      'A negative':pair(s('finished'),check(s('hungry'),'Is the bird hungry? Notice its tummy','state')),
    },
    'ownership':{
      'Name the owner':pair(focus(s('owner'),'This bird owns the seed','owner'),owner),
      'Refer to the male bird':pair(focus(s('owner'),'The seed belongs to him','owner'),owner),
      'Before the thing':pair(focus(s('owner'),'His seed: owner and possession stay linked','object'),owner),
    },
    'reference':{
      'One nearby':observe(s('near'),'Which single eating bird is being pointed to?','location'),
      'One farther away':observe(s('far'),'Which distant eating bird is being pointed to?','location'),
      'Several nearby':observe(s('near-plural'),'Which nearby group is being pointed to?','location'),
      'Several farther away':observe(s('far-plural'),'Which distant group is being pointed to?','location'),
    },
    'time-place':{
      'Above':pair(s('above'),location),
      'Beside':pair(s('waiting'),location),
    },
    'routine-now':{
      'A habit':observe(loop('eating'),'What food is eaten day after day?','object',1),
      'In progress':observe(now('eating'),'What action is happening right now?','action'),
    },
    'negation':{
      'What it does':verify(loop('eating'),'Does this action repeat across days?','action',1),
      'What it does not do':pair(loop('waiting'),check(loop('eating'),'Does this action repeat across days?','action',1)),
    },
    'past-state':{
      'Now':verify(now('hungry'),'Is the bird hungry at the present marker?','state'),
      'Then':verify(past('hungry'),'Was the bird hungry before the present marker?','state'),
      'Not then':pair(past('finished'),check(past('hungry'),'Was the bird hungry before now?','state')),
    },
    'past-events':{
      'Happened':verify(time(completed,'past'),'Did eating happen in the past?','action'),
      'Did not happen':pair(time(unfinished,'past'),check(time(completed,'past'),'Did eating happen in the past?','action')),
    },
    'participants':{
      'The male bird acts':observe(focus(s('he-sees-her'),'The male bird is the one looking','left'),'Who is looking at her?','left'),
      'The female bird acts':observe(focus(s('she-sees-him'),'The female bird is the one looking','right'),'Who is looking at him?','right'),
      'The thing it eats':observe(focus(s('eating'),'The seed is what is eaten','object'),'What is in the bird’s beak?','object'),
      'Refer to that same seed':verify(seq('Follow this same seed into the bird’s beak',[f('seed'),f('eating')],'identity'),'Does the bird eat this same seed?','object',1),
    },
    'questions':{
      'A habit?':verify(loop('eating'),'Is this a recurring seed-eating habit?','action',1),
      'Happening now?':verify(now('eating'),'Is eating happening at this moment?','action'),
      'Happened before?':verify(time(completed,'past'),'Did the bird eat before now?','action'),
      'Ask about the thing':observe(focus(s('eating'),'Food in the beak','object'),'What is the bird eating?','object'),
    },
    'request-basics':{
      'Permission for me':pair(permission,s('permission-self')),
      'Help from you':pair(focus(s('feeding'),'The other person helps by offering the seed','left'),s('request-help')),
      'An instruction':observe(s('feeding'),'What action should the person take?','action'),
      'A negative instruction':observe(s('no-feeding'),'Which action should be stopped?','action'),
    },
    'simple-links':{
      'Add':verify(seq('Hunger and eating are both true at the same time',[f('hungry'),f('eating')],'together'),'Is it hungry, and is it eating?'),
      'Contrast':pair(contrast,check(seq('Check hunger and eating separately',[f('hungry'),f('eating')],'together'),'Are both hunger and eating true?')),
      'Explain':observe(cause,'What causes the eating?','state',0),
    },
    'future':{
      'A prediction':observe(future('eating'),'What action will happen after now?','action'),
      'Expecting it from what we see':observe(time(seq('The hungry bird reaches the seed, then eats',[f('hungry'),f('eating')]),'future'),'What will this visible hunger lead to?','action',1),
      'A negative prediction':pair(future('waiting'),check(future('eating'),'Will the bird eat after now?','action')),
    },
    'obligation':{
      'Ability':verify(s('able'),'Can the bird reach the accessible seed?','object'),
      'Unable':verify(s('unable'),'Can the bird reach the seed under the cover?','object'),
      'Necessary':observe(intention(s('need-food'),'requirement'),'What must restore the bird’s energy?','object'),
      'Advisable':observe(intention(s('advice-eat'),'recommendation'),'What action is being recommended to the bird?','object'),
    },
    'quantity':{
      'Count the seeds':observe(s('three-seeds'),'Count the individual seeds','quantity'),
      'Amount of food':observe(s('little-food'),'How full is the bowl?','quantity'),
      'Some':verify(s('three-seeds'),'Are there any seeds here?','quantity'),
      'Hardly any':verify(s('scarce'),'Are there many seeds, or almost none?','quantity'),
    },
    'comparison':{
      'One direction':observe(focus(s('big-small'),'Compare the larger bird with the smaller bird','left'),'How does the left bird compare in size?','left'),
      'The other direction':observe(focus(s('big-small'),'Compare the smaller bird with the larger bird','right'),'How does the right bird compare in size?','right'),
      'Equal':verify(s('equal'),'Are these two birds equal in size?'),
    },
    'sequence':{
      'Eating first':observe(seq('Eating happens before flying',[f('eating'),f('flying')]),'When does eating happen relative to flying?','action',0),
      'Flying first':observe(seq('Flying happens before eating',[f('flying'),f('eating')]),'When does eating happen relative to flying?','action',1),
    },
    'completion':{
      'In progress':observe(now('eating'),'What action is in progress now?','action'),
      'Completed':verify(time(completed,'present'),'Is the seed already eaten? Look for the resulting empty shell','object',1),
      'Not yet':pair(time(unfinished,'present'),check(time(completed,'present'),'Has eating finished yet?','object',1)),
    },
    'past-sequence':{
      'In progress then':observe(atArrival('eating','past'),'What was happening at the same time as arrival?','action',1),
      'Finished before then':observe(beforeArrival('past'),'What was already finished before arrival?','object',0),
    },
    'verb-shapes':{
      'Possible action':verify(s('able'),'Is the food accessible so the bird can eat?','object'),
      'Action in progress':verify(now('eating'),'Is the action taking place now?','action'),
      'Completed action':verify(time(completed,'present'),'Has the action left an empty shell?','object',1),
    },
    'verb-complements':{
      'The bird will do it':observe(s('want-eat'),'What does the bird want itself to do?','speech'),
      'The bird wants me to do it':observe(s('wants-person'),'What does the bird want the person to do?','right'),
    },
    'passive':{
      'Start with the bird':observe(focus(past('eating'),'Follow the actor','subject'),'What did the bird do?','action'),
      'Start with the seed':observe(time(seq('Follow the seed through eating to the empty shell',[f('seed'),f('eating'),f('shell')]),'past'),'What happened to this seed?','object',0),
      'Leave the eater unnamed':observe(time(seq('The seed becomes an empty shell; the eater is not shown',[f('seed'),f('shell')]),'past'),'What happened to the seed, regardless of who did it?','object',0),
    },
    'repair':{
      'Direct':pair(s('waiting'),location),
      'Indirect':pair(s('waiting'),intention(seq('Ask another person about the unknown bird location',[f('speaking'),f('location-question')],'identity'),'speech')),
      'Checking an action':pair(time(completed,'present'),intention(check(seq('Ask another person whether eating is complete',[f('speaking'),f('finished')],'identity'),'Has the bird finished eating?','object',1),'speech')),
    },
    'possibility':{
      'Possible':verify(certainty(imaginedMeal,'possible'),'Is eating one possible explanation?','action'),
      'Strong conclusion':verify(certainty(imaginedMeal,'likely'),'Does the evidence strongly suggest eating?','action'),
      'Rule it out':verify(certainty(now('unable'),'impossible'),'Does the covered seed rule out eating?','object'),
    },
    'hypothetical':{
      'Open possibility':observe(time(seq('Hunger is a possible starting condition; eating follows',[f('hungry'),f('eating')],'cause'),'future'),'What follows if the hungry condition occurs?','action',1),
      'Imagined situation':observe(alternative(seq('Imagine hunger leading to eating',[f('hungry'),f('eating')],'cause'),[f('finished')]),'What follows in the imagined situation?','action',1),
    },
    'nuance':{
      'Possibly happened':verify(certainty(thought(time(completed,'past')),'possible'),'Could eating explain the empty shell?','object',1),
      'Would have been advisable':observe(intention(alternative(time(seq('The better past choice was eating, leading to being satisfied',[f('eating'),f('finished')]),'past'),[f('waiting'),f('hungry')]),'recommendation'),'Which past choice would have avoided the hunger?','action',0),
    },
    'reported':{
      'Original words':observe(intention(time(seq('Her own prediction, from speaking to a later meal',[f('speaking','“…”'),f('eating')]),'past'),'speech'),'What did she say directly?','speech',0),
      'Retelling':observe(intention(time(seq('Her earlier prediction is passed on by a second speaker',[f('speaking','“…”'),f('eating'),f('person','→ “…”')]),'past'),'speech'),'What prediction is the second person passing on?','speech',2),
      'Completed before she spoke':observe(intention(time(seq('Eating completed before she spoke',[f('finished'),f('speaking','“…”')]),'past'),'speech'),'What had finished before her report?','object',0),
    },
    'relative':{
      'A separate fact':observe(past('eating'),'What did this bird do?','action'),
      'Identify which bird':observe(seq('Track the same bird from the meal to here now',[f('eating'),f('neutral')],'identity'),'Which bird is here? Follow the eating bird','subject',1),
      'Identify which seed':observe(seq('Track the small seed into the bird’s beak',[{...f('seed'),small:true},f('eating')],'identity'),'Which seed was small? Follow the seed that was eaten','object',0),
    },
    'future-completion':{
      'In progress then':observe(atArrival('eating','future'),'What will be happening at the same time as return?','action',1),
      'Finished by then':observe(beforeArrival('future'),'What will be completed before return?','object',0),
    },
    'counterfactual':{
      'A different past result':observe(alternative(time(seq('Imagined past meal would lead to a satisfied bird then',[f('eating'),f('finished')],'cause'),'past'),[f('waiting'),f('hungry')]),'Would hunger remain in that different past?','state',1),
      'A different result now':observe(alternative(time(seq('Imagined earlier meal would lead to a satisfied bird now',[f('eating','←'),f('finished')],'cause'),'present'),[f('waiting'),f('hungry')]),'Would hunger remain now after that different past?','state',1),
    },
    'qualification':{
      'A reason':observe(time(cause,'past'),'Which earlier condition explains eating?','state',0),
      'Against expectation':verify(time(contrast,'past'),'Did hunger actually lead to eating?','action',1),
    },
    'professional-response':{
      'Available now':observe(now('able'),'Which action is available now?','object'),
      'Was available then':observe(alternative(time(seq('The accessible seed could have been eaten',[f('able'),f('eating')]),'past'),[f('waiting')]),'Which past option was available but not taken?','action',1),
    },
    'complex-time':{
      'Eating was already finished':observe(time(seq('First the seed is put down, then eaten, then the person returns',[f('leave-seed'),f('finished'),f('arriving')]),'past'),'What had finished between leaving the seed and returning?','object',1),
      'Eating was still happening':observe(time(seq('The seed is put down; the bird is still eating during the return',[f('leave-seed'),f('eating'),f('arriving')],'same-time'),'past'),'What was still happening when the person returned?','action',1),
    },
  }
}
