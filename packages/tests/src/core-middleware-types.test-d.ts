import { defineContract, initTsIo } from '@tsio/core'
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

const contract = defineContract({
  actions: {
    secureAction: {
      type: 'action',
      input: z.object({ reason: z.string() }),
    },
    publicAction: {
      type: 'action',
      input: z.object({ message: z.string() }),
    },
  },
  events: {},
})

const tsIo = initTsIo.context<Context>().create(contract)

const requireUser = tsIo.middleware(async ({ ctx, next }) => {
  expectTypeOf(ctx.user).toEqualTypeOf<User | null>()

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
    secureAction: a.actions.secureAction.use(requireAdmin).handler(({ ctx, input }) => {
      expectTypeOf(ctx.requestId).toEqualTypeOf<string>()
      expectTypeOf(ctx.user).toEqualTypeOf<User>()
      expectTypeOf(ctx.isAdmin).toEqualTypeOf<true>()
      expectTypeOf(input).toEqualTypeOf<{ reason: string }>()
    }),
    publicAction: a.actions.publicAction.handler(({ ctx, input }) => {
      expectTypeOf(ctx.user).toEqualTypeOf<User | null>()
      expectTypeOf(input).toEqualTypeOf<{ message: string }>()
    }),
  },
  events: {},
}))
