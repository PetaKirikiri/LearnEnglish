import MemberAvatar from '../ui/MemberAvatar'
import { useMemberLeaderboard } from './useMemberLeaderboard'

export default function LeaderboardButton({ userId, onClick }: { userId: string; onClick: () => void }) {
  const result = useMemberLeaderboard(userId)
  const champion = result?.champion
  return <button type="button" aria-label="Leaderboard" title={champion ? `Champion: ${champion.name}` : 'Leaderboard'} onClick={onClick} className="champion-button">
    <span className="champion-cup" aria-hidden="true" />
    {champion && <><MemberAvatar name={champion.name} url={champion.avatarUrl} size={28} /><span className="truncate">{champion.name}</span></>}
  </button>
}
