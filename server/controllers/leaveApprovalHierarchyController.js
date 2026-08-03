import pool from '../config/db.js'
import {
  findAllHierarchiesWithSteps,
  findHierarchyByCategory,
  HIERARCHY_CATEGORIES,
  HIERARCHY_NAME_MAX_LENGTH,
  APPROVER_ROLES,
  replaceHierarchySteps,
  maxStepsForCategory,
  CATEGORY_LABELS,
} from '../models/leaveApprovalHierarchyModel.js'
import { refreshPendingStepOneHierarchySnapshots } from '../models/leaveRequestsModel.js'
import { formatDbError } from '../utils/formatDbError.js'

function parseStepsPayload(body, category = '') {
  const errors = []
  const name = String(body?.name ?? '').trim()
  const rawSteps = Array.isArray(body?.steps) ? body.steps : null

  if (!name) {
    errors.push('Name is required')
  } else if (name.length > HIERARCHY_NAME_MAX_LENGTH) {
    errors.push(`Name must be ${HIERARCHY_NAME_MAX_LENGTH} characters or fewer`)
  }

  if (!rawSteps) {
    errors.push('steps array is required')
    return { errors, name, steps: [] }
  }

  if (rawSteps.length === 0) {
    errors.push('At least one approval step is required')
  }

  const maxSteps = maxStepsForCategory(category)

  if (rawSteps.length > maxSteps) {
    errors.push(
      `At most ${maxSteps} approval steps are allowed (one per approver type)`,
    )
  }

  const steps = []
  const seen = new Set()
  const allowedKinds = ['department_head', 'role']

  rawSteps.forEach((item, index) => {
    const kind = String(item?.approverKind ?? '').trim()
    const role = String(item?.approverRole ?? '').trim().toLowerCase()
    const stepOrder = index + 1

    if (!allowedKinds.includes(kind)) {
      errors.push(
        `Step ${stepOrder}: approver kind must be department_head or role`,
      )
      return
    }

    let approverRole = null

    if (kind === 'role') {
      if (!APPROVER_ROLES.includes(role)) {
        errors.push(`Step ${stepOrder}: role must be hr or admin`)
        return
      }
      approverRole = role
    }

    // Same person / same role cannot approve their own leave category.
    // HR leave requester is the HR department head — Team Lead would be themselves.
    if (category === 'hr') {
      if (kind === 'role' && approverRole === 'hr') {
        errors.push(
          `Step ${stepOrder}: HR leave cannot use HR as an approver`,
        )
        return
      }
      if (kind === 'department_head') {
        errors.push(
          `Step ${stepOrder}: HR leave cannot use Team Lead (that is the HR head themselves)`,
        )
        return
      }
    }
    if (category === 'department_head' && kind === 'department_head') {
      errors.push(
        `Step ${stepOrder}: Team lead leave cannot use Team Lead as an approver`,
      )
      return
    }

    const signature =
      kind === 'department_head' ? 'department_head' : `role:${approverRole}`

    if (seen.has(signature)) {
      errors.push(
        `Step ${stepOrder}: each approver type can only appear once in the hierarchy`,
      )
    }
    seen.add(signature)

    steps.push({
      stepOrder,
      approverKind: kind,
      approverRole,
      approverEmployeeId: null,
    })
  })

  return { errors, name, steps }
}

export async function getLeaveApprovalHierarchies(_req, res) {
  try {
    const hierarchies = await findAllHierarchiesWithSteps()
    res.json({ hierarchies })
  } catch (error) {
    res.status(500).json({ message: formatDbError(error) })
  }
}

export async function getLeaveApprovalHierarchyByCategory(req, res) {
  try {
    const category = String(req.params.category || '').trim()
    if (!HIERARCHY_CATEGORIES.includes(category)) {
      return res.status(400).json({
        message: 'Category must be employee, department_head, or hr',
      })
    }

    const hierarchy = await findHierarchyByCategory(category)
    if (!hierarchy) {
      return res.status(404).json({ message: 'Hierarchy not found' })
    }

    res.json({ hierarchy })
  } catch (error) {
    res.status(500).json({ message: formatDbError(error) })
  }
}

export async function updateLeaveApprovalHierarchy(req, res) {
  try {
    const category = String(req.params.category || '').trim()
    if (!HIERARCHY_CATEGORIES.includes(category)) {
      return res.status(400).json({
        message: 'Category must be employee, department_head, or hr',
      })
    }

    const { errors, name, steps } = parseStepsPayload(req.body, category)
    if (errors.length > 0) {
      return res.status(400).json({ message: errors.join('; ') })
    }

    const client = await pool.connect()
    try {
      await client.query('BEGIN')

      const hierarchy = await replaceHierarchySteps(
        category,
        {
          name: name || CATEGORY_LABELS[category],
          steps,
        },
        client,
      )

      // New leave + Pending with no intermediate approvals get the new chain.
      // Mid-flight (a step already approved) keeps its frozen snapshot.
      await refreshPendingStepOneHierarchySnapshots(
        hierarchy.id,
        hierarchy.steps,
        client,
      )

      await client.query('COMMIT')
      res.json({ hierarchy })
    } catch (error) {
      try {
        await client.query('ROLLBACK')
      } catch {
        // Connection may already be aborted.
      }
      throw error
    } finally {
      client.release()
    }
  } catch (error) {
    if (error.statusCode === 404) {
      return res.status(404).json({ message: error.message })
    }
    res.status(500).json({ message: formatDbError(error) })
  }
}
