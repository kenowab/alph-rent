import { Router } from 'express'
import {
  getMyNotifications,
  getUnreadCount,
  markNotificationsRead,
  deleteNotification,
} from '../controllers/notificationController.js'
import { protect } from '../middleware/auth.js'

const router = Router()

router.get('/', protect, getMyNotifications)
router.get('/unread-count', protect, getUnreadCount)
router.put('/read', protect, markNotificationsRead)
router.delete('/:id', protect, deleteNotification)

export default router
