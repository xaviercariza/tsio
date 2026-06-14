import { defineContract, initNewClient, initTsIo, type TResponse, type TsIoClientAdapter } from '@tsio/core'
import { expectTypeOf } from 'vitest'
import { z } from 'zod'

type User = {
  id: string
  role: 'admin' | 'member'
}

type Context = {
  requestId: string
  user: User | null
}

const MessageInputSchema = z.object({
  text: z.string(),
})

const MessageSchema = z.object({
  id: z.string(),
  text: z.string(),
})

const contract = defineContract({
  actions: {
    sendMessage: {
      type: 'action',
      input: MessageInputSchema,
      response: MessageSchema,
    },
    adminOnly: {
      type: 'action',
      input: z.object({ reason: z.string() }),
    },
  },
  events: {
    onMessage: {
      type: 'listener',
      data: MessageSchema,
    },
  },
})

const tsIo = initTsIo.context<Context>().create(contract)

const requireUser = tsIo.middleware(async ({ ctx, next }) => {
  if (!ctx.user) {
    return { ok: false, error: new Error('Unauthorized') }
  }

  return next({
    ctx: {
      user: ctx.user,
    },
  })
})

const requireAdmin = requireUser.pipe(async ({ ctx, next }) => {
  expectTypeOf(ctx.user).toEqualTypeOf<User>()

  if (ctx.user.role !== 'admin') {
    return { ok: false, error: new Error('Forbidden') }
  }

  return next({
    ctx: {
      isAdmin: true as const,
    },
  })
})

tsIo.router.create(a => ({
  actions: {
    sendMessage: a.actions.sendMessage.use(requireUser).handler(({ ctx, input, path, emitEventTo }) => {
      expectTypeOf(ctx.requestId).toEqualTypeOf<string>()
      expectTypeOf(ctx.user).toEqualTypeOf<User>()
      expectTypeOf(input).toEqualTypeOf<{ text: string }>()
      expectTypeOf(path).toEqualTypeOf<string>()

      emitEventTo('events.onMessage', 'socket-1', { id: ctx.user.id, text: input.text })

      // @ts-expect-error action paths cannot be emitted as listener events
      emitEventTo('actions.sendMessage', 'socket-1', { id: ctx.user.id, text: input.text })

      // @ts-expect-error listener payload must match the listener schema
      emitEventTo('events.onMessage', 'socket-1', { id: ctx.user.id })

      return {
        success: true,
        data: {
          id: ctx.user.id,
          text: input.text,
        },
      }
    }),
    adminOnly: a.actions.adminOnly.use(requireAdmin).handler(({ ctx, input }) => {
      expectTypeOf(ctx.user).toEqualTypeOf<User>()
      expectTypeOf(ctx.isAdmin).toEqualTypeOf<true>()
      expectTypeOf(input).toEqualTypeOf<{ reason: string }>()
    }),
  },
  events: {},
}))

declare const adapter: TsIoClientAdapter<typeof contract>
const client = initNewClient(adapter, contract)

expectTypeOf(client.actions.actions.sendMessage).parameter(0).toEqualTypeOf<{ text: string }>()
expectTypeOf(client.actions.actions.sendMessage({ text: 'hello' })).toEqualTypeOf<
  Promise<TResponse<{ id: string; text: string }>> | TResponse<{ id: string; text: string }>
>()

client.actions.actions.adminOnly({ reason: 'maintenance' })

// @ts-expect-error action input must match its schema
client.actions.actions.sendMessage({ wrong: 'field' })

// @ts-expect-error listeners are not exposed as actions
client.actions.events.onMessage({ id: 'message-1', text: 'hello' })

client.listeners.events.onMessage(data => {
  expectTypeOf(data).toEqualTypeOf<{ id: string; text: string }>()
})

// @ts-expect-error actions are not exposed as listeners
client.listeners.actions.sendMessage(() => {})
