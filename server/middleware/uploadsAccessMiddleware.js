import path from 'path'
import { verifyAuthToken } from './authMiddleware.js'
import { UPLOADS_DIR } from '../config/uploads.js'

/**
 * Allow access to /uploads files with either:
 * - Authorization: Bearer <jwt>
 * - ?access_token=<jwt> (for <img> / <a> which cannot set headers)
 */
export function requireUploadAccess(req, res, next) {
  const header = req.headers.authorization || ''
  const [scheme, bearer] = header.split(' ')
  const queryToken = String(req.query?.access_token || '').trim()
  const token =
    scheme === 'Bearer' && bearer ? bearer.trim() : queryToken

  if (!token) {
    return res.status(401).json({ message: 'Authentication required' })
  }

  try {
    verifyAuthToken(token)
    return next()
  } catch {
    return res.status(401).json({ message: 'Invalid or expired token' })
  }
}

/** Resolve a safe absolute path under UPLOADS_DIR, or null if invalid. */
export function resolveUploadFilePath(filename) {
  const safeName = path.basename(String(filename || '').trim())
  if (!safeName || safeName === '.' || safeName === '..') {
    return null
  }

  const absolute = path.resolve(UPLOADS_DIR, safeName)
  const root = path.resolve(UPLOADS_DIR)
  if (absolute !== root && !absolute.startsWith(`${root}${path.sep}`)) {
    return null
  }

  return absolute
}
