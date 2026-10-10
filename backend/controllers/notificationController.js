import Notification from '../models/Notification.js'
import { asyncHandler } from '../utils/asyncHandler.js'

const POPULATE = [
  { path: 'property', select: 'title address city images' },
  { path: 'actor', select: 'name email' },
]

/**
 * GET /api/notifications
 * Requires: Bearer token
 * Returns: { data: [notification...], unread: n } — newest first.
 */
export const getMyNotifications = asyncHandler(async (req, res) => {
  const data = await Notification.find({ user: req.user.id })
    .populate(POPULATE)
    .sort({ createdAt: -1 })

  res.status(200).json({
    success: true,
    data,
    unread: data.reduce((n, notif) => n + (notif.read ? 0 : 1), 0),
  })
})

/**
 * GET /api/notifications/unread-count
 * Requires: Bearer token
 * Returns: { data: n }
 */
export const getUnreadCount = asyncHandler(async (req, res) => {
  const count = await Notification.countDocuments({ user: req.user.id, read: false })
  res.status(200).json({ success: true, data: count })
})

/**
 * PUT /api/notifications/read
 * Requires: Bearer token
 * Body: { all?: true } — marks every notification read, or just one via :id.
 * Returns: { data: { updated: n } }
 */
export const markNotificationsRead = asyncHandler(async (req, res) => {
  const result = await Notification.updateMany({ user: req.user.id, read: false }, { read: true })
  res.status(200).json({ success: true, data: { updated: result.modifiedCount } })
})

/**
 * DELETE /api/notifications/:id
 * Requires: Bearer token
 * Removes a single notification owned by the user.
 */
export const deleteNotification = asyncHandler(async (req, res) => {
  const { id } = req.params
  const result = await Notification.deleteOne({ _id: id, user: req.user.id })
  if (result.deletedCount === 0) {
    return res.status(200).json({ success: true, data: null })
  }
  res.status(200).json({ success: true, data: { id } })
})
