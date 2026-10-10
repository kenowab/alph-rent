import { useState } from 'react'
import { Link } from 'react-router-dom'
import Icon from '../../components/ui/Icon'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import { CATEGORIES } from '../../data/meta'

export default function RoleSelectPage() {
  const { isAuthenticated } = useAuth()
  const toast = useToast()

  const handleChoose = (e, role) => {
    if (isAuthenticated) {
      e.preventDefault()
      toast.info('You already have an account — visit your dashboard instead.')
    }
  }

  const roles = [
    {
      id: 'tenant',
      title: 'I want to rent',
      description: 'Find and request houses, apartments, villas and offices across Ethiopia.',
      icon: 'key',
      accent: 'from-primary-500 to-primary-700',
      badge: 'For tenants',
      to: '/register?role=tenant',
    },
    {
      id: 'owner',
      title: 'I want to list my property',
      description: 'Post your rental listings and reach thousands of serious tenants for free.',
      icon: 'building2',
      accent: 'from-brand-400 to-brand-600',
      badge: 'For property owners',
      to: '/register?role=owner',
    },
  ]

  return (
    <div className="container-page flex min-h-[80vh] flex-col items-center justify-center py-16">
      <div className="text-center">
        <span className="inline-grid h-16 w-16 place-items-center rounded-2xl bg-primary-600 text-white shadow-lg shadow-primary-600/30">
          <Icon name="users" size={30} />
        </span>
        <h1 className="mt-5 text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          How will you use Alpha Rent Ethiopia?
        </h1>
        <p className="mx-auto mt-3 max-w-lg text-slate-500 dark:text-slate-400">
          Choose your role to personalise your experience. You can still browse every listing no
          matter which role you pick.
        </p>
      </div>

      <div className="mt-10 grid w-full max-w-3xl gap-6 sm:grid-cols-2">
        {roles.map((role, i) => (
          <Link
            key={role.id}
            to={role.to}
            onClick={(e) => handleChoose(e, role.id)}
            className={`group relative overflow-hidden rounded-3xl bg-gradient-to-br p-8 text-white shadow-card transition-all duration-300 hover:-translate-y-1.5 hover:shadow-card-hover animate-fade-in-up ${role.accent}`}
            style={{ animationDelay: `${i * 100}ms` }}
          >
            <span className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10 transition-transform duration-500 group-hover:scale-150" />
            <span className="inline-block rounded-full bg-white/20 px-3 py-1 text-xs font-bold uppercase tracking-wide backdrop-blur-sm">
              {role.badge}
            </span>
            <span className="mt-6 grid h-14 w-14 place-items-center rounded-2xl bg-white/15 backdrop-blur-sm">
              <Icon name={role.icon} size={28} />
            </span>
            <h2 className="mt-5 text-xl font-extrabold">{role.title}</h2>
            <p className="mt-2 text-sm leading-relaxed text-white/85">{role.description}</p>
            <span className="mt-6 inline-flex items-center gap-1.5 text-sm font-bold text-white">
              Continue
              <Icon name="arrowRight" size={16} className="transition-transform group-hover:translate-x-1" />
            </span>
          </Link>
        ))}
      </div>

      <p className="mt-8 text-sm text-slate-500 dark:text-slate-400">
        Already have an account?{' '}
        <Link to="/login" className="font-bold text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300">
          Sign in
        </Link>
      </p>

      <p className="mt-10 flex flex-wrap items-center justify-center gap-2 text-xs text-slate-400 dark:text-slate-500">
        <Icon name="check-circle" size={14} className="text-emerald-500" />
        Free to join {CATEGORIES.length} property categories across {10} cities
      </p>
    </div>
  )
}
