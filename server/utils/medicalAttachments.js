const MEDICAL_ATTACHMENT_URL =
  /^\/uploads\/medical-[A-Za-z0-9._-]+$/

export const MAX_MEDICAL_ATTACHMENTS = 5

export function isMedicalAttachmentUrl(url) {
  return MEDICAL_ATTACHMENT_URL.test(String(url || '').trim())
}

/**
 * Normalize DB / API medical attachment values into [{ url, name }].
 * Supports legacy single URL strings and JSON arrays.
 */
export function parseMedicalAttachments(raw) {
  if (raw == null) return []

  if (Array.isArray(raw)) {
    return raw
      .map((item) => normalizeAttachmentItem(item))
      .filter(Boolean)
  }

  const text = String(raw).trim()
  if (!text) return []

  if (text.startsWith('[')) {
    try {
      const parsed = JSON.parse(text)
      if (Array.isArray(parsed)) {
        return parsed
          .map((item) => normalizeAttachmentItem(item))
          .filter(Boolean)
      }
    } catch {
      /* fall through to legacy single URL */
    }
  }

  if (isMedicalAttachmentUrl(text)) {
    return [{ url: text, name: '' }]
  }

  return []
}

function normalizeAttachmentItem(item) {
  if (typeof item === 'string') {
    const url = item.trim()
    return isMedicalAttachmentUrl(url) ? { url, name: '' } : null
  }
  if (item && typeof item === 'object') {
    const url = String(item.url || '').trim()
    if (!isMedicalAttachmentUrl(url)) return null
    return {
      url,
      name: String(item.name || item.originalName || '').trim(),
    }
  }
  return null
}

export function serializeMedicalAttachments(list) {
  const attachments = parseMedicalAttachments(list)
  if (!attachments.length) return null
  return JSON.stringify(
    attachments.map(({ url, name }) => ({
      url,
      name: name || '',
    })),
  )
}

export function validateMedicalAttachmentsInput(rawList) {
  const attachments = parseMedicalAttachments(rawList)
  if (!attachments.length) {
    return {
      ok: false,
      message: 'Medical leave requires at least one uploaded supporting document',
      attachments: [],
    }
  }
  if (attachments.length > MAX_MEDICAL_ATTACHMENTS) {
    return {
      ok: false,
      message: `You can upload up to ${MAX_MEDICAL_ATTACHMENTS} medical documents`,
      attachments: [],
    }
  }
  return { ok: true, message: '', attachments }
}
