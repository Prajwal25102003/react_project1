import {
  countEmployeesInDepartment,
  createDepartment,
  deleteDepartmentById,
  findAllDepartments,
  findDepartmentById,
  generateNextDepartmentId,
  updateDepartment,
} from '../models/departmentsModel.js'
import { findEmployeeById } from '../models/employeesModel.js'
import { syncDepartmentEmployeeLoginRoles } from '../models/authModel.js'
import { createRecentActivity } from '../models/recentActivitiesModel.js'
import {
  actorFromUser,
  formatActorLabel,
} from '../utils/activityCopy.js'
import { formatDbError } from '../utils/formatDbError.js'
import { uniqueConstraintMessage } from '../utils/pgErrors.js'

function parseDepartmentPayload(body) {
  const errors = []

  const name = String(body?.name ?? '').trim()
  const headEmployeeIdRaw = body?.headEmployeeId
  const headEmployeeId =
    headEmployeeIdRaw === null ||
    headEmployeeIdRaw === undefined ||
    headEmployeeIdRaw === ''
      ? null
      : String(headEmployeeIdRaw).trim()

  if (!name) errors.push('Name is required')

  return {
    errors,
    department: {
      name,
      headEmployeeId,
      // DB column remains NOT NULL; description is no longer collected in the UI.
      description: '',
    },
  }
}

const DEPARTMENT_UNIQUE_MATCHERS = [
  {
    includes: 'departments_pkey',
    message: 'A department with this ID already exists',
  },
]

export async function getDepartments(_req, res) {
  try {
    const departments = await findAllDepartments()
    res.json({ departments })
  } catch (error) {
    res.status(500).json({ message: formatDbError(error) })
  }
}

export async function getDepartmentById(req, res) {
  try {
    const department = await findDepartmentById(req.params.id)
    if (!department) {
      return res.status(404).json({ message: 'Department not found' })
    }

    res.json({ department })
  } catch (error) {
    res.status(500).json({ message: formatDbError(error) })
  }
}

export async function createDepartmentHandler(req, res) {
  try {
    const { errors, department } = parseDepartmentPayload(req.body)
    if (errors.length > 0) {
      return res.status(400).json({ message: errors.join('; ') })
    }

    if (department.headEmployeeId) {
      const head = await findEmployeeById(department.headEmployeeId)
      if (!head) {
        return res.status(400).json({ message: 'Head employee not found' })
      }
      // New department has no members yet — head must be assigned on edit.
      return res.status(400).json({
        message:
          'Assign a department head after creating the department and adding employees to it',
      })
    }

    const id = await generateNextDepartmentId()
    const created = await createDepartment({ ...department, id, headEmployeeId: null })

    await syncDepartmentEmployeeLoginRoles(created)

    const actorLabel = formatActorLabel(actorFromUser(req.user))
    await createRecentActivity({
      title: `${created.name} Department Created`,
      description: `${actorLabel} added the ${created.name} department to the organization.`,
      category: 'Departments',
      status: 'Added',
      actorEmployeeId: req.user?.employeeId || null,
      meta: {
        departmentName: created.name,
        actorName: req.user?.name || null,
        actorRole: req.user?.role || null,
      },
    })

    res.status(201).json({ department: created })
  } catch (error) {
    const uniqueMessage = uniqueConstraintMessage(
      error,
      DEPARTMENT_UNIQUE_MATCHERS,
    )
    if (uniqueMessage) {
      return res.status(409).json({ message: uniqueMessage })
    }

    res.status(500).json({ message: formatDbError(error) })
  }
}

export async function updateDepartmentHandler(req, res) {
  try {
    const { errors, department } = parseDepartmentPayload(req.body)
    if (errors.length > 0) {
      return res.status(400).json({ message: errors.join('; ') })
    }

    if (department.headEmployeeId) {
      const head = await findEmployeeById(department.headEmployeeId)
      if (!head) {
        return res.status(400).json({ message: 'Head employee not found' })
      }
      if (String(head.departmentId || '') !== String(req.params.id)) {
        return res.status(400).json({
          message: 'Department head must be an employee in this department',
        })
      }
    }

    const existing = await findDepartmentById(req.params.id)
    if (!existing) {
      return res.status(404).json({ message: 'Department not found' })
    }

    const updated = await updateDepartment(req.params.id, department)
    if (!updated) {
      return res.status(404).json({ message: 'Department not found' })
    }

    await syncDepartmentEmployeeLoginRoles(updated)
    // If the head moved from another department, refresh that dept's roles too.
    if (
      existing.headEmployeeId &&
      existing.headEmployeeId !== updated.headEmployeeId
    ) {
      const previousHead = await findEmployeeById(existing.headEmployeeId)
      if (
        previousHead?.departmentId &&
        previousHead.departmentId !== updated.id
      ) {
        const previousDept = await findDepartmentById(previousHead.departmentId)
        if (previousDept) {
          await syncDepartmentEmployeeLoginRoles(previousDept)
        }
      }
    }

    const actorLabel = formatActorLabel(actorFromUser(req.user))
    let description = `${actorLabel} updated the ${updated.name} department.`
    if (
      String(existing.headEmployeeId || '') !==
      String(updated.headEmployeeId || '')
    ) {
      const fromHead = existing.head || 'Unassigned'
      const toHead = updated.head || 'Unassigned'
      description = `${actorLabel} updated the ${updated.name} department. Department Head changed from ${fromHead} to ${toHead}.`
    } else if (existing.name !== updated.name) {
      description = `${actorLabel} renamed the department from ${existing.name} to ${updated.name}.`
    }

    await createRecentActivity({
      title: `${updated.name} Department Updated`,
      description,
      category: 'Departments',
      status: 'Updated',
      actorEmployeeId: req.user?.employeeId || null,
      meta: {
        departmentName: updated.name,
        actorName: req.user?.name || null,
        actorRole: req.user?.role || null,
      },
    })

    res.json({ department: updated })
  } catch (error) {
    const uniqueMessage = uniqueConstraintMessage(
      error,
      DEPARTMENT_UNIQUE_MATCHERS,
    )
    if (uniqueMessage) {
      return res.status(409).json({ message: uniqueMessage })
    }

    res.status(500).json({ message: formatDbError(error) })
  }
}

export async function deleteDepartmentHandler(req, res) {
  try {
    const existing = await findDepartmentById(req.params.id)
    if (!existing) {
      return res.status(404).json({ message: 'Department not found' })
    }

    const employeeCount = await countEmployeesInDepartment(req.params.id)
    if (employeeCount > 0) {
      return res.status(400).json({
        message: `Cannot delete ${existing.name}: ${employeeCount} employee(s) are assigned to this department. Reassign or remove them first.`,
      })
    }

    const deleted = await deleteDepartmentById(req.params.id)
    if (!deleted) {
      return res.status(404).json({ message: 'Department not found' })
    }

    const actorLabel = formatActorLabel(actorFromUser(req.user))
    await createRecentActivity({
      title: `${existing.name} Department Removed`,
      description: `${actorLabel} removed the ${existing.name} department from the organization.`,
      category: 'Departments',
      status: 'Removed',
      actorEmployeeId: req.user?.employeeId || null,
      meta: {
        departmentName: existing.name,
        actorName: req.user?.name || null,
        actorRole: req.user?.role || null,
      },
    })

    res.json({ message: 'Department deleted' })
  } catch (error) {
    res.status(500).json({ message: formatDbError(error) })
  }
}
