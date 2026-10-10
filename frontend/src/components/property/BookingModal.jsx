import { useState } from 'react'
import PropTypes from 'prop-types'
import Modal from '../ui/Modal'
import Icon from '../ui/Icon'
import { useToast } from '../../context/ToastContext'
import { useAuth } from '../../context/AuthContext'
import { sendRentalRequest } from '../../api/interactions'
import { formatPrice } from '../../utils/format'

export default function BookingModal({ open, onClose, property, onSuccess }) {
  const toast = useToast()
  const { user } = useAuth()
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    email: user?.email || '',
    startDate: '',
    endDate: '',
    occupation: '',
    monthlyIncome: '',
    employmentStatus: 'Full-time',
    message: '',
  })

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.name.trim()) {
      toast.error('Please enter your full name.')
      return
    }
    if (form.startDate && form.endDate && form.endDate < form.startDate) {
      toast.error('The rent end date cannot be before the start date.')
      return
    }
    setSubmitting(true)
    try {
      await sendRentalRequest({
        propertyId: property.id,
        ...form,
      })
      toast.success('Rental request sent to Admin for approval.')
      onSuccess?.()
      onClose()
    } catch (err) {
      toast.error(err.message || 'Could not submit your application. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Submit Rental Application" size="md">
      <div className="mb-5 flex items-center gap-3 rounded-xl bg-primary-50 p-3 dark:bg-slate-800">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-white text-primary-600 shadow-sm dark:bg-slate-900">
          <Icon name="building" size={20} />
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-bold text-slate-900 dark:text-white">{property.title}</p>
          <p className="text-sm text-primary-700 dark:text-primary-400">
            <span className="font-extrabold">{formatPrice(property.price)}</span> / month
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="booking-name">Full name *</label>
            <input
              id="booking-name"
              className="input dark:bg-slate-800 dark:border-slate-700 dark:text-white dark:placeholder-slate-500"
              required
              value={form.name}
              onChange={set('name')}
              placeholder="Your full name"
            />
          </div>
          <div>
            <label className="label" htmlFor="booking-phone">Phone number *</label>
            <input
              id="booking-phone"
              className="input dark:bg-slate-800 dark:border-slate-700 dark:text-white dark:placeholder-slate-500"
              required
              value={form.phone}
              onChange={set('phone')}
              placeholder="+251 9..."
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="booking-email">Email</label>
            <input
              id="booking-email"
              type="email"
              className="input dark:bg-slate-800 dark:border-slate-700 dark:text-white dark:placeholder-slate-500"
              value={form.email}
              onChange={set('email')}
              placeholder="you@email.com"
            />
          </div>
          <div>
            <label className="label" htmlFor="booking-start">Rent start date</label>
            <input
              id="booking-start"
              type="date"
              className="input dark:bg-slate-800 dark:border-slate-700 dark:text-white dark:placeholder-slate-500"
              value={form.startDate}
              onChange={set('startDate')}
              placeholder="2026-09-01"
            />
          </div>
          <div>
            <label className="label" htmlFor="booking-end">Rent end date</label>
            <input
              id="booking-end"
              type="date"
              className="input dark:bg-slate-800 dark:border-slate-700 dark:text-white dark:placeholder-slate-500"
              value={form.endDate}
              onChange={set('endDate')}
              placeholder="2027-09-01"
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label className="label" htmlFor="booking-occupation">Occupation</label>
            <input
              id="booking-occupation"
              className="input dark:bg-slate-800 dark:border-slate-700 dark:text-white dark:placeholder-slate-500"
              value={form.occupation}
              onChange={set('occupation')}
              placeholder="e.g. Accountant"
            />
          </div>
          <div>
            <label className="label" htmlFor="booking-income">Est. Monthly Income</label>
            <input
              id="booking-income"
              className="input dark:bg-slate-800 dark:border-slate-700 dark:text-white dark:placeholder-slate-500"
              value={form.monthlyIncome}
              onChange={set('monthlyIncome')}
              placeholder="e.g. 35,000 ETB"
            />
          </div>
          <div>
            <label className="label" htmlFor="booking-emp-status">Employment Status</label>
            <select
              id="booking-emp-status"
              className="input dark:bg-slate-800 dark:border-slate-700 dark:text-white"
              value={form.employmentStatus}
              onChange={set('employmentStatus')}
            >
              <option value="Full-time">Full-time</option>
              <option value="Part-time">Part-time</option>
              <option value="Self-employed">Self-employed</option>
              <option value="Student">Student</option>
              <option value="Other">Other</option>
            </select>
          </div>
        </div>

        <div>
          <label className="label" htmlFor="booking-message">Message to the owner</label>
          <textarea
            id="booking-message"
            className="input min-h-[96px] resize-y dark:bg-slate-800 dark:border-slate-700 dark:text-white dark:placeholder-slate-500"
            value={form.message}
            onChange={set('message')}
            placeholder="Tell the owner about yourself, who will live with you, and any lease preferences..."
          />
        </div>

        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-800 dark:border-amber-900 dark:bg-amber-950/80 dark:text-amber-200">
          <p className="flex items-start gap-2">
            <Icon name="info" size={15} className="mt-0.5 shrink-0" />
            By submitting this application, your rental request is sent to the administrator for
            approval. Once approved, a formal rental agreement will be generated.
          </p>
        </div>

        <div className="flex gap-3 pt-1">
          <button type="button" onClick={onClose} className="btn-outline flex-1">
            Cancel
          </button>
          <button type="submit" disabled={submitting} className="btn-primary flex-1">
            {submitting ? 'Submitting...' : 'Submit Application'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

BookingModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  property: PropTypes.object.isRequired,
  onSuccess: PropTypes.func,
}
