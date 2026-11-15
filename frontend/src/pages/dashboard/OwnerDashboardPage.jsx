import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import DashboardLayout from '../../components/dashboard/DashboardLayout'
import StatCard from '../../components/dashboard/StatCard'
import RequestCard from '../../components/dashboard/RequestCard'
import ViewingCard from '../../components/dashboard/ViewingCard'
import AgreementCard from '../../components/dashboard/AgreementCard'
import MessagesPanel from '../../components/dashboard/MessagesPanel'
import NotificationsPanel from '../../components/dashboard/NotificationsPanel'
import ProfileSettings from '../../components/dashboard/ProfileSettings'
import PropertyCard from '../../components/property/PropertyCard'
import EmptyState from '../../components/ui/EmptyState'
import Modal from '../../components/ui/Modal'
import Icon from '../../components/ui/Icon'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import { useNotifications } from '../../context/NotificationContext'
import {
  fetchRentalRequests,
  fetchViewingRequests,
  updateViewingStatus,
  fetchRentalAgreements,
  updateAgreementStatus,
  fetchConversations,
} from '../../api/interactions'
import { fetchMyProperties, deleteProperty } from '../../api/properties'
import { formatPrice } from '../../utils/format'

const TABS = [
  { id: 'overview', label: 'Overview', icon: 'grid' },
  { id: 'listings', label: 'My Properties', icon: 'building' },
  { id: 'requests', label: 'Rental requests', icon: 'calendar' },
  { id: 'viewings', label: 'Viewing requests', icon: 'eye' },
  { id: 'agreements', label: 'Agreements', icon: 'key' },
  { id: 'messages', label: 'Messages', icon: 'message' },
  { id: 'notifications', label: 'Notifications', icon: 'bell' },
  { id: 'profile', label: 'Profile settings', icon: 'settings' },
]

