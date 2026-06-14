import type { ContractAction, TsIoServerAdapter, TsIoServerEmitter } from '@tsio/core'
import type { Socket } from 'socket.io'
import { v4 as uuidv4 } from 'uuid'

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
      const messageId = uuidv4()
      const response = { messageId, event, data }

      emitToClient(to, response)
    },
    on: (event, handler) => {
      socket.on(event as string, async (data, callback) => {
        const response = await handler(data)

        if (typeof response === 'object') {
          callback({ data: response })
        }
      })
    },
  }
}

export { socketio }
