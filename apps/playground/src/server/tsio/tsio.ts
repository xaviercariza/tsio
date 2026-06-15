import { createServer } from '@tsio/core'
import type { Socket } from 'socket.io'
import type { UserProfile } from '../../types'
import { chatContract } from './contract'

type Context = { user: UserProfile | null; socket: Socket }

const tsio = createServer.context<Context>().create(chatContract)
const router = tsio.router
const middleware = tsio.middleware
const attach = tsio.attach

const requireUser = middleware(({ ctx, next }) => {
  if (!ctx.user) {
    return { ok: false, error: new Error('Unauthorized') }
  }

  return next({
    ctx: {
      user: ctx.user,
    },
  })
})

export { attach, middleware, requireUser, router }
