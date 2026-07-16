import path from 'path'
import multer from 'multer'
import { UPLOADS_DIR } from '../config/uploads.js'

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, UPLOADS_DIR)
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || '.jpg'
    const safeExt = ['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(ext)
      ? ext
      : '.jpg'
    cb(null, `avatar-${Date.now()}-${Math.round(Math.random() * 1e6)}${safeExt}`)
  },
})

function fileFilter(_req, file, cb) {
  if (!file.mimetype.startsWith('image/')) {
    cb(new Error('Only image files are allowed'))
    return
  }
  cb(null, true)
}

export const avatarUpload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 2 * 1024 * 1024 },
})
