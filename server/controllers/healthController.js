import { getDatabaseStatus } from '../models/healthModel.js'
import { formatDbError } from '../utils/formatDbError.js'

export async function getHealth(_req, res) {
  try {
    const status = await getDatabaseStatus()
    res.json({ status: 'ok', database: status })
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: formatDbError(error),
    })
  }
}
