import {
  createEmployeeUser,
  findUserByEmployeeId,
  hashPassword,
  syncDepartmentEmployeeLoginRoles,
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
import { assignLeaveBalances } from '../models/leaveBalancesModel.js'
import { findDepartmentById } from '../models/departmentsModel.js'
import { createRecentActivity } from '../models/recentActivitiesModel.js'
import pool from '../config/db.js'
import {
  actorFromUser,
  formatActorLabel,
} from '../utils/activityCopy.js'
import { formatDbError } from '../utils/formatDbError.js'
import { loginRoleForEmployee } from '../utils/loginRole.js'
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

function parseEmployeePayload(body, { requireDepartment = true } = {}) {
  const errors = []

  const name = String(body?.name ?? '').trim()
  const email = String(body?.email ?? '').trim().toLowerCase()
  const phone = String(body?.phone ?? '').trim()
  const gender = String(body?.gender ?? '').trim()
  const departmentId = String(body?.departmentId ?? '').trim() || null
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
  if (requireDepartment && !departmentId) errors.push('Department is required')
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

  const { value: casualLeaveBalance, error: casualError } =
    parseOptionalLeaveBalance(body?.casualLeaveBalance, 'Casual leave')
  if (casualError) errors.push(casualError)

  const { value: sickLeaveBalance, error: sickError } =
    parseOptionalLeaveBalance(body?.sickLeaveBalance, 'Sick leave')
  if (sickError) errors.push(sickError)

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
      casualLeaveBalance,
      sickLeaveBalance,
    },
  }
}

