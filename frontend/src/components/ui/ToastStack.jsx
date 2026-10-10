import PropTypes from 'prop-types'
import Icon from './Icon'

const STYLES = {
  success: {
    wrapper: 'bg-emerald-50 border-emerald-200 dark:bg-emerald-950/80 dark:border-emerald-900',
    icon: 'text-emerald-500',
    iconName: 'check-circle',
  },
  error: {
    wrapper: 'bg-red-50 border-red-200 dark:bg-red-950/80 dark:border-red-900',
    icon: 'text-red-500',
    iconName: 'x-circle',
  },
  info: {
    wrapper: 'bg-primary-50 border-primary-200 dark:bg-slate-800 dark:border-slate-700',
    icon: 'text-primary-600',
    iconName: 'info',
  },
}

export default function ToastStack({ toasts, onRemove }) {
  if (toasts.length === 0) return null
  return (
    <div className="pointer-events-none fixed inset-x-0 top-4 z-[100] flex flex-col items-center gap-2 px-4 sm:items-end sm:px-6">
      {toasts.map((toast) => {
        const style = STYLES[toast.type] || STYLES.info
        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex w-full max-w-sm items-center gap-3 rounded-xl border px-4 py-3 shadow-card animate-fade-in-up ${style.wrapper}`}
            role="alert"
          >
            <Icon name={style.iconName} size={20} className={`shrink-0 ${style.icon}`} />
            <p className="flex-1 text-sm font-medium text-slate-800 dark:text-slate-200">{toast.message}</p>
            <button
              type="button"
              onClick={() => onRemove(toast.id)}
              className="rounded-lg p-1 text-slate-400 transition hover:bg-white/60 hover:text-slate-600 dark:text-slate-500 dark:hover:bg-white/10 dark:hover:text-slate-300"
              aria-label="Dismiss notification"
            >
              <Icon name="x" size={16} />
            </button>
          </div>
        )
      })}
    </div>
  )
}

ToastStack.propTypes = {
  toasts: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.number.isRequired,
      message: PropTypes.string.isRequired,
      type: PropTypes.oneOf(['success', 'error', 'info']),
    }),
  ).isRequired,
  onRemove: PropTypes.func.isRequired,
}
