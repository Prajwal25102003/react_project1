import { formatDbError } from '../utils/formatDbError.js'

/** Final Express error handler for uncaught route/multer errors. */
export function globalErrorHandler(error, _req, res, _next) {
  if (res.headersSent) {
    return
  }

  const status = Number(error?.status || error?.statusCode) || 500
  const message =
    status >= 500
      ? formatDbError(error)
      : String(error?.message || 'Request failed')

  if (status >= 500) {
    console.error(error)
  }

  res.status(status).json({ message })
}
