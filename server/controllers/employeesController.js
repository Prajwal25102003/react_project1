import {
  createEmployeeUser,
  findUserByEmployeeId,
  hashPassword,
  updateEmployeeUserCredentials,
} from '../models/authModel.js'
import {
  createEmployee,
  deleteEmployeeById,
  findAllEmployees,
  findEmployeeById,
  generateNextEmployeeId,
  updateEmployee,
} from '../models/employeesModel.js'
import { findDepartmentById } from '../models/departmentsModel.js'
import { createRecentActivity } from '../models/recentActivitiesModel.js'
import pool from '../config/db.js'
import { formatDbError } from '../utils/formatDbError.js'
import { loginRoleForDepartmentName } from '../utils/loginRole.js'
import { uniqueConstraintMessage } from '../utils/pgErrors.js'
import {
  isValidIndianPhone,
  normalizeIndianPhone,
} from '../utils/indianPhone.js'
import { isValidEmail } from '../utils/email.js'

const GENDERS = new Set(['Male', 'Female'])
const STATUSES = new Set(['Active', 'Inactive'])
const MIN_PASSWORD_LENGTH = 8

function canManageLogin(role) {
  return role === 'admin' || role === 'hr'
}

function parsePassword(body, { required }) {
  const password = String(body?.password ?? '')
  const errors = []

  if (!password) {
    if (required) errors.push('Password is required')
    return { errors, password: null }
  }

  if (password.length < MIN_PASSWORD_LENGTH) {
    errors.push(`Password must be at least ${MIN_PASSWORD_LENGTH} characters`)
  }

  return { errors, password }
}

function parseLoginEmail(body, { required }) {
  const loginEmail = String(body?.loginEmail ?? body?.gmail ?? '')
    .trim()
    .toLowerCase()
  const errors = []

  if (!loginEmail) {
    if (required) errors.push('Gmail is required for employee login')
    return { errors, loginEmail: null }
  }

  if (!isValidEmail(loginEmail)) {
    errors.push('Gmail is invalid')
  }

  return { errors, loginEmail }
}

function parseEmployeePayload(body) {
  const errors = []

  const name = String(body?.name ?? '').trim()
  const email = String(body?.email ?? '').trim().toLowerCase()
  const phone = String(body?.phone ?? '').trim()
  const gender = String(body?.gender ?? '').trim()
  const departmentId = String(body?.departmentId ?? '').trim()
  const designation = String(body?.designation ?? '').trim()
  const joiningDate = String(body?.joiningDate ?? '').trim()
  const status = String(body?.status ?? '').trim()
  const avatarRaw = body?.avatar
  const avatar =
    avatarRaw === null || avatarRaw === undefined || avatarRaw === ''
      ? null
      : String(avatarRaw).trim()

  if (!name) errors.push('Name is required')
  if (!email) errors.push('Email is required')
  else if (!isValidEmail(email)) {
    errors.push('Email is invalid')
  }
  if (!phone) errors.push('Phone is required')
  else if (!isValidIndianPhone(phone)) {
    errors.push(
      'Phone must be a valid 10-digit Indian mobile number (e.g. 9876543210)',
    )
  }

  const normalizedPhone = normalizeIndianPhone(phone) || phone
  if (!gender) errors.push('Gender is required')
  else if (!GENDERS.has(gender)) errors.push('Gender must be Male or Female')
  if (!departmentId) errors.push('Department is required')
  if (!designation) errors.push('Designation is required')
  if (!joiningDate) errors.push('Joining date is required')
  else if (!/^\d{4}-\d{2}-\d{2}$/.test(joiningDate)) {
    errors.push('Joining date must be YYYY-MM-DD')
  }
  if (!status) errors.push('Status is required')
  else if (!STATUSES.has(status)) errors.push('Status must be Active or Inactive')

  const salary = Number(body?.salary)
  if (body?.salary === undefined || body?.salary === null || body?.salary === '') {
    errors.push('Salary is required')
  } else if (Number.isNaN(salary) || salary < 0) {
    errors.push('Salary must be a non-negative number')
  }

  return {
    errors,
    employee: {
      name,
      email,
      phone: normalizedPhone,
      gender,
      departmentId,
      designation,
      joiningDate,
      salary,
      status,
      avatar,
    },
  }
}

function withLoginInfo(employee, loginUser, includeCredentials) {
  if (!employee) return null
  if (!includeCredentials) return employee

  return {
    ...employee,
    hasLoginAccount: Boolean(loginUser),
    loginEmail: loginUser?.email || employee.email,
  }
}

const EMPLOYEE_UNIQUE_MATCHERS = [
  { includes: 'email', message: 'An employee with this email already exists' },
  {
    includes: 'employees_pkey',
    message: 'An employee with this ID already exists',
  },
]

function resolveEmployeeUniqueMessage(error) {
  if (error?.code !== '23505') return null

  const constraint = String(error.constraint || '')
  if (constraint.includes('users') && constraint.includes('email')) {
    return 'A login account with this email already exists'
  }

  return uniqueConstraintMessage(error, EMPLOYEE_UNIQUE_MATCHERS)
}

export async function getEmployees(req, res) {
  try {
    const excludeLoginRoles = String(req.query.excludeLoginRoles || '')
      .split(',')
      .map((role) => role.trim().toLowerCase())
      .filter(Boolean)

    const employees = await findAllEmployees({ excludeLoginRoles })
    res.json({ employees })
  } catch (error) {
    res.status(500).json({
      message: formatDbError(error),
    })
  }
}

