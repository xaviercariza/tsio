import { createClient, type TsIoClient } from '@tsio/core'
import { socketioClient } from '@tsio/socketio/client'
import type React from 'react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { io } from 'socket.io-client'
import { chatContract } from '../server/tsio/contract'
import type { DemoSnapshot, Group, UserProfile } from '../types'
import { api } from '../utils/api'
import { Avatar } from './Avatar'
import { Spinner } from './Spinner'

function DemoChatPanel({
  user,
  peer,
  initialChat,
}: {
  user: UserProfile
  peer: UserProfile
  initialChat: Group
}) {
  const [chat, setChat] = useState(initialChat)
  const [text, setText] = useState('')
  const [connected, setConnected] = useState(false)
  const [sending, setSending] = useState(false)
  const [typingUser, setTypingUser] = useState<string | null>(null)
  const [sendError, setSendError] = useState<string | null>(null)
  const clientRef = useRef<TsIoClient<typeof chatContract> | null>(null)
  const typingStateRef = useRef(false)
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const sendTypingState = useCallback((isTyping: boolean) => {
    const client = clientRef.current
    if (!client || typingStateRef.current === isTyping) {
      return
    }

    typingStateRef.current = isTyping
    client.actions.chat.updateTypingState({ chatId: initialChat.id, isTyping })
  }, [initialChat.id])

  useEffect(() => {
    setChat(initialChat)
  }, [initialChat])

  useEffect(() => {
    const socket = io({
      auth: { userId: user.id },
      transports: ['websocket'],
    })
    const client = createClient(chatContract, socketioClient(socket))

    clientRef.current = client

    const messageEvent = client.events.chat.onMessageReceived(nextChat => {
      setChat(nextChat)
    })

    const typingEvent = client.events.chat.onUserIsTyping(event => {
      if (event.chatId !== initialChat.id) {
        return
      }

      setTypingUser(event.isTyping ? event.nickname : null)
    })

    socket.on('connect', () => {
      setConnected(true)
      setSendError(null)
    })

    socket.on('disconnect', () => {
      setConnected(false)
    })

    socket.on('connect_error', error => {
      setConnected(false)
      setSendError(error.message)
    })

    return () => {
      messageEvent.unsubscribe()
      typingEvent.unsubscribe()
      socket.disconnect()
      clientRef.current = null

      if (typingTimerRef.current) {
        clearTimeout(typingTimerRef.current)
      }
    }
  }, [initialChat.id, user.id])

  const handleTextChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const nextText = event.target.value
    setText(nextText)

    if (typingTimerRef.current) {
      clearTimeout(typingTimerRef.current)
    }

    if (!nextText.trim()) {
      sendTypingState(false)
      return
    }

    sendTypingState(true)
    typingTimerRef.current = setTimeout(() => sendTypingState(false), 1200)
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const client = clientRef.current
    const messageText = text.trim()
    if (!client || !messageText) {
      return
    }

    setSending(true)
    sendTypingState(false)
    setSendError(null)

    const result = await client.actions.chat.sendMessage({
      chatId: chat.id,
      text: messageText,
    })

    if (result.success) {
      setChat(result.data)
      setText('')
    } else {
      setSendError(result.error)
    }

    setSending(false)
  }

  return (
    <section className="flex min-h-[520px] flex-col overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm md:min-h-[620px] xl:h-[calc(100vh-9rem)]">
      <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-4 py-3">
        <Avatar nickname={user.nickname} displayName size="md">
          <span className={connected ? 'text-xs text-emerald-600' : 'text-xs text-slate-400'}>
            {connected ? 'connected' : 'connecting'}
          </span>
        </Avatar>
        <div className="rounded-md border border-slate-200 bg-slate-50 px-2 py-1 font-mono text-xs text-slate-500">
          {user.id}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto bg-slate-50 p-4">
        <div className="flex flex-col gap-3">
          {chat.messages.map(message => {
            const isOwnMessage = message.senderId === user.id

            return (
              <div
                key={message.id}
                className={isOwnMessage ? 'flex justify-end' : 'flex justify-start'}
              >
                <div
                  className={
                    isOwnMessage
                      ? 'max-w-[82%] rounded-lg bg-blue-600 px-3 py-2 text-sm text-white shadow-sm'
                      : 'max-w-[82%] rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm'
                  }
                >
                  <div className={isOwnMessage ? 'text-blue-100' : 'text-slate-400'}>
                    {message.sender.nickname}
                  </div>
                  <div className="break-words leading-relaxed">{message.text}</div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <div className="border-t border-slate-200 bg-white p-3">
        <div className="mb-2 h-5 text-xs text-slate-500">
          {sendError ?? (typingUser ? `${typingUser} is typing` : `To ${peer.nickname}`)}
        </div>
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="text"
            value={text}
            onChange={handleTextChange}
            placeholder={`Message ${peer.nickname}`}
            className="min-w-0 flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
          <button
            type="submit"
            disabled={sending || !connected || !text.trim()}
            className="inline-flex h-10 min-w-20 items-center justify-center rounded-md bg-blue-600 px-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            {sending ? <Spinner className="h-4 w-4" /> : 'Send'}
          </button>
        </form>
      </div>
    </section>
  )
}

export function DemoPlayground() {
  const [snapshot, setSnapshot] = useState<DemoSnapshot | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let ignore = false

    async function loadDemo() {
      const response = await api<DemoSnapshot>('/api/demo', {
        method: 'GET',
        headers: {
          'Cache-Control': 'no-cache',
        },
      })

      if (ignore) {
        return
      }

      if (!response.success) {
        setError(response.error)
        return
      }

      setSnapshot(response.data)
    }

    loadDemo()

    return () => {
      ignore = true
    }
  }, [])

  if (error) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-100 p-6 text-slate-900">
        <div className="rounded-lg border border-red-200 bg-white p-5 text-red-700 shadow-sm">
          {error}
        </div>
      </main>
    )
  }

  if (!snapshot) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-100 p-6 text-slate-900">
        <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <Spinner className="h-5 w-5 text-blue-600" />
          <span className="text-sm font-medium text-slate-600">Loading playground</span>
        </div>
      </main>
    )
  }

  const [alice, bob] = snapshot.users
  if (!alice || !bob) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-100 p-6 text-slate-900">
        <div className="rounded-lg border border-red-200 bg-white p-5 text-red-700 shadow-sm">
          Demo users are missing
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-slate-100 text-slate-900">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 p-4 md:p-6">
        <header className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
          <div>
            <h1 className="text-2xl font-semibold text-slate-950">tsio playground</h1>
          </div>
        </header>

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          <DemoChatPanel
            user={alice}
            peer={bob}
            initialChat={snapshot.chat}
          />
          <DemoChatPanel
            user={bob}
            peer={alice}
            initialChat={snapshot.chat}
          />
        </div>
      </div>
    </main>
  )
}
