import { contract, createServer } from '@tsio/core'
import { describe, expect, vi } from 'vitest'
import { z } from 'zod'
import { socketsTest } from './utils'

type Context = { userName: string }

const ACTIONS_MOCK = {
  fireAndForget: vi.fn(),
  fireAndForgetWithEmit: vi.fn(),
  requestResponse: vi.fn(),
  requestResponseWithEmit: vi.fn(),
  requestResponseError: vi.fn(),
}

const PostSchema = z.object({
  id: z.string(),
  title: z.string(),
  body: z.string().optional(),
})

const api = contract({
  actionsRouter: {
    fireAndForget: {
      type: 'action',
      input: PostSchema.omit({ id: true }),
    },
    fireAndForgetWithEmit: {
      type: 'action',
      input: PostSchema.omit({ id: true }),
    },
    requestResponse: {
      type: 'action',
      input: PostSchema.omit({ id: true }),
      response: PostSchema,
    },
    requestResponseWithEmit: {
      type: 'action',
      input: PostSchema.omit({ id: true }),
      response: PostSchema,
    },
    requestResponseError: {
      type: 'action',
      input: PostSchema.omit({ id: true }),
      response: PostSchema,
    },
  },
  eventsRouter: {
    onActionResponse: {
      type: 'event',
      data: PostSchema,
    },
  },
})

const context: Context = { userName: 'Xavier' }
const tsio = createServer.context<Context>().create(api)
const createContext = () => context

