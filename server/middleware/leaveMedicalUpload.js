import path from 'path'
import multer from 'multer'
import { UPLOADS_DIR } from '../config/uploads.js'

const ALLOWED_EXT = new Set(['.jpg', '.jpeg', '.png', '.gif', '.webp', '.pdf'])
const ALLOWED_MIME = new Set([
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'application/pdf',
])

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, UPLOADS_DIR)
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || '.pdf'
    const safeExt = ALLOWED_EXT.has(ext) ? ext : '.pdf'
    cb(
      null,
      `medical-${Date.now()}-${Math.round(Math.random() * 1e6)}${safeExt}`,
    )
  },
})

function fileFilter(_req, file, cb) {
  if (!ALLOWED_MIME.has(file.mimetype)) {
    cb(new Error('Only PDF or image files are allowed'))
    return
  }
  cb(null, true)
}

export const leaveMedicalUpload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
})
