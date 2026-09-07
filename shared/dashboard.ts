export interface DashboardKpi {
  key: string
  value: number
}

export interface DashboardDistribution {
  key: string
  items: Array<{ key: string; value: number }>
}

export interface DashboardStats {
  generatedAt: string
  kpis: DashboardKpi[]
  distributions: DashboardDistribution[]
}

export function normalizeDistribution(rows: Array<{ status: string; count: unknown }>, statuses: readonly string[]) {
  return statuses.map(status => ({
    key: status,
    value: Math.max(0, Number(rows.find(row => row.status === status)?.count) || 0)
  }))
}
