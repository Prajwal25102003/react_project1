import { useEffect, useState } from 'react'
import { fetchHealth } from '../models/healthModel.js'

export function useHealthStatus() {
  const [status, setStatus] = useState('loading')
  const [database, setDatabase] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        const data = await fetchHealth()
        if (cancelled) return
        setStatus(data.status === 'ok' ? 'ok' : 'error')
        setDatabase(data.database ?? null)
        setError(null)
      } catch (err) {
        if (cancelled) return
        setStatus('error')
        setDatabase(null)
        setError(err.message)
      }
    }

    load()

    return () => {
      cancelled = true
    }
  }, [])

  const nodeLabel =
    status === 'loading'
      ? 'CHECKING…'
      : status === 'ok'
        ? 'SECURE NODE'
        : 'NODE OFFLINE'

  return { status, database, error, nodeLabel }
}
