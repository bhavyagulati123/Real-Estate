// lib/queryKeys.ts
export const queryKeys = {
  dashboard:       ['dashboard'] as const,
  leads:           (f?: Record<string, unknown>) => ['leads', f]    as const,
  lead:            (id: string)                  => ['leads', id]   as const,
  properties:      (f?: Record<string, unknown>) => ['properties', f] as const,
  property:        (id: string)                  => ['properties', id] as const,
  propertyMatches: (id: string)                  => ['properties', id, 'matches'] as const,
  deals:           (f?: Record<string, unknown>) => ['deals', f]    as const,
  deal:            (id: string)                  => ['deals', id]   as const,
  investments:     (f?: Record<string, unknown>) => ['investments', f] as const,
  investment:      (id: string)                  => ['investments', id] as const,
  wealth:          (f?: Record<string, unknown>) => ['wealth', f]   as const,
}
