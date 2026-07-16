import {
  findUserByEmail,
  findUserById,
  toPublicUser,
  verifyPassword,
} from '../models/authModel.js'
import { findEmployeeById } from '../models/employeesModel.js'
import { signAuthToken } from '../middleware/authMiddleware.js'
import { formatDbError } from '../utils/formatDbError.js'

async function toPublicUserWithAvatar(user) {
  const publicUser = toPublicUser(user)
  if (!user?.employeeId) {
    return { ...publicUser, avatar: null }
  }

  const employee = await findEmployeeById(user.employeeId)
  return {
    ...publicUser,
    avatar: employee?.avatar || null,
  }
}

export async function signInHandler(req, res) {
  try {
    const email = String(req.body?.email ?? '')
      .trim()
      .toLowerCase()
    const password = String(req.body?.password ?? '')

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' })
    }

    const user = await findUserByEmail(email)
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' })
    }

    const ok = await verifyPassword(password, user.passwordHash)
    if (!ok) {
      return res.status(401).json({ message: 'Invalid email or password' })
    }

    const publicUser = await toPublicUserWithAvatar(user)
    const token = signAuthToken(publicUser)

    res.json({ token, user: publicUser })
  } catch (error) {
    res.status(500).json({ message: formatDbError(error) })
  }
}

export async function getMeHandler(req, res) {
  try {
    const user = await findUserById(req.user.id)
    if (!user) {
      return res.status(401).json({ message: 'User not found' })
    }
    res.json({ user: await toPublicUserWithAvatar(user) })
  } catch (error) {
    res.status(500).json({ message: formatDbError(error) })
  }
}

export async function getProfileHandler(req, res) {
  try {
    const user = await findUserById(req.user.id)
    if (!user) {
      return res.status(401).json({ message: 'User not found' })
    }

    const publicUser = toPublicUser(user)
    let employee = null
    if (user.employeeId) {
      employee = await findEmployeeById(user.employeeId)
    }

    const nameParts = String(publicUser.name || '').trim().split(/\s+/)
    const firstName = nameParts[0] || publicUser.name || ''
    const lastName = nameParts.slice(1).join(' ') || ''

    res.json({
      profile: {
        name: publicUser.name,
        role: publicUser.role,
        email: publicUser.email,
        employeeId: publicUser.employeeId,
        location: employee?.department || 'Head Office',
        avatar: employee?.avatar || null,
        personal: {
          firstName,
          lastName,
          email: employee?.email || publicUser.email,
          phone: employee?.phone || '—',
          bio: `${publicUser.role.toUpperCase()} — Employee Management System`,
        },
        address: {
          country: 'India',
          cityState: 'Bengaluru, Karnataka',
          postalCode: '560001',
          taxId: employee?.id || '—',
        },
        employee,
      },
    })
  } catch (error) {
    res.status(500).json({ message: formatDbError(error) })
  }
}
