import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { fetchPropertyById, fetchProperties } from '../api/properties'
import PropertyImageGallery from '../components/property/PropertyImageGallery'
import PropertyCard from '../components/property/PropertyCard'
import FavoriteButton from '../components/property/FavoriteButton'
import BookingModal from '../components/property/BookingModal'
import ViewingModal from '../components/property/ViewingModal'
import ConversationModal from '../components/property/ConversationModal'
import Icon from '../components/ui/Icon'
import Avatar from '../components/ui/Avatar'
import Spinner from '../components/ui/Spinner'
import { useToast } from '../context/ToastContext'
import { useAuth } from '../context/AuthContext'
import { getCategoryLabel } from '../components/property/helpers'
import { formatPrice, formatRent, formatDate } from '../utils/format'
import { useRent } from '../context/RentContext'
import { useLanguage } from '../context/LanguageContext'
import { mapEmbedUrl, mapViewUrl, propertyCoords } from '../utils/images'

const FACTS = [
  { key: 'bedrooms', icon: 'bed', label: 'Bedrooms', value: (p) => (p.bedrooms > 0 ? `${p.bedrooms}` : 'N/A') },
  { key: 'bathrooms', icon: 'bath', label: 'Bathrooms', value: (p) => (p.bathrooms > 0 ? `${p.bathrooms}` : 'N/A') },
  { key: 'area', icon: 'ruler', label: 'Area', value: (p) => (p.area ? `${p.area} m²` : 'N/A') },
]

const AMENITIES = [
  { id: 'furnished', label: 'Furnished', icon: 'bed' },
  { id: 'parking', label: 'Parking', icon: 'truck' },
  { id: 'security', label: 'Security', icon: 'shield' },
  { id: 'waterTank', label: 'Water tank', icon: 'droplet' },
  { id: 'elevator', label: 'Elevator', icon: 'chevronUp' },
]

