import './worldObjects.css'

/** Independent scenery objects; never a flattened landscape image. */
export function Tree({ variant = 0 }: { variant?: number }) {
  return <svg className={`world-tree tree-${variant}`} viewBox="0 0 100 140" aria-hidden="true">
    <ellipse cx="49" cy="132" rx="36" ry="6" fill="#426b3c" opacity=".12"/>
    <path d="M43 133 46 68h10l3 65" fill="#a7794b"/>
    <path d="m51 99-20-24m21 16 19-22" stroke="#a7794b" strokeWidth="7" strokeLinecap="round"/>
    <g className="world-tree-crown">
      <ellipse cx="50" cy="55" rx="43" ry="46" fill={variant ? '#629e6c' : '#75a55a'}/>
      <ellipse cx="39" cy="41" rx="31" ry="32" fill={variant ? '#7cb983' : '#99bf71'}/>
      <ellipse cx="33" cy="30" rx="16" ry="13" fill="#d0df95" opacity=".45"/>
      <path d="m65 68 5-5m-46-5 4 3" stroke="#d5e8a7" strokeWidth="4" strokeLinecap="round" opacity=".6"/>
    </g>
  </svg>
}

export function WorldObjects({ kind = 'garden' }: { kind?: 'garden' | 'lobby' }) {
  return <div className={`world-objects world-objects-${kind}`} aria-hidden="true">
    <div className="world-cloud cloud-one"><i/><i/><i/></div>
    <div className="world-cloud cloud-two"><i/><i/><i/></div>
    <div className="world-garden-tree"><Tree/></div>
    <div className="world-garden-tree tree-right"><Tree variant={1}/></div>
    <div className="world-grass grass-one"><i/><i/><i/></div>
    <div className="world-grass grass-two"><i/><i/><i/></div>
  </div>
}
