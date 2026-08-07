import path from 'path'
import { verifyAuthToken } from './authMiddleware.js'
import { findUserById, syncUserLoginRole } from '../models/authModel.js'
import { canUserAccessUploadFile } from '../models/uploadsAccessModel.js'
import { UPLOADS_DIR } from '../config/uploads.js'
import { verifyUploadAccessSignature } from '../utils/uploadAccessToken.js'

/**
 * Allow access to /uploads files with either:
 * - Short-lived signed file token: ?exp=&sig= (for <img> / <a>)
 * - Authorization: Bearer <jwt> plus per-file authorization
 *
 * Session JWTs in ?access_token= are no longer accepted.
 */
export async function requireUploadAccess(req, res, next) {
  const filename = path.basename(String(req.params.filename || '').trim())
  if (!filename || filename === '.' || filename === '..') {
    return res.status(400).json({ message: 'Invalid file path' })
  }

  const exp = req.query?.exp
  const sig = req.query?.sig
  if (exp != null && sig != null && String(sig).trim()) {
    if (verifyUploadAccessSignature(filename, exp, sig)) {
      return next()
    }
    return res.status(401).json({ message: 'Invalid or expired file link' })
  }

  const header = req.headers.authorization || ''
  const [scheme, bearer] = header.split(' ')
  if (scheme !== 'Bearer' || !bearer) {
    return res.status(401).json({ message: 'Authentication required' })
  }

  try {
    const payload = verifyAuthToken(bearer.trim())
    const dbUser = await findUserById(payload.sub)
    if (!dbUser) {
      return res.status(401).json({ message: 'User not found' })
    }
    const user = await syncUserLoginRole(dbUser)
    let allowed = false
    try {
      allowed = await canUserAccessUploadFile(user, filename)
    } catch (error) {
      console.error(error)
      return res.status(500).json({ message: 'Failed to authorize file access' })
    }
    if (!allowed) {
      return res.status(403).json({ message: 'You do not have access to this file' })
    }
    req.user = {
      id: user.id,
      role: user.role,
      employeeId: user.employeeId || null,
      email: user.email,
      name: user.name,
    }
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
