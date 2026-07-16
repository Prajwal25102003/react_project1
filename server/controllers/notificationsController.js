import {
  findNotificationsForEmployee,
  findNotificationsForOrg,
} from '../models/notificationsModel.js'
import { formatDbError } from '../utils/formatDbError.js'
import { mapActivityRows } from '../utils/relativeTime.js'

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
      rows = await findNotificationsForEmployee(req.user.employeeId)
    } else if (role === 'hr' || role === 'admin') {
      rows = await findNotificationsForOrg()
    } else {
      return res.status(403).json({ message: 'Unauthorized' })
    }

    res.json({ notifications: mapActivityRows(rows) })
  } catch (error) {
    res.status(500).json({ message: formatDbError(error) })
  }
}
