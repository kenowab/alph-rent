import { useState } from 'react'
import { Link } from 'react-router-dom'
import Icon from '../ui/Icon'
import { CATEGORIES } from '../../data/meta'
import { useLanguage } from '../../context/LanguageContext'
import { placeholderSvgUrl } from '../../utils/images'

const CATEGORY_COUNTS = {
  house: '1,120',
  apartment: '986',
  villa: '342',
  office: '268',
  land: '410',
  studio: '184',
  shop: '97',
}

const CATEGORY_IMAGES = {
  house: '/images/properties/house-2.jpg',
  apartment: '/images/properties/apartment-1.jpg',
  villa: '/images/properties/villa-1.jpg',
  office: '/images/properties/office-1.jpg',
  land: '/images/properties/land-1.jpg',
  studio: '/images/properties/livingroom-3.jpg',
  shop: '/images/properties/shop-1.jpg',
  room: '/images/properties/bedroom-3.jpg',
  commercial: '/images/properties/commercial-1.jpg',
}

const TILE_STYLES = [
  'from-sky-500 to-blue-700',
  'from-emerald-500 to-teal-700',
  'from-violet-500 to-purple-700',
  'from-rose-500 to-pink-700',
  'from-amber-500 to-orange-700',
  'from-cyan-500 to-sky-700',
  'from-indigo-500 to-blue-700',
  'from-lime-500 to-green-700',
]

export default function CategoryGrid() {
  const { t } = useLanguage()
  const [failed, setFailed] = useState(() => new Set())

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      {CATEGORIES.map((cat, i) => {
        const imageUrl = failed.has(cat.id)
          ? placeholderSvgUrl({ label: cat.label, category: cat.id, seed: i })
          : CATEGORY_IMAGES[cat.id]
        return (
          <Link
            key={cat.id}
            to={`/properties?category=${cat.id}`}
            className="group relative block overflow-hidden rounded-2xl bg-slate-900 shadow-card transition-all duration-300 hover:-translate-y-1 hover:shadow-card-hover"
          >
            <img
              src={imageUrl}
              alt={cat.label}
              loading="lazy"
              onError={() => setFailed((current) => new Set(current).add(cat.id))}
              className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
            <span className={`absolute inset-0 bg-gradient-to-br opacity-30 mix-blend-multiply ${TILE_STYLES[i % TILE_STYLES.length]}`} />
            <span className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/20 to-transparent" />
            <div className="relative flex h-40 flex-col justify-end p-4 sm:h-44">
              <div className="flex items-center gap-2">
                <Icon name={cat.icon} size={18} className="text-white" />
                <h3 className="text-base font-bold text-white">{t(`cat_${cat.id}`)}</h3>
              </div>
              <p className="mt-0.5 text-xs text-white/80">{CATEGORY_COUNTS[cat.id] || '—'} {t('listings')}</p>
              <span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-white/90 transition-transform group-hover:translate-x-1">
                {t('explore')} <Icon name="arrowRight" size={13} />
              </span>
            </div>
          </Link>
        )
      })}
    </div>
  )
}
