import { useEffect } from 'react'
import type { UserProfile } from '../../types'
import { Chat } from '../Chat'
import { useChat } from '../ChatProvider/ChatProvider'
import { Layout } from '../Layout'
import { SideBar } from '../SideBar'
import { useTsIo } from '../TsIoProvider'

type Proops = { user: UserProfile; onLogOut: () => void }

export function MainScreen({ user, onLogOut }: Proops) {
  const tsIo = useTsIo()
  const chat = useChat()

  useEffect(() => {
    if (tsIo) {
      const event = tsIo.events.chat.onMessageReceived(newChat => {
        chat.dispatch({
          type: 'UPDATE_CHAT',
          payload: { chat: newChat },
        })
      })

      return () => {
        event.unsubscribe()
      }
    }
  }, [chat.dispatch, tsIo])

  return (
    <Layout>
      <SideBar user={user} onLoggedOut={onLogOut} />
      <div className="container mx-auto flex items-center justify-center py-2 max-w-4xl h-screen">
        <Chat user={user} />
      </div>
    </Layout>
  )
}
