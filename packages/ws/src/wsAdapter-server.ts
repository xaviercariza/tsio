import type { ContractAction, TsIoServerAdapter, TsIoServerEmitter } from '@tsio/core'
import { randomUUID } from 'node:crypto'
import type wsModule from 'ws'
import type { WebSocketServer } from 'ws'

export type TsIoWebSocket = wsModule.WebSocket & { id?: string }

export type TsIoWebSocketServer = Omit<WebSocketServer, 'clients'> & {
  clients: Set<TsIoWebSocket>
}

function ws<Action extends ContractAction>(
  wsServer: TsIoWebSocketServer,
  socket: TsIoWebSocket
): TsIoServerAdapter<Action> {
  const emitToClient: TsIoServerEmitter = (to, data) => {
    wsServer.clients.forEach(ws => {
      if (ws.id === to && socket.readyState === socket.OPEN) {
        ws.send(JSON.stringify(data))
      }
    })
  }

  return {
    emitTo: (event, to, data) => {
      const messageId = randomUUID()
      emitToClient(to, { messageId, event, data })
    },
    on: (eventKey, handler) => {
      socket.on('message', async msg => {
        const { messageId, event, data } = JSON.parse(msg.toString())
        if (event === eventKey) {
          const response = await handler(data)
          if (typeof response === 'object') {
            wsServer.clients.forEach(ws => {
              if (socket.id === ws.id && socket.readyState === socket.OPEN) {
                ws.send(JSON.stringify({ messageId, event, data: response }))
              }
            })
          }
        }
      })
    },
  }
}

export { ws }
