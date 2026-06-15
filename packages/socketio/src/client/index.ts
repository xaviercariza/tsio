import type { ContractRouterType, TsIoClientAdapter } from '@tsio/core'
import type { Socket } from 'socket.io-client'

function socketioClient<Contract extends ContractRouterType>(
  socket: Socket
): TsIoClientAdapter<Contract> {
  return {
    emit: (event, payload, callback) => {
      socket.emit(event as string, payload, (response: any) => {
        if (callback) {
          callback(response.data)
        }
      })
    },
    on: (event, callback) => {
      socket.on(event as string, callback)
    },
    unsubscribe: event => {
      socket.off(event)
    },
  }
}

export { socketioClient }
