import { API_BASE_URL } from '../config/api.js'

export async function fetchHealth() {
  const response = await fetch(`${API_BASE_URL}/api/health`)

  if (!response.ok) {
    const body = await response.json().catch(() => null)
    throw new Error(body?.message || `Health check failed (${response.status})`)
  }

  return response.json()
}