export default function PropertyDetailsPage() {
  const { id } = useParams()
  const toast = useToast()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { period, setPeriod } = useRent()
  const { t } = useLanguage()
  const [property, setProperty] = useState(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [similar, setSimilar] = useState([])
  const [bookingOpen, setBookingOpen] = useState(false)
  const [viewingOpen, setViewingOpen] = useState(false)
  const [contactOpen, setContactOpen] = useState(false)

  useEffect(() => {
    let cancelled = false
    fetchPropertyById(id)
      .then(({ data }) => {
        if (cancelled) return
        if (!data) {
          setNotFound(true)
          setLoading(false)
          return
        }
        setProperty(data)
        setLoading(false)
        return fetchProperties({ category: data.category, limit: 4 }).then(({ data: list }) => {
          if (!cancelled) setSimilar(list.filter((p) => p.id !== data.id).slice(0, 3))
        })
      })
      .catch(() => {
        if (!cancelled) {
          setNotFound(true)
          setLoading(false)
        }
      })

    const handleFocus = () => {
      fetchPropertyById(id)
        .then(({ data }) => {
          if (!cancelled && data) setProperty(data)
        })
        .catch((error) => {
          if (!cancelled) console.error('[WARN] Could not refresh property availability:', error)
        })
    }
    window.addEventListener('focus', handleFocus)

    return () => {
      cancelled = true
      window.removeEventListener('focus', handleFocus)
    }
  }, [id])

  if (loading) {
    return (
      <div className="container-page flex flex-col items-center justify-center gap-3 py-32 text-slate-400 dark:text-slate-500">
        <Spinner size={36} label="Loading property..." />
      </div>
    )
  }

  if (notFound || !property) {
    return (
      <div className="container-page py-24 text-center">
        <Icon name="alert-triangle" size={48} className="mx-auto text-amber-500" />
        <h1 className="mt-4 text-2xl font-extrabold text-slate-900 dark:text-white">Property not found</h1>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">This listing may have been removed or is no longer available.</p>
        <Link to="/properties" className="btn-primary mt-6">
          Browse all properties
        </Link>
      </div>
    )
  }

  const owner = property?.owner || {}
  const coords = property ? propertyCoords(property) : null

  const refreshAvailability = async () => {
    try {
      const { data } = await fetchPropertyById(id)
      if (data) setProperty(data)
      return data
    } catch {
      toast.error('Could not refresh property availability.')
      return null
    }
  }

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({ title: property.title, url: window.location.href })
      } else {
        await navigator.clipboard.writeText(window.location.href)
        toast.success('Link copied to clipboard')
      }
    } catch {
      toast.info('Could not share this listing')
    }
  }

  return (
    <div className="container-page py-8">
      <nav className="mb-6 flex flex-wrap items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400" aria-label="Breadcrumb">
        <Link to="/" className="transition hover:text-primary-600">Home</Link>
        <Icon name="chevronRight" size={14} />
        <Link to="/properties" className="transition hover:text-primary-600">Properties</Link>
        <Icon name="chevronRight" size={14} />
        <Link to={`/properties?category=${property.category}`} className="transition hover:text-primary-600">
          {getCategoryLabel(property.category)}s
        </Link>
        <Icon name="chevronRight" size={14} />
        <span className="line-clamp-1 max-w-[180px] font-medium text-slate-700 sm:max-w-xs dark:text-slate-200">{property.title}</span>
      </nav>

      <div className="mb-8 flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="badge bg-primary-50 text-primary-700">{getCategoryLabel(property.category)}</span>
            {property.featured && (
              <span className="badge bg-brand-50 text-brand-700">
                <Icon name="star-solid" size={12} /> Featured
              </span>
            )}
            {property.status === 'rented' ? (
              <span className="badge bg-slate-900 text-white font-extrabold uppercase dark:bg-slate-800">
                <Icon name="x-circle" size={12} /> RENTED
              </span>
            ) : property.status === 'pending' ? (
              <span className="badge bg-amber-500 text-white font-bold uppercase">
                <Icon name="clock" size={12} /> PENDING
              </span>
            ) : property.status === 'available' ? (
              <span className="badge bg-emerald-600 text-white font-bold uppercase">
                <Icon name="check-circle" size={12} /> AVAILABLE
              </span>
            ) : (
              <span className="badge bg-slate-100 text-slate-600 font-bold uppercase dark:bg-slate-800 dark:text-slate-300">
                <Icon name="x-circle" size={12} /> UNAVAILABLE
              </span>
            )}
          </div>
          <h1 className="mt-3 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl dark:text-white">
            {property.title}
          </h1>
          <p className="mt-2 flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400">
            <Icon name="map-pin" size={16} className="text-slate-400 dark:text-slate-500" />
            {property.address}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <FavoriteButton propertyId={property.id} size="lg" className="!bg-slate-100 dark:!bg-slate-800" />
          <button type="button" onClick={handleShare} className="grid h-11 w-11 place-items-center rounded-full bg-slate-100 text-slate-600 transition hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700" aria-label="Share listing">
            <Icon name="share" size={18} />
          </button>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <PropertyImageGallery property={property} />

          <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {FACTS.map((fact) => (
              <div key={fact.key} className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-card dark:border-slate-700 dark:bg-slate-900">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary-50 text-primary-600">
                  <Icon name={fact.icon} size={20} />
                </span>
                <div>
                  <p className="text-xs text-slate-400 dark:text-slate-500">{fact.label}</p>
                  <p className="text-sm font-bold text-slate-900 dark:text-white">{fact.value(property)}</p>
                </div>
              </div>
            ))}
          </div>

          <section className="mt-8">
            <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">About this property</h2>
            <p className="mt-3 whitespace-pre-line leading-relaxed text-slate-600 dark:text-slate-300">{property.description}</p>
          </section>

          <section className="mt-8">
            <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">Amenities & features</h2>
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {AMENITIES.filter((a) => property[a.id]).map((a) => (
                <div key={a.label} className="flex items-center gap-2.5 rounded-xl bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                  <Icon name="check-circle" size={17} className="text-emerald-500" />
                  {a.label}
                </div>
              ))}
              {!AMENITIES.some((a) => property[a.id]) && (
                <p className="text-sm text-slate-400 dark:text-slate-500">No amenities listed for this property.</p>
              )}
            </div>
          </section>

          <section className="mt-8">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">Location</h2>
              <a href={mapViewUrl(property.address, property.city, coords)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-sm font-bold text-primary-600 transition hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300">
                <Icon name="expand" size={15} /> Open in map
              </a>
            </div>
            <div className="relative mt-4 overflow-hidden rounded-2xl border border-slate-200 shadow-card dark:border-slate-700">
              <iframe
                title="Property location map"
                src={mapEmbedUrl(property.address, property.city, coords)}
                className="h-72 w-full"
                loading="lazy"
              />
              <div className="pointer-events-none absolute bottom-4 left-4 right-4 sm:right-auto sm:max-w-xs rounded-xl bg-white/95 p-4 shadow-xl backdrop-blur dark:bg-slate-900/95">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-slate-900 dark:text-white">{property.title}</p>
                    <p className="mt-0.5 truncate text-xs text-slate-500 dark:text-slate-400">
                      {property.subArea}, {property.city}
                    </p>
                    <p className="mt-1 text-sm font-extrabold text-primary-700 dark:text-primary-400">
                      {formatRent(property.price, period)}
                    </p>
                  </div>
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary-600 text-white">
                    <Icon name="map-pin-solid" size={18} />
                  </span>
                </div>
              </div>
            </div>
            <p className="mt-3 flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400">
              <Icon name="map-pin" size={16} className="text-primary-500" />
              {property.address}, {property.city}, Ethiopia
            </p>
          </section>
        </div>

        <aside className="space-y-6 lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-card dark:border-slate-700 dark:bg-slate-900">
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
                {period === 'yearly' ? 'Price per year' : 'Price per month'}
              </p>
              <div
                className="flex items-center rounded-lg bg-slate-100 p-0.5 dark:bg-slate-800"
                title="Rent period"
              >
                {['monthly', 'yearly'].map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPeriod(p)}
                    className={`rounded-md px-2 py-0.5 text-[10px] font-bold uppercase transition ${
                      period === p
                        ? 'bg-primary-600 text-white shadow-sm'
                        : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'
                    }`}
                  >
                    {p === 'monthly' ? 'mo' : 'yr'}
                  </button>
                ))}
              </div>
            </div>
            <p className="mt-1 text-3xl font-extrabold text-primary-700">{formatRent(property.price, period)}</p>
            {period === 'yearly' && (
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">≈ {formatPrice(property.price)} / month</p>
            )}
            {property.area && (
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                ≈ {Math.round(property.price / (property.area || 1)).toLocaleString()} ETB / m²
              </p>
            )}
            <p className="mt-2 text-xs text-slate-400 dark:text-slate-500">
              Deposit often required • Posted {formatDate(property.postedAt)}
            </p>

            <div className="mt-5 space-y-3">
              {property.status === 'rented' ? (
                <div className="rounded-xl bg-slate-100 p-4 text-center dark:bg-slate-800">
                  <p className="flex items-center justify-center gap-1.5 font-bold text-slate-800 dark:text-slate-200">
                    <Icon name="info" size={18} className="text-amber-500" />
                    {t('alreadyRentedTitle')}
                  </p>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    {t('alreadyRentedMessage')}
                  </p>
                  <Link to="/properties" className="btn-primary mt-4 w-full">
                    {t('browseAvailableHouses')}
                  </Link>
                </div>
              ) : property.status === 'pending' ? (
                <div className="rounded-xl bg-amber-50 p-4 text-center dark:bg-slate-800">
                  <p className="flex items-center justify-center gap-1.5 font-bold text-amber-700 dark:text-amber-300">
                    <Icon name="clock" size={18} />
                    {t('propertyPendingTitle')}
                  </p>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    {t('propertyPendingMessage')}
                  </p>
                </div>
              ) : property.status !== 'available' ? (
                <div className="rounded-xl bg-slate-100 p-4 text-center dark:bg-slate-800">
                  <p className="font-bold text-slate-800 dark:text-slate-200">{t('propertyUnavailableTitle')}</p>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{t('propertyUnavailableMessage')}</p>
                  <Link to="/properties" className="btn-primary mt-4 w-full">
                    {t('browseAvailableHouses')}
                  </Link>
                </div>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      if (!user) return navigate('/login')
                      setViewingOpen(true)
                    }}
                    className="btn-outline w-full border-primary-600 text-primary-700 hover:bg-primary-50 dark:border-primary-500 dark:text-primary-400 dark:hover:bg-slate-800"
                  >
                    <Icon name="calendar" size={17} /> Schedule a viewing
                  </button>
                  {(user?.role === 'tenant' || !user) && (
                    <button
                      type="button"
                      onClick={() => {
                        if (!user) return navigate('/login')
                        refreshAvailability().then((latest) => {
                          if (latest?.status === 'available') setBookingOpen(true)
                        })
                      }}
                      className="btn-accent w-full"
                    >
                      <Icon name="edit" size={17} /> Apply for Rent
                    </button>
                  )}
                </>
              )}
              <button
                type="button"
                onClick={() => {
                  if (!user) return navigate('/login')
                  setContactOpen(true)
                }}
                className="btn-primary w-full"
              >
                <Icon name="message" size={17} /> Contact owner
              </button>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-card dark:border-slate-700 dark:bg-slate-900">
            <div className="flex items-center gap-3">
              <Avatar name={owner.name} seed={owner.id?.charCodeAt(2) || 0} size={52} />
              <div>
                <div className="flex items-center gap-1.5">
                  <p className="font-bold text-slate-900 dark:text-white">{owner.name}</p>
                  {owner.verified && <Icon name="verified" size={16} className="text-primary-600" />}
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">Property owner</p>
              </div>
            </div>
            <div className="mt-4 space-y-2 text-sm">
              <p className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                <Icon name="shield-check" size={16} className={owner.verified ? 'text-emerald-500' : 'text-slate-400 dark:text-slate-500'} />
                {owner.verified ? 'Verified account' : 'Unverified account'}
              </p>
              <p className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                <Icon name="clock" size={16} className="text-slate-400 dark:text-slate-500" />
                Responds within ~{owner.responseRate ? 24 - Math.round(owner.responseRate / 5) : 24} hours
              </p>
              <p className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                <Icon name="eye" size={16} className="text-slate-400 dark:text-slate-500" />
                {property.views.toLocaleString()} people viewed this
              </p>
            </div>
          </div>

          <div className="rounded-2xl bg-gradient-to-br from-primary-600 to-primary-800 p-6 text-white shadow-card">
            <Icon name="shield-check" size={28} className="text-brand-400" />
            <h3 className="mt-3 text-base font-extrabold">Rental tips</h3>
            <ul className="mt-2 space-y-1.5 text-sm text-white/85">
              <li>• Always inspect the property in person.</li>
              <li>• Never pay before signing a contract.</li>
              <li>• Get a signed copy of your rental agreement.</li>
            </ul>
          </div>
        </aside>
      </div>

      <section className="mt-16">
        <h2 className="mb-6 text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">Similar properties</h2>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {similar.map((p, i) => (
            <PropertyCard key={p.id} property={p} index={i} />
          ))}
        </div>
      </section>

      <BookingModal
        open={bookingOpen}
        onClose={() => setBookingOpen(false)}
        property={property}
        onSuccess={() => navigate('/dashboard/tenant')}
        onUnavailable={refreshAvailability}
      />
      <ViewingModal open={viewingOpen} onClose={() => setViewingOpen(false)} property={property} />
      <ConversationModal open={contactOpen} onClose={() => setContactOpen(false)} property={property} />
    </div>
  )
}
