import jwt from 'jsonwebtoken'
import { findUserById, syncUserLoginRole } from '../models/authModel.js'
import { findEmployeeById } from '../models/employeesModel.js'
import { formatDbError } from '../utils/formatDbError.js'

export const ACCOUNT_INACTIVE_MESSAGE =
  'Your account is temporarily inactive. You can view information but cannot make changes.'

function getJwtSecret() {
  const secret = String(process.env.JWT_SECRET || '').trim()
  if (!secret) {
    throw new Error('JWT_SECRET is not configured. Set it in server/.env')
  }
  return secret
}

function getJwtExpiresIn() {
  return process.env.JWT_EXPIRES_IN || '7d'
}

export function signAuthToken(user) {
  return jwt.sign(
    {
      sub: user.id,
      role: user.role,
      employeeId: user.employeeId || null,
      email: user.email,
      name: user.name,
    },
    getJwtSecret(),
    { expiresIn: getJwtExpiresIn() },
  )
}

export function verifyAuthToken(token) {
  return jwt.verify(token, getJwtSecret())
}

export async function requireAuth(req, res, next) {
  const header = req.headers.authorization || ''
  const [scheme, token] = header.split(' ')

  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({ message: 'Authentication required' })
  }

  try {
    const payload = verifyAuthToken(token)
    const dbUser = await findUserById(payload.sub)
    if (!dbUser) {
      return res.status(401).json({ message: 'User not found' })
    }

    // Prefer live DB role so HR headship promotions apply without forcing re-login.
    const user = await syncUserLoginRole(dbUser)
    req.tokenClaims = {
      role: payload.role,
      employeeId: payload.employeeId || null,
      email: payload.email,
      name: payload.name,
    }
    req.user = {
      id: user.id,
      role: user.role,
      employeeId: user.employeeId || null,
      email: user.email,
      name: user.name,
    }
    next()
  } catch {
    return res.status(401).json({ message: 'Invalid or expired token' })
  }
}

export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' })
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'You do not have access to this resource' })
    }
    next()
  }
}

/**
 * Block create/update/delete for Inactive employee/admin profiles.
 * Place after requireAuth on mutating routes. GET/read stays allowed.
 */
export async function requireActiveAccount(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ message: 'Authentication required' })
  }

  if (!req.user.employeeId) {
    return next()
  }

  try {
    const employee = await findEmployeeById(req.user.employeeId)
    const status = String(employee?.status || 'Active').trim()
    req.user.status = status

    if (status === 'Inactive') {
      return res.status(403).json({ message: ACCOUNT_INACTIVE_MESSAGE })
    }

    return next()
  } catch (error) {
    return res.status(500).json({ message: formatDbError(error) })
  }
}
