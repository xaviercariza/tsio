import { useEffect, useState } from 'react'
import { useTsIo } from '../components/TsIoProvider'

export function useUserIsTyping(chatId: string | undefined, userId: string, isTyping: boolean) {
  const tsIo = useTsIo()
  const [userTyping, setUserTyping] = useState<string | null>(null)

  useEffect(() => {
    if (tsIo && chatId) {
      tsIo.actions.chat.updateTypingState({ chatId, userId, isTyping: isTyping })
    }
  }, [isTyping, chatId, tsIo, userId])

  useEffect(() => {
    if (tsIo) {
      const event = tsIo.events.chat.onUserIsTyping(
        ({ chatId: chatIdFromServer, nickname, isTyping }) => {
          if (chatIdFromServer === chatId) {
            setUserTyping(isTyping ? nickname : null)
          }
        }
      )

      return () => {
        event.unsubscribe()
      }
    }
  }, [chatId, tsIo])

  return { userTyping }
}
