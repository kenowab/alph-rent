import { Link } from 'react-router-dom'
import Icon from '../ui/Icon'
import { CITY_HIGHLIGHTS } from '../../data/meta'

export default function CityGrid() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {CITY_HIGHLIGHTS.map((city, i) => (
        <Link
          key={city.city}
          to={`/properties?city=${city.city.toLowerCase().replace(/\s+/g, '-')}`}
          className={`group relative flex h-40 items-end overflow-hidden rounded-2xl bg-gradient-to-br p-6 text-white shadow-card transition-all duration-300 hover:-translate-y-1 hover:shadow-card-hover ${city.gradient}`}
        >
          <span className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/10 transition-transform duration-500 group-hover:scale-[1.6]" />
          <span className="absolute -bottom-10 -left-6 h-24 w-24 rounded-full bg-black/10" />
          <div className="relative flex w-full items-end justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-white/70">{city.tag}</p>
              <h3 className="mt-1 text-xl font-extrabold">{city.city}</h3>
              <p className="mt-1 text-sm text-white/80">{city.count}</p>
            </div>
            <span className="grid h-10 w-10 place-items-center rounded-full bg-white/20 backdrop-blur-sm transition-transform group-hover:translate-x-1">
              <Icon name="arrowRight" size={18} />
            </span>
          </div>
        </Link>
      ))}
    </div>
  )
}
