import {
  createEmployeeUser,
  findUserByEmployeeId,
  findUsersByEmployeeId,
  hashPassword,
  syncDepartmentEmployeeLoginRoles,
  updateEmployeeUserCredentials,
} from '../models/authModel.js'
import {
  countAdminUsers,
  createAdminUser,
  deleteAdminUser,
} from '../models/adminUsersModel.js'
import {
  createEmployee,
  deleteEmployeeById,
  findAllEmployees,
  findEmployeeById,
  generateNextAdminId,
  generateNextEmployeeId,
  updateEmployee,
} from '../models/employeesModel.js'
import { assignLeaveBalances } from '../models/leaveBalancesModel.js'
import { findDepartmentById } from '../models/departmentsModel.js'
import { createRecentActivity } from '../models/recentActivitiesModel.js'
import {
  buildEmployeeAudienceMeta,
  expandEmployeeIdsWithDepartmentHeads,
} from '../utils/notificationAudience.js'
import pool from '../config/db.js'
import {
  actorFromUser,
  formatActorLabel,
} from '../utils/activityCopy.js'
import { formatDbError } from '../utils/formatDbError.js'
import {
  canonicalizeUploadPath,
  signEmployeeAvatar,
} from '../utils/uploadAccessToken.js'
import { paginateArray, parsePagination } from '../utils/pagination.js'
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
  const loginEmail = String(body?.loginEmail ?? body?.gmail ?? body?.email ?? '')
    .trim()
    .toLowerCase()
  const errors = []

  if (!loginEmail) {
    if (required) errors.push('Email is required for login')
    return { errors, loginEmail: null }
  }

  if (!isValidEmail(loginEmail)) {
    errors.push('Email is invalid')
  }

  return { errors, loginEmail }
}

/** Minimal admin profile — name, email, status, address, optional photo. */
function parseAdminPayload(body, { previous = null } = {}) {
  const errors = []
  const name = String(body?.name ?? '').trim()
  const email = String(body?.email ?? body?.loginEmail ?? body?.gmail ?? '')
    .trim()
    .toLowerCase()
  const status = String(body?.status ?? previous?.status ?? 'Active').trim()
  const avatarRaw = body?.avatar
  const avatar =
    avatarRaw === null || avatarRaw === undefined || avatarRaw === ''
      ? null
      : canonicalizeUploadPath(avatarRaw)
  const country = String(body?.country ?? previous?.country ?? '').trim()
  const cityState = String(body?.cityState ?? previous?.cityState ?? '').trim()
  const postalCode = String(body?.postalCode ?? previous?.postalCode ?? '').trim()

  if (!name) errors.push('Name is required')
  if (!email) errors.push('Email is required')
  else if (!isValidEmail(email)) errors.push('Email is invalid')
  if (!status) errors.push('Status is required')
  else if (!STATUSES.has(status)) errors.push('Status must be Active or Inactive')
  if (!country) errors.push('Country is required')
  if (!cityState) errors.push('City / State is required')
  if (!postalCode) errors.push('Postal code is required')

  const today = new Date().toISOString().slice(0, 10)
  const phoneSource =
    previous?.phone ||
    String(body?.phone ?? '').trim() ||
    '9999999999'
  const normalizedPhone =
    normalizeIndianPhone(phoneSource) || '+91 99999 99999'

  return {
    errors,
    employee: {
      name,
      email,
      phone: normalizedPhone,
      gender: previous?.gender || 'Male',
      departmentId: null,
      designation: previous?.designation || 'System Administrator',
      joiningDate: previous?.joiningDate || today,
      salary: 0,
      status,
      avatar,
      country: country || null,
      cityState: cityState || null,
      postalCode: postalCode || null,
      casualLeaveBalance: 0,
      sickLeaveBalance: 0,
    },
    loginEmail: email,
  }
}

