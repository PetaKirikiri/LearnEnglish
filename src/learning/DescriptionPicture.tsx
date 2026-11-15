import {descriptions} from './everydayVocabulary'
/** The shared adjective artwork is used by the explorer and every sentence slot. */
export default function DescriptionPicture({word}:{word:string}){
 const description=descriptions.find(item=>item.word===word)
 if(!description)return null
 return <img className="description-picture" src={`/classroom/icons/adjectives/3d/${description.word}.png`} alt="" aria-hidden="true" draggable={false} style={{objectFit:'contain'}}/>
}
