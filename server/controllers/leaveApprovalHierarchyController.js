import {
  findAllHierarchiesWithSteps,
  findHierarchyByCategory,
  HIERARCHY_CATEGORIES,
  APPROVER_ROLES,
  replaceHierarchySteps,
  CATEGORY_LABELS,
} from '../models/leaveApprovalHierarchyModel.js'
import { refreshPendingStepOneHierarchySnapshots } from '../models/leaveRequestsModel.js'
import { formatDbError } from '../utils/formatDbError.js'

function parseStepsPayload(body) {
  const errors = []
  const name = String(body?.name ?? '').trim()
  const rawSteps = Array.isArray(body?.steps) ? body.steps : null

  if (!rawSteps) {
    errors.push('steps array is required')
    return { errors, name, steps: [] }
  }

  if (rawSteps.length === 0) {
    errors.push('At least one approval step is required')
  }

  if (rawSteps.length > APPROVER_ROLES.length + 1) {
    // Team Lead + each role in APPROVER_ROLES (hr, admin)
    errors.push(
      `At most ${APPROVER_ROLES.length + 1} approval steps are allowed (one per approver type)`,
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

    const { errors, name, steps } = parseStepsPayload(req.body)
    if (errors.length > 0) {
      return res.status(400).json({ message: errors.join('; ') })
    }

    const hierarchy = await replaceHierarchySteps(category, {
      name: name || CATEGORY_LABELS[category],
      steps,
    })

    // New leave + Pending still on step 1 get the new chain.
    // Mid-flight (step 1 already approved) keeps its frozen snapshot.
    await refreshPendingStepOneHierarchySnapshots(hierarchy.id, hierarchy.steps)

    res.json({ hierarchy })
  } catch (error) {
    if (error.statusCode === 404) {
      return res.status(404).json({ message: error.message })
    }
    res.status(500).json({ message: formatDbError(error) })
  }
}
