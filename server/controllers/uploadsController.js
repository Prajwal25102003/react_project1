import { formatDbError } from '../utils/formatDbError.js'

export function uploadAvatarHandler(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Please select an image file' })
    }

    res.status(201).json({
      url: `/uploads/${req.file.filename}`,
    })
  } catch (error) {
    res.status(500).json({ message: formatDbError(error) })
  }
}

export function uploadErrorHandler(error, _req, res, next) {
  if (!error) return next()

  if (error.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ message: 'Image must be 2MB or smaller' })
  }

  if (error.message === 'Only image files are allowed') {
    return res.status(400).json({ message: error.message })
  }

  return res.status(400).json({ message: error.message || 'Upload failed' })
}
