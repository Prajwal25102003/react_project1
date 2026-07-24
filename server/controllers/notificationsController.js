import { isEmployeeDepartmentHead } from '../models/departmentsModel.js'
import {
  findNotificationsForAdmin,
  findNotificationsForEmployee,
  findNotificationsForOrg,
  findNotificationsForTeamLead,
} from '../models/notificationsModel.js'
import { formatDbError } from '../utils/formatDbError.js'
import { mapActivityRows } from '../utils/relativeTime.js'

function withAudience(rows, audience) {
  return (rows || []).map((row) => ({
    ...row,
    audience: row.audience || audience,
  }))
}

/**
 * Merge org + personal feeds for HR/Admin who also have an employee record.
 * Personal leave items keep audience "self" so sidebar badges stay module-correct.
 */
function mergeOrgAndPersonal(orgRows, personalRows) {
  const seen = new Set()
  const merged = []

  for (const row of withAudience(personalRows, 'self')) {
    const id = String(row.id)
    if (seen.has(id)) continue
    seen.add(id)
    merged.push(row)
  }

  for (const row of withAudience(orgRows, 'org')) {
    const id = String(row.id)
    if (seen.has(id)) continue
    seen.add(id)
    merged.push(row)
  }

  merged.sort((a, b) => {
    const ta = new Date(a.activityTime || 0).getTime()
    const tb = new Date(b.activityTime || 0).getTime()
    return tb - ta
  })

  return merged.slice(0, 15)
}

export async function getNotifications(req, res) {
  try {
    const role = req.user?.role
    let rows = []

    if (role === 'employee') {
      if (!req.user.employeeId) {
        return res.status(403).json({
          message: 'Your account is not linked to an employee record',
        })
      }

      const isTeamLead = await isEmployeeDepartmentHead(req.user.employeeId)
      rows = isTeamLead
        ? await findNotificationsForTeamLead(req.user.employeeId)
        : await findNotificationsForEmployee(req.user.employeeId)
    } else if (role === 'admin') {
      // Admin maintains modules + HR leave approvals only.
      rows = withAudience(await findNotificationsForAdmin(10), 'org')
    } else if (role === 'hr') {
      const orgRows = await findNotificationsForOrg(10)
      if (req.user.employeeId) {
        const personalRows = await findNotificationsForEmployee(
          req.user.employeeId,
          10,
        )
        rows = mergeOrgAndPersonal(orgRows, personalRows)
      } else {
        rows = withAudience(orgRows, 'org')
      }
    } else {
      return res.status(403).json({ message: 'Unauthorized' })
    }

    const viewer = {
      employeeId: req.user?.employeeId || null,
      role: req.user?.role || null,
      name: req.user?.name || null,
    }
    const notifications = mapActivityRows(rows, viewer)

    res.json({ notifications })
  } catch (error) {
    res.status(500).json({ message: formatDbError(error) })
  }
}
