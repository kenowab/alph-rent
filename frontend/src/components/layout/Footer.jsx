import { Link } from 'react-router-dom'
import Logo from '../ui/Logo'
import Icon from '../ui/Icon'
import { CATEGORIES, CITIES } from '../../data/meta'
import { SOCIAL_LINKS } from '../../data/social'
import { useLanguage } from '../../context/LanguageContext'

export default function Footer() {
  const { t } = useLanguage()

  const quickLinks = [
    { to: '/properties', label: t('browseAllProperties') },
    { to: '/properties?category=house', label: t('rentAHouse') },
    { to: '/properties?category=apartment', label: t('apartments') },
    { to: '/properties?category=villa', label: t('villas') },
    { to: '/properties?category=office', label: t('officeSpaces') },
    { to: '/register/role', label: t('listYourProperty') },
  ]

  const aboutLinks = [
    { to: '/', label: t('aboutUs') },
    { to: '/', label: t('howItWorks') },
    { to: '/', label: t('safetyTips') },
    { to: '/', label: t('helpCentre') },
    { to: '/', label: t('termsConditions') },
    { to: '/', label: t('privacyPolicy') },
  ]

  return (
    <footer className="mt-16 border-t border-slate-800 bg-slate-900 text-slate-300">
      <div className="container-page grid gap-10 py-14 md:grid-cols-2 lg:grid-cols-4">
        <div>
          <Logo className="!text-white" />
          <p className="mt-4 text-sm leading-relaxed text-slate-400">
            Ethiopia&apos;s modern property rental marketplace. Find houses, apartments, villas,
            offices and land for rent — from Addis Ababa to every region.
          </p>
          <div className="mt-5 flex items-center gap-3">
            {SOCIAL_LINKS.map((social) => (
              <a
                key={social.id}
                href={social.url}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={social.name}
                className="grid h-9 w-9 place-items-center rounded-full bg-slate-800 text-slate-400 transition hover:bg-primary-600 hover:text-white"
              >
                <Icon name={social.icon} size={17} />
              </a>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-sm font-bold uppercase tracking-wider text-white">
            {t('categories')}
          </h3>
          <ul className="mt-4 space-y-2.5 text-sm">
            {CATEGORIES.map((cat) => (
              <li key={cat.id}>
                <Link
                  to={`/properties?category=${cat.id}`}
                  className="inline-flex items-center gap-2 text-slate-400 transition hover:text-brand-400"
                >
                  <Icon name={cat.icon} size={14} />
                  {t(`cat_${cat.id}`)}s {t('forRent')}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-bold uppercase tracking-wider text-white">
            {t('quickLinks')}
          </h3>
          <ul className="mt-4 space-y-2.5 text-sm">
            {quickLinks.map((link) => (
              <li key={link.label}>
                <Link to={link.to} className="text-slate-400 transition hover:text-brand-400">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
          <ul className="mt-4 space-y-2.5 text-sm">
            {aboutLinks.map((link) => (
              <li key={link.label}>
                <Link to={link.to} className="text-slate-400 transition hover:text-brand-400">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-bold uppercase tracking-wider text-white">
            {t('popularCitiesFooter')}
          </h3>
          <ul className="mt-4 space-y-2.5 text-sm">
            {CITIES.slice(0, 6).map((city) => (
              <li key={city.id}>
                <Link
                  to={`/properties?city=${city.id}`}
                  className="text-slate-400 transition hover:text-brand-400"
                >
                  {city.name}
                </Link>
              </li>
            ))}
          </ul>
          <div className="mt-6 rounded-xl border border-slate-800 bg-slate-800/50 p-4">
            <p className="flex items-center gap-2 text-sm font-semibold text-white">
              <Icon name="phone" size={16} className="text-brand-400" />
              +251 917 446 847
            </p>
            <p className="mt-1 text-xs text-slate-400">{t('supportAvailable')}</p>
          </div>
        </div>
      </div>

      <div className="border-t border-slate-800">
        <div className="container-page flex flex-col items-center justify-between gap-3 py-6 text-xs text-slate-500 sm:flex-row">
          <p>© {new Date().getFullYear()} Alpha Rental Platform. {t('rightsReserved')}</p>
          <p className="flex items-center gap-1.5">
            {t('madeWith')} <Icon name="heart-solid" size={12} className="text-red-500" />{' '}
            in Nekemte
          </p>
        </div>
      </div>
    </footer>
  )
}
