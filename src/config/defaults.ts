export const DEFAULTS = {
  maxInjectedSummaries: 5,
  maxInjectedObservations: 8,
  maxInjectedChars: 1200,
  maxCompactionSummaries: 6,
  maxCompactionObservations: 10,
  maxCompactionChars: 1800,
  minObservationOutputLength: 40,
  workerIdleShutdownMs: 60_000,
  workerActiveSessionMaxIdleMs: 15 * 60_000,
  workerActiveSessionReapIntervalMs: 2 * 60_000,
} as const
