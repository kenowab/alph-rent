import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
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
import Icon from '../../components/ui/Icon'
import { useAuth } from '../../context/AuthContext'
import { useFavorites } from '../../context/FavoritesContext'
import { useToast } from '../../context/ToastContext'
import { useNotifications } from '../../context/NotificationContext'
import { fetchPropertyById, fetchProperties } from '../../api/properties'
import {
  fetchRentalRequests,
  fetchViewingRequests,
  updateViewingStatus,
  fetchRentalAgreements,
  fetchConversations,
} from '../../api/interactions'

const TABS = [
  { id: 'overview', label: 'Overview', icon: 'grid' },
  { id: 'properties', label: 'Properties', icon: 'building' },
  { id: 'saved', label: 'Saved properties', icon: 'heart' },
  { id: 'requests', label: 'My Rental Requests', icon: 'calendar' },
  { id: 'viewings', label: 'Viewings', icon: 'eye' },
  { id: 'agreements', label: 'Agreements', icon: 'key' },
  { id: 'messages', label: 'Messages', icon: 'message' },
  { id: 'notifications', label: 'Notifications', icon: 'bell' },
  { id: 'profile', label: 'Profile settings', icon: 'settings' },
]

export default function TenantDashboardPage() {
  const { user } = useAuth()
  const { favorites } = useFavorites()
  const toast = useToast()
  const { unreadCount: notificationCount } = useNotifications()
  const [activeTab, setActiveTab] = useState('overview')
  const [savedProperties, setSavedProperties] = useState([])
  const [approvedProperties, setApprovedProperties] = useState([])
  const [requests, setRequests] = useState([])
  const [viewings, setViewings] = useState([])
  const [agreements, setAgreements] = useState([])
  const [conversations, setConversations] = useState([])
  const [loadingSaved, setLoadingSaved] = useState(true)

  useEffect(() => {
    if (favorites.length === 0) {
      setSavedProperties([])
      setLoadingSaved(false)
      return
    }
    let cancelled = false
    setLoadingSaved(true)
    Promise.all(favorites.map((id) => fetchPropertyById(id)))
      .then((results) => {
        if (!cancelled) setSavedProperties(results.map((r) => r.data).filter(Boolean))
      })
      .finally(() => {
        if (!cancelled) setLoadingSaved(false)
      })
    return () => {
      cancelled = true
    }
  }, [favorites])

  useEffect(() => {
    let cancelled = false
    // Only admin-approved properties are returned by the API. Pending and
    // rejected listings never reach the tenant dashboard.
    fetchProperties({ limit: 12 })
      .then(({ data }) => {
        if (!cancelled) setApprovedProperties(data)
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    Promise.all([
      fetchRentalRequests({ userId: user?.id, role: 'tenant' }),
      fetchViewingRequests({ role: 'tenant' }),
      fetchRentalAgreements(),
      fetchConversations().catch(() => ({ data: [] })),
    ]).then(([requestsResult, viewingsResult, agreementsResult, conversationsResult]) => {
      if (cancelled) return
      setRequests(requestsResult.data)
      setViewings(viewingsResult.data)
      setAgreements(agreementsResult.data)
      setConversations(conversationsResult.data)
    })
    return () => {
      cancelled = true
    }
  }, [user])

  const handleCancelViewing = async (id) => {
    try {
      await updateViewingStatus(id, 'cancelled')
      setViewings((current) => current.map((v) => (v.id === id ? { ...v, status: 'cancelled' } : v)))
      toast.info('Viewing request cancelled')
    } catch (err) {
      toast.error(err.message || 'Could not cancel the viewing request.')
    }
  }

  const unreadMessages = conversations.reduce((sum, c) => sum + c.unreadCount, 0)

  const tabCounts = {
    properties: approvedProperties.length,
    saved: favorites.length,
    requests: requests.length,
    viewings: viewings.filter((v) => v.status === 'pending').length,
    agreements: agreements.length,
    messages: unreadMessages,
    notifications: notificationCount,
  }

  const tabs = TABS.map((tab) => ({ ...tab, count: tabCounts[tab.id] || 0 }))

  const renderSaved = () => {
    if (loadingSaved) {
      return (
        <div className="grid gap-5 sm:grid-cols-2">
          {[1, 2].map((i) => (
            <div key={i} className="h-72 animate-pulse rounded-2xl bg-slate-200" />
          ))}
        </div>
      )
    }
    if (savedProperties.length === 0) {
      return (
        <EmptyState
          icon="heart"
          title="No saved properties yet"
          description="Tap the heart icon on any property to save it here for later."
          action={
            <Link to="/properties" className="btn-primary">
              Browse properties
            </Link>
          }
        />
      )
    }
    return (
      <div className="grid gap-5 sm:grid-cols-2">
        {savedProperties.map((p, i) => (
          <PropertyCard key={p.id} property={p} index={i} />
        ))}
      </div>
    )
  }

  const renderProperties = () =>
    approvedProperties.length === 0 ? (
      <EmptyState
        icon="building"
        title="No approved properties yet"
        description="Properties approved by the administrator will appear here for you to apply to."
        action={
          <Link to="/properties" className="btn-primary">
            Browse all properties
          </Link>
        }
      />
    ) : (
      <div className="grid gap-5 sm:grid-cols-2">
        {approvedProperties.map((p, i) => (
          <PropertyCard key={p.id} property={p} index={i} />
        ))}
      </div>
    )

  const renderRequests = () =>
    requests.length === 0 ? (
      <EmptyState
        icon="calendar"
        title="No rental requests yet"
        description="Request a rental from any approved property page and track its status here. Final approval is given by the administrator."
        action={
          <Link to="/properties" className="btn-primary">
            Find a place to rent
          </Link>
        }
      />
    ) : (
      <div className="grid gap-5 lg:grid-cols-2">
        {requests.map((req) => (
          <RequestCard key={req.id} request={req} tenantView />
        ))}
      </div>
    )

  const renderViewings = () =>
    viewings.length === 0 ? (
      <EmptyState
        icon="eye"
        title="No viewing requests yet"
        description="Schedule a viewing from any property page and track its status here."
        action={
          <Link to="/properties" className="btn-primary">
            Browse properties
          </Link>
        }
      />
    ) : (
      <div className="grid gap-5 lg:grid-cols-2">
        {viewings.map((viewing) => (
          <ViewingCard key={viewing.id} viewing={viewing} onUpdateStatus={handleCancelViewing} tenantView />
        ))}
      </div>
    )

  const renderAgreements = () =>
    agreements.length === 0 ? (
      <EmptyState
        icon="key"
        title="No rental agreements yet"
        description="Once an owner approves your application, your rental agreement will appear here."
      />
    ) : (
      <div className="grid gap-5 lg:grid-cols-2">
        {agreements.map((agreement) => (
          <AgreementCard key={agreement.id} agreement={agreement} tenantView />
        ))}
      </div>
    )

  return (
    <DashboardLayout role="tenant" tabs={tabs} activeTab={activeTab} onChangeTab={setActiveTab}>
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-extrabold text-slate-900">
              Welcome back, {user?.name.split(' ')[0]}
            </h2>
            <p className="mt-1 text-sm text-slate-500">Here is what is happening with your rentals.</p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard icon="heart" label="Saved properties" value={favorites.length} style="blue" />
            <StatCard icon="calendar" label="Active requests" value={requests.filter((r) => r.status === 'pending').length} style="amber" />
            <StatCard icon="message" label="Unread messages" value={unreadMessages} style="violet" />
            <StatCard icon="check-circle" label="Approved" value={requests.filter((r) => r.status === 'approved').length} style="green" trend="Good" />
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-card">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900">Latest rental requests</h3>
              <button type="button" onClick={() => setActiveTab('requests')} className="text-sm font-bold text-primary-600 hover:text-primary-700">
                View all
              </button>
            </div>
            {requests.length === 0 ? (
              <p className="py-6 text-center text-sm text-slate-400">No requests yet.</p>
            ) : (
              <div className="grid gap-4 lg:grid-cols-2">
                {requests.slice(0, 2).map((req) => (
                  <RequestCard key={req.id} request={req} tenantView />
                ))}
              </div>
            )}
          </div>

          {savedProperties.length > 0 && (
            <div>
              <h3 className="mb-4 text-lg font-bold text-slate-900">Recommended for you</h3>
              <div className="grid gap-5 sm:grid-cols-2">
                {savedProperties.slice(0, 2).map((p, i) => (
                  <PropertyCard key={p.id} property={p} index={i} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'properties' && (
        <div>
          <h2 className="mb-1 text-2xl font-extrabold text-slate-900">Properties</h2>
          <p className="mb-5 text-sm text-slate-500">
            Approved properties available to rent. Apply for rent on any listing.
          </p>
          {renderProperties()}
        </div>
      )}

      {activeTab === 'saved' && (
        <div>
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-extrabold text-slate-900">Saved properties</h2>
              <p className="mt-1 text-sm text-slate-500">{favorites.length} saved rental(s)</p>
            </div>
            {favorites.length > 0 && (
              <Link to="/properties" className="btn-outline">
                <Icon name="plus" size={16} /> Add more
              </Link>
            )}
          </div>
          {renderSaved()}
        </div>
      )}

      {activeTab === 'requests' && (
        <div>
          <h2 className="mb-1 text-2xl font-extrabold text-slate-900">My Rental Requests</h2>
          <p className="mb-5 text-sm text-slate-500">
            Track the status of every rental you have requested. The administrator approves or
            declines each request.
          </p>
          {renderRequests()}
        </div>
      )}

      {activeTab === 'viewings' && (
        <div>
          <h2 className="mb-1 text-2xl font-extrabold text-slate-900">Viewings</h2>
          <p className="mb-5 text-sm text-slate-500">Track your property viewing requests. You can cancel a request the owner has not completed yet.</p>
          {renderViewings()}
        </div>
      )}

      {activeTab === 'agreements' && (
        <div>
          <h2 className="mb-1 text-2xl font-extrabold text-slate-900">Rental agreements</h2>
          <p className="mb-5 text-sm text-slate-500">Your rental agreements and lease details.</p>
          {renderAgreements()}
        </div>
      )}

      {activeTab === 'messages' && (
        <div>
          <h2 className="mb-1 text-2xl font-extrabold text-slate-900">Messages</h2>
          <p className="mb-5 text-sm text-slate-500">Chat directly with property owners.</p>
          <MessagesPanel />
        </div>
      )}

      {activeTab === 'notifications' && (
        <div>
          <h2 className="mb-1 text-2xl font-extrabold text-slate-900">Notifications</h2>
          <p className="mb-5 text-sm text-slate-500">Updates on your applications, viewings and agreements.</p>
          <NotificationsPanel />
        </div>
      )}

      {activeTab === 'profile' && (
        <div>
          <h2 className="mb-5 text-2xl font-extrabold text-slate-900">Profile settings</h2>
          <ProfileSettings type="tenant" />
        </div>
      )}
    </DashboardLayout>
  )
}
