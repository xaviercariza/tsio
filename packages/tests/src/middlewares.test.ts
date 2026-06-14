import { contract, createServer } from '@tsio/core'
import { describe, expect, it, vi } from 'vitest'
import { z } from 'zod'

const PostSchema = z.object({
  id: z.string(),
  title: z.string(),
  body: z.string().optional(),
})

const api = contract({
  actionsRouter: {
    actionWithoutMiddlewares: {
      type: 'action',
      input: PostSchema.omit({ id: true }),
    },
    actionWithEmptyMiddleware: {
      type: 'action',
      input: PostSchema.omit({ id: true }),
    },
    actionWithUserMiddleware: {
      type: 'action',
      input: PostSchema.omit({ id: true }),
    },
  },
  eventsRouter: {},
})

type Context = { userName: string }

const initialContext = { userName: 'Xavier' }
const s = createServer.context<Context>().create(api)
const emptyContextMiddleware = s.middleware(
  vi.fn().mockImplementation(opts => {
    return opts.next()
  })
)

const userMiddleware = s.middleware(
  vi.fn().mockImplementation(opts => {
    return opts.next({
      ctx: {
        userName: 'Clara',
      },
    })
  })
)

const actionWithoutMiddlewaresHandler = vi.fn()
const actionWithEmptyMiddlewareHandler = vi.fn()
const actionWithUserMiddlewareHandler = vi.fn()

const actionsRouter = s.router.actionsRouter.create(a => ({
  actionWithoutMiddlewares: a.actionWithoutMiddlewares.handle(actionWithoutMiddlewaresHandler),
  actionWithEmptyMiddleware: a.actionWithEmptyMiddleware
    .use(emptyContextMiddleware)
    .handle(actionWithEmptyMiddlewareHandler),
  actionWithUserMiddleware: a.actionWithUserMiddleware
    .use(userMiddleware)
    .handle(actionWithUserMiddlewareHandler),
}))
const router = s.router.create({
  actionsRouter,
  eventsRouter: {},
})

describe('middlewares', () => {
  it('should call handler w/ initial context', async () => {
    await router.actionsRouter.actionWithoutMiddlewares({
      ctx: initialContext,
      path: 'action-key',
      input: {
        title: 'This is the title',
        body: 'This is the body',
      },
      emit: vi.fn(),
    })

    expect(actionWithoutMiddlewaresHandler).toHaveBeenCalledTimes(1)
    expect(actionWithoutMiddlewaresHandler).toHaveBeenCalledWith(
      expect.objectContaining({
        ctx: initialContext,
      })
    )

    await router.actionsRouter.actionWithEmptyMiddleware({
      ctx: initialContext,
      path: 'action-key',
      input: {
        title: 'This is the title',
        body: 'This is the body',
      },
      emit: vi.fn(),
    })

    expect(actionWithEmptyMiddlewareHandler).toHaveBeenCalledTimes(1)
    expect(actionWithEmptyMiddlewareHandler).toHaveBeenCalledWith(
      expect.objectContaining({
        ctx: initialContext,
      })
    )
  })

  it('should call handler w/ updated context from middleware', async () => {
    await router.actionsRouter.actionWithUserMiddleware({
      ctx: initialContext,
      path: 'action-key',
      input: {
        title: 'This is the title',
        body: 'This is the body',
      },
      emit: vi.fn(),
    })

    expect(actionWithUserMiddlewareHandler).toHaveBeenCalledTimes(1)
    expect(actionWithUserMiddlewareHandler).toHaveBeenCalledWith(
      expect.objectContaining({
        ctx: {
          userName: 'Clara',
        },
      })
    )
  })
})
