import './structureNavigation.css'

/** Every host renders the same navigator; the lesson catalogue supplies the questions. */
export default function StructureNavigation<T extends string>({structures,selected,onChange}:{
 structures:readonly {id:T;question:string}[];selected:T;onChange:(id:T)=>void
}){
 return <nav className="cw-structure-navigation" aria-label="Sentence structure">
  {structures.map(structure=><button type="button" key={structure.id} aria-pressed={selected===structure.id} onClick={()=>onChange(structure.id)}>{structure.question}</button>)}
 </nav>
}
