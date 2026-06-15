import { contract, createServer, type TsIoServerAdapter } from '@tsio/core'
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
    const api = contract({
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
    const tsio = createServer.context<typeof ctx>().create(api)
    const actionHandler = vi.fn(({ input }) => ({
      success: true as const,
      data: { id: 'post-1', ...input },
    }))
    const router = tsio.router.create(a => ({
      posts: {
        create: a.posts.create.handle(actionHandler),
      },
      events: {},
    }))
    const { adapter, handlers } = createAdapter()

    tsio.attach({ router, adapter, createContext: () => ctx })
    const result = await handlers.get('posts.create')?.({ title: 'Hello' })

    expect(result).toStrictEqual({ success: true, data: { id: 'post-1', title: 'Hello' } })
    expect(actionHandler).toHaveBeenCalledWith({
      path: 'posts.create',
      ctx,
      input: { title: 'Hello' },
      emit: adapter.emitTo,
    })
  })

  it('validates action input when validation is enabled', async () => {
    const api = contract({
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
    const tsio = createServer.context<object>().create(api)
    const actionHandler = vi.fn(() => ({
      success: true as const,
      data: { id: 'post-1', title: 'Hello' },
    }))
    const router = tsio.router.create(a => ({
      posts: {
        create: a.posts.create.handle(actionHandler),
      },
      events: {},
    }))
    const { adapter, handlers } = createAdapter()

    tsio.attach({ router, adapter, createContext: () => ({}) })

    await expect(handlers.get('posts.create')?.({ title: 123 })).rejects.toThrow()
    expect(actionHandler).not.toHaveBeenCalled()
  })

  it('validates successful action responses when validation is enabled', async () => {
    const api = contract({
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
    const tsio = createServer.context<object>().create(api)
    const router = tsio.router.create(a => ({
      posts: {
        create: a.posts.create.handle(({ input }) => ({
          success: true as const,
          data: { id: 123, title: input.title } as any,
        })),
      },
      events: {},
    }))
    const { adapter, handlers } = createAdapter()

    tsio.attach({ router, adapter, createContext: () => ({}) })

    await expect(handlers.get('posts.create')?.({ title: 'Hello' })).rejects.toThrow()
  })
})
