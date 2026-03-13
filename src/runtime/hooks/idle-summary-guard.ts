export interface SessionGuardResult<T> {
  ran: boolean
  result?: T
}

export function createSessionReentryGuard() {
  const inFlight = new Set<string>()

  return {
    async run<T>(sessionID: string, task: () => Promise<T>): Promise<SessionGuardResult<T>> {
      if (inFlight.has(sessionID)) {
        return { ran: false }
      }

      inFlight.add(sessionID)

      try {
        const result = await task()
        return { ran: true, result }
      } finally {
        inFlight.delete(sessionID)
      }
    },
  }
}