export async function getEmployeeById(req, res) {
  try {
    const employee = await findEmployeeById(req.params.id)
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' })
    }

    const includeCredentials = canManageLogin(req.user?.role)
    const loginUser = includeCredentials
      ? await findUserByEmployeeId(employee.id)
      : null

    res.json({
      employee: withLoginInfo(employee, loginUser, includeCredentials),
    })
  } catch (error) {
    res.status(500).json({
      message: formatDbError(error),
    })
  }
}

export async function createEmployeeHandler(req, res) {
  const client = await pool.connect()

  try {
    const { errors, employee } = parseEmployeePayload(req.body)
    const { errors: loginEmailErrors, loginEmail } = parseLoginEmail(req.body, {
      required: true,
    })
    const { errors: passwordErrors, password } = parsePassword(req.body, {
      required: true,
    })
    const allErrors = [...errors, ...loginEmailErrors, ...passwordErrors]
    if (allErrors.length > 0) {
      return res.status(400).json({ message: allErrors.join('; ') })
    }

    const department = await findDepartmentById(employee.departmentId)
    if (!department) {
      return res.status(400).json({ message: 'Department not found' })
    }

    const loginRole = loginRoleForDepartmentName(department.name)

    const id = await generateNextEmployeeId()
    const passwordHash = await hashPassword(password)

    await client.query('BEGIN')

    await createEmployee({ ...employee, id }, client)
    await createEmployeeUser(
      {
        email: loginEmail,
        name: employee.name,
        employeeId: id,
        passwordHash,
        role: loginRole,
      },
      client,
    )

    await client.query('COMMIT')

    const created = await findEmployeeById(id)

    await createRecentActivity({
      title: 'New employee added',
      description: `${created.name} joined ${created.department} as ${created.designation}.`,
      category: 'Employees',
      status: 'Added',
    })

    const includeCredentials = canManageLogin(req.user?.role)
    const loginUser = includeCredentials
      ? await findUserByEmployeeId(id)
      : null

    res.status(201).json({
      employee: withLoginInfo(created, loginUser, includeCredentials),
    })
  } catch (error) {
    await client.query('ROLLBACK')

    const uniqueMessage = resolveEmployeeUniqueMessage(error)
    if (uniqueMessage) {
      return res.status(409).json({ message: uniqueMessage })
    }

    res.status(500).json({
      message: formatDbError(error),
    })
  } finally {
    client.release()
  }
}

export async function updateEmployeeHandler(req, res) {
  try {
    const { errors, employee } = parseEmployeePayload(req.body)
    const manageLogin = canManageLogin(req.user?.role)
    const { errors: loginEmailErrors, loginEmail } = parseLoginEmail(req.body, {
      required: false,
    })
    const { errors: passwordErrors, password } = parsePassword(req.body, {
      required: false,
    })

    if (!manageLogin && (password || loginEmail)) {
      return res.status(403).json({
        message: 'Only HR and Admin can manage employee login credentials',
      })
    }

    const allErrors = [
      ...errors,
      ...(manageLogin ? loginEmailErrors : []),
      ...(manageLogin ? passwordErrors : []),
    ]
    if (allErrors.length > 0) {
      return res.status(400).json({ message: allErrors.join('; ') })
    }

    const department = await findDepartmentById(employee.departmentId)
    if (!department) {
      return res.status(400).json({ message: 'Department not found' })
    }

    const loginRole = loginRoleForDepartmentName(department.name)

    const updated = await updateEmployee(req.params.id, employee)
    if (!updated) {
      return res.status(404).json({ message: 'Employee not found' })
    }

    const existingLogin = await findUserByEmployeeId(updated.id)

    if (existingLogin) {
      const credentialUpdate = {
        name: employee.name,
        role: loginRole,
      }

      if (manageLogin && loginEmail) {
        credentialUpdate.email = loginEmail
      }

      if (manageLogin && password) {
        credentialUpdate.passwordHash = await hashPassword(password)
      }

      await updateEmployeeUserCredentials(updated.id, credentialUpdate)
    } else if (manageLogin && loginEmail && password) {
      await createEmployeeUser({
        email: loginEmail,
        name: employee.name,
        employeeId: updated.id,
        passwordHash: await hashPassword(password),
        role: loginRole,
      })
    } else if (manageLogin && (loginEmail || password)) {
      return res.status(400).json({
        message:
          'Gmail and password are both required to create an employee login',
      })
    }

    await createRecentActivity({
      title: 'Employee updated',
      description: `${updated.name}'s profile was updated (${updated.designation}, ${updated.department}).`,
      category: 'Employees',
      status: 'Updated',
    })

    const loginUser = manageLogin
      ? await findUserByEmployeeId(updated.id)
      : null

    res.json({
      employee: withLoginInfo(updated, loginUser, manageLogin),
    })
  } catch (error) {
    const uniqueMessage = resolveEmployeeUniqueMessage(error)
    if (uniqueMessage) {
      return res.status(409).json({ message: uniqueMessage })
    }

    res.status(500).json({
      message: formatDbError(error),
    })
  }
}

export async function deleteEmployeeHandler(req, res) {
  try {
    const existing = await findEmployeeById(req.params.id)
    if (!existing) {
      return res.status(404).json({ message: 'Employee not found' })
    }

    const deleted = await deleteEmployeeById(req.params.id)
    if (!deleted) {
      return res.status(404).json({ message: 'Employee not found' })
    }

    await createRecentActivity({
      title: 'Employee removed',
      description: `${existing.name} was removed from the employee directory.`,
      category: 'Employees',
      status: 'Removed',
    })

    res.json({ message: 'Employee deleted' })
  } catch (error) {
    res.status(500).json({
      message: formatDbError(error),
    })
  }
}
