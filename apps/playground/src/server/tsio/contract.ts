import { contract } from '@tsio/core'
import { z } from 'zod'
import { GroupSchema, NewMessageSchema } from './schemas'

const chatContract = contract({
  chat: {
    sendMessage: {
      type: 'action',
      input: NewMessageSchema,
      response: GroupSchema,
    },
    onMessageReceived: {
      type: 'event',
      data: GroupSchema,
    },
    updateTypingState: {
      type: 'action',
      input: z.object({ chatId: z.string(), userId: z.string(), isTyping: z.boolean() }),
    },
    onUserIsTyping: {
      type: 'event',
      data: z.object({ chatId: z.string(), nickname: z.string(), isTyping: z.boolean() }),
    },
  },
})

export { chatContract }
