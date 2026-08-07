import path from 'path'
import { formatDbError } from '../utils/formatDbError.js'
import { buildSignedUploadUrl } from '../utils/uploadAccessToken.js'
import {
  fileMatchesAllowedUploadMagic,
  removeUploadedFile,
} from '../utils/uploadFileMagic.js'
import { recordUploadFile } from '../models/uploadFilesModel.js'

export async function uploadAvatarHandler(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Please select an image file' })
    }

    if (
      !fileMatchesAllowedUploadMagic(req.file.path, { allowPdf: false })
    ) {
      removeUploadedFile(req.file.path)
      return res.status(400).json({ message: 'File content is not a valid image' })
    }

    const canonical = `/uploads/${req.file.filename}`
    try {
      await recordUploadFile({
        filename: req.file.filename,
        kind: 'avatar',
        uploadedByUserId: req.user?.id,
        employeeId: req.user?.employeeId || null,
        originalName: req.file.originalname || null,
      })
    } catch (error) {
      removeUploadedFile(req.file.path)
      throw error
    }

    res.status(201).json({
      url: buildSignedUploadUrl(canonical),
      path: canonical,
    })
  } catch (error) {
    res.status(500).json({ message: formatDbError(error) })
  }
}

export async function uploadLeaveMedicalHandler(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({
        message: 'Please select a medical document (PDF or image)',
      })
    }

    if (!fileMatchesAllowedUploadMagic(req.file.path, { allowPdf: true })) {
      removeUploadedFile(req.file.path)
      return res.status(400).json({
        message: 'File content is not a valid PDF or image',
      })
    }

    const canonical = `/uploads/${path.basename(req.file.filename)}`
    try {
      await recordUploadFile({
        filename: req.file.filename,
        kind: 'medical',
        uploadedByUserId: req.user?.id,
        employeeId: req.user?.employeeId || null,
        originalName: req.file.originalname || null,
      })
    } catch (error) {
      removeUploadedFile(req.file.path)
      throw error
    }

    res.status(201).json({
      url: buildSignedUploadUrl(canonical),
      path: canonical,
      originalName: req.file.originalname || null,
    })
  } catch (error) {
    res.status(500).json({ message: formatDbError(error) })
  }
}

export function uploadErrorHandler(error, _req, res, next) {
  if (!error) return next()

  if (error.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ message: 'File is too large' })
  }

  if (
    error.message === 'Only image files are allowed' ||
    error.message === 'Only PDF or image files are allowed'
  ) {
    return res.status(400).json({ message: error.message })
  }

  return res.status(400).json({ message: error.message || 'Upload failed' })
}
