/**
 * Live API smoke tests. Skipped unless EMS_SMOKE=1.
 *
 * Usage:
 *   EMS_SMOKE=1 npm test
 *
 * Optional env:
 *   EMS_SMOKE_BASE_URL (default http://127.0.0.1:5000)
 *   EMS_SMOKE_EMAIL / EMS_SMOKE_PASSWORD
 */
import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

const enabled = String(process.env.EMS_SMOKE || '').trim() === '1'
const baseUrl = String(
  process.env.EMS_SMOKE_BASE_URL || 'http://127.0.0.1:5000',
).replace(/\/$/, '')
const email = String(process.env.EMS_SMOKE_EMAIL || 'hr@company.com').trim()
const password = String(process.env.EMS_SMOKE_PASSWORD || '12345678')

async function api(path, { method = 'GET', token, body } = {}) {
  const headers = {}
  if (body !== undefined) headers['Content-Type'] = 'application/json'
  if (token) headers.Authorization = `Bearer ${token}`

  const response = await fetch(`${baseUrl}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })
  const data = await response.json().catch(() => ({}))
  return { response, data }
}

describe('live API smoke', { skip: !enabled }, () => {
  let token = ''

  it('GET /api/health responds without DB identity leak', async () => {
    const { response, data } = await api('/api/health')
    assert.equal(response.status, 200)
    assert.equal(data.status, 'ok')
    assert.equal(data.database?.connected, true)
    assert.equal(data.database?.database, undefined)
    assert.equal(data.database?.user, undefined)
  })

  it('POST /api/auth/signin returns a token', async () => {
    const { response, data } = await api('/api/auth/signin', {
      method: 'POST',
      body: { email, password },
    })
    assert.equal(response.status, 200, data.message || 'sign-in failed')
    assert.ok(data.token)
    token = data.token
  })

  it('GET /api/auth/me works with the token', async () => {
    const { response, data } = await api('/api/auth/me', { token })
    assert.equal(response.status, 200)
    assert.ok(data.user?.email)
  })

  it('GET /api/auth/profile has no hardcoded Bengaluru address', async () => {
    const { response, data } = await api('/api/auth/profile', { token })
    assert.equal(response.status, 200)
    assert.notEqual(data.profile?.address?.cityState, 'Bengaluru, Karnataka')
    assert.notEqual(data.profile?.address?.postalCode, '560001')
  })

  it('rejects unauthenticated /uploads access', async () => {
    const response = await fetch(`${baseUrl}/uploads/does-not-exist.png`)
    assert.equal(response.status, 401)
  })

  it('rejects session JWT in upload query string', async () => {
    const response = await fetch(
      `${baseUrl}/uploads/does-not-exist.png?access_token=${encodeURIComponent(token)}`,
    )
    assert.equal(response.status, 401)
  })

  it('GET /api/leave-requests is authorized', async () => {
    const { response } = await api('/api/leave-requests', { token })
    assert.equal(response.status, 200)
  })

  it('attendance import schema gate rejects empty records', async () => {
    const { response, data } = await api('/api/attendance/import', {
      method: 'POST',
      token,
      body: { records: [] },
    })
    assert.equal(response.status, 400)
    assert.ok(data.message)
  })
})
