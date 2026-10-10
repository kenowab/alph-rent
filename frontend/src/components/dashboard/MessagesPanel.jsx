import { useCallback, useEffect, useRef, useState } from 'react'
import Icon from '../ui/Icon'
import Avatar from '../ui/Avatar'
import { useAuth } from '../../context/AuthContext'
import { useNotifications } from '../../context/NotificationContext'
import { fetchConversations, fetchConversationMessages, sendMessage, markConversationRead } from '../../api/interactions'
import { formatPrice } from '../../utils/format'
import { Link } from 'react-router-dom'

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

export default function MessagesPanel() {
  const { user } = useAuth()
  const { refresh } = useNotifications()
  const [conversations, setConversations] = useState([])
  const [active, setActive] = useState(null)
  const [messages, setMessages] = useState([])
  const [draft, setDraft] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const bottomRef = useRef(null)

  const loadConversations = useCallback(async () => {
    try {
      const { data } = await fetchConversations()
      setConversations(data)
      setLoading(false)
      setActive((current) => {
        if (current) return current
        return data[0] || null
      })
    } catch {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadConversations()
  }, [loadConversations])

  const loadThread = useCallback(async (conv) => {
    if (!conv) return
    setMessages([])
    try {
      const { data } = await fetchConversationMessages({
        propertyId: conv.property?.id || 'general',
        otherId: conv.otherUser?.id,
      })
      setMessages(data)
      markConversationRead({ otherId: conv.otherUser?.id, propertyId: conv.property?.id }).catch(() => {})
      setConversations((current) =>
        current.map((c) => (c.id === conv.id ? { ...c, unreadCount: 0 } : c)),
      )
      refresh()
    } catch {
      setMessages([])
    }
  }, [refresh])

  useEffect(() => {
    if (active) loadThread(active)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active?.id])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSelect = (conv) => {
    setActive(conv)
  }

  const handleSend = async (e) => {
    e.preventDefault()
    if (!draft.trim() || sending || !active?.otherUser?.id) return
    setSending(true)
    const content = draft.trim()
    const optimistic = {
      id: `tmp-${Date.now()}`,
      senderId: user?.id,
      recipientId: active.otherUser.id,
      content,
      createdAt: new Date().toISOString(),
    }
    setMessages((current) => [...current, optimistic])
    setDraft('')
    try {
      await sendMessage({
        senderId: user?.id,
        recipientId: active.otherUser.id,
        content,
        propertyId: active.property?.id,
      })
      loadConversations()
      refresh()
    } catch (err) {
      setMessages((current) => current.filter((m) => m.id !== optimistic.id))
    } finally {
      setSending(false)
    }
  }

  const myId = user?.id

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card dark:border-slate-700 dark:bg-slate-900">
      <div className="grid md:grid-cols-[300px_1fr]">
        <div className="max-h-[560px] border-b border-slate-200 md:border-b-0 md:border-r dark:border-slate-700">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3.5 dark:border-slate-800">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Messages</h3>
            <button type="button" onClick={loadConversations} className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800" aria-label="Refresh conversations">
              <Icon name="refresh" size={16} />
            </button>
          </div>
          <ul className="max-h-[500px] overflow-y-auto">
            {loading && (
              <li className="px-4 py-8 text-center text-sm text-slate-400 dark:text-slate-500">Loading conversations...</li>
            )}
            {!loading && conversations.length === 0 && (
              <li className="px-4 py-8 text-center text-sm text-slate-400 dark:text-slate-500">
                No conversations yet. Message an owner from a property page.
              </li>
            )}
            {conversations.map((c) => (
              <li key={c.id}>
                <button
                  type="button"
                  onClick={() => handleSelect(c)}
                  className={`flex w-full items-start gap-3 px-4 py-3.5 text-left transition ${
                    active?.id === c.id ? 'bg-primary-50 dark:bg-slate-800' : 'hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-primary-600 text-sm font-bold text-white">
                    {(c.otherUser?.name || '?').split(' ').map((p) => p[0]).slice(0, 2).join('')}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center justify-between gap-2">
                      <span className="truncate text-sm font-bold text-slate-900 dark:text-white">{c.otherUser?.name}</span>
                      {c.unreadCount > 0 && (
                        <span className="grid h-5 min-w-5 place-items-center rounded-full bg-primary-600 px-1.5 text-[10px] font-bold text-white">
                          {c.unreadCount}
                        </span>
                      )}
                    </span>
                    <span className="block truncate text-xs text-slate-500 dark:text-slate-400">
                      {c.lastMessage?.content}
                    </span>
                    <span className="flex items-center justify-between gap-2">
                      <span className="mt-0.5 block truncate text-[11px] text-slate-400 dark:text-slate-500">
                        {c.property ? `${c.property.title} • ` : ''}
                        {timeLabel(c.lastMessageAt)}
                      </span>
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>

        <div className="flex flex-col">
          {active ? (
            <>
              <div className="border-b border-slate-100 px-5 py-4 dark:border-slate-800">
                <div className="flex items-center gap-3">
                  <Avatar name={active.otherUser?.name} seed={active.otherUser?.id?.charCodeAt(2) || 0} size={40} />
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-slate-900 dark:text-white">{active.otherUser?.name}</p>
                    {active.property ? (
                      <Link
                        to={`/properties/${active.property.id}`}
                        className="block truncate text-xs text-primary-600 hover:underline dark:text-primary-400"
                      >
                        {active.property.title} • {formatPrice(active.property.price)}/mo
                      </Link>
                    ) : (
                      <p className="text-xs text-slate-400 dark:text-slate-500">Property owner</p>
                    )}
                  </div>
                </div>
              </div>
              <div className="max-h-[380px] flex-1 space-y-3 overflow-y-auto bg-slate-50 p-5 dark:bg-slate-800">
                {messages.length === 0 && (
                  <p className="py-10 text-center text-sm text-slate-400 dark:text-slate-500">
                    No messages in this conversation yet.
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
              <form onSubmit={handleSend} className="flex items-center gap-2 border-t border-slate-100 p-4 dark:border-slate-800">
                <input
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  placeholder="Write a message..."
                  className="input !rounded-full dark:bg-slate-800 dark:border-slate-700 dark:text-white dark:placeholder-slate-500"
                  aria-label="Message body"
                />
                <button type="submit" disabled={sending} className="btn-primary !rounded-full !px-4" aria-label="Send message">
                  <Icon name="send" size={17} />
                </button>
              </form>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400 dark:text-slate-500">
              <Icon name="message" size={36} />
              <p className="mt-3 text-sm">Select a conversation</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
