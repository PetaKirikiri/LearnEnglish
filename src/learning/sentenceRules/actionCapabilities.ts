import {activeActionBlueprints,matchingActionBlueprint,type ActionBlueprint} from './actionBlueprints'
import {verbGroupForAction} from './verbGroups'
import {actionForFrame, actionDialogue, actionVocabulary, objectDeterminers, objectsForAction, type ActionSubject} from './actionDialogue'
import {subjectPronouns, type SubjectWord} from '../sentenceMatrix/subjectEngine'
import {lessonDeterminers,type MatrixLesson,type Determiner} from '../sentenceMatrix/model'
/** Every picker, education view and generator asks for the same scoped choices. */
export function actionCapabilities(lesson: MatrixLesson) {
 const source=lesson.actions??actionVocabulary.filter(action=>lesson.actionQuestion!=='destination'||action.destination).map(action=>action.word)
 const blueprints=lesson.actionBlueprints??activeActionBlueprints.filter(frame=>!lesson.actionGroup&&lesson.actionQuestion!=='destination'||frame.connection===(lesson.actionGroup==='transitive'?'direct':'to'))
 const frameFor=(word:string)=>{const lexical=actionVocabulary.find(item=>item.word===word);return lexical&&matchingActionBlueprint(lexical,blueprints)}
 const requestedActions = source.flatMap(word => {
  const frame=frameFor(word)
  if(!frame){if(lesson.actions)throw new Error(`No compatible blueprint for action: ${word}`);return []}
  const action = actionForFrame(word,lesson.actionQuestion,frame)
  if (!action) return []
  return [action]
 })
 const available=(action:typeof actionVocabulary[number])=>action.complement==='none'||objectsForAction(action.word,lesson.vocabulary,lesson.actionQuestion,frameFor(action.word)).length>0
 if(lesson.actions&&requestedActions.some(action=>!available(action)))throw new Error('Configured action has no compatible lesson objects')
 const actions=requestedActions.filter(action=>(!lesson.actionGroup||verbGroupForAction(action)===lesson.actionGroup)&&available(action))
 const subjects:readonly SubjectWord[] = (lesson.subjectModes?.pronouns ?? subjectPronouns).map((subject:SubjectWord)=>({...subject,kind:subject.kind??'person'}))
 if (!actions.length) throw new Error('An action lesson needs actions')
 return {actions, subjects, frame:(word:string):ActionBlueprint=>{const frame=frameFor(word);if(!frame)throw new Error('No compatible blueprint');return frame}, objects:(action:string) => {
  if (!actions.some(item => item.word === action)) throw new Error(`Action outside lesson ${lesson.id}: ${action}`)
  return objectsForAction(action,lesson.vocabulary,lesson.actionQuestion,frameFor(action))
 }, determiners:(object:ReturnType<typeof objectsForAction>[number]) => objectDeterminers(object,lessonDeterminers(lesson).map(item=>item.word).concat(lesson.owners??[]))}
}
export function composeLessonAction(lesson:MatrixLesson, request:{subject:string; action:string; object?:string; description?:{english:string;thai:string}; determiner?:Determiner}) {
 const capability=actionCapabilities(lesson)
 const subject=capability.subjects.find(item=>item.word.toLowerCase()===request.subject.toLowerCase())
 if(!subject)throw new Error(`Subject outside lesson ${lesson.id}: ${request.subject}`)
 const objects=capability.objects(request.action)
 const object=request.object===undefined?objects[0]:objects.find(item=>item.word===request.object)
 if(request.object!==undefined&&!object)throw new Error('Object outside lesson action scope')
 const determiner=request.determiner ?? (object ? capability.determiners(object)[0]?.word : undefined)
 if(determiner&&(!object||!capability.determiners(object).some(item=>item.word===determiner)))throw new Error('Determiner outside lesson scope')
 return actionDialogue(subject.word.toLowerCase() as ActionSubject,request.action,{blueprint:capability.frame(request.action),question:lesson.actionQuestion,vocabulary:lesson.vocabulary,subject:{...subject,kind:'person'},object:object?.word,description:request.description,determiner})
}
