import { useEffect, useState } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import Icon from '../../components/ui/Icon'
import Spinner from '../../components/ui/Spinner'
import Avatar from '../../components/ui/Avatar'
import DescriptionGenerator from '../../components/ai/DescriptionGenerator'
import { useToast } from '../../context/ToastContext'
import { useAuth } from '../../context/AuthContext'
import { CATEGORIES, CITIES } from '../../data/meta'
import { fetchPropertyById, createProperty, updateProperty } from '../../api/properties'
import { localImage } from '../../data/propertyImages'

const MAX_IMAGES = 8

const buildForm = (existing, user) => ({
  title: existing?.title || '',
  description: existing?.description || '',
  category: existing?.category || 'apartment',
  city: existing?.city || 'Addis Ababa',
  subArea: existing?.subArea || '',
  address: existing?.address || '',
  price: existing?.price || '',
  bedrooms: existing?.bedrooms || 0,
  bathrooms: existing?.bathrooms || 1,
  area: existing?.area || '',
  furnished: existing?.furnished || false,
  parking: existing?.parking || false,
  security: existing?.security || false,
  waterTank: existing?.waterTank || false,
  elevator: existing?.elevator || false,
  status: existing?.status || 'available',
})

const emptyImage = () => ({ url: '', file: null })

const initialImages = (existing) => {
  if (existing?.images?.length) {
    return [...existing.images.map((url) => ({ url: localImage(url), file: null })), emptyImage(), emptyImage(), emptyImage(), emptyImage()]
      .slice(0, MAX_IMAGES)
  }
  return [emptyImage()]
}

