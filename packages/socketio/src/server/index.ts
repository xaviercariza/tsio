import type { ContractAction, TsIoServerAdapter, TsIoServerEmitter } from '@tsio/core'
import { randomUUID } from 'node:crypto'
import type { Socket } from 'socket.io'

type TsIoSocketIoSocket = Socket & { id?: string }

function socketio<Action extends ContractAction>(
  socket: TsIoSocketIoSocket
): TsIoServerAdapter<Action> {
  const emitToClient: TsIoServerEmitter = (socketId, response) => {
    const { event, data } = response
    socket.to(socketId).emit(event, data)
  }

  return {
    emitTo: (event, to, data) => {
      const messageId = randomUUID()
      const response = { messageId, event, data }

      emitToClient(to, response)
    },
    on: (event, handler) => {
      socket.on(event as string, async (data, callback) => {
        try {
          const response = await handler(data)

          if (typeof response === 'object' && callback) {
            callback({ data: response })
          }
        } catch (cause) {
          if (callback) {
            callback({
              data: {
                success: false,
                error: cause instanceof Error ? cause.message : 'Unexpected error',
              },
            })
          }
        }
      })
    },
  }
}

export { socketio }
