import { contract, createClient, createServer, type TResponse, type TsIoClientAdapter } from '@tsio/core'
import { expectTypeOf } from 'vitest'
import { z } from 'zod'

const MessageInputSchema = z.object({
  text: z.string(),
})

const MessageSchema = z.object({
  id: z.string(),
  text: z.string(),
})

const api = contract({
  actions: {
    sendMessage: {
      type: 'action',
      input: MessageInputSchema,
      response: MessageSchema,
    },
    markRead: {
      type: 'action',
      input: z.object({ messageId: z.string() }),
    },
  },
  events: {
    onMessage: {
      type: 'event',
      data: MessageSchema,
    },
  },
})

type Context = {
  requestId: string
}

const tsio = createServer.context<Context>().create(api)

tsio.router.create(a => ({
  actions: {
    sendMessage: a.actions.sendMessage.handle(({ input, emit }) => {
      expectTypeOf(input).toEqualTypeOf<{ text: string }>()

      emit('events.onMessage', 'socket-1', { id: 'message-1', text: input.text })

      // @ts-expect-error action paths cannot be emitted as events
      emit('actions.sendMessage', 'socket-1', { id: 'message-1', text: input.text })

      // @ts-expect-error event payload must match its schema
      emit('events.onMessage', 'socket-1', { id: 'message-1' })

      return {
        success: true,
        data: {
          id: 'message-1',
          text: input.text,
        },
      }
    }),
    markRead: a.actions.markRead.handle(({ input }) => {
      expectTypeOf(input).toEqualTypeOf<{ messageId: string }>()
    }),
  },
  events: {},
}))

declare const adapter: TsIoClientAdapter<typeof api>
const client = createClient(api, adapter)

type SendMessage = typeof client.actions.actions.sendMessage
type SendMessageResult = ReturnType<SendMessage>

expectTypeOf<Parameters<SendMessage>[0]>().toEqualTypeOf<{ text: string }>()
expectTypeOf<SendMessageResult>().toEqualTypeOf<
  Promise<TResponse<{ id: string; text: string }>> | TResponse<{ id: string; text: string }>
>()

client.actions.actions.markRead({ messageId: 'message-1' })

// @ts-expect-error action input must match its schema
client.actions.actions.sendMessage({ wrong: 'field' })

// @ts-expect-error events are not exposed as actions
client.actions.events.onMessage({ id: 'message-1', text: 'hello' })

client.events.events.onMessage(data => {
  expectTypeOf(data).toEqualTypeOf<{ id: string; text: string }>()
})

// @ts-expect-error actions are not exposed as events
client.events.actions.sendMessage(() => {})
