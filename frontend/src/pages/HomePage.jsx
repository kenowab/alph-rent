import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import SectionHeader from '../components/ui/SectionHeader'
import SearchBar from '../components/search/SearchBar'
import PropertyGrid from '../components/property/PropertyGrid'
import CategoryGrid from '../components/home/CategoryGrid'
import CityGrid from '../components/home/CityGrid'
import Icon from '../components/ui/Icon'
import { fetchProperties } from '../api/properties'
import { useLanguage } from '../context/LanguageContext'
import { placeholderSvgUrl } from '../utils/images'

const HERO_IMAGE_URL = '/images/properties/apartment-5.jpg'

export default function HomePage() {
  const { t } = useLanguage()
  const [featured, setFeatured] = useState([])
  const [latest, setLatest] = useState([])
  const [heroImage, setHeroImage] = useState(HERO_IMAGE_URL)

  useEffect(() => {
    let cancelled = false
    fetchProperties({ featured: 'true', limit: 3 })
      .then(({ data }) => {
        if (!cancelled) setFeatured(data)
      })
      .catch(() => {})
    fetchProperties({ limit: 6 })
      .then(({ data }) => {
        if (!cancelled) setLatest(data)
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [])

  const stats = [
    { value: '3,452+', label: t('activeListings') },
    { value: '2,100+', label: t('happyTenants') },
    { value: '850+', label: t('propertyOwners') },
    { value: '25+', label: t('citiesAcross') },
  ]

  return (
    <div>
      <section className="relative overflow-hidden bg-gradient-to-br from-primary-800 via-primary-900 to-primary-950">
        <img
          src={heroImage}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
          onError={() =>
            setHeroImage(
              placeholderSvgUrl({ label: 'Alpha Rent Ethiopia', category: 'apartment', seed: 1 }),
            )
          }
        />
        <div className="absolute inset-0 bg-gradient-to-b from-primary-950/85 via-primary-900/75 to-primary-950/90" />
        <span className="pointer-events-none absolute -left-24 top-10 h-72 w-72 rounded-full bg-brand-400/20 blur-3xl" />
        <span className="pointer-events-none absolute -right-24 bottom-0 h-80 w-80 rounded-full bg-sky-400/20 blur-3xl" />

        <div className="container-page relative py-16 sm:py-20 lg:py-24">
          <div className="mx-auto max-w-3xl text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-xs font-semibold text-white backdrop-blur-sm">
              <Icon name="bolt" size={14} className="text-brand-400" />
              {t('heroBadge')}
            </span>
            <h1 className="mt-6 text-4xl font-extrabold leading-tight tracking-tight text-white sm:text-5xl lg:text-6xl">
              {t('heroTitleA')} <span className="text-brand-400">{t('heroTitleB')}</span>
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-base text-white/75 sm:text-lg">
              {t('heroSubtitle')}
            </p>

            <div className="mt-8">
              <SearchBar variant="hero" />
            </div>

            <div className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-white/80">
              <span className="inline-flex items-center gap-1.5">
                <Icon name="check-circle" size={16} className="text-brand-400" /> {t('verifiedListings')}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Icon name="shield-check" size={16} className="text-brand-400" /> {t('safeSecure')}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Icon name="users" size={16} className="text-brand-400" /> {t('directOwnerContact')}
              </span>
            </div>
          </div>

          <div className="mx-auto mt-14 grid max-w-4xl grid-cols-2 gap-4 lg:grid-cols-4">
            {stats.map((stat, i) => (
              <div
                key={stat.label}
                className="rounded-2xl border border-white/10 bg-white/5 px-4 py-5 text-center backdrop-blur-sm animate-fade-in-up"
                style={{ animationDelay: `${i * 80}ms` }}
              >
                <p className="text-2xl font-extrabold text-white">{stat.value}</p>
                <p className="mt-1 text-xs text-white/70">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="container-page py-14">
        <SectionHeader
          title={t('featuredProperties')}
          subtitle={t('featuredSubtitle')}
          linkTo="/properties"
          linkLabel={t('viewAll')}
        />
        <PropertyGrid properties={featured} columns={3} />
      </section>

      <section className="bg-slate-100/70 py-14 dark:bg-slate-900/50">
        <div className="container-page">
          <SectionHeader
            title={t('browseByCategory')}
            subtitle={t('browseByCategorySubtitle')}
            linkTo="/properties"
            linkLabel={t('browseEverything')}
          />
          <CategoryGrid />
        </div>
      </section>

      <section className="container-page py-14">
        <SectionHeader
          title={t('latestListings')}
          subtitle={t('latestListingsSubtitle')}
          linkTo="/properties"
          linkLabel={t('seeAllListings')}
        />
        <PropertyGrid properties={latest} columns={3} />
      </section>

      <section className="bg-slate-100/70 py-14 dark:bg-slate-900/50">
        <div className="container-page">
          <SectionHeader
            title={t('popularCities')}
            subtitle={t('popularCitiesSubtitle')}
            linkTo="/properties"
            linkLabel={t('allCities')}
          />
          <CityGrid />
        </div>
      </section>

      <section className="container-page py-14">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 to-primary-950 px-6 py-12 text-center shadow-card sm:px-12">
          <span className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-brand-400/20 blur-3xl" />
          <span className="pointer-events-none absolute -bottom-20 -left-16 h-56 w-56 rounded-full bg-primary-500/20 blur-3xl" />
          <div className="relative">
            <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-brand-400 text-slate-900">
              <Icon name="key" size={26} />
            </span>
            <h2 className="mx-auto mt-5 max-w-xl text-2xl font-extrabold text-white sm:text-3xl">
              {t('ownPropertyTitle')}
            </h2>
            <p className="mx-auto mt-3 max-w-lg text-sm text-white/70 sm:text-base">
              {t('ownPropertySubtitle')}
            </p>
            <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link to="/register/role" className="btn-accent w-full sm:w-auto">
                {t('listYourPropertyFree')}
              </Link>
              <Link
                to="/properties"
                className="btn w-full border border-white/25 bg-white/10 text-white hover:bg-white/20 sm:w-auto"
              >
                {t('browseListings')}
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
