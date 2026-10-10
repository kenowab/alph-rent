import { Link } from 'react-router-dom'
import Icon from '../components/ui/Icon'

export default function NotFoundPage() {
  return (
    <div className="container-page flex flex-col items-center justify-center py-28 text-center">
      <p className="text-7xl font-extrabold tracking-tight text-primary-600">404</p>
      <h1 className="mt-4 text-2xl font-extrabold text-slate-900">Page not found</h1>
      <p className="mt-2 max-w-md text-sm text-slate-500">
        The page you are looking for does not exist or may have been moved. Let&apos;s get you back
        home.
      </p>
      <div className="mt-7 flex gap-3">
        <Link to="/" className="btn-primary">
          <Icon name="home" size={17} /> Go home
        </Link>
        <Link to="/properties" className="btn-outline">
          Browse properties
        </Link>
      </div>
    </div>
  )
}
