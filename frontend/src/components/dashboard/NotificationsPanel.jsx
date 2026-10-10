import { useState } from 'react'
import Icon from '../ui/Icon'
import { Link } from 'react-router-dom'
import { useNotifications } from '../../context/NotificationContext'

const TYPE_META = {
  message: { icon: 'message', className: 'bg-primary-50 text-primary-600 dark:bg-primary-900/40' },
  request: { icon: 'edit', className: 'bg-violet-50 text-violet-600 dark:bg-violet-900/40' },
  viewing: { icon: 'calendar', className: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/40' },
  agreement: { icon: 'file-text', className: 'bg-amber-50 text-amber-600 dark:bg-amber-900/40' },
  property: { icon: 'building', className: 'bg-sky-50 text-sky-600 dark:bg-sky-900/40' },
}

function timeLabel(date) {
  if (!date) return ''
  const d = new Date(date)
  const now = Date.now()
  const diff = now - d.getTime()
  if (diff < 60000) return 'Just now'
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`
  return d.toLocaleDateString()
}

export default function NotificationsPanel() {
  const { notifications, unreadCount, markAllRead, removeNotification } = useNotifications()
  const [clearing, setClearing] = useState(false)

  const handleMarkAll = async () => {
    setClearing(true)
    await markAllRead()
    setClearing(false)
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card dark:border-slate-700 dark:bg-slate-900">
      <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 dark:border-slate-800">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white">Notifications</h3>
        {unreadCount > 0 && (
          <button
            type="button"
            onClick={handleMarkAll}
            disabled={clearing}
            className="text-xs font-semibold text-primary-600 transition hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
          >
            {clearing ? 'Marking...' : 'Mark all as read'}
          </button>
        )}
      </div>

      <ul className="max-h-[520px] divide-y divide-slate-100 overflow-y-auto dark:divide-slate-800">
        {notifications.length === 0 && (
          <li className="flex flex-col items-center gap-2 px-4 py-12 text-center text-slate-400 dark:text-slate-500">
            <span className="grid h-12 w-12 place-items-center rounded-full bg-slate-100 dark:bg-slate-800">
              <Icon name="bell" size={22} />
            </span>
            <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">No notifications yet</p>
            <p className="text-xs">Activity on your applications and properties will show up here.</p>
          </li>
        )}
        {notifications.map((n) => {
          const meta = TYPE_META[n.type] || TYPE_META.message
          return (
            <li
              key={n.id}
              className={`flex items-start gap-3 px-5 py-4 transition hover:bg-slate-50 dark:hover:bg-slate-800 ${n.read ? '' : 'bg-primary-50/60 dark:bg-primary-900/10'}`}
            >
              <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-full ${meta.className}`}>
                <Icon name={meta.icon} size={18} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-slate-900 dark:text-white">
                  {n.title}
                  {!n.read && <span className="ml-2 inline-block h-2 w-2 rounded-full bg-primary-600 align-middle" />}
                </p>
                <p className="mt-0.5 text-sm text-slate-600 dark:text-slate-300">{n.body}</p>
                <p className="mt-1 text-[11px] text-slate-400 dark:text-slate-500">
                  {timeLabel(n.createdAt)}
                  {n.propertyId && (
                    <>
                      {' • '}
                      <Link to={`/properties/${n.propertyId}`} className="font-semibold text-primary-600 hover:underline dark:text-primary-400">
                        View property
                      </Link>
                    </>
                  )}
                </p>
              </div>
              <button
                type="button"
                onClick={() => removeNotification(n.id)}
                className="rounded-lg p-1.5 text-slate-300 transition hover:bg-slate-100 hover:text-slate-500 dark:text-slate-600 dark:hover:bg-slate-700 dark:hover:text-slate-300"
                aria-label="Dismiss notification"
              >
                <Icon name="x" size={15} />
              </button>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
