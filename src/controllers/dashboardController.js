import { getDashboardMetrics } from '../models/dashboardModel.js'

export function useDashboard() {
  return {
    metrics: getDashboardMetrics(),
  }
}
