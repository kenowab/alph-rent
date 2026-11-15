import { useState, useRef, useEffect, useCallback } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useLanguage } from '../../context/LanguageContext'
import { sendChatMessage } from '../../api/ai'
import Icon from '../ui/Icon'

const QUICK_ACTIONS = {
  en: [
    'How do I rent a property?',
    'Find 2 bedroom houses in Addis Ababa',
    'How do I list my property?',
    'What does "pending" mean?',
  ],
  om: [
    'Akkamitti qabeenya kireeffuu danda\'a?',
    'Manneen lammaata Addiis Ababaa keessatti argi',
    'Akkamitti qabeenya kee maxxansuu danda\'a?',
    '"pending" jalqabuun maan jira?',
  ],
  am: [
    'ንብረት እንዴት ኪራይ ማድረግ እችላለሁ?',
    'በአዲስ አበባ 2 መኝታ ቤቶችን ፈልግ',
    'ንብረቴን እንዴት ማስተዋወቅ እችላለሁ?',
    '"በመጠባበቅ ላይ" ማለት ማን ነው?',
  ],
}

export default function ChatBot() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)
  const { user } = useAuth()
  const { language, t } = useLanguage()

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages, scrollToBottom])

  useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus()
    }
  }, [open])

  const getGreeting = () => {
    const greetings = {
      en: "Hello! I'm Alpha Rental Platform AI assistant. I can help you find properties, answer questions about renting, and more. How can I help you?",
      om: "Nagaa! Alpha Rental Platform AI gargaaraa koo dha. Qabeenya barbaaduu,wwan waa'ee kireeffamaa gahee deebisuun. Akkamitti gargaaraa danda'a?",
      am: "ሰላም! እኔ Alpha Rental Platform AI እርዳታ ነኝ። ንብረቶችን ለማግኘት፣ ስለ ኪራይ ጥያቄዎችን ለመልስ እና ሌሎችንም ማድረግ እችላለሁ። እንዴት ልርዳዎ?",
    }
    return greetings[language] || greetings.en
  }

  useEffect(() => {
    if (messages.length === 0) {
      setMessages([{ role: 'assistant', content: getGreeting() }])
    }
  }, [language])

  const sendMessage = async (text) => {
    if (!text.trim() || loading) return

    const userMessage = { role: 'user', content: text.trim() }
    setMessages((prev) => [...prev, userMessage])
    setInput('')
    setLoading(true)

    try {
      const { data } = await sendChatMessage(text.trim())
      setMessages((prev) => [...prev, { role: 'assistant', content: data.reply }])
    } catch (err) {
      const errorMessages = {
        en: 'Sorry, something went wrong. Please try again.',
        om: "Waqqi, wrong konii jiru. Maaloo deebi'i yaadii.",
        am: 'ይቅርታ፣ ስህተት ተፈጥሯል። እባክዎን እንደገና ይሞክሩ።',
      }
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: errorMessages[language] || errorMessages.en },
      ])
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    sendMessage(input)
  }

  const placeholders = {
    en: 'Type your question...',
    om: 'Gahee kee barreessi...',
    am: 'ጥያቄዎን ይተይቡ...',
  }

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen(!open)}
        className={`fixed bottom-6 right-6 z-[80] flex h-14 w-14 items-center justify-center rounded-full shadow-lg transition-all duration-300 ${
          open
            ? 'bg-slate-700 text-white rotate-90 hover:bg-slate-600'
            : 'bg-primary-600 text-white hover:bg-primary-700 hover:scale-110'
        }`}
        aria-label={open ? 'Close AI chat' : 'Open AI chat'}
      >
        <Icon name={open ? 'x' : 'message-circle'} size={24} />
      </button>

      {!open && (
        <div className="fixed bottom-[5.5rem] right-6 z-[80] animate-fade-in-up">
          <div className="rounded-xl bg-slate-900 px-3 py-1.5 text-xs font-medium text-white shadow-lg">
            {language === 'om' ? 'Gargaaraa AI' : language === 'am' ? 'AI እርዳታ' : 'AI Assistant'}
          </div>
        </div>
      )}

      {/* Chat window */}
      {open && (
        <div className="fixed bottom-24 right-4 z-[85] flex w-[calc(100%-2rem)] max-w-[400px] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl animate-fade-in-up sm:right-6">
          {/* Header */}
          <div className="flex items-center gap-3 bg-primary-600 px-4 py-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20">
              <Icon name="message-circle" size={18} className="text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-bold text-white">
                Alpha Rental Platform AI
              </h3>
              <p className="text-[11px] text-white/70">
                {language === 'om'
                  ? 'Yeroo hunda jira'
                  : language === 'am'
                    ? 'ሁልጊዜ ተጓዦ ነው'
                    : 'Always available'}
              </p>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-4" style={{ maxHeight: '360px', minHeight: '240px' }}>
            {messages.length <= 1 && (
              <div className="mb-4 flex flex-wrap gap-2">
                {(QUICK_ACTIONS[language] || QUICK_ACTIONS.en).map((action) => (
                  <button
                    key={action}
                    onClick={() => sendMessage(action)}
                    className="rounded-full border border-primary-200 bg-primary-50 px-3 py-1.5 text-xs font-medium text-primary-700 transition hover:bg-primary-100"
                  >
                    {action}
                  </button>
                ))}
              </div>
            )}

            {messages.map((msg, i) => (
              <div key={i} className={`mb-3 flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-primary-600 text-white'
                      : 'bg-slate-100 text-slate-800'
                  }`}
                >
                  <div className="whitespace-pre-wrap break-words">{msg.content}</div>
                </div>
              </div>
            ))}

            {loading && (
              <div className="mb-3 flex justify-start">
                <div className="rounded-2xl bg-slate-100 px-4 py-3">
                  <div className="flex items-center gap-1.5">
                    <div className="h-2 w-2 animate-bounce rounded-full bg-slate-400" style={{ animationDelay: '0ms' }} />
                    <div className="h-2 w-2 animate-bounce rounded-full bg-slate-400" style={{ animationDelay: '150ms' }} />
                    <div className="h-2 w-2 animate-bounce rounded-full bg-slate-400" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <form onSubmit={handleSubmit} className="border-t border-slate-100 px-3 py-3">
            <div className="flex items-center gap-2">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={placeholders[language] || placeholders.en}
                disabled={loading}
                className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-800 placeholder-slate-400 transition focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100 disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={!input.trim() || loading}
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-600 text-white transition hover:bg-primary-700 disabled:opacity-40 disabled:cursor-not-allowed"
                aria-label="Send message"
              >
                <Icon name="send" size={16} />
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  )
}
