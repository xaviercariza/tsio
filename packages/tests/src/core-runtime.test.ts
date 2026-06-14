import { defineContract, initTsIo, type TsIoServerAdapter } from '@tsio/core'
import { describe, expect, it, vi } from 'vitest'
import { z } from 'zod'

function createAdapter() {
  const handlers = new Map<string, (input: unknown) => unknown>()
  const adapter: TsIoServerAdapter<any> = {
    emitTo: vi.fn(),
    on: vi.fn((event, handler) => {
      handlers.set(event, handler as (input: unknown) => unknown)
    }),
  }

  return { adapter, handlers }
}

describe('core runtime', () => {
  it('registers nested action paths and forwards resolver params', async () => {
    const contract = defineContract({
      posts: {
        create: {
          type: 'action',
          input: z.object({ title: z.string() }),
          response: z.object({ id: z.string(), title: z.string() }),
        },
      },
      events: {},
    })
    const ctx = { requestId: 'request-1' }
    const tsIo = initTsIo.context<typeof ctx>().create(contract)
    const actionHandler = vi.fn(({ input }) => ({ success: true, data: { id: 'post-1', ...input } }))
    const router = tsIo.router.create(a => ({
      posts: {
        create: a.posts.create.handler(actionHandler),
      },
      events: {},
    }))
    const { adapter, handlers } = createAdapter()

    tsIo.attachRouterToSocket({ router, adapter, createContext: () => ctx })
    const result = await handlers.get('posts.create')?.({ title: 'Hello' })

    expect(result).toStrictEqual({ success: true, data: { id: 'post-1', title: 'Hello' } })
    expect(actionHandler).toHaveBeenCalledWith({
      path: 'posts.create',
      ctx,
      input: { title: 'Hello' },
      emitEventTo: adapter.emitTo,
    })
  })

  it('validates action input when validation is enabled', async () => {
    const contract = defineContract({
      posts: {
        create: {
          type: 'action',
          input: z.object({ title: z.string() }),
          response: z.object({ id: z.string(), title: z.string() }),
          options: { validate: true },
        },
      },
      events: {},
    })
    const tsIo = initTsIo.context<object>().create(contract)
    const actionHandler = vi.fn(() => ({ success: true, data: { id: 'post-1', title: 'Hello' } }))
    const router = tsIo.router.create(a => ({
      posts: {
        create: a.posts.create.handler(actionHandler),
      },
      events: {},
    }))
    const { adapter, handlers } = createAdapter()

    tsIo.attachRouterToSocket({ router, adapter, createContext: () => ({}) })

    await expect(handlers.get('posts.create')?.({ title: 123 })).rejects.toThrow()
    expect(actionHandler).not.toHaveBeenCalled()
  })

  it('validates successful action responses when validation is enabled', async () => {
    const contract = defineContract({
      posts: {
        create: {
          type: 'action',
          input: z.object({ title: z.string() }),
          response: z.object({ id: z.string(), title: z.string() }),
          options: { validate: true },
        },
      },
      events: {},
    })
    const tsIo = initTsIo.context<object>().create(contract)
    const router = tsIo.router.create(a => ({
      posts: {
        create: a.posts.create.handler(({ input }) => ({
          success: true,
          data: { id: 123, title: input.title } as any,
        })),
      },
      events: {},
    }))
    const { adapter, handlers } = createAdapter()

    tsIo.attachRouterToSocket({ router, adapter, createContext: () => ({}) })

    await expect(handlers.get('posts.create')?.({ title: 'Hello' })).rejects.toThrow()
  })
})
