import { useState } from 'react'
import PropTypes from 'prop-types'
import Modal from '../ui/Modal'
import Icon from '../ui/Icon'
import { useToast } from '../../context/ToastContext'
import { useAuth } from '../../context/AuthContext'
import { sendViewingRequest } from '../../api/interactions'
import { formatPrice } from '../../utils/format'

const TIME_SLOTS = [
  '09:00 AM - 10:00 AM',
  '10:30 AM - 11:30 AM',
  '02:00 PM - 03:00 PM',
  '04:00 PM - 05:00 PM',
  '05:30 PM - 06:30 PM',
]

export default function ViewingModal({ open, onClose, property }) {
  const toast = useToast()
  const { user } = useAuth()
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    email: user?.email || '',
    requestedDate: '',
    requestedTime: TIME_SLOTS[0],
    message: '',
  })

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.name || !form.phone || !form.requestedDate || !form.requestedTime) {
      toast.error('Please fill in all required fields.')
      return
    }
    setSubmitting(true)
    try {
      await sendViewingRequest({
        propertyId: property.id,
        ...form,
      })
      toast.success('Viewing request submitted! The owner will review your requested date/time.')
      onClose()
    } catch (err) {
      toast.error(err.message || 'Could not send viewing request. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  // Minimum date selection should be tomorrow
  const tomorrowStr = new Date(Date.now() + 86400000).toISOString().split('T')[0]

  return (
    <Modal open={open} onClose={onClose} title="Request Property Viewing" size="md">
      <div className="mb-5 flex items-center gap-3 rounded-xl bg-primary-50 p-3 dark:bg-slate-800">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-white text-primary-600 shadow-sm dark:bg-slate-900">
          <Icon name="calendar" size={20} />
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-bold text-slate-900 dark:text-white">{property.title}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {property.subArea}, {property.city} • <span className="font-extrabold text-primary-700 dark:text-primary-400">{formatPrice(property.price)}/mo</span>
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="viewing-name">Full name *</label>
            <input
              id="viewing-name"
              className="input dark:bg-slate-800 dark:border-slate-700 dark:text-white"
              required
              value={form.name}
              onChange={set('name')}
              placeholder="Your full name"
            />
          </div>
          <div>
            <label className="label" htmlFor="viewing-phone">Phone number *</label>
            <input
              id="viewing-phone"
              className="input dark:bg-slate-800 dark:border-slate-700 dark:text-white"
              required
              value={form.phone}
              onChange={set('phone')}
              placeholder="+251 9..."
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="viewing-date">Preferred viewing date *</label>
            <input
              id="viewing-date"
              type="date"
              min={tomorrowStr}
              className="input dark:bg-slate-800 dark:border-slate-700 dark:text-white"
              required
              value={form.requestedDate}
              onChange={set('requestedDate')}
            />
          </div>
          <div>
            <label className="label" htmlFor="viewing-time">Preferred time slot *</label>
            <select
              id="viewing-time"
              className="input dark:bg-slate-800 dark:border-slate-700 dark:text-white"
              required
              value={form.requestedTime}
              onChange={set('requestedTime')}
            >
              {TIME_SLOTS.map((slot) => (
                <option key={slot} value={slot}>
                  {slot}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="label" htmlFor="viewing-message">Optional message for owner</label>
          <textarea
            id="viewing-message"
            className="input min-h-[80px] resize-y dark:bg-slate-800 dark:border-slate-700 dark:text-white"
            value={form.message}
            onChange={set('message')}
            placeholder="Any specific questions or details regarding your visit..."
          />
        </div>

        <div className="rounded-xl border border-primary-100 bg-primary-50 px-4 py-3 text-xs text-primary-900 dark:border-primary-900/50 dark:bg-primary-950/60 dark:text-primary-200">
          <p className="flex items-start gap-2">
            <Icon name="info" size={16} className="mt-0.5 shrink-0 text-primary-600" />
            The owner will be notified to confirm or reschedule your requested viewing date and time.
          </p>
        </div>

        <div className="flex gap-3 pt-2">
          <button type="button" onClick={onClose} className="btn-outline flex-1">
            Cancel
          </button>
          <button type="submit" disabled={submitting} className="btn-primary flex-1">
            {submitting ? 'Submitting...' : 'Confirm Request'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

ViewingModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  property: PropTypes.object.isRequired,
}
