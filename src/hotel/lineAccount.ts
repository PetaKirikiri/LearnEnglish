// An SDK/network stall must not leave the learner on an indefinite spinner.
export async function bounded<T>(work: (signal: AbortSignal) => Promise<T>, ms = 15000): Promise<T> {
  const controller = new AbortController()
  let timer: ReturnType<typeof setTimeout>
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      controller.abort()
      reject(new Error('LINE took too long. Please try again.'))
    }, ms)
  })
  try { return await Promise.race([work(controller.signal), timeout]) }
  finally { clearTimeout(timer!); controller.abort() }
}
