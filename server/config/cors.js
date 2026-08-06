/**
 * Allowed browser origins for CORS.
 * Set CORS_ORIGINS as a comma-separated list in server/.env.
 * Defaults cover local Vite + API ports.
 */
export function getAllowedOrigins() {
  const fromEnv = String(process.env.CORS_ORIGINS || '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean)

  if (fromEnv.length > 0) return fromEnv

  return [
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'http://localhost:5000',
    'http://127.0.0.1:5000',
  ]
}

export function createCorsOptions() {
  const allowed = new Set(getAllowedOrigins())

  return {
    origin(origin, callback) {
      // Non-browser clients (curl, Postman, same-origin proxy) send no Origin.
      if (!origin) {
        callback(null, true)
        return
      }
      if (allowed.has(origin)) {
        callback(null, true)
        return
      }
      callback(null, false)
    },
    credentials: true,
  }
}
