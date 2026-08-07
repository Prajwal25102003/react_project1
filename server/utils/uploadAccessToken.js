import crypto from 'crypto'
import path from 'path'

/** Short-lived file capability tokens (not session JWTs). Default 2 hours. */
export const UPLOAD_TOKEN_TTL_SEC = Number(process.env.UPLOAD_TOKEN_TTL_SEC) || 2 * 60 * 60

function getSigningSecret() {
  const secret = String(process.env.JWT_SECRET || '').trim()
  if (!secret) {
    throw new Error('JWT_SECRET is not configured')
  }
  return secret
}

function hmacSign(payload) {
  return crypto
    .createHmac('sha256', getSigningSecret())
    .update(payload)
    .digest('base64url')
}

function timingSafeEqualString(a, b) {
  const left = Buffer.from(String(a))
  const right = Buffer.from(String(b))
  if (left.length !== right.length) return false
  return crypto.timingSafeEqual(left, right)
}

/** Strip query/hash; return `/uploads/<basename>` or null. */
export function canonicalizeUploadPath(url) {
  const raw = String(url || '').trim()
  if (!raw) return null

  let pathname = raw
  try {
    if (/^https?:\/\//i.test(raw)) {
      pathname = new URL(raw).pathname
    } else {
      pathname = raw.split('?')[0].split('#')[0]
    }
  } catch {
    pathname = raw.split('?')[0].split('#')[0]
  }

  if (!pathname.startsWith('/uploads/')) return null
  const filename = path.basename(pathname)
  if (!filename || filename === '.' || filename === '..') return null
  return `/uploads/${filename}`
}

export function uploadFilenameFromPath(url) {
  const canonical = canonicalizeUploadPath(url)
  return canonical ? path.basename(canonical) : null
}

export function signUploadAccess(filename, ttlSec = UPLOAD_TOKEN_TTL_SEC) {
  const safeName = path.basename(String(filename || '').trim())
  if (!safeName || safeName === '.' || safeName === '..') {
    throw new Error('Invalid upload filename')
  }
  const exp = Math.floor(Date.now() / 1000) + Number(ttlSec)
  const payload = `${safeName}:${exp}`
  return { filename: safeName, exp, sig: hmacSign(payload) }
}

export function verifyUploadAccessSignature(filename, exp, sig) {
  const safeName = path.basename(String(filename || '').trim())
  const expNum = Number(exp)
  const provided = String(sig || '').trim()
  if (!safeName || !provided || !Number.isFinite(expNum)) return false
  if (expNum < Math.floor(Date.now() / 1000)) return false

  const expected = hmacSign(`${safeName}:${expNum}`)
  return timingSafeEqualString(expected, provided)
}

/** Append exp/sig to a canonical `/uploads/...` path. */
export function buildSignedUploadUrl(url, ttlSec = UPLOAD_TOKEN_TTL_SEC) {
  const canonical = canonicalizeUploadPath(url)
  if (!canonical) return url || null
  const filename = path.basename(canonical)
  const { exp, sig } = signUploadAccess(filename, ttlSec)
  return `${canonical}?exp=${exp}&sig=${encodeURIComponent(sig)}`
}

export function signEmployeeAvatar(employee) {
  if (!employee || typeof employee !== 'object') return employee
  if (!employee.avatar) return employee
  return {
    ...employee,
    avatar: buildSignedUploadUrl(employee.avatar),
  }
}

export function signLeaveAttachmentUrls(leaveRequest) {
  if (!leaveRequest || typeof leaveRequest !== 'object') return leaveRequest
  if (!leaveRequest.attachmentUrl) return leaveRequest

  const raw = String(leaveRequest.attachmentUrl).trim()
  if (!raw) return leaveRequest

  if (raw.startsWith('[')) {
    try {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed)) {
        const signed = parsed.map((item) => {
          if (typeof item === 'string') {
            return buildSignedUploadUrl(item)
          }
          if (item && typeof item === 'object') {
            return {
              ...item,
              url: buildSignedUploadUrl(item.url),
            }
          }
          return item
        })
        return {
          ...leaveRequest,
          attachmentUrl: JSON.stringify(signed),
        }
      }
    } catch {
      /* legacy single URL */
    }
  }

  return {
    ...leaveRequest,
    attachmentUrl: buildSignedUploadUrl(raw),
  }
}