export default function OwnerDashboardPage() {
  const { user } = useAuth()
  const toast = useToast()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { unreadCount: notificationCount, refresh: refreshNotifications } = useNotifications()
  const tabParam = searchParams.get('tab')
  const [activeTab, setActiveTab] = useState(() =>
    TABS.some((tab) => tab.id === tabParam) ? tabParam : 'overview',
  )
  const [requests, setRequests] = useState([])
  const [viewings, setViewings] = useState([])
  const [agreements, setAgreements] = useState([])
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [listings, setListings] = useState([])
  const [propertyMap, setPropertyMap] = useState({})
  const [conversations, setConversations] = useState([])

  useEffect(() => {
    let cancelled = false
    Promise.all([
      fetchMyProperties(),
      fetchRentalRequests({ role: 'owner' }),
      fetchViewingRequests({ role: 'owner' }),
      fetchRentalAgreements(),
      fetchConversations().catch(() => ({ data: [] })),
    ]).then(([listingsResult, requestsResult, viewingsResult, agreementsResult, conversationsResult]) => {
      if (cancelled) return
      const next = listingsResult.data
      setListings(next)
      setPropertyMap(Object.fromEntries(next.map((p) => [p.id, p])))
      setRequests(requestsResult.data)
      setViewings(viewingsResult.data)
      setAgreements(agreementsResult.data)
      setConversations(conversationsResult.data)
    })
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (tabParam && TABS.some((tab) => tab.id === tabParam)) {
      setActiveTab(tabParam)
    }
  }, [tabParam])

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await deleteProperty(deleteTarget.id)
      setListings((current) => current.filter((p) => p.id !== deleteTarget.id))
      setPropertyMap((current) => {
        const next = { ...current }
        delete next[deleteTarget.id]
        return next
      })
      setDeleteTarget(null)
      toast.success('Property removed from your listings')
    } catch {
      toast.error('Could not delete the property. Please try again.')
    } finally {
      setDeleting(false)
    }
  }

  const handleViewingStatus = async (id, status) => {
    await updateViewingStatus(id, status)
    setViewings((current) => current.map((v) => (v.id === id ? { ...v, status } : v)))
    const label = { accepted: 'accepted', rejected: 'rejected', completed: 'marked completed' }
    toast[status === 'rejected' ? 'error' : 'success'](
      `Viewing request ${label[status] || status} — tenant notified`,
    )
  }

  const handleAgreementStatus = async (id, status) => {
    await updateAgreementStatus(id, status)
    setAgreements((current) => current.map((a) => (a.id === id ? { ...a, status } : a)))
    if (status === 'active') {
      toast.success('Agreement activated — property is now RENTED')
    } else if (status === 'completed') {
      toast.success('Agreement completed — property is available again')
    } else {
      toast.info('Agreement cancelled — property is available again')
    }
  }

  const totalViews = listings.reduce((sum, p) => sum + p.views, 0)
  const totalValue = listings.reduce((sum, p) => sum + p.price, 0)
  const pendingCount = requests.filter((r) => r.status === 'pending').length

  const tabCounts = {
    listings: listings.length,
    requests: requests.filter((r) => r.status === 'pending').length,
    viewings: viewings.filter((v) => v.status === 'pending').length,
    agreements: agreements.filter((a) => a.status === 'active').length,
    messages: conversations.reduce((sum, c) => sum + c.unreadCount, 0),
    notifications: notificationCount,
  }

  const tabs = TABS.map((tab) => ({ ...tab, count: tabCounts[tab.id] || 0 }))

  const renderListings = () =>
    listings.length === 0 ? (
      <EmptyState
        icon="building"
        title="You have no active listings"
        description="Post your first property and start receiving rental requests today."
        action={
          <Link to="/dashboard/owner/add-property" className="btn-primary">
            <Icon name="plus" size={16} /> Post a property
          </Link>
        }
      />
    ) : (
      <div className="grid gap-5 sm:grid-cols-2">
        {listings.map((p, i) => (
          <PropertyCard
            key={p.id}
            property={p}
            index={i}
            ownerView
            onEdit={(prop) => navigate(`/dashboard/owner/edit-property/${prop.id}`)}
            onDelete={(prop) => setDeleteTarget(prop)}
          />
        ))}
      </div>
    )

  const renderViewings = () =>
    viewings.length === 0 ? (
      <EmptyState
        icon="eye"
        title="No viewing requests yet"
        description="When tenants request to view one of your properties, they will appear here."
      />
    ) : (
      <div className="grid gap-5 lg:grid-cols-2">
        {viewings.map((viewing) => (
          <ViewingCard key={viewing.id} viewing={viewing} onUpdateStatus={handleViewingStatus} />
        ))}
      </div>
    )

  const renderAgreements = () =>
    agreements.length === 0 ? (
      <EmptyState
        icon="key"
        title="No rental agreements yet"
        description="When you approve a rental application, a rental agreement is generated here."
      />
    ) : (
      <div className="grid gap-5 lg:grid-cols-2">
        {agreements.map((agreement) => (
          <AgreementCard key={agreement.id} agreement={agreement} onUpdateStatus={handleAgreementStatus} />
        ))}
      </div>
    )

  const renderRequests = () =>
    requests.length === 0 ? (
      <EmptyState
        icon="calendar"
        title="No rental requests yet"
        description="When tenants request one of your properties, they will appear here."
      />
    ) : (
      <div className="grid gap-5 lg:grid-cols-2">
        {requests.map((req) => (
          <RequestCard
            key={req.id}
            request={req}
            property={propertyMap[req.propertyId]}
          />
        ))}
      </div>
    )

  return (
    <DashboardLayout role="owner" tabs={tabs} activeTab={activeTab} onChangeTab={setActiveTab}>
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white">
              Welcome back, {user?.name.split(' ')[0]}
            </h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Your rental business at a glance.</p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard icon="building" label="Active listings" value={listings.length} style="blue" />
            <StatCard icon="eye" label="Total views" value={totalViews.toLocaleString()} style="violet" trend="+12%" />
            <StatCard icon="calendar" label="Pending requests" value={pendingCount} style="amber" />
            <StatCard icon="wallet" label="Monthly portfolio" value={`${totalValue.toLocaleString()} ETB`} style="green" trend="+8%" />          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-card dark:border-slate-700 dark:bg-slate-900">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Recent rental requests</h3>
              <button type="button" onClick={() => setActiveTab('requests')} className="text-sm font-bold text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300">
                View all
              </button>
            </div>
            {requests.length === 0 ? (
              <p className="py-6 text-center text-sm text-slate-400 dark:text-slate-500">No requests yet.</p>
            ) : (
              <div className="grid gap-4 lg:grid-cols-2">
                {requests.slice(0, 2).map((req) => (
                  <RequestCard key={req.id} request={req} property={propertyMap[req.propertyId]} />
                ))}
              </div>
            )}
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-card dark:border-slate-700 dark:bg-slate-900">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Top performing listings</h3>
              <ul className="mt-4 space-y-3">
                {[...listings].sort((a, b) => b.views - a.views).slice(0, 4).map((p) => (
                  <li key={p.id} className="flex items-center justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-primary-50 text-primary-600 dark:bg-slate-800">
                        <Icon name="eye" size={16} />
                      </span>
                      <div className="min-w-0">
                        <Link to={`/properties/${p.id}`} className="block truncate text-sm font-semibold text-slate-800 hover:text-primary-700 dark:text-slate-200 dark:hover:text-primary-400">
                          {p.title}
                        </Link>
                        <p className="text-xs text-slate-500 dark:text-slate-400">{p.views.toLocaleString()} views</p>
                      </div>
                    </div>
                    <span className="shrink-0 text-sm font-bold text-primary-700">{formatPrice(p.price)}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-primary-600 to-primary-800 p-6 text-white shadow-card">
              <Icon name="trendingUp" size={28} className="text-brand-400" />
              <h3 className="mt-3 text-lg font-extrabold">Pro tip</h3>
              <p className="mt-2 text-sm leading-relaxed text-white/85">
                Listings with 5+ clear photos and complete details get <strong>up to 3x more</strong> rental
                requests. Update your properties to keep them on top.
              </p>
              <button
                type="button"
                onClick={() => setActiveTab('listings')}
                className="btn-accent mt-4"
              >
                Manage listings
              </button>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'listings' && (
        <div>
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white">My Properties</h2>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                {listings.length} property/properties — approval status shown on each card
              </p>
            </div>
            <Link to="/dashboard/owner/add-property" className="btn-primary">
              <Icon name="plus" size={16} /> Post property
            </Link>
          </div>
          {renderListings()}
        </div>
      )}

      {activeTab === 'requests' && (
        <div>
          <h2 className="mb-1 text-2xl font-extrabold text-slate-900 dark:text-white">Rental requests</h2>
          <p className="mb-5 text-sm text-slate-500 dark:text-slate-400">
            Applications submitted by tenants for your properties. Final approval is handled by the
            administrator.
          </p>
          {renderRequests()}
        </div>
      )}

      {activeTab === 'viewings' && (
        <div>
          <h2 className="mb-1 text-2xl font-extrabold text-slate-900 dark:text-white">Viewing requests</h2>
          <p className="mb-5 text-sm text-slate-500 dark:text-slate-400">Accept or decline viewing requests for your properties.</p>
          {renderViewings()}
        </div>
      )}

      {activeTab === 'agreements' && (
        <div>
          <h2 className="mb-1 text-2xl font-extrabold text-slate-900 dark:text-white">Rental agreements</h2>
          <p className="mb-5 text-sm text-slate-500 dark:text-slate-400">Administrator-approved rental requests appear here as active agreements. Update an agreement when the tenancy ends or is cancelled.</p>
          {renderAgreements()}
        </div>
      )}

      {activeTab === 'messages' && (
        <div>
          <h2 className="mb-1 text-2xl font-extrabold text-slate-900">Messages</h2>
          <p className="mb-5 text-sm text-slate-500">Chat directly with interested tenants.</p>
          <MessagesPanel />
        </div>
      )}

      {activeTab === 'notifications' && (
        <div>
          <h2 className="mb-1 text-2xl font-extrabold text-slate-900">Notifications</h2>
          <p className="mb-5 text-sm text-slate-500">Activity and updates across your properties.</p>
          <NotificationsPanel />
        </div>
      )}

      {activeTab === 'profile' && (
        <div>
          <h2 className="mb-5 text-2xl font-extrabold text-slate-900">Profile settings</h2>
          <ProfileSettings type="owner" />
        </div>
      )}

      <Modal
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        title="Delete property?"
        size="sm"
      >
        <p className="text-sm text-slate-600">
          Are you sure you want to remove{' '}
          <span className="font-semibold text-slate-900">{deleteTarget?.title}</span>? This action cannot
          be undone.
        </p>
        <div className="mt-6 flex gap-3">
          <button type="button" onClick={() => setDeleteTarget(null)} className="btn-outline flex-1">
            Cancel
          </button>
          <button type="button" onClick={handleDelete} disabled={deleting} className="btn flex-1 border-red-600 bg-red-600 text-white hover:bg-red-700">
            <Icon name="trash" size={16} /> {deleting ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </Modal>
    </DashboardLayout>
  )
}
