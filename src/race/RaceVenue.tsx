import { memo } from 'react'

/** A stationary environment plate. All race geometry remains in the live world. */
export default memo(function RaceVenue() {
  return <div className="race-venue" aria-hidden="true">
    <img src="/images/race/toy-stadium-v1.png" alt="" draggable={false}/>
  </div>
})
