import { createMessage, getGroup, getUserById, getUserSocketId } from '../store'
import { router } from './tsio'

const chatRouter = router.create(a => ({
  chat: {
    sendMessage: a.chat.sendMessage.handle(async ({ input, emit }) => {
      const group = createMessage({
        groupId: input.chatId,
        text: input.text,
        senderId: input.senderId,
        receiverId: input.receiverId,
      })

      const receiverSocketId = getUserSocketId(input.receiverId)
      if (receiverSocketId) {
        emit('chat.onMessageReceived', receiverSocketId, group)
      }

      return { success: true, data: group }
    }),
    updateTypingState: a.chat.updateTypingState.handle(async ({ input, emit }) => {
      const chat = getGroup(input.chatId)
      if (!chat) {
        return
      }

      const userTyping = getUserById(input.userId)
      if (!userTyping) {
        throw new Error('User not found')
      }

      for (const chatUser of chat.users) {
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
