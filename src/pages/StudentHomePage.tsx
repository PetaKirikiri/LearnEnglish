import QuizPage from '../learning/QuizPage'

export default function StudentHomePage({ displayName, userId, syncState, onSignOut }: {
  displayName: string; userId: string; syncState: string; onSignOut: () => void
}) {
  return <QuizPage key={userId} learnerId={displayName} userId={userId} syncState={syncState} onSignOut={onSignOut} />
}
