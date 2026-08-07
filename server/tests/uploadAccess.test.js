import assert from 'node:assert/strict'
import { describe, it, before } from 'node:test'
import {
  buildSignedUploadUrl,
  canonicalizeUploadPath,
  signUploadAccess,
  verifyUploadAccessSignature,
  uploadFilenameFromPath,
  UPLOAD_TOKEN_TTL_SEC,
} from '../utils/uploadAccessToken.js'
import { resolveUploadFilePath } from '../middleware/uploadsAccessMiddleware.js'
import {
  isMedicalAttachmentUrl,
  parseMedicalAttachments,
  serializeMedicalAttachments,
} from '../utils/medicalAttachments.js'

describe('upload access tokens', () => {
  before(() => {
    if (!process.env.JWT_SECRET) {
      process.env.JWT_SECRET = 'test-upload-signing-secret'
    }
  })

  it('canonicalizes paths and strips query/signature', () => {
    assert.equal(
      canonicalizeUploadPath('/uploads/medical-1.pdf?exp=1&sig=abc'),
      '/uploads/medical-1.pdf',
    )
    assert.equal(
      uploadFilenameFromPath('/uploads/avatar-9.png?exp=1&sig=x'),
      'avatar-9.png',
    )
    assert.equal(canonicalizeUploadPath('../secret.txt'), null)
  })

  it('signs and verifies a short-lived file token', () => {
    const { filename, exp, sig } = signUploadAccess('medical-demo.pdf')
    assert.equal(filename, 'medical-demo.pdf')
    assert.equal(verifyUploadAccessSignature(filename, exp, sig), true)
    assert.equal(verifyUploadAccessSignature(filename, exp, 'tampered'), false)
    assert.equal(
      verifyUploadAccessSignature(filename, exp - 10_000, sig),
      false,
    )
  })

  it('builds a signed upload URL', () => {
    const signed = buildSignedUploadUrl('/uploads/avatar-1.png')
    assert.match(signed, /^\/uploads\/avatar-1\.png\?exp=\d+&sig=/)
    const url = new URL(signed, 'http://local')
    assert.equal(
      verifyUploadAccessSignature(
        'avatar-1.png',
        url.searchParams.get('exp'),
        url.searchParams.get('sig'),
      ),
      true,
    )
  })

  it('keeps medical attachment storage canonical (no query)', () => {
    const signed = buildSignedUploadUrl('/uploads/medical-abc123.pdf')
    assert.equal(isMedicalAttachmentUrl(signed), true)
    const parsed = parseMedicalAttachments([
      { url: signed, name: 'scan.pdf' },
    ])
    assert.equal(parsed[0].url, '/uploads/medical-abc123.pdf')
    const serialized = serializeMedicalAttachments(parsed)
    assert.equal(serialized.includes('?exp='), false)
    assert.equal(serialized.includes('medical-abc123.pdf'), true)
  })

  it('defaults upload token TTL to at least one hour', () => {
    assert.ok(UPLOAD_TOKEN_TTL_SEC >= 3600)
  })

  it('rejects path traversal for static resolve', () => {
    const resolved = resolveUploadFilePath('../secret.txt')
    assert.ok(resolved)
    assert.match(resolved, /[\\/]uploads[\\/]secret\.txt$/)
  })
})
