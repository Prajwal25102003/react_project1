/**
 * Validate JSON body against a Zod schema.
 * On success, replaces req.body with the parsed value (unknown keys stripped).
 */
export function validateBody(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body ?? {})
    if (!result.success) {
      const errors = result.error.issues.map((issue) => {
        const path = issue.path.length ? `${issue.path.join('.')}: ` : ''
        return `${path}${issue.message}`
      })
      return res.status(400).json({
        message: errors[0] || 'Invalid request body',
        errors,
      })
    }
    req.body = result.data
    return next()
  }
}
