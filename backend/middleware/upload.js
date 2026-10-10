import fs from 'fs'
import path from 'path'
import crypto from 'crypto'
import multer from 'multer'
import { AppError } from '../utils/AppError.js'

const uploadDir = path.resolve(process.cwd(), 'uploads')

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true })
}

const ALLOWED_MIME = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif'])

const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, uploadDir)
  },
  filename(req, file, cb) {
    const ext = path.extname(file.originalname).toLowerCase()
    const name = `${Date.now()}-${crypto.randomBytes(12).toString('hex')}${ext}`
    cb(null, name)
  },
})

function fileFilter(req, file, cb) {
  if (ALLOWED_MIME.has(file.mimetype)) {
    cb(null, true)
  } else {
    cb(new AppError('Only JPEG, PNG, WEBP and GIF images are allowed', 400))
  }
}

export const MAX_IMAGE_SIZE = 3 * 1024 * 1024 // 3MB
export const MAX_IMAGES = 8

/** Handles up to 8 images under the `images` field name. */
export const uploadImages = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_IMAGE_SIZE, files: MAX_IMAGES },
}).array('images', MAX_IMAGES)

/** Builds a public URL for an uploaded image using the current request host. */
export function imageUrl(req, filename) {
  return `${req.protocol}://${req.get('host')}/uploads/${filename}`
}
