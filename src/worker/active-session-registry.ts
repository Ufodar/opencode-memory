export interface ActiveSessionRegistry {
  touch(sessionID: string): void
  remove(sessionID: string): void
  list(): string[]
  listStale(maxIdleMs: number, now?: number): string[]
}

export function createActiveSessionRegistry(initialSessionIDs: string[] = []): ActiveSessionRegistry {
  const seen = new Map<string, number>()
  const touchAt = (sessionID: string, touchedAt: number) => {
    seen.delete(sessionID)
    seen.set(sessionID, touchedAt)
  }

  for (const sessionID of initialSessionIDs) {
    if (!sessionID) {
      continue
    }
    touchAt(sessionID, Date.now())
  }

  return {
    touch(sessionID) {
      if (!sessionID) {
        return
      }
      touchAt(sessionID, Date.now())
    },
    remove(sessionID) {
      if (!sessionID) {
        return
      }

      seen.delete(sessionID)
    },
    list() {
      return Array.from(seen.entries())
        .sort((left, right) => right[1] - left[1])
        .map(([sessionID]) => sessionID)
    },
    listStale(maxIdleMs, now = Date.now()) {
      if (maxIdleMs <= 0) {
        return []
      }

      const cutoff = now - maxIdleMs
      return Array.from(seen.entries())
        .filter(([, touchedAt]) => touchedAt <= cutoff)
        .sort((left, right) => left[1] - right[1])
        .map(([sessionID]) => sessionID)
    },
  }
}
