import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import Logo from '../ui/Logo'
import Icon from '../ui/Icon'
import Avatar from '../ui/Avatar'
import { useAuth } from '../../context/AuthContext'
import { useFavorites } from '../../context/FavoritesContext'
import { useTheme } from '../../context/ThemeContext'
import { useLanguage } from '../../context/LanguageContext'
import { useNotifications } from '../../context/NotificationContext'
import { useRent } from '../../context/RentContext'
import { CATEGORIES } from '../../data/meta'

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuth()
  const { favorites } = useFavorites()
  const { theme, toggleTheme } = useTheme()
  const { t, language, setLanguage, languages } = useLanguage()
  const { period, setPeriod } = useRent()
  const { notifications, unreadCount, markAllRead } = useNotifications()
  const navigate = useNavigate()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [langMenuOpen, setLangMenuOpen] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const langRef = useRef(null)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    const onClickOutside = (e) => {
      if (langRef.current && !langRef.current.contains(e.target)) setLangMenuOpen(false)
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  const handleLogout = () => {
    logout()
    setUserMenuOpen(false)
    navigate('/')
  }

  const dashboardPath =
    user?.role === 'admin' ? '/admin/dashboard' : user?.role === 'owner' ? '/dashboard/owner' : '/dashboard/tenant'
  const settingsPath = user?.role === 'admin' ? '/admin/settings' : dashboardPath

  const linkClass = ({ isActive }) =>
    `rounded-lg px-3 py-2 text-sm font-semibold transition ${
      isActive
        ? 'text-primary-700 dark:text-primary-400'
        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white'
    }`

  const iconButtonClass =
    'relative grid h-10 w-10 place-items-center rounded-xl text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white'

  const dropdownPanelClass =
    'absolute right-0 top-full z-50 mt-2 w-64 rounded-xl border border-slate-200 bg-white p-2 shadow-card-hover animate-fade-in dark:border-slate-700 dark:bg-slate-900'

  return (
    <header
      className={`sticky top-0 z-50 border-b transition-all duration-300 ${
        scrolled
          ? 'border-slate-200 bg-white/95 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-900/95'
          : 'border-transparent bg-white dark:bg-slate-900'
      }`}
    >
      <div className="container-page flex h-16 items-center justify-between gap-3">
        <div className="flex items-center gap-5">
          <Logo />
          <nav className="hidden items-center gap-1 md:flex">
            <NavLink to="/" className={linkClass} end>
              {t('home')}
            </NavLink>
            <NavLink to="/properties" className={linkClass}>
              {t('properties')}
            </NavLink>
            <div className="group relative">
              <button
                type="button"
                className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
              >
                {t('categories')}
                <Icon name="chevronDown" size={14} />
              </button>
              <div className="invisible absolute left-0 top-full w-56 rounded-xl border border-slate-200 bg-white p-1.5 opacity-0 shadow-card-hover transition-all group-hover:visible group-hover:opacity-100 dark:border-slate-700 dark:bg-slate-900">
                {CATEGORIES.map((cat) => (
                  <Link
                    key={cat.id}
                    to={`/properties?category=${cat.id}`}
                    className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-slate-600 transition hover:bg-primary-50 hover:text-primary-700 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-primary-400"
                  >
                    <Icon name={cat.icon} size={16} className="text-slate-400" />
                    {t(`cat_${cat.id}`)}
                  </Link>
                ))}
              </div>
            </div>
          </nav>
        </div>

        <div className="flex items-center gap-1.5">
          <Link
            to="/properties"
            className={iconButtonClass}
            aria-label={t('search')}
            title={t('search')}
          >
            <Icon name="search" size={20} />
          </Link>

          <Link
            to="/properties?favorites=1"
            className={iconButtonClass}
            aria-label={t('favorites')}
            title={t('favorites')}
          >
            <Icon name={favorites.length ? 'heart-solid' : 'heart'} size={20} />
            {favorites.length > 0 && (
              <span className="absolute -right-0.5 -top-0.5 grid h-4.5 min-w-[18px] place-items-center rounded-full bg-primary-600 px-1 text-[10px] font-bold text-white">
                {favorites.length}
              </span>
            )}
          </Link>

          <div className="relative">
            <button
              type="button"
              onClick={() => setNotifOpen((o) => !o)}
              className={iconButtonClass}
              aria-label={t('notifications')}
              title={t('notifications')}
            >
              <Icon name="bell" size={20} />
              {isAuthenticated && unreadCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 grid h-4.5 min-w-[18px] place-items-center rounded-full bg-primary-600 px-1 text-[10px] font-bold text-white">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>
            {notifOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setNotifOpen(false)} />
                <div className={dropdownPanelClass}>
                  <div className="flex items-center justify-between px-3 py-2">
                    <p className="text-sm font-bold text-slate-900 dark:text-white">
                      {t('notifications')}
                    </p>
                    {unreadCount > 0 && (
                      <button
                        type="button"
                        onClick={markAllRead}
                        className="text-xs font-semibold text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
                      >
                        Mark all read
                      </button>
                    )}
                  </div>
                  {!isAuthenticated ? (
                    <div className="flex flex-col items-center gap-2 px-4 py-8 text-center">
                      <span className="grid h-12 w-12 place-items-center rounded-full bg-slate-100 text-slate-400 dark:bg-slate-800">
                        <Icon name="bell" size={22} />
                      </span>
                      <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                        {t('noNotifications')}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {t('noNotificationsDesc')}
                      </p>
                    </div>
                  ) : notifications.length === 0 ? (
                    <div className="flex flex-col items-center gap-2 px-4 py-8 text-center">
                      <span className="grid h-12 w-12 place-items-center rounded-full bg-slate-100 text-slate-400 dark:bg-slate-800">
                        <Icon name="bell" size={22} />
                      </span>
                      <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                        {t('noNotifications')}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {t('noNotificationsDesc')}
                      </p>
                    </div>
                  ) : (
                    <>
                      <ul className="max-h-80 overflow-y-auto">
                        {notifications.slice(0, 8).map((n) => (
                          <li key={n.id}>
                            <Link
                              to={n.propertyId ? `/properties/${n.propertyId}` : dashboardPath}
                              onClick={() => setNotifOpen(false)}
                              className="flex items-start gap-2.5 rounded-lg px-3 py-2.5 transition hover:bg-slate-50 dark:hover:bg-slate-800"
                            >
                              <span
                                className={`mt-0.5 h-2 w-2 shrink-0 rounded-full ${
                                  n.read ? 'bg-slate-200 dark:bg-slate-700' : 'bg-primary-600'
                                }`}
                              />
                              <span className="min-w-0">
                                <span className="block truncate text-sm font-semibold text-slate-800 dark:text-slate-200">
                                  {n.title}
                                </span>
                                <span className="line-clamp-2 block text-xs text-slate-500 dark:text-slate-400">
                                  {n.body}
                                </span>
                              </span>
                            </Link>
                          </li>
                        ))}
                      </ul>
                      {isAuthenticated && (
                        <Link
                          to={dashboardPath}
                          onClick={() => setNotifOpen(false)}
                          className="block border-t border-slate-100 px-3 py-2 text-center text-xs font-bold text-primary-600 hover:text-primary-700 dark:border-slate-800 dark:text-primary-400 dark:hover:text-primary-300"
                        >
                          View all in dashboard
                        </Link>
                      )}
                    </>
                  )}
                </div>
              </>
            )}
          </div>

          <div className="relative" ref={langRef}>
            <button
              type="button"
              onClick={() => setLangMenuOpen((o) => !o)}
              className={iconButtonClass}
              aria-label={t('language')}
              title={t('language')}
            >
              <Icon name="globe" size={20} />
              <span className="absolute bottom-0.5 right-0.5 text-[9px] font-bold text-primary-600 dark:text-primary-400">
                {language.toUpperCase()}
              </span>
            </button>
            {langMenuOpen && (
              <div className={dropdownPanelClass}>
                <p className="px-3 py-2 text-sm font-bold text-slate-900 dark:text-white">
                  {t('language')}
                </p>
                <div className="space-y-0.5">
                  {languages.map((lang) => (
                    <button
                      key={lang.code}
                      type="button"
                      onClick={() => {
                        setLanguage(lang.code)
                        setLangMenuOpen(false)
                      }}
                      className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm transition ${
                        language === lang.code
                          ? 'bg-primary-50 font-bold text-primary-700 dark:bg-slate-800 dark:text-primary-400'
                          : 'text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
                      }`}
                    >
                      <span>{lang.name}</span>
                      {language === lang.code && <Icon name="check" size={16} />}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div
            className="flex items-center rounded-xl bg-slate-100 p-1 dark:bg-slate-800"
            title="Rent period"
          >
            {['monthly', 'yearly'].map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPeriod(p)}
                aria-label={p}
                className={`rounded-lg px-2 py-1 text-[11px] font-bold uppercase transition ${
                  period === p
                    ? 'bg-primary-600 text-white shadow-sm'
                    : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
                }`}
              >
                {p === 'monthly' ? 'mo' : 'yr'}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={toggleTheme}
            className={iconButtonClass}
            aria-label={t('theme')}
            title={t('theme')}
          >
            <Icon name={theme === 'dark' ? 'sun' : 'moon'} size={20} />
          </button>

          {isAuthenticated ? (
            <div className="flex items-center gap-2">
              <Link
                to={dashboardPath}
                className="hidden rounded-xl bg-primary-600 px-4 py-2 text-sm font-bold text-white shadow-sm transition hover:bg-primary-700 sm:inline-flex"
              >
                {t('dashboard')}
              </Link>
              {user?.role === 'owner' && (
                <Link
                  to="/dashboard/owner/add-property"
                  className="hidden items-center gap-1.5 rounded-xl bg-brand-400 px-4 py-2 text-sm font-bold text-slate-900 shadow-sm transition hover:bg-brand-300 sm:inline-flex"
                >
                  <Icon name="plus" size={16} />
                  {t('postProperty')}
                </Link>
              )}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setUserMenuOpen((o) => !o)}
                  className="flex items-center gap-2 rounded-full p-1 transition hover:bg-slate-100 dark:hover:bg-slate-800"
                  aria-label="Open user menu"
                >
                  <Avatar name={user.name} seed={user.avatarSeed} src={user.avatar} size={38} />
                </button>
                {userMenuOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setUserMenuOpen(false)} />
                    <div className={dropdownPanelClass}>
                      <div className="border-b border-slate-100 px-3 py-2.5 dark:border-slate-700">
                        <p className="truncate text-sm font-bold text-slate-900 dark:text-white">
                          {user.name}
                        </p>
                        <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                          {user.email}
                        </p>
                        <span className="mt-1.5 inline-block rounded-full bg-primary-50 px-2 py-0.5 text-[11px] font-semibold capitalize text-primary-700 dark:bg-slate-800 dark:text-primary-400">
                          {user.role} {t('account')}
                        </span>
                      </div>
                      <div className="pt-1.5">
                        <Link
                          to={dashboardPath}
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-slate-700 transition hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                        >
                          <Icon name="grid" size={16} /> {t('dashboard')}
                        </Link>
                        <Link
                          to={settingsPath}
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-slate-700 transition hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                        >
                          <Icon name="settings" size={16} /> {t('settings')}
                        </Link>
                        <button
                          type="button"
                          onClick={handleLogout}
                          className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-red-600 transition hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10"
                        >
                          <Icon name="logout" size={16} /> {t('logout')}
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          ) : (
            <div className="hidden items-center gap-2 sm:flex">
              <Link to="/login" className="btn-ghost">
                {t('login')}
              </Link>
              <Link to="/register/role" className="btn-primary">
                {t('register')}
              </Link>
            </div>
          )}

          <button
            type="button"
            className="rounded-lg p-2 text-slate-600 transition hover:bg-slate-100 md:hidden dark:text-slate-300 dark:hover:bg-slate-800"
            onClick={() => setMobileOpen((o) => !o)}
            aria-label="Toggle navigation menu"
          >
            <Icon name={mobileOpen ? 'close' : 'menu'} size={24} />
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="border-t border-slate-100 bg-white px-4 pb-4 pt-2 animate-fade-in md:hidden dark:border-slate-800 dark:bg-slate-900">
          <div className="space-y-1">
            <NavLink
              to="/"
              end
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) =>
                `block rounded-lg px-3 py-2.5 text-sm font-semibold ${
                  isActive
                    ? 'bg-primary-50 text-primary-700 dark:bg-slate-800 dark:text-primary-400'
                    : 'text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
                }`
              }
            >
              {t('home')}
            </NavLink>
            <NavLink
              to="/properties"
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) =>
                `block rounded-lg px-3 py-2.5 text-sm font-semibold ${
                  isActive
                    ? 'bg-primary-50 text-primary-700 dark:bg-slate-800 dark:text-primary-400'
                    : 'text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
                }`
              }
            >
              {t('properties')}
            </NavLink>
            <p className="px-3 pb-1 pt-3 text-xs font-bold uppercase tracking-wide text-slate-400 dark:text-slate-500">
              {t('categories')}
            </p>
            {CATEGORIES.map((cat) => (
              <Link
                key={cat.id}
                to={`/properties?category=${cat.id}`}
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-slate-700 transition hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                <Icon name={cat.icon} size={16} className="text-slate-400" />
                {t(`cat_${cat.id}`)}
              </Link>
            ))}
          </div>

          <div className="mt-4 border-t border-slate-100 pt-4 dark:border-slate-800">
            {isAuthenticated ? (
              <div className="space-y-2">
                <Link
                  to={dashboardPath}
                  onClick={() => setMobileOpen(false)}
                  className="btn-outline w-full"
                >
                  {t('dashboard')}
                </Link>
                {user.role === 'owner' && (
                  <Link
                    to="/dashboard/owner/add-property"
                    onClick={() => setMobileOpen(false)}
                    className="btn-accent w-full"
                  >
                    <Icon name="plus" size={16} /> {t('postProperty')}
                  </Link>
                )}
                <button type="button" onClick={handleLogout} className="btn-ghost w-full text-red-600">
                  {t('logout')}
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <Link to="/login" onClick={() => setMobileOpen(false)} className="btn-outline w-full">
                  {t('login')}
                </Link>
                <Link to="/register/role" onClick={() => setMobileOpen(false)} className="btn-primary w-full">
                  {t('register')}
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  )
}
