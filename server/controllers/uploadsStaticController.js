import fs from 'fs'
import path from 'path'
import { resolveUploadFilePath } from '../middleware/uploadsAccessMiddleware.js'

const CONTENT_TYPES = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.pdf': 'application/pdf',
}

export function serveProtectedUploadHandler(req, res) {
  const filePath = resolveUploadFilePath(req.params.filename)
  if (!filePath) {
    return res.status(400).json({ message: 'Invalid file path' })
  }

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ message: 'File not found' })
  }

  const ext = path.extname(filePath).toLowerCase()
  const contentType = CONTENT_TYPES[ext] || 'application/octet-stream'
  res.setHeader('Content-Type', contentType)
  res.setHeader('Cache-Control', 'private, max-age=300')
  res.setHeader('X-Content-Type-Options', 'nosniff')

  return res.sendFile(filePath)
}