function parseEmployeePayload(
  body,
  { requireDepartment = true, previous = null } = {},
) {
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
      : canonicalizeUploadPath(avatarRaw)
  const country = String(body?.country ?? previous?.country ?? '').trim()
  const cityState = String(body?.cityState ?? previous?.cityState ?? '').trim()
  const postalCode = String(body?.postalCode ?? previous?.postalCode ?? '').trim()

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

  if (!country) errors.push('Country is required')
  if (!cityState) errors.push('City / State is required')
  if (!postalCode) errors.push('Postal code is required')

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
      country: country || null,
      cityState: cityState || null,
      postalCode: postalCode || null,
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

    // HR (and others) never see admin system accounts in Employees.
    // Admins can list other admins so they can manage them here.
    if (req.user?.role !== 'admin' && !excludeLoginRoles.includes('admin')) {
      excludeLoginRoles.push('admin')
    }

    const employees = await findAllEmployees({ excludeLoginRoles })
    const page = parsePagination(req.query, { defaultLimit: 200, maxLimit: 500 })
    const paged = paginateArray(employees.map(signEmployeeAvatar), page)
    res.json({
      employees: paged.rows,
      total: paged.total,
      limit: paged.limit,
      offset: paged.offset,
      hasMore: paged.hasMore,
    })
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

    if (employee.loginRole === 'admin' && req.user?.role !== 'admin') {
      return res.status(404).json({
        message: 'Admin is a system manager and is not listed as an employee',
      })
    }

    const includeCredentials = canManageLogin(req.user?.role)
    const loginUser = includeCredentials
      ? await findUserByEmployeeId(employee.id)
      : null

    res.json({
      employee: signEmployeeAvatar(
        withLoginInfo(employee, loginUser, includeCredentials),
      ),
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
    const wantsAdmin =
      String(req.body?.accountType ?? req.body?.role ?? '')
        .trim()
        .toLowerCase() === 'admin'

    if (wantsAdmin && req.user?.role !== 'admin') {
      return res.status(403).json({
        message: 'Only an admin can create another admin account',
      })
    }

    let employee
    let loginEmail
    let password
    let allErrors = []

    if (wantsAdmin) {
      const parsed = parseAdminPayload(req.body)
      const { errors: passwordErrors, password: nextPassword } = parsePassword(
        req.body,
        { required: true },
      )
      allErrors = [...parsed.errors, ...passwordErrors]
      employee = parsed.employee
      loginEmail = parsed.loginEmail
      password = nextPassword
    } else {
      const { errors, employee: nextEmployee } = parseEmployeePayload(req.body)
      const { errors: loginEmailErrors, loginEmail: nextLoginEmail } =
        parseLoginEmail(req.body, { required: true })
      const { errors: passwordErrors, password: nextPassword } = parsePassword(
        req.body,
        { required: true },
      )
      allErrors = [...errors, ...loginEmailErrors, ...passwordErrors]
      employee = nextEmployee
      loginEmail = nextLoginEmail
      password = nextPassword
    }

    if (allErrors.length > 0) {
      return res.status(400).json({ message: allErrors.join('; ') })
    }

    let department = null
    let loginRole = wantsAdmin ? 'admin' : 'employee'

    if (!wantsAdmin) {
      department = await findDepartmentById(employee.departmentId)
      if (!department) {
        return res.status(400).json({ message: 'Department not found' })
      }
    }

    const id = wantsAdmin
      ? await generateNextAdminId()
      : await generateNextEmployeeId()
    if (!wantsAdmin) {
      loginRole = loginRoleForEmployee({
        departmentName: department.name,
        employeeId: id,
        headEmployeeId: department.headEmployeeId,
      })
    }

    const passwordHash = await hashPassword(password)

    await client.query('BEGIN')

    await createEmployee({ ...employee, id }, client)
    if (wantsAdmin) {
      await createAdminUser(
        {
          email: loginEmail,
          name: employee.name,
          employeeId: id,
          passwordHash,
        },
        client,
      )
    } else {
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
    }

    await client.query('COMMIT')

    const created = await findEmployeeById(id)

    const actorLabel = formatActorLabel(actorFromUser(req.user))
    const audience = await buildEmployeeAudienceMeta(created)
    await createRecentActivity({
      title: wantsAdmin ? 'Admin Added' : 'New Employee Added',
      description: wantsAdmin
        ? `${created.name} was granted admin access by ${actorLabel}.`
        : `${created.name} joined the ${created.department} Department as ${created.designation}. Added by ${actorLabel}.`,
      category: 'Employees',
      status: 'Added',
      eventType: wantsAdmin ? 'admin.added' : 'employee.added',
      subjectEmployeeId: created.id,
      actorEmployeeId: req.user?.employeeId || null,
      meta: {
        subjectName: created.name,
        departmentName: created.department,
        designation: created.designation,
        departmentId: audience.departmentId,
        departmentIds: audience.departmentIds,
        employeeIds: audience.employeeIds,
        actorName: req.user?.name || null,
        actorRole: req.user?.role || null,
      },
    })

    const includeCredentials = canManageLogin(req.user?.role)
    const loginUser = includeCredentials
      ? await findUserByEmployeeId(id)
      : null

    res.status(201).json({
      employee: signEmployeeAvatar(
        withLoginInfo(created, loginUser, includeCredentials),
      ),
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
    if (isAdminAccount && req.user?.role !== 'admin') {
      return res.status(403).json({
        message:
          'Admin is a system manager and cannot be edited from Employees',
      })
    }

    const manageLogin = canManageLogin(req.user?.role)
    let employee
    let loginEmail = null
    let password = null
    let allErrors = []

    if (isAdminAccount) {
      const parsed = parseAdminPayload(req.body, { previous })
      const { errors: passwordErrors, password: nextPassword } = parsePassword(
        req.body,
        { required: false },
      )
      allErrors = [...parsed.errors, ...passwordErrors]
      employee = parsed.employee
      loginEmail = parsed.loginEmail
      password = nextPassword
    } else {
      const { errors, employee: nextEmployee } = parseEmployeePayload(req.body, {
        requireDepartment: true,
        previous,
      })
      const { errors: loginEmailErrors, loginEmail: nextLoginEmail } =
        parseLoginEmail(req.body, { required: false })
      const { errors: passwordErrors, password: nextPassword } = parsePassword(
        req.body,
        { required: false },
      )

      if (!manageLogin && (nextPassword || nextLoginEmail)) {
        return res.status(403).json({
          message: 'Only HR and Admin can manage employee login credentials',
        })
      }

      allErrors = [
        ...errors,
        ...(manageLogin ? loginEmailErrors : []),
        ...(manageLogin ? passwordErrors : []),
      ]
      employee = nextEmployee
      loginEmail = nextLoginEmail
      password = nextPassword
    }

    if (allErrors.length > 0) {
      return res.status(400).json({ message: allErrors.join('; ') })
    }

    let department = null
    let loginRole = 'employee'
    if (!isAdminAccount) {
      department = await findDepartmentById(employee.departmentId)
      if (!department) {
        return res.status(400).json({ message: 'Department not found' })
      }
      loginRole = loginRoleForEmployee({
        departmentName: department.name,
        employeeId: req.params.id,
        headEmployeeId: department.headEmployeeId,
      })
    }

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

      // Pass login email so credential updates target the matching users row.
      // updateEmployeeUserCredentials will not reassign an email already owned
      // by another login for this employee (avoids false unique violations).
      if (manageLogin && loginEmail) {
        credentialUpdate.email = loginEmail
      }

      if (manageLogin && password) {
        credentialUpdate.passwordHash = await hashPassword(password)
      }

      await updateEmployeeUserCredentials(updated.id, credentialUpdate)
    } else if (manageLogin && loginEmail && password) {
      if (isAdminAccount) {
        await createAdminUser({
          email: loginEmail,
          name: employee.name,
          employeeId: updated.id,
          passwordHash: await hashPassword(password),
        })
      } else {
        await createEmployeeUser({
          email: loginEmail,
          name: employee.name,
          employeeId: updated.id,
          passwordHash: await hashPassword(password),
          role: loginRole,
        })
      }
    } else if (manageLogin && (loginEmail || password)) {
      return res.status(400).json({
        message:
          'Gmail and password are both required to create an employee login',
      })
    }

    if (!isAdminAccount && department) {
      await syncDepartmentEmployeeLoginRoles(department)
      if (
        previous.departmentId &&
        previous.departmentId !== department.id
      ) {
        const previousDept = await findDepartmentById(previous.departmentId)
        if (previousDept) {
          await syncDepartmentEmployeeLoginRoles(previousDept)
        }
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

    const audience = await buildEmployeeAudienceMeta(updated, {
      previousDepartmentId: previous.departmentId,
    })
    await createRecentActivity({
      title: 'Employee Profile Updated',
      description,
      category: 'Employees',
      status: 'Updated',
      eventType: 'employee.updated',
      subjectEmployeeId: updated.id,
      actorEmployeeId: req.user?.employeeId || null,
      meta: {
        subjectName: updated.name,
        departmentName: updated.department,
        designation: updated.designation,
        departmentId: audience.departmentId,
        departmentIds: audience.departmentIds,
        employeeIds: audience.employeeIds,
        actorName: req.user?.name || null,
        actorRole: req.user?.role || null,
      },
    })

    const loginUser = manageLogin
      ? await findUserByEmployeeId(updated.id)
      : null

    res.json({
      employee: signEmployeeAvatar(
        withLoginInfo(updated, loginUser, manageLogin),
      ),
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
      if (req.user?.role !== 'admin') {
        return res.status(403).json({
          message:
            'Admin is a system manager and cannot be deleted from Employees',
        })
      }

      const linked = await findUsersByEmployeeId(existing.id)
      const adminUser = linked.find((user) => user.role === 'admin')
      if (!adminUser) {
        return res.status(404).json({ message: 'Admin account not found' })
      }

      if (req.user?.id && Number(req.user.id) === Number(adminUser.id)) {
        return res.status(400).json({
          message: 'You cannot remove your own admin account',
        })
      }

      const adminCount = await countAdminUsers()
      if (adminCount <= 1) {
        return res.status(400).json({
          message: 'At least one admin account must remain',
        })
      }

      // Log before delete — subject_employee_id FK cannot reference a removed employee,
      // and deleteAdminUser may also remove the admin-only employee profile.
      const actorLabel = formatActorLabel(actorFromUser(req.user))
      const adminAudience = await buildEmployeeAudienceMeta(existing)
      await createRecentActivity({
        title: 'Admin Removed',
        description: `${existing.name}'s admin access was removed by ${actorLabel}.`,
        category: 'Employees',
        status: 'Removed',
        eventType: 'admin.removed',
        subjectEmployeeId: existing.id,
        actorEmployeeId: req.user?.employeeId || null,
        meta: {
          subjectName: existing.name,
          departmentId: adminAudience.departmentId,
          departmentIds: adminAudience.departmentIds,
          employeeIds: adminAudience.employeeIds,
          actorName: req.user?.name || null,
          actorRole: req.user?.role || null,
        },
      })

      const result = await deleteAdminUser(adminUser.id, {
        actorUserId: req.user?.id,
      })
      if (!result.ok) {
        return res.status(400).json({ message: 'Unable to remove admin' })
      }

      return res.json({ message: 'Admin removed' })
    }

    // Log before delete — subject_employee_id FK cannot reference a removed employee.
    const actorLabel = formatActorLabel(actorFromUser(req.user))
    const removedAudience = await buildEmployeeAudienceMeta(existing)
    await createRecentActivity({
      title: 'Employee Removed',
      description: `${existing.name} was removed from the employee directory by ${actorLabel}.`,
      category: 'Employees',
      status: 'Removed',
      eventType: 'employee.removed',
      subjectEmployeeId: existing.id,
      actorEmployeeId: req.user?.employeeId || null,
      meta: {
        subjectName: existing.name,
        departmentName: existing.department,
        departmentId: removedAudience.departmentId,
        departmentIds: removedAudience.departmentIds,
        employeeIds: removedAudience.employeeIds,
        actorName: req.user?.name || null,
        actorRole: req.user?.role || null,
      },
    })

    const deleted = await deleteEmployeeById(req.params.id)
    if (!deleted) {
      return res.status(404).json({ message: 'Employee not found' })
    }

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

    const audienceEmployeeIds = await expandEmployeeIdsWithDepartmentHeads(
      result.employeeIds,
    )
    await createRecentActivity({
      title: 'Leave Balances Updated',
      description: `${actorLabel} ${modeLabel} leave balances for ${scopeLabel} (casual ${casualLeaveBalance}, sick ${sickLeaveBalance}).`,
      category: 'Employees',
      status: 'Updated',
      eventType: 'employee.leave_balances',
      subjectEmployeeId: null,
      actorEmployeeId: req.user?.employeeId || null,
      meta: {
        scope,
        mode,
        casualLeaveBalance,
        sickLeaveBalance,
        departmentId,
        departmentIds: departmentId ? [departmentId] : [],
        updatedCount: result.updatedCount,
        employeeIds: audienceEmployeeIds,
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
