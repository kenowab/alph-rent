import { Router } from 'express'
import {
  getProperties,
  getProperty,
  getMyProperties,
  createProperty,
  updateProperty,
  deleteProperty,
  getSearchSuggestions,
} from '../controllers/propertyController.js'
import { protect, authorize } from '../middleware/auth.js'
import { validateBody } from '../middleware/validate.js'
import { uploadImages } from '../middleware/upload.js'

const router = Router()

const createSchema = {
  title: { required: true, type: 'string', min: 5 },
  description: { required: true, type: 'string', min: 20 },
  category: { required: true, enum: ['house', 'apartment', 'villa', 'office', 'land', 'studio', 'shop', 'warehouse', 'room', 'commercial'] },
  city: { required: true, type: 'string' },
  subArea: { required: true, type: 'string' },
  address: { required: true, type: 'string' },
  price: { required: true, type: 'number', min: 0 },
}

router.get('/', getProperties)
router.get('/mine', protect, authorize('owner', 'admin'), getMyProperties)
router.get('/suggestions', getSearchSuggestions)
router.get('/:id', getProperty)

router.post(
  '/',
  protect,
  authorize('owner', 'admin'),
  uploadImages,
  validateBody(createSchema),
  createProperty,
)

router.put('/:id', protect, uploadImages, updateProperty)
router.delete('/:id', protect, deleteProperty)

export default router
