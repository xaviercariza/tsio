import { z } from 'zod'

export const UserSchema = z.object({
  id: z.string(),
  nickname: z.string(),
})

export const NewMessageSchema = z.object({
  chatId: z.string(),
  text: z.string().min(1),
})

export const MessageSchema = z.object({
  id: z.string(),
  text: z.string(),
  senderId: z.string(),
  receiverId: z.string(),
  sender: UserSchema,
  receiver: UserSchema,
  createdAt: z.string(),
})

export const GroupSchema = z.object({
  id: z.string(),
  messages: z.array(MessageSchema),
  users: z.array(UserSchema),
})
