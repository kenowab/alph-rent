import { Router } from 'express'
import {
  getMessages,
  getConversations,
  getConversationMessages,
  createMessage,
  markConversationRead,
} from '../controllers/messageController.js'
import { protect } from '../middleware/auth.js'
import { validateBody } from '../middleware/validate.js'

const router = Router()

router.get('/', protect, getMessages)
router.get('/conversations', protect, getConversations)
router.get('/conversations/:propertyId/:otherId', protect, getConversationMessages)

router.put(
  '/read',
  protect,
  validateBody({
    otherId: { required: true, type: 'string' },
  }),
  markConversationRead,
)

router.post(
  '/',
  protect,
  validateBody({
    recipientId: { required: true, type: 'string' },
    content: { required: true, type: 'string', min: 1, max: 2000 },
  }),
  createMessage,
)

export default router
