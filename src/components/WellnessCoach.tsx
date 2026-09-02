import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Send, Bot, User, Sparkles, RotateCcw, Maximize2, Minimize2 } from 'lucide-react'
import clsx from 'clsx'

import { apiPost } from '../api/client'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: number
}

const SUGGESTED_PROMPTS = [
  'How am I doing today?',
  'What did I eat today and is it enough?',
  'Why is my score low?',
  'Am I hitting my step goal?',
  'What should I focus on right now?',
  'How is my water intake today?',
]

// ---------------------------------------------------------------------------
// Message bubble
// ---------------------------------------------------------------------------
function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === 'user'
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={clsx('flex gap-2.5', isUser && 'flex-row-reverse')}
    >
      <div className={clsx(
        'w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5',
        isUser ? 'bg-lp-primary/20' : 'bg-[#6366F1]/20',
      )}>
        {isUser
          ? <User size={13} className="text-lp-primary" />
          : <Bot size={13} className="text-[#6366F1]" />
        }
      </div>
      <div className={clsx(
        'max-w-[82%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed',
        isUser
          ? 'bg-lp-primary/10 text-black/80 dark:text-white/80 rounded-tr-sm'
          : 'bg-black/[0.05] dark:bg-white/[0.07] text-black/75 dark:text-white/70 rounded-tl-sm',
      )}>
        {message.content}
      </div>
    </motion.div>
  )
}

