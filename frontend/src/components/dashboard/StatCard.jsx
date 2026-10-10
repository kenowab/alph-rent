import Icon from '../ui/Icon'

const STYLES = {
  blue: 'from-primary-500 to-primary-700',
  green: 'from-emerald-500 to-teal-700',
  amber: 'from-brand-400 to-orange-600',
  violet: 'from-violet-500 to-purple-700',
}

export default function StatCard({ icon, label, value, trend, style = 'blue' }) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-card dark:border-slate-700 dark:bg-slate-900">
      <span className={`absolute -right-6 -top-6 h-20 w-20 rounded-full bg-gradient-to-br opacity-10 ${STYLES[style]}`} />
      <div className="flex items-center justify-between">
        <span className={`grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br text-white shadow-sm ${STYLES[style]}`}>
          <Icon name={icon} size={22} />
        </span>
        {trend && (
          <span className="badge bg-emerald-50 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300">
            <Icon name="trendingUp" size={13} />
            {trend}
          </span>
        )}
      </div>
      <p className="mt-4 text-2xl font-extrabold text-slate-900 dark:text-white">{value}</p>
      <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">{label}</p>
    </div>
  )
}
