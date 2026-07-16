import jwt from 'jsonwebtoken'

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

export function requireAuth(req, res, next) {
  const header = req.headers.authorization || ''
  const [scheme, token] = header.split(' ')

  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({ message: 'Authentication required' })
  }

  try {
    const payload = verifyAuthToken(token)
    req.user = {
      id: payload.sub,
      role: payload.role,
      employeeId: payload.employeeId || null,
      email: payload.email,
      name: payload.name,
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
