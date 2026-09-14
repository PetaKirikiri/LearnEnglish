import Icon from '../ui/Icon'
import MemberAvatar from '../ui/MemberAvatar'
import { useMemberLeaderboard } from './useMemberLeaderboard'

export default function LeaderboardButton({ userId, onClick }: { userId: string; onClick: () => void }) {
  const result = useMemberLeaderboard(userId)
  const champion = result?.champion
  return <button type="button" aria-label="Leaderboard" title={champion ? `Champion: ${champion.name}` : 'Leaderboard'} onClick={onClick} className="champion-button">
    <Icon name="trophy" className="h-6 w-6 shrink-0" />
    {champion && <><MemberAvatar name={champion.name} url={champion.avatarUrl} size={28} /><span className="truncate">{champion.name}</span></>}
  </button>
}
