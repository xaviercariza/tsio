import {
  type ContractPaths,
  type ContractRouterType,
  type TsIoClient,
  type TsIoServerAdapter,
  createClient,
} from '@tsio/core'
import { wsClient } from '@tsio/ws/client'
import { type TsIoWebSocket, type TsIoWebSocketServer, ws } from '@tsio/ws/server'
import http from 'node:http'
import type { AddressInfo } from 'node:net'
import type wsModule from 'ws'
import { WebSocket, WebSocketServer } from 'ws'

function generateSocketIdMock(): string {
  return Math.random().toString(36).substring(2, 10)
}

function waitForWsClientToReceiveEvent<Contract extends ContractRouterType>(
  clientSocket: wsModule.WebSocket,
  event: ContractPaths<Contract, 'event'> | 'connect'
) {
  return new Promise<any>(resolve => {
    clientSocket.on(event as any, resolve)
  })
}

function waitForWsServerToReceiveEvent<Contract extends ContractRouterType>(
  serverSocket: wsModule.WebSocket,
  event: ContractPaths<Contract, 'action'>
) {
  return new Promise<any>(resolve => {
    serverSocket.on(event as any, resolve)
  })
}

type SocketsSetup<Contract extends ContractRouterType> = {
  wss: TsIoWebSocketServer
  server: {
    socket: TsIoWebSocket
    adapter: TsIoServerAdapter<any>
  }
  client: {
    socket1: {
      socket: TsIoWebSocket
      client: TsIoClient<Contract>
    }
    socket2: {
      socket: TsIoWebSocket
      client: TsIoClient<Contract>
    }
  }
}

type WsServer = {
  socket: TsIoWebSocket
  adapter: TsIoServerAdapter<any>
}
async function initializeTsIo(wss: TsIoWebSocketServer): Promise<WsServer> {
  return await new Promise(resolve => {
    wss.on('connection', (socket, req) => {
      const uuid = req.url?.replace('/?uuid=', '')

      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      socket.id = uuid

      const adapter = ws(wss, socket)

      function onSocketPostError(e: Error) {
        console.log('onSocketPostError: ', e)
      }

      socket.on('error', onSocketPostError)

      resolve({
        socket,
        adapter,
      })
    })
  })
}

function waitForSocketState(socket: WebSocket, state: number) {
  return new Promise<void>(resolve => {
    setTimeout(() => {
      if (socket.readyState === state) {
        resolve()
      } else {
        waitForSocketState(socket, state).then(resolve)
      }
    }, 5)
  })
}

async function createClientSocket<Contract extends ContractRouterType>(
  contract: Contract,
  port: number
) {
  const uuid = generateSocketIdMock()
  const socket = new WebSocket(`ws://localhost:${port}/?uuid=${uuid}`) as TsIoWebSocket

  socket.id = uuid

  const adapter = wsClient(socket)
  const client = createClient(contract, adapter)

  socket.emit('connection')

  return { socket, adapter, client }
}

async function createSockets<Contract extends ContractRouterType>(
  httpServer: http.Server,
  contract: Contract
) {
  const wss = new WebSocketServer({ noServer: true }) as TsIoWebSocketServer
  const port = (httpServer.address() as AddressInfo).port

  const socket1 = await createClientSocket(contract, port)
  const socket2 = await createClientSocket(contract, port)

  function onSocketPreError(e: Error) {
    console.log('onSocketPreError: ', e)
  }

  httpServer.on('upgrade', (req, socket, head) => {
    socket.on('error', onSocketPreError)
    wss.handleUpgrade(req, socket, head, ws => {
      socket.removeListener('error', onSocketPreError)
      wss.emit('connection', ws, req)
    })
  })

  const server = await initializeTsIo(wss)

  await waitForSocketState(socket1.socket, socket1.socket.OPEN)
  await waitForSocketState(socket2.socket, socket2.socket.OPEN)

  return {
    wss,
    server,
    client: {
      socket1,
      socket2,
    },
  }
}

async function setupWs<Contract extends ContractRouterType>(contract: Contract) {
  const httpServer = http.createServer()

  const setup = await new Promise<SocketsSetup<Contract>>(resolve => {
    httpServer.listen(async () => {
      const sockets = await createSockets(httpServer, contract)
      resolve(sockets)
    })
  })

  function closeConnections() {
    setup.wss.close()
    setup.client.socket1.socket.close()
    setup.client.socket2.socket.close()
  }

  return { setup, closeConnections }
}

export { setupWs, waitForWsClientToReceiveEvent, waitForWsServerToReceiveEvent }