export default function AddPropertyPage() {
  const { id } = useParams()
  const isEditing = Boolean(id)

  const toast = useToast()
  const navigate = useNavigate()
  const { user } = useAuth()

  const [loading, setLoading] = useState(isEditing)
  const [submitting, setSubmitting] = useState(false)
  const [images, setImages] = useState(initialImages(null))
  const [form, setForm] = useState(() => buildForm(null, user))

  useEffect(() => {
    if (!isEditing) return
    let cancelled = false
    fetchPropertyById(id)
      .then(({ data }) => {
        if (cancelled) return
        setImages(initialImages(data))
        setForm(buildForm(data, user))
      })
      .catch(() => {
        if (!cancelled) toast.error('Could not load this property for editing.')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [id, isEditing, user, toast])

  const set = (key) => (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value
    setForm((f) => ({ ...f, [key]: value }))
  }

  const handleImageChange = (index) => (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 3 * 1024 * 1024) {
      toast.error('Image must be under 3MB')
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      setImages((current) => {
        const next = [...current]
        next[index] = { url: reader.result, file }
        return next
      })
    }
    reader.readAsDataURL(file)
  }

  const addImageSlot = () => {
    if (images.length >= MAX_IMAGES) {
      toast.info(`You can upload up to ${MAX_IMAGES} images`)
      return
    }
    setImages((current) => [...current, emptyImage()])
  }

  const removeImage = (index) => {
    setImages((current) => current.filter((_, i) => i !== index))
  }

  const city = CITIES.find((c) => c.name === form.city)

  const validate = () => {
    if (!form.title.trim()) return 'Please enter a property title'
    if (form.title.length < 5) return 'Title must be at least 5 characters'
    if (!form.description.trim() || form.description.length < 20)
      return 'Please write a description of at least 20 characters'
    if (!form.subArea.trim() || !form.address.trim()) return 'Please provide the sub-area and street address'
    if (!form.price || Number(form.price) <= 0) return 'Please enter a valid monthly price'
    if (form.category !== 'land' && form.category !== 'office' && Number(form.bedrooms) === 0) {
      return 'Please enter the number of bedrooms'
    }
    return ''
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const validationError = validate()
    if (validationError) {
      toast.error(validationError)
      return
    }
    setSubmitting(true)
    try {
      const payload = new FormData()
      payload.append('title', form.title)
      payload.append('description', form.description)
      payload.append('category', form.category)
      payload.append('city', form.city)
      payload.append('subArea', form.subArea)
      payload.append('address', `${form.address}, ${form.subArea}`)
      payload.append('price', String(Number(form.price) || 0))
      payload.append('bedrooms', String(Number(form.bedrooms) || 0))
      payload.append('bathrooms', String(Number(form.bathrooms) || 1))
      payload.append('area', form.area ? String(Number(form.area)) : '')
      payload.append('furnished', String(Boolean(form.furnished)))
      payload.append('parking', String(Boolean(form.parking)))
      payload.append('security', String(Boolean(form.security)))
      payload.append('waterTank', String(Boolean(form.waterTank)))
      payload.append('elevator', String(Boolean(form.elevator)))
      payload.append('status', form.status)

      const existingUrls = images.filter((img) => !img.file && img.url).map((img) => img.url)
      payload.append('existingImages', JSON.stringify(existingUrls))
      images.forEach((img) => {
        if (img.file) payload.append('images', img.file, img.file.name)
      })

      const result = isEditing
        ? await updateProperty(id, payload)
        : await createProperty(payload)

      toast.success(
        isEditing
          ? 'Property updated successfully'
          : 'Property submitted for review — it will appear once an admin approves it.',
      )
      navigate(isEditing ? `/properties/${result.data.id}` : '/dashboard/owner?tab=listings')
    } catch (err) {
      toast.error(err.message || 'Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const inputGroup = 'space-y-1.5'
  const sectionClass = 'rounded-2xl border border-slate-200 bg-white p-6 shadow-card'

  if (loading) {
    return (
      <div className="container-page flex flex-col items-center justify-center gap-3 py-32 text-slate-400">
        <Spinner size={36} label="Loading property..." />
      </div>
    )
  }

  return (
    <div className="container-page py-8">
      <nav className="mb-6 flex items-center gap-1.5 text-sm text-slate-500">
        <Link to="/dashboard/owner" className="transition hover:text-primary-600">Dashboard</Link>
        <Icon name="chevronRight" size={14} />
        <span className="font-medium text-slate-700">
          {isEditing ? 'Edit property' : 'Post a new property'}
        </span>
      </nav>

      <div className="mb-8">
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
          {isEditing ? 'Edit your property' : 'Post your property for rent'}
        </h1>
        <p className="mt-1.5 text-sm text-slate-500">
          Provide complete details to attract more tenants. Fields marked * are required.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <section className={sectionClass}>
          <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary-600 text-sm font-extrabold text-white">1</span>
            Basic information
          </h2>
          <div className="mt-5 grid gap-5">
            <div className={inputGroup}>
              <label className="label" htmlFor="prop-title">Property title *</label>
              <input id="prop-title" className="input" value={form.title} onChange={set('title')} placeholder="e.g. Modern 2 Bedroom Apartment in CMC" />
            </div>

            <div className={inputGroup}>
              <div className="flex items-center justify-between">
                <label className="label mb-0" htmlFor="prop-desc">Description *</label>
                <DescriptionGenerator
                  form={form}
                  onApply={(desc) => setForm((f) => ({ ...f, description: desc }))}
                />
              </div>
              <textarea id="prop-desc" className="input min-h-[120px] resize-y" value={form.description} onChange={set('description')} placeholder="Describe the property, its features, neighbourhood and what makes it special..." />
              <p className="text-right text-xs text-slate-400">{form.description.length} characters</p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className={inputGroup}>
                <label className="label" htmlFor="prop-category">Property type *</label>
                <select id="prop-category" className="input" value={form.category} onChange={set('category')}>
                  {CATEGORIES.map((c) => (
                    <option key={c.id} value={c.id}>{c.label}</option>
                  ))}
                </select>
              </div>
              <div className={inputGroup}>
                <label className="label" htmlFor="prop-price">Monthly price (ETB) *</label>
                <input id="prop-price" type="number" min="0" className="input" value={form.price} onChange={set('price')} placeholder="e.g. 18000" />
              </div>
              <div className={inputGroup}>
                <label className="label" htmlFor="prop-availability">Availability *</label>
                <select
                  id="prop-availability"
                  className="input"
                  value={form.status}
                  onChange={set('status')}
                  disabled={isEditing && ['pending', 'rented'].includes(form.status)}
                >
                  <option value="available">Available for rent</option>
                  <option value="unavailable">Not available (hide from listings)</option>
                </select>
                {isEditing && ['pending', 'rented'].includes(form.status) && (
                  <p className="text-xs font-medium text-amber-600 dark:text-amber-400">
                    This property is in an active rental process — its availability is managed by the
                    agreement until the rental is completed or cancelled.
                  </p>
                )}
              </div>
            </div>
          </div>
        </section>

        <section className={sectionClass}>
          <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary-600 text-sm font-extrabold text-white">2</span>
            Location
          </h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <div className={inputGroup}>
              <label className="label" htmlFor="prop-city">City *</label>
              <select id="prop-city" className="input" value={form.city} onChange={set('city')}>
                {CITIES.map((c) => (
                  <option key={c.id} value={c.name}>{c.name}</option>
                ))}
              </select>
            </div>
            <div className={inputGroup}>
              <label className="label" htmlFor="prop-subarea">Sub-area / District *</label>
              <input id="prop-subarea" className="input" value={form.subArea} onChange={set('subArea')} list="subareas" placeholder="e.g. CMC, Bole, Saris" />
              <datalist id="subareas">
                {(city?.subAreas || []).map((sa) => (
                  <option key={sa} value={sa} />
                ))}
              </datalist>
            </div>
            <div className={inputGroup + ' sm:col-span-2'}>
              <label className="label" htmlFor="prop-address">Street address *</label>
              <input id="prop-address" className="input" value={form.address} onChange={set('address')} placeholder="e.g. Bole Road, Near Edna Mall" />
            </div>
          </div>
        </section>

        <section className={sectionClass}>
          <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary-600 text-sm font-extrabold text-white">3</span>
            Property details
          </h2>
          <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3">
            <div className={inputGroup}>
              <label className="label" htmlFor="prop-bedrooms">Bedrooms</label>
              <input id="prop-bedrooms" type="number" min="0" className="input" value={form.bedrooms} onChange={set('bedrooms')} />
            </div>
            <div className={inputGroup}>
              <label className="label" htmlFor="prop-bathrooms">Bathrooms</label>
              <input id="prop-bathrooms" type="number" min="0" className="input" value={form.bathrooms} onChange={set('bathrooms')} />
            </div>
            <div className={inputGroup}>
              <label className="label" htmlFor="prop-area">Area (m²)</label>
              <input id="prop-area" type="number" min="0" className="input" value={form.area} onChange={set('area')} placeholder="e.g. 120" />
            </div>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-5">
            {[
              { key: 'furnished', label: 'Furnished', icon: 'bed' },
              { key: 'parking', label: 'Parking', icon: 'truck' },
              { key: 'security', label: 'Security', icon: 'shield' },
              { key: 'waterTank', label: 'Water tank', icon: 'droplet' },
              { key: 'elevator', label: 'Elevator', icon: 'chevronUp' },
            ].map((amenity) => (
              <label
                key={amenity.key}
                className={`flex cursor-pointer items-center gap-2.5 rounded-xl border-2 px-3 py-3 text-sm font-semibold transition ${
                  form[amenity.key]
                    ? 'border-primary-600 bg-primary-50 text-primary-700'
                    : 'border-slate-200 text-slate-600 hover:border-slate-300'
                }`}
              >
                <Icon name={amenity.icon} size={17} />
                <input type="checkbox" className="sr-only" checked={form[amenity.key]} onChange={set(amenity.key)} />
                {amenity.label}
              </label>
            ))}
          </div>
        </section>

        <section className={sectionClass}>
          <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary-600 text-sm font-extrabold text-white">4</span>
            Photos
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Upload up to {MAX_IMAGES} images. The first photo will be the main cover. (Max 3MB each)
          </p>
          <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {images.map((image, index) => (
              <div key={index} className="relative aspect-[4/3] overflow-hidden rounded-xl border-2 border-dashed border-slate-300 bg-slate-50">
                {image.url ? (
                  <img src={image.url} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full flex-col items-center justify-center gap-1 text-slate-400">
                    <Icon name="image" size={24} />
                    <span className="text-xs">No image</span>
                  </div>
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange(index)}
                  className="absolute inset-0 cursor-pointer opacity-0"
                  aria-label={`Upload image ${index + 1}`}
                />
                {image.url && (
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="absolute right-2 top-2 grid h-7 w-7 place-items-center rounded-full bg-black/55 text-white backdrop-blur-sm transition hover:bg-red-500"
                    aria-label="Remove image"
                  >
                    <Icon name="x" size={14} />
                  </button>
                )}
                {index === 0 && image.url && (
                  <span className="absolute bottom-2 left-2 rounded-full bg-primary-600 px-2.5 py-0.5 text-[11px] font-bold text-white">
                    Cover
                  </span>
                )}
              </div>
            ))}
            {images.length < MAX_IMAGES && (
              <button
                type="button"
                onClick={addImageSlot}
                className="flex aspect-[4/3] flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed border-primary-300 bg-primary-50/50 text-primary-600 transition hover:bg-primary-50"
              >
                <Icon name="plus" size={26} />
                <span className="text-xs font-semibold">Add image</span>
              </button>
            )}
          </div>
        </section>

        <section className={sectionClass}>
          <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary-600 text-sm font-extrabold text-white">5</span>
            Owner information
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            This property is automatically associated with your account — no need to re-enter your details.
          </p>
          <div className="mt-5 flex items-center gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/50">
            <Avatar name={user?.name} seed={user?.avatarSeed || 0} src={user?.avatar} size={48} />
            <div className="min-w-0">
              <p className="font-bold text-slate-900 dark:text-white">{user?.name}</p>
              <p className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-500 dark:text-slate-400">
                <span className="inline-flex items-center gap-1.5">
                  <Icon name="mail" size={14} /> {user?.email || '—'}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Icon name="phone" size={14} /> {user?.phone || '—'}
                </span>
              </p>
            </div>
          </div>
          {!user?.phone && (
            <p className="mt-2 text-xs text-amber-600 dark:text-amber-400">
              Your account has no phone number yet. Tenants contact owners by phone — add one in{' '}
              <Link to="/dashboard/owner" className="font-bold underline">Profile settings</Link>.
            </p>
          )}
        </section>

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Link to="/dashboard/owner" className="btn-outline">
            Cancel
          </Link>
          <button type="submit" disabled={submitting} className="btn-primary px-8">
            {submitting ? <Spinner size={18} /> : <Icon name="check-circle" size={18} />}
            {submitting ? 'Publishing...' : isEditing ? 'Save changes' : 'Publish property'}
          </button>
        </div>
      </form>
    </div>
  )
}