describe('ws', () => {
  describe('fire and forget actions', () => {
    socketsTest('handles basic fire and forget action', async ({ wsFixture, onTestFinished }) => {
      const { setup, closeConnections } = await wsFixture.setupWs(api)
      const actionHandler = vi.fn()
      const router = tsio.router.create(a => ({
        actionsRouter: {
          ...ACTIONS_MOCK,
          fireAndForget: a.actionsRouter.fireAndForget.handle(actionHandler),
        },
        eventsRouter: {},
      }))

      wsFixture.attach({ router, adapter: setup.server.adapter, createContext })

      const actionPayload = {
        title: 'This is the title',
        body: 'This is the body',
      }
      setup.client.socket1.client.actions.actionsRouter.fireAndForget(actionPayload)

      await vi.waitFor(() => expect(actionHandler).toHaveBeenCalledTimes(1))
      expect(actionHandler).toHaveBeenCalledWith({
        path: 'actionsRouter.fireAndForget',
        ctx: context,
        input: actionPayload,
        emit: setup.server.adapter.emitTo,
      })

      onTestFinished(closeConnections)
    })

    socketsTest(
      'handles fire and forget action w/ emit to other client',
      async ({ wsFixture, onTestFinished }) => {
        const { setup, closeConnections } = await wsFixture.setupWs(api)
        const actionHandler = vi.fn()
        const router = tsio.router.create(a => ({
          actionsRouter: {
            ...ACTIONS_MOCK,
            fireAndForgetWithEmit: a.actionsRouter.fireAndForgetWithEmit.handle(
              actionHandler.mockImplementation(({ emit }) => {
                emit('eventsRouter.onActionResponse', setup.client.socket2.socket.id, {
                  id: 'post-1',
                  title: 'This is the title',
                  body: 'This is the body',
                })
              })
            ),
          },
          eventsRouter: {},
        }))

        wsFixture.attach({ router, adapter: setup.server.adapter, createContext })

        const emitToAdapter = vi.spyOn(setup.server.adapter, 'emitTo')
        const actionPayload = {
          title: 'This is the title',
          body: 'This is the body',
        }

        const eventHandler = vi.fn()
        setup.client.socket2.client.events.eventsRouter.onActionResponse(eventHandler)

        setup.client.socket1.client.actions.actionsRouter.fireAndForgetWithEmit(actionPayload)

        await vi.waitFor(() => expect(eventHandler).toHaveBeenCalledTimes(1))
        expect(eventHandler).toHaveBeenCalledWith({ ...actionPayload, id: 'post-1' })

        expect(actionHandler).toHaveBeenCalledTimes(1)
        expect(actionHandler).toHaveBeenCalledWith({
          path: 'actionsRouter.fireAndForgetWithEmit',
          input: actionPayload,
          ctx: context,
          emit: setup.server.adapter.emitTo,
        })

        expect(emitToAdapter).toHaveBeenCalledTimes(1)
        expect(emitToAdapter).toHaveBeenCalledWith(
          'eventsRouter.onActionResponse',
          setup.client.socket2.socket.id,
          {
            body: 'This is the body',
            id: 'post-1',
            title: 'This is the title',
          }
        )

        onTestFinished(closeConnections)
      }
    )
  })

  describe('request-response actions', () => {
    socketsTest(
      'handles basic request-response action w/ success response',
      async ({ wsFixture, onTestFinished }) => {
        const { setup, closeConnections } = await wsFixture.setupWs(api)
        const actionHandler = vi.fn()
        const router = tsio.router.create(a => ({
          actionsRouter: {
            ...ACTIONS_MOCK,
            requestResponse: a.actionsRouter.requestResponse.handle(
              actionHandler.mockImplementation(({ input }) => {
                const { title, body } = input
                const newPost = {
                  id: 'post-1',
                  title,
                  body,
                }
                return { success: true, data: newPost }
              })
            ),
          },
          eventsRouter: {},
        }))

        wsFixture.attach({ router, adapter: setup.server.adapter, createContext })

        const actionPayload = {
          title: 'This is the title',
          body: 'This is the body',
        }

        setup.client.socket1.client.actions.actionsRouter.requestResponse(actionPayload)

        await vi.waitFor(() => expect(actionHandler).toHaveBeenCalledTimes(1))
        expect(actionHandler).toHaveBeenCalledWith({
          path: 'actionsRouter.requestResponse',
          input: actionPayload,
          ctx: context,
          emit: setup.server.adapter.emitTo,
        })

        onTestFinished(closeConnections)
      }
    )

    socketsTest(
      'handles request-response action w/ emit to other client',
      async ({ wsFixture, onTestFinished }) => {
        const { setup, closeConnections } = await wsFixture.setupWs(api)
        const actionHandler = vi.fn()
        const router = tsio.router.create(a => ({
          actionsRouter: {
            ...ACTIONS_MOCK,
            requestResponseWithEmit: a.actionsRouter.requestResponseWithEmit.handle(
              actionHandler.mockImplementation(({ input, emit }) => {
                const { title, body } = input
                const newPost = { id: 'post-1', title, body }
                emit('eventsRouter.onActionResponse', setup.client.socket2.socket.id, newPost)
                return { success: true, data: newPost }
              })
            ),
          },
          eventsRouter: {},
        }))

        wsFixture.attach({ router, adapter: setup.server.adapter, createContext })

        const emitToAdapter = vi.spyOn(setup.server.adapter, 'emitTo')
        const actionPayload = {
          title: 'This is the title',
          body: 'This is the body',
        }

        const eventHandler = vi.fn()
        setup.client.socket2.client.events.eventsRouter.onActionResponse(eventHandler)

        const action =
          setup.client.socket1.client.actions.actionsRouter.requestResponseWithEmit(actionPayload)

        await vi.waitFor(() => expect(eventHandler).toHaveBeenCalledTimes(1))
        expect(eventHandler).toHaveBeenCalledWith({ ...actionPayload, id: 'post-1' })

        expect(actionHandler).toHaveBeenCalledTimes(1)
        expect(actionHandler).toHaveBeenCalledWith({
          path: 'actionsRouter.requestResponseWithEmit',
          input: actionPayload,
          ctx: context,
          emit: setup.server.adapter.emitTo,
        })

        expect(emitToAdapter).toHaveBeenCalledTimes(1)
        expect(emitToAdapter).toHaveBeenCalledWith(
          'eventsRouter.onActionResponse',
          setup.client.socket2.socket.id,
          {
            body: 'This is the body',
            id: 'post-1',
            title: 'This is the title',
          }
        )

        await expect(action).resolves.toStrictEqual({
          success: true,
          data: { ...actionPayload, id: 'post-1' },
        })

        onTestFinished(closeConnections)
      }
    )

    socketsTest(
      'handles basic request-response action w/ error response',
      async ({ wsFixture, onTestFinished }) => {
        const { setup, closeConnections } = await wsFixture.setupWs(api)
        const actionHandler = vi.fn()
        const router = tsio.router.create(a => ({
          actionsRouter: {
            ...ACTIONS_MOCK,
            requestResponseError: a.actionsRouter.requestResponseError.handle(
              actionHandler.mockImplementation(() => {
                return { success: false, error: 'Action with ack error' }
              })
            ),
          },
          eventsRouter: {},
        }))

        wsFixture.attach({ router, adapter: setup.server.adapter, createContext })

        const actionPayload = {
          title: 'This is the title',
          body: 'This is the body',
        }

        const action =
          setup.client.socket1.client.actions.actionsRouter.requestResponseError(actionPayload)

        await expect(action).resolves.toStrictEqual({
          success: false,
          error: 'Action with ack error',
        })

        expect(actionHandler).toHaveBeenCalledTimes(1)
        expect(actionHandler).toHaveBeenCalledWith({
          path: 'actionsRouter.requestResponseError',
          input: actionPayload,
          ctx: context,
          emit: setup.server.adapter.emitTo,
        })

        onTestFinished(closeConnections)
      }
    )
  })
})
