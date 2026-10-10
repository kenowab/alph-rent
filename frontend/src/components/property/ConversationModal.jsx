import { useEffect, useRef, useState } from 'react'
import Modal from '../ui/Modal'
import Icon from '../ui/Icon'
import Avatar from '../ui/Avatar'
import { useAuth } from '../../context/AuthContext'
import { useNotifications } from '../../context/NotificationContext'
import { sendMessage, fetchConversationMessages, markConversationRead } from '../../api/interactions'
import { useToast } from '../../context/ToastContext'
import { formatPrice } from '../../utils/format'

function timeLabel(date) {
  if (!date) return ''
  const d = new Date(date)
  const now = Date.now()
  const diff = now - d.getTime()
  if (diff < 60000) return 'Just now'
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`
  return d.toLocaleDateString()
}

export default function ConversationModal({ open, onClose, property, otherUser }) {
  const { user } = useAuth()
  const toast = useToast()
  const { refresh } = useNotifications()
  const [messages, setMessages] = useState([])
  const [draft, setDraft] = useState('')
  const [sending, setSending] = useState(false)
  const [revealed, setRevealed] = useState(false)
  const bottomRef = useRef(null)

  const owner = property?.owner || {}
  const other = otherUser || owner

  const load = async () => {
    if (!property?.id || !other?.id) return
    try {
      const { data } = await fetchConversationMessages({ propertyId: property.id, otherId: other.id })
      setMessages(data)
    } catch {
      setMessages([])
    }
  }

  useEffect(() => {
    if (open) {
      setDraft('')
      load()
      if (other?.id) {
        markConversationRead({ otherId: other.id, propertyId: property?.id }).catch(() => {})
      }
      refresh()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, property?.id, other?.id])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, open])

  const handleSend = async (e) => {
    e.preventDefault()
    if (!draft.trim() || sending) return
    setSending(true)
    const content = draft.trim()
    const optimistic = {
      id: `tmp-${Date.now()}`,
      senderId: user?.id,
      recipientId: other?.id,
      content,
      createdAt: new Date().toISOString(),
      fromMe: true,
    }
    setMessages((current) => [...current, optimistic])
    setDraft('')
    try {
      await sendMessage({ senderId: user?.id, recipientId: other?.id, content, propertyId: property?.id })
      refresh()
      load()
    } catch (err) {
      setMessages((current) => current.filter((m) => m.id !== optimistic.id))
      toast.error(err.message || 'Could not send your message.')
    } finally {
      setSending(false)
    }
  }

  const myId = user?.id
  const canMessage = Boolean(user && other?.id && String(other.id) !== String(myId))

  return (
    <Modal open={open} onClose={onClose} title="Message" size="lg">
      {property?.id && (
        <div className="mb-4 flex items-center gap-3 rounded-xl bg-slate-50 p-3 dark:bg-slate-800">
          {property.image ? (
            <img src={property.image} alt="" className="h-12 w-14 rounded-lg object-cover" />
          ) : (
            <span className="grid h-12 w-14 place-items-center rounded-lg bg-primary-100 text-primary-600 dark:bg-primary-900/40">
              <Icon name="home" size={20} />
            </span>
          )}
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-slate-900 dark:text-white">{property.title}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {property.address}, {property.city} • {formatPrice(property.price)}/mo
            </p>
          </div>
        </div>
      )}

      <div className="flex items-center gap-3">
        <Avatar name={other?.name} seed={other?.id?.charCodeAt(2) || 0} size={42} />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-slate-900 dark:text-white">{other?.name || 'Owner'}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">Property owner</p>
        </div>
        <div className="text-right text-xs">
          <p className="text-slate-400 dark:text-slate-500">Phone</p>
          <p className="font-bold text-slate-900 dark:text-white">
            {revealed ? owner.phone || '—' : '+251 9** *** ***'}
          </p>
          <button
            type="button"
            onClick={() => setRevealed(true)}
            className="mt-0.5 inline-flex items-center gap-1 font-semibold text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
          >
            <Icon name="eye" size={13} /> {revealed ? 'Visible' : 'Reveal'}
          </button>
        </div>
      </div>

      <div className="mt-4 max-h-[46vh] space-y-3 overflow-y-auto rounded-2xl bg-slate-50 p-4 dark:bg-slate-800">
        {messages.length === 0 && (
          <p className="py-8 text-center text-sm text-slate-400 dark:text-slate-500">
            No messages yet — say hello to {other?.name || 'the owner'}.
          </p>
        )}
        {messages.map((m) => {
          const mine = String(m.senderId) === String(myId)
          return (
            <div key={m.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm shadow-sm ${
                  mine
                    ? 'rounded-tr-sm bg-primary-600 text-white'
                    : 'rounded-tl-sm bg-white text-slate-700 dark:bg-slate-700 dark:text-slate-200'
                }`}
              >
                {m.content}
                <p className={`mt-1 text-[11px] ${mine ? 'text-primary-200' : 'text-slate-400 dark:text-slate-500'}`}>
                  {timeLabel(m.createdAt)}
                </p>
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      {canMessage ? (
        <form onSubmit={handleSend} className="mt-4 flex items-center gap-2">
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder={`Message ${other?.name || 'the owner'}...`}
            className="input !rounded-full dark:bg-slate-800 dark:border-slate-700 dark:text-white dark:placeholder-slate-500"
            aria-label="Message body"
          />
          <button type="submit" disabled={sending} className="btn-primary !rounded-full !px-4" aria-label="Send message">
            <Icon name="send" size={17} />
          </button>
        </form>
      ) : (
        <p className="mt-4 text-center text-sm text-slate-400 dark:text-slate-500">Please sign in to message this owner.</p>
      )}
    </Modal>
  )
}
