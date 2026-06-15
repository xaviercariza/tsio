import { createMessage, getGroup, getUserById, getUserSocketId } from '../store'
import { requireUser, router } from './tsio'

const chatRouter = router.create(a => ({
  chat: {
    sendMessage: a.chat.sendMessage.use(requireUser).handle(async ({ ctx, input, emit }) => {
      const group = createMessage({
        groupId: input.chatId,
        text: input.text,
        senderId: ctx.user.id,
      })

      for (const chatUser of group.users) {
        if (chatUser.id === ctx.user.id) {
          continue
        }

        const socketId = getUserSocketId(chatUser.id)
        if (socketId) {
          emit('chat.onMessageReceived', socketId, group)
        }
      }

      return { success: true, data: group }
    }),
    updateTypingState: a.chat.updateTypingState.use(requireUser).handle(async ({ ctx, input, emit }) => {
      const chat = getGroup(input.chatId)
      if (!chat) {
        return
      }

      const userTyping = getUserById(ctx.user.id)
      if (!userTyping) {
        throw new Error('User not found')
      }

      for (const chatUser of chat.users) {
        if (chatUser.id === ctx.user.id) {
          continue
        }

        const socketId = getUserSocketId(chatUser.id)
        if (socketId) {
          emit('chat.onUserIsTyping', socketId, {
            chatId: chat.id,
            nickname: userTyping.nickname,
            isTyping: input.isTyping,
          })
        }
      }
    }),
  },
}))

export { chatRouter }
