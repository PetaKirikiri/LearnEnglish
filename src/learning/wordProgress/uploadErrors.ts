// Keep rejected answers for repair, but do not let one bad catalogue entry
// prevent unrelated answers from reaching the server. Connection/auth errors
// still stop the run, so a disconnected device does not hammer the API.
export function isRejectedAnswer(error: unknown): boolean {
 const message = error && typeof error === 'object' && 'message' in error ? error.message : undefined
 return typeof message === 'string' && [
  'Unknown vocabulary', 'Unknown question or answer', 'Invalid answer metadata',
  'Invalid attempt time', 'Invalid presented verb or subject',
 ].includes(message)
}
