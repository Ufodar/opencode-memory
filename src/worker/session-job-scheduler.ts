export interface SessionJobScheduler {
  run<T>(sessionID: string, job: () => Promise<T>): Promise<T>
  enqueue(sessionID: string, job: () => Promise<unknown>): void
  isBusy(sessionID: string): boolean
}

export function createSessionJobScheduler(): SessionJobScheduler {
  const tails = new Map<string, Promise<void>>()

  return {
    async run<T>(sessionID: string, job: () => Promise<T>): Promise<T> {
      const previous = tails.get(sessionID) ?? Promise.resolve()
      let releaseCurrent!: () => void
      const current = new Promise<void>((resolve) => {
        releaseCurrent = resolve
      })
      const nextTail = previous.catch(() => undefined).then(() => current)
      tails.set(sessionID, nextTail)

      try {
        await previous.catch(() => undefined)
        return await job()
      } finally {
        releaseCurrent()

        if (tails.get(sessionID) === nextTail) {
          tails.delete(sessionID)
        }
      }
    },

    enqueue(sessionID: string, job: () => Promise<unknown>) {
      void this.run(sessionID, job).catch(() => undefined)
    },

    isBusy(sessionID: string) {
      return tails.has(sessionID)
    },
  }
}
