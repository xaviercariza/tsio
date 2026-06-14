import { defineContract, initTsIo } from '@tsio/core'
import { describe, expect, vi } from 'vitest'
import { z } from 'zod'
import { socketsTest } from './utils'

type Context = { userName: string }

type Contract = typeof contract

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

const contract = defineContract({
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
  listenersRouter: {
    onActionResponse: {
      type: 'listener',
      data: PostSchema,
    },
  },
})

const context: Context = { userName: 'Xavier' }
const tsIo = initTsIo.context<Context>().create(contract)
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
      const { setup, closeConnections } = await socketIoFixture.setupSocketIo(contract)
      const actionHandler = vi.fn()
      const router = tsIo.router.create(a => ({
        actionsRouter: {
          ...ACTIONS_MOCK,
          fireAndForget: a.actionsRouter.fireAndForget.handler(actionHandler),
        },
        listenersRouter: {},
      }))

      socketIoFixture.attachTsIoToWebSocket({
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
        emitEventTo: setup.server.adapter.emitTo,
      })

      onTestFinished(closeConnections)
    })

    socketsTest(
      'handles fire and forget action w/ emit to other client',
      async ({ socketIoFixture, onTestFinished }) => {
        const { setup, closeConnections } = await socketIoFixture.setupSocketIo(contract)
        const actionHandler = vi.fn()
        const emittedPost = createPostResponse()
        const router = tsIo.router.create(a => ({
          actionsRouter: {
            ...ACTIONS_MOCK,
            fireAndForgetWithEmit: a.actionsRouter.fireAndForgetWithEmit.handler(
              actionHandler.mockImplementation(({ emitEventTo }) => {
                emitEventTo(
                  'listenersRouter.onActionResponse',
                  setup.client.socket2.socket.id,
                  emittedPost
                )
              })
            ),
          },
          listenersRouter: {},
        }))

        socketIoFixture.attachTsIoToWebSocket({
          router,
          adapter: setup.server.adapter,
          createContext,
        })

        const emitToAdapter = vi.spyOn(setup.server.adapter, 'emitTo')
        const listenerHandler = vi.fn()
        const actionPayload = createPostPayload()

        setup.client.socket2.client.listeners.listenersRouter.onActionResponse(listenerHandler)
        setup.client.socket1.client.actions.actionsRouter.fireAndForgetWithEmit(actionPayload)

        await vi.waitFor(() => expect(listenerHandler).toHaveBeenCalledTimes(1))

        expect(actionHandler).toHaveBeenCalledTimes(1)
        expect(actionHandler).toHaveBeenCalledWith({
          path: 'actionsRouter.fireAndForgetWithEmit',
          input: actionPayload,
          ctx: context,
          emitEventTo: setup.server.adapter.emitTo,
        })
        expect(emitToAdapter).toHaveBeenCalledTimes(1)
        expect(emitToAdapter).toHaveBeenCalledWith(
          'listenersRouter.onActionResponse',
          setup.client.socket2.socket.id,
          emittedPost
        )
        expect(listenerHandler).toHaveBeenCalledWith({ ...actionPayload, id: 'post-1' })

        onTestFinished(closeConnections)
      }
    )
  })

  describe('request-response actions', () => {
    socketsTest('handles basic request-response action w/ success response', async ({ socketIoFixture, onTestFinished }) => {
      const { setup, closeConnections } = await socketIoFixture.setupSocketIo(contract)
      const actionHandler = vi.fn()
      const router = tsIo.router.create(a => ({
        actionsRouter: {
          ...ACTIONS_MOCK,
          requestResponse: a.actionsRouter.requestResponse.handler(
            actionHandler.mockImplementation(({ input }) => {
              return { success: true, data: { ...input, id: 'post-1' } }
            })
          ),
        },
        listenersRouter: {},
      }))

      socketIoFixture.attachTsIoToWebSocket({
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
        emitEventTo: setup.server.adapter.emitTo,
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
        const { setup, closeConnections } = await socketIoFixture.setupSocketIo(contract)
        const actionHandler = vi.fn()
        const router = tsIo.router.create(a => ({
          actionsRouter: {
            ...ACTIONS_MOCK,
            requestResponseWithEmit: a.actionsRouter.requestResponseWithEmit.handler(
              actionHandler.mockImplementation(({ input, emitEventTo }) => {
                const newPost = { ...input, id: 'post-1' }
                emitEventTo(
                  'listenersRouter.onActionResponse',
                  setup.client.socket2.socket.id,
                  newPost
                )
                return { success: true, data: newPost }
              })
            ),
          },
          listenersRouter: {},
        }))

        socketIoFixture.attachTsIoToWebSocket({
          router,
          adapter: setup.server.adapter,
          createContext,
        })

        const emitToAdapter = vi.spyOn(setup.server.adapter, 'emitTo')
        const listenerHandler = vi.fn()
        const actionPayload = createPostPayload()

        setup.client.socket2.client.listeners.listenersRouter.onActionResponse(listenerHandler)
        const action = setup.client.socket1.client.actions.actionsRouter.requestResponseWithEmit(actionPayload)

        await vi.waitFor(() => expect(listenerHandler).toHaveBeenCalledTimes(1))

        expect(actionHandler).toHaveBeenCalledTimes(1)
        expect(actionHandler).toHaveBeenCalledWith({
          path: 'actionsRouter.requestResponseWithEmit',
          input: actionPayload,
          ctx: context,
          emitEventTo: setup.server.adapter.emitTo,
        })
        expect(emitToAdapter).toHaveBeenCalledTimes(1)
        expect(emitToAdapter).toHaveBeenCalledWith(
          'listenersRouter.onActionResponse',
          setup.client.socket2.socket.id,
          { ...actionPayload, id: 'post-1' }
        )
        await expect(action).resolves.toStrictEqual({
          success: true,
          data: { ...actionPayload, id: 'post-1' },
        })
        expect(listenerHandler).toHaveBeenCalledWith({ ...actionPayload, id: 'post-1' })

        onTestFinished(closeConnections)
      }
    )

    socketsTest('handles basic request-response action w/ error response', async ({ socketIoFixture, onTestFinished }) => {
      const { setup, closeConnections } = await socketIoFixture.setupSocketIo(contract)
      const actionHandler = vi.fn()
      const router = tsIo.router.create(a => ({
        actionsRouter: {
          ...ACTIONS_MOCK,
          requestResponseError: a.actionsRouter.requestResponseError.handler(
            actionHandler.mockImplementation(() => {
              return { success: false, error: 'Action with ack error' }
            })
          ),
        },
        listenersRouter: {},
      }))

      socketIoFixture.attachTsIoToWebSocket({
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
        emitEventTo: setup.server.adapter.emitTo,
      })

      onTestFinished(closeConnections)
    })
  })
})
