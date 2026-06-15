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

function createPostPayload() {
  return {
    title: 'This is the title',
    body: 'This is the body',
  }
}

function createPostResponse() {
  return {
    id: 'post-1',
    title: 'This is the title',
    body: 'This is the body',
  }
}

describe('socketio', () => {
  describe('fire and forget actions', () => {
    socketsTest('handles basic fire and forget action', async ({ socketIoFixture, onTestFinished }) => {
      const { setup, closeConnections } = await socketIoFixture.setupSocketIo(api)
      const actionHandler = vi.fn()
      const router = tsio.router.create(a => ({
        actionsRouter: {
          ...ACTIONS_MOCK,
          fireAndForget: a.actionsRouter.fireAndForget.handle(actionHandler),
        },
        eventsRouter: {},
      }))

      socketIoFixture.attach({
        router,
        adapter: setup.server.adapter,
        createContext,
      })

      const actionPayload = createPostPayload()
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
      async ({ socketIoFixture, onTestFinished }) => {
        const { setup, closeConnections } = await socketIoFixture.setupSocketIo(api)
        const actionHandler = vi.fn()
        const emittedPost = createPostResponse()
        const router = tsio.router.create(a => ({
          actionsRouter: {
            ...ACTIONS_MOCK,
            fireAndForgetWithEmit: a.actionsRouter.fireAndForgetWithEmit.handle(
              actionHandler.mockImplementation(({ emit }) => {
                emit('eventsRouter.onActionResponse', setup.client.socket2.socket.id, emittedPost)
              })
            ),
          },
          eventsRouter: {},
        }))

        socketIoFixture.attach({
          router,
          adapter: setup.server.adapter,
          createContext,
        })

        const emitToAdapter = vi.spyOn(setup.server.adapter, 'emitTo')
        const eventHandler = vi.fn()
        const actionPayload = createPostPayload()

        setup.client.socket2.client.events.eventsRouter.onActionResponse(eventHandler)
        setup.client.socket1.client.actions.actionsRouter.fireAndForgetWithEmit(actionPayload)

        await vi.waitFor(() => expect(eventHandler).toHaveBeenCalledTimes(1))

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
          emittedPost
        )
        expect(eventHandler).toHaveBeenCalledWith({ ...actionPayload, id: 'post-1' })

        onTestFinished(closeConnections)
      }
    )
  })

  describe('request-response actions', () => {
    socketsTest('handles basic request-response action w/ success response', async ({ socketIoFixture, onTestFinished }) => {
      const { setup, closeConnections } = await socketIoFixture.setupSocketIo(api)
      const actionHandler = vi.fn()
      const router = tsio.router.create(a => ({
        actionsRouter: {
          ...ACTIONS_MOCK,
          requestResponse: a.actionsRouter.requestResponse.handle(
            actionHandler.mockImplementation(({ input }) => {
              return { success: true, data: { ...input, id: 'post-1' } }
            })
          ),
        },
        eventsRouter: {},
      }))

      socketIoFixture.attach({
        router,
        adapter: setup.server.adapter,
        createContext,
      })

      const actionPayload = createPostPayload()
      const action = setup.client.socket1.client.actions.actionsRouter.requestResponse(actionPayload)

      await vi.waitFor(() => expect(actionHandler).toHaveBeenCalledTimes(1))
      expect(actionHandler).toHaveBeenCalledWith({
        path: 'actionsRouter.requestResponse',
        input: actionPayload,
        ctx: context,
        emit: setup.server.adapter.emitTo,
      })
      await expect(action).resolves.toStrictEqual({
        success: true,
        data: { ...actionPayload, id: 'post-1' },
      })

      onTestFinished(closeConnections)
    })

    socketsTest(
      'handles request-response action w/ emit to other client',
      async ({ socketIoFixture, onTestFinished }) => {
        const { setup, closeConnections } = await socketIoFixture.setupSocketIo(api)
        const actionHandler = vi.fn()
        const router = tsio.router.create(a => ({
          actionsRouter: {
            ...ACTIONS_MOCK,
            requestResponseWithEmit: a.actionsRouter.requestResponseWithEmit.handle(
              actionHandler.mockImplementation(({ input, emit }) => {
                const newPost = { ...input, id: 'post-1' }
                emit('eventsRouter.onActionResponse', setup.client.socket2.socket.id, newPost)
                return { success: true, data: newPost }
              })
            ),
          },
          eventsRouter: {},
        }))

        socketIoFixture.attach({
          router,
          adapter: setup.server.adapter,
          createContext,
        })

        const emitToAdapter = vi.spyOn(setup.server.adapter, 'emitTo')
        const eventHandler = vi.fn()
        const actionPayload = createPostPayload()

        setup.client.socket2.client.events.eventsRouter.onActionResponse(eventHandler)
        const action = setup.client.socket1.client.actions.actionsRouter.requestResponseWithEmit(actionPayload)

        await vi.waitFor(() => expect(eventHandler).toHaveBeenCalledTimes(1))

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
          { ...actionPayload, id: 'post-1' }
        )
        await expect(action).resolves.toStrictEqual({
          success: true,
          data: { ...actionPayload, id: 'post-1' },
        })
        expect(eventHandler).toHaveBeenCalledWith({ ...actionPayload, id: 'post-1' })

        onTestFinished(closeConnections)
      }
    )

    socketsTest('handles basic request-response action w/ error response', async ({ socketIoFixture, onTestFinished }) => {
      const { setup, closeConnections } = await socketIoFixture.setupSocketIo(api)
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

      socketIoFixture.attach({
        router,
        adapter: setup.server.adapter,
        createContext,
      })

      const actionPayload = createPostPayload()
      const action = setup.client.socket1.client.actions.actionsRouter.requestResponseError(actionPayload)

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
    })
  })
})