// ---------------------------------------------------------------------------
// Typing indicator
// ---------------------------------------------------------------------------
function TypingIndicator() {
  return (
    <div className="flex gap-2.5">
      <div className="w-7 h-7 rounded-xl bg-[#6366F1]/20 flex items-center justify-center flex-shrink-0">
        <Bot size={13} className="text-[#6366F1]" />
      </div>
      <div className="px-3.5 py-3 rounded-2xl rounded-tl-sm bg-black/[0.05] dark:bg-white/[0.07] flex items-center gap-1.5">
        {[0, 1, 2].map(i => (
          <motion.div
            key={i}
            className="w-1.5 h-1.5 rounded-full bg-black/30 dark:bg-white/30"
            animate={{ y: [0, -4, 0] }}
            transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
          />
        ))}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// WellnessCoach panel
// ---------------------------------------------------------------------------
interface WellnessCoachProps {
  open: boolean
  onClose: () => void
}

export default function WellnessCoach({ open, onClose }: WellnessCoachProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [expanded, setExpanded] = useState(false)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 300)
  }, [open])

  const sendMessage = useCallback(async (text: string) => {
    const trimmed = text.trim()
    if (!trimmed || loading) return

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: trimmed,
      timestamp: Date.now(),
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setLoading(true)
    setError(null)

    try {
      // All messages in conversation so far — backend uses them for context
      const history = [...messages, userMessage].map(m => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      }))

      // Call our secure backend proxy — API key never leaves the server
      const res = await apiPost<{ success: boolean; data: { reply: string } }>(
        '/api/ai/chat',
        { messages: history },
      )

      const assistantMessage: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: res.data.reply,
        timestamp: Date.now(),
      }

      setMessages(prev => [...prev, assistantMessage])
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      console.error('[WellnessCoach] Error:', message)
      setError(`Could not reach the wellness coach: ${message}`)
    } finally {
      setLoading(false)
    }
  }, [loading, messages])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage(input)
    }
  }

  const clearConversation = () => {
    setMessages([])
    setError(null)
    setInput('')
  }

  const isEmpty = messages.length === 0

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Mobile backdrop */}
          <motion.div
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 md:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Panel */}
          <motion.div
            className="fixed bottom-4 right-4 z-[9999] flex flex-col rounded-2xl border border-black/[0.08] dark:border-white/[0.08] shadow-2xl overflow-hidden"
            style={{
              width: expanded ? Math.min(640, window.innerWidth - 32) : Math.min(360, window.innerWidth - 32),
              height: expanded ? Math.min(700, window.innerHeight - 80) : 520,
              transition: 'width 0.25s ease, height 0.25s ease',
            }}
            initial={{ opacity: 0, y: 24, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.97 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 bg-white dark:bg-slate-900 border-b border-black/[0.06] dark:border-white/[0.06] flex-shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#6366F1]/15 flex items-center justify-center">
                  <Sparkles size={15} className="text-[#6366F1]" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-black/80 dark:text-white/80">Wellness Coach</div>
                  <div className="text-[10px] text-black/35 dark:text-white/30">Knows your steps, meals, mood & more</div>
                </div>
              </div>
              <div className="flex items-center gap-1">
                {messages.length > 0 && (
                  <button
                    type="button"
                    onClick={clearConversation}
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-black/35 dark:text-white/30 hover:bg-black/[0.06] dark:hover:bg-white/[0.08] hover:text-black/60 dark:hover:text-white/60 transition-all"
                    title="Clear conversation"
                  >
                    <RotateCcw size={13} />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setExpanded(e => !e)}
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-black/35 dark:text-white/30 hover:bg-black/[0.06] dark:hover:bg-white/[0.08] hover:text-black/60 dark:hover:text-white/60 transition-all"
                  title={expanded ? 'Minimize' : 'Expand'}
                  aria-label={expanded ? 'Minimize chat' : 'Expand chat'}
                >
                  {expanded ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
                </button>
                <button
                  type="button"
                  onClick={() => { onClose(); setExpanded(false) }}
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-black/35 dark:text-white/30 hover:bg-black/[0.06] dark:hover:bg-white/[0.08] hover:text-black/60 dark:hover:text-white/60 transition-all"
                  aria-label="Close"
                >
                  <X size={14} />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-slate-50 dark:bg-[#0d1320]">
              {isEmpty && (
                <div className="flex flex-col items-center justify-center h-full gap-4 pb-4">
                  <div className="w-12 h-12 rounded-2xl bg-[#6366F1]/15 flex items-center justify-center">
                    <Sparkles size={22} className="text-[#6366F1]" />
                  </div>
                  <div className="text-center">
                    <div className="text-sm font-semibold text-black/70 dark:text-white/70">
                      Your Wellness Coach
                    </div>
                    <div className="text-xs text-black/40 dark:text-white/35 mt-1 leading-relaxed max-w-[240px]">
                      I know your steps, meals, mood, sleep, water, streak and more — ask me anything.
                    </div>
                  </div>
                  <div className="w-full space-y-1.5">
                    {SUGGESTED_PROMPTS.map(prompt => (
                      <button
                        key={prompt}
                        type="button"
                        onClick={() => sendMessage(prompt)}
                        className="w-full text-left px-3 py-2 rounded-xl text-xs text-black/60 dark:text-white/55 bg-white dark:bg-slate-800 border border-black/[0.07] dark:border-white/[0.07] hover:bg-[#6366F1]/10 hover:border-[#6366F1]/25 hover:text-[#6366F1] transition-all duration-150"
                      >
                        {prompt}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {messages.map(msg => (
                <MessageBubble key={msg.id} message={msg} />
              ))}

              {loading && <TypingIndicator />}

              {error && (
                <div className="px-3 py-2.5 rounded-xl bg-lp-alert/10 border border-lp-alert/20">
                  <p className="text-xs text-lp-alert">{error}</p>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="flex-shrink-0 px-3 py-3 bg-white dark:bg-slate-900 border-t border-black/[0.06] dark:border-white/[0.06]">
              <div className="flex items-end gap-2">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask about your wellness data…"
                  rows={1}
                  disabled={loading}
                  className="flex-1 resize-none px-3 py-2.5 rounded-xl border border-black/[0.08] dark:border-white/[0.08] bg-black/[0.02] dark:bg-white/[0.04] text-sm text-black/75 dark:text-white/70 placeholder:text-black/25 dark:placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-[#6366F1]/40 transition-all disabled:opacity-50 max-h-24 leading-relaxed"
                  style={{ scrollbarWidth: 'none' }}
                />
                <button
                  type="button"
                  onClick={() => sendMessage(input)}
                  disabled={!input.trim() || loading}
                  className="w-9 h-9 rounded-xl bg-[#6366F1] flex items-center justify-center text-white hover:bg-indigo-500 hover:shadow-lg hover:shadow-[#6366F1]/25 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0"
                  aria-label="Send"
                >
                  <Send size={15} />
                </button>
              </div>
              <div className="text-[10px] text-black/20 dark:text-white/15 mt-1.5 px-1">
                Enter to send · Shift+Enter for new line
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}