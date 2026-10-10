import { AppError } from '../utils/AppError.js'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/**
 * Lightweight body validation.
 * schema: { field: { required?, type, min?, max?, enum?, message? } }
 * Returns a middleware that throws AppError(400) with a readable message
 * describing the first invalid field.
 */
export function validateBody(schema) {
  return (req, res, next) => {
    try {
      for (const [field, rules] of Object.entries(schema)) {
        const value = req.body[field]

        if (rules.required && (value === undefined || value === null || value === '')) {
          throw new AppError(rules.message || `${field} is required`, 400)
        }
        if (value === undefined || value === null || value === '') continue

        const type = rules.type
        if (type === 'string') {
          if (typeof value !== 'string') throw new AppError(`${field} must be a string`, 400)
          if (rules.min && value.trim().length < rules.min)
            throw new AppError(rules.message || `${field} must be at least ${rules.min} characters`, 400)
          if (rules.max && value.trim().length > rules.max)
            throw new AppError(`${field} cannot exceed ${rules.max} characters`, 400)
        }
        if (type === 'number') {
          const num = Number(value)
          if (Number.isNaN(num)) throw new AppError(`${field} must be a number`, 400)
          if (rules.min !== undefined && num < rules.min)
            throw new AppError(`${field} must be at least ${rules.min}`, 400)
          req.body[field] = num
        }
        if (type === 'boolean') {
          if (typeof value !== 'boolean' && value !== 'true' && value !== 'false') {
            throw new AppError(`${field} must be a boolean`, 400)
          }
          req.body[field] = value === true || value === 'true'
        }
        if (rules.enum && !rules.enum.includes(value)) {
          throw new AppError(rules.message || `${field} must be one of: ${rules.enum.join(', ')}`, 400)
        }
        if (type === 'email') {
          if (!EMAIL_RE.test(value)) throw new AppError(rules.message || 'Please provide a valid email address', 400)
          req.body[field] = value.toLowerCase()
        }
      }
      next()
    } catch (err) {
      next(err)
    }
  }
}

export const isObjectId = (value) => /^[a-fA-F0-9]{24}$/.test(String(value))
