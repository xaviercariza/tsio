import type { Group } from '../../types'
import { prisma } from '../prisma'
import { router } from './tsio'

const chatRouter = router.create(a => ({
  chat: {
    sendMessage: a.chat.sendMessage.handle(async ({ input, emit, ctx }) => {
      let existingChat = await prisma.group.findFirst({
        where: {
          AND: [
            {
              users: {
                some: { userId: input.senderId },
              },
            },
            {
              users: {
                some: { userId: input.receiverId },
              },
            },
          ],
        },
      })

      if (!existingChat) {
        existingChat = await prisma.group.create({
          data: {
            id: input.chatId,
            users: {
              create: [
                {
                  user: {
                    connect: { id: input.senderId },
                  },
                },
                {
                  user: {
                    connect: { id: input.receiverId },
                  },
                },
              ],
            },
          },
        })
      }

      const chat = await prisma.message.create({
        data: {
          text: input.text,
          receiverId: input.receiverId,
          senderId: input.senderId,
          groupId: existingChat.id,
        },
        include: {
          receiver: {
            select: { socketId: true },
          },
          group: {
            select: {
              id: true,
              messages: {
                include: {
                  sender: {
                    select: {
                      id: true,
                      nickname: true,
                    },
                  },
                  receiver: {
                    select: {
                      id: true,
                      nickname: true,
                    },
                  },
                },
              },
              users: {
                select: {
                  user: {
                    select: {
                      id: true,
                      nickname: true,
                    },
                  },
                },
              },
            },
          },
        },
      })

      const group = chat.group
      if (!group) {
        throw new Error('Message group not found')
      }

      if (!chat.receiver.socketId) {
        throw new Error('Receiver socketId not found')
      }

      const normalizedChat: Group = {
        ...group,
        users: group.users.map(u => u.user),
      }

      emit('chat.onMessageReceived', chat.receiver.socketId, normalizedChat)

      return { success: true, data: normalizedChat }
    }),
    updateTypingState: a.chat.updateTypingState.handle(async ({ input, emit }) => {
      const chat = await prisma.group.findUnique({
        where: {
          id: input.chatId,
        },
        select: {
          id: true,
          users: {
            select: {
              user: {
                select: {
                  id: true,
                  nickname: true,
                  socketId: true,
                },
              },
            },
          },
        },
      })
      if (!chat) {
        return
      }

      const userTyping = chat.users.find(u => u.user.id === input.userId)
      if (!userTyping) {
        throw new Error('User not found')
      }

      for (const chatUser of chat.users) {
        if (chatUser.user.socketId) {
          emit('chat.onUserIsTyping', chatUser.user.socketId, {
            chatId: chat.id,
            nickname: userTyping.user.nickname,
            isTyping: input.isTyping,
          })
        }
      }
    }),
  },
}))

export { chatRouter }