/** Optional paid leave field: blank → 0; otherwise non-negative integer. */
function parseOptionalLeaveBalance(raw, label) {
  if (raw === undefined || raw === null || String(raw).trim() === '') {
    return { value: 0, error: null }
  }
  const num = Number(raw)
  if (!Number.isInteger(num) || num < 0) {
    return {
      value: 0,
      error: `${label} must be a whole number 0 or greater`,
    }
  }
  return { value: num, error: null }
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

    // Admin is a system manager, not an employee — never list in Employees module.
    if (!excludeLoginRoles.includes('admin')) {
      excludeLoginRoles.push('admin')
    }

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

    if (employee.loginRole === 'admin') {
      return res.status(404).json({
        message: 'Admin is a system manager and is not listed as an employee',
      })
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

    const id = await generateNextEmployeeId()
    const loginRole = loginRoleForEmployee({
      departmentName: department.name,
      employeeId: id,
      headEmployeeId: department.headEmployeeId,
    })

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

    const actorLabel = formatActorLabel(actorFromUser(req.user))
    await createRecentActivity({
      title: 'New Employee Added',
      description: `${created.name} joined the ${created.department} Department as ${created.designation}. Added by ${actorLabel}.`,
      category: 'Employees',
      status: 'Added',
      subjectEmployeeId: created.id,
      actorEmployeeId: req.user?.employeeId || null,
      meta: {
        subjectName: created.name,
        departmentName: created.department,
        designation: created.designation,
        actorName: req.user?.name || null,
        actorRole: req.user?.role || null,
      },
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
    const previous = await findEmployeeById(req.params.id)
    if (!previous) {
      return res.status(404).json({ message: 'Employee not found' })
    }

    const isAdminAccount = previous.loginRole === 'admin'
    if (isAdminAccount) {
      return res.status(403).json({
        message:
          'Admin is a system manager and cannot be edited from Employees',
      })
    }

    const { errors, employee } = parseEmployeePayload(req.body, {
      requireDepartment: true,
    })

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

    let department = await findDepartmentById(employee.departmentId)
    if (!department) {
      return res.status(400).json({ message: 'Department not found' })
    }

    const loginRole = loginRoleForEmployee({
      departmentName: department.name,
      employeeId: req.params.id,
      headEmployeeId: department.headEmployeeId,
    })

    const updated = await updateEmployee(req.params.id, employee)
    if (!updated) {
      return res.status(404).json({ message: 'Employee not found' })
    }

    const existingLogin = await findUserByEmployeeId(updated.id)

    if (existingLogin) {
      const credentialUpdate = {
        name: employee.name,
      }

      // Keep admin accounts as admin; only sync employee/hr from department headship.
      if (existingLogin.role !== 'admin') {
        credentialUpdate.role = loginRole
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

    await syncDepartmentEmployeeLoginRoles(department)
    if (
      department &&
      previous.departmentId &&
      previous.departmentId !== department.id
    ) {
      const previousDept = await findDepartmentById(previous.departmentId)
      if (previousDept) {
        await syncDepartmentEmployeeLoginRoles(previousDept)
      }
    }

    const actorLabel = formatActorLabel(actorFromUser(req.user))
    const changeParts = []
    if (previous.phone !== updated.phone || previous.email !== updated.email) {
      changeParts.push('contact information')
    }
    if (previous.departmentId !== updated.departmentId) {
      changeParts.push(
        `department (${previous.department} → ${updated.department})`,
      )
    }
    if (previous.designation !== updated.designation) {
      changeParts.push(
        `designation (${previous.designation} → ${updated.designation})`,
      )
    }
    if (previous.status !== updated.status) {
      changeParts.push(`status (${previous.status} → ${updated.status})`)
    }
    if (previous.name !== updated.name) {
      changeParts.push(`name (${previous.name} → ${updated.name})`)
    }

    let description
    if (changeParts.length === 1 && changeParts[0] === 'contact information') {
      description = `${updated.name}'s contact information was updated by ${actorLabel}.`
    } else if (changeParts.length > 0) {
      description = `${updated.name}'s profile was updated by ${actorLabel}: ${changeParts.join(', ')}.`
    } else {
      description = `${updated.name}'s employee profile was updated by ${actorLabel}.`
    }

    await createRecentActivity({
      title: 'Employee Profile Updated',
      description,
      category: 'Employees',
      status: 'Updated',
      subjectEmployeeId: updated.id,
      actorEmployeeId: req.user?.employeeId || null,
      meta: {
        subjectName: updated.name,
        departmentName: updated.department,
        designation: updated.designation,
        actorName: req.user?.name || null,
        actorRole: req.user?.role || null,
      },
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

    if (existing.loginRole === 'admin') {
      return res.status(403).json({
        message:
          'Admin is a system manager and cannot be deleted from Employees',
      })
    }

    const deleted = await deleteEmployeeById(req.params.id)
    if (!deleted) {
      return res.status(404).json({ message: 'Employee not found' })
    }

    const actorLabel = formatActorLabel(actorFromUser(req.user))
    await createRecentActivity({
      title: 'Employee Removed',
      description: `${existing.name} was removed from the employee directory by ${actorLabel}.`,
      category: 'Employees',
      status: 'Removed',
      subjectEmployeeId: existing.id,
      actorEmployeeId: req.user?.employeeId || null,
      meta: {
        subjectName: existing.name,
        departmentName: existing.department,
        actorName: req.user?.name || null,
        actorRole: req.user?.role || null,
      },
    })

    res.json({ message: 'Employee deleted' })
  } catch (error) {
    res.status(500).json({
      message: formatDbError(error),
    })
  }
}

/** Bulk set or add casual/sick leave for All / Department / Custom employees. */
export async function assignLeaveBalancesHandler(req, res) {
  try {
    const scope = String(req.body?.scope ?? '').trim()
    const mode = String(req.body?.mode ?? 'set').trim()
    const departmentId = String(req.body?.departmentId ?? '').trim() || null
    const employeeIds = Array.isArray(req.body?.employeeIds)
      ? [
          ...new Set(
            req.body.employeeIds
              .map((id) => String(id || '').trim())
              .filter(Boolean),
          ),
        ]
      : []

    if (!['all', 'department', 'custom'].includes(scope)) {
      return res.status(400).json({
        message: 'Scope must be all, department, or custom',
      })
    }
    if (!['set', 'add'].includes(mode)) {
      return res.status(400).json({
        message: 'Mode must be set or add',
      })
    }

    const { value: casualLeaveBalance, error: casualError } =
      parseOptionalLeaveBalance(req.body?.casualLeaveBalance, 'Casual leave')
    if (casualError) {
      return res.status(400).json({ message: casualError })
    }
    const { value: sickLeaveBalance, error: sickError } =
      parseOptionalLeaveBalance(req.body?.sickLeaveBalance, 'Sick leave')
    if (sickError) {
      return res.status(400).json({ message: sickError })
    }

    if (
      req.body?.casualLeaveBalance === undefined ||
      req.body?.casualLeaveBalance === null ||
      String(req.body?.casualLeaveBalance).trim() === '' ||
      req.body?.sickLeaveBalance === undefined ||
      req.body?.sickLeaveBalance === null ||
      String(req.body?.sickLeaveBalance).trim() === ''
    ) {
      return res.status(400).json({
        message: 'Casual leave and sick leave days are required',
      })
    }

    if (scope === 'department') {
      if (!departmentId) {
        return res.status(400).json({ message: 'Department is required' })
      }
      const department = await findDepartmentById(departmentId)
      if (!department) {
        return res.status(400).json({ message: 'Department not found' })
      }
      if (employeeIds.length === 0) {
        return res.status(400).json({
          message: 'Select at least one employee',
        })
      }
    }

    if (scope === 'custom') {
      if (employeeIds.length === 0) {
        return res.status(400).json({
          message: 'Select at least one employee',
        })
      }
    }

    const result = await assignLeaveBalances({
      scope,
      mode,
      casualLeaveBalance,
      sickLeaveBalance,
      departmentId,
      employeeIds,
    })

    if (result.updatedCount === 0) {
      return res.status(400).json({
        message:
          scope === 'all'
            ? 'No active employees match this selection'
            : 'No matching employees to update',
      })
    }

    const actorLabel = formatActorLabel(actorFromUser(req.user))
    const modeLabel = mode === 'add' ? 'added' : 'set'
    const scopeLabel =
      scope === 'all'
        ? 'all active employees'
        : scope === 'department'
          ? `${result.updatedCount} employee(s) in a department`
          : `${result.updatedCount} employee(s)`

    await createRecentActivity({
      title: 'Leave Balances Updated',
      description: `${actorLabel} ${modeLabel} leave balances for ${scopeLabel} (casual ${casualLeaveBalance}, sick ${sickLeaveBalance}).`,
      category: 'Employees',
      status: 'Updated',
      subjectEmployeeId: null,
      actorEmployeeId: req.user?.employeeId || null,
      meta: {
        scope,
        mode,
        casualLeaveBalance,
        sickLeaveBalance,
        departmentId,
        updatedCount: result.updatedCount,
        actorName: req.user?.name || null,
        actorRole: req.user?.role || null,
      },
    })

    res.json({
      message: `Leave balances ${mode === 'add' ? 'added for' : 'set for'} ${result.updatedCount} employee(s)`,
      updatedCount: result.updatedCount,
      employeeIds: result.employeeIds,
    })
  } catch (error) {
    res.status(500).json({
      message: formatDbError(error),
    })
  }
}
