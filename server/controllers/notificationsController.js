import { buildActivityFeedForViewer } from '../models/notificationsModel.js'
import { formatDbError } from '../utils/formatDbError.js'
import { mapActivityRowsAsync } from '../utils/relativeTime.js'

const NOTIFICATION_FEED_LIMIT = 25

export async function getNotifications(req, res) {
  try {
    const { rows, viewer } = await buildActivityFeedForViewer(req.user, {
      limit: NOTIFICATION_FEED_LIMIT,
    })
    const notifications = await mapActivityRowsAsync(rows, viewer)
    res.json({ notifications })
  } catch (error) {
    if (error.status === 403) {
      return res.status(403).json({ message: error.message })
    }
    res.status(500).json({ message: formatDbError(error) })
  }
}
