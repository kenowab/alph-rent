import PropTypes from 'prop-types'

const APPROVAL_STYLES = {
  pending: 'bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-200',
  approved: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300',
  rejected: 'bg-red-100 text-red-700 dark:bg-red-900/60 dark:text-red-300',
}

const REQUEST_STYLES = {
  pending: 'bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-200',
  approved: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300',
  rejected: 'bg-red-100 text-red-700 dark:bg-red-900/60 dark:text-red-300',
  cancelled: 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300',
  contacted: 'bg-sky-100 text-sky-700 dark:bg-sky-900/60 dark:text-sky-300',
}

const USER_STATUS_STYLES = {
  active: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300',
  deactivated: 'bg-red-100 text-red-700 dark:bg-red-900/60 dark:text-red-300',
}

const ROLE_STYLES = {
  admin: 'bg-violet-100 text-violet-700 dark:bg-violet-900/60 dark:text-violet-300',
  owner: 'bg-sky-100 text-sky-700 dark:bg-sky-900/60 dark:text-sky-300',
  tenant: 'bg-primary-100 text-primary-700 dark:bg-primary-900/60 dark:text-primary-300',
}

export default function StatusBadge({ kind = 'approval', value, label, style }) {
  const text = label || (value || '—')
  const resolved =
    style ||
    (kind === 'approval'
      ? APPROVAL_STYLES[value]
      : kind === 'request'
        ? REQUEST_STYLES[value]
        : kind === 'user-status'
          ? USER_STATUS_STYLES[value]
          : kind === 'role'
            ? ROLE_STYLES[value]
            : '')
  return (
    <span className={`badge font-semibold capitalize ${resolved || 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'}`}>
      {text}
    </span>
  )
}

StatusBadge.propTypes = {
  kind: PropTypes.oneOf(['approval', 'request', 'user-status', 'role']),
  value: PropTypes.string,
  label: PropTypes.string,
  style: PropTypes.string,
}
