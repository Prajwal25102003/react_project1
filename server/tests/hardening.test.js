import assert from 'node:assert/strict'
import { describe, it, before } from 'node:test'
import { parsePagination, paginateArray } from '../utils/pagination.js'
import {
  signAuthToken,
  verifyAuthToken,
} from '../middleware/authMiddleware.js'

describe('pagination helpers', () => {
  it('caps limit and floors offset', () => {
    const page = parsePagination(
      { limit: '9999', offset: '-3' },
      { defaultLimit: 200, maxLimit: 500 },
    )
    assert.equal(page.limit, 500)
    assert.equal(page.offset, 0)
  })

  it('slices arrays with metadata', () => {
    const paged = paginateArray([1, 2, 3, 4, 5], { limit: 2, offset: 2 })
    assert.deepEqual(paged.rows, [3, 4])
    assert.equal(paged.total, 5)
    assert.equal(paged.hasMore, true)
  })
})

describe('JWT token version claim', () => {
  before(() => {
    if (!process.env.JWT_SECRET) {
      process.env.JWT_SECRET = 'test-jwt-secret-for-token-version'
    }
  })

  it('embeds tv and verifies payload', () => {
    const token = signAuthToken({
      id: 42,
      role: 'hr',
      employeeId: 'EMP-1',
      email: 'hr@example.com',
      name: 'HR',
      tokenVersion: 3,
    })
    const payload = verifyAuthToken(token)
    assert.equal(payload.sub, 42)
    assert.equal(payload.tv, 3)
  })
})
