import type { TsIoClient } from '@tsio/core'
import { createClient } from '@tsio/core'
import { socketioClient } from '@tsio/socketio/client'
import { createContext, useContext, useState, type ReactNode } from 'react'
import { io } from 'socket.io-client'
import { chatContract } from '../server/tsio/contract'

interface ChatSocketCtxState {
  tsIo: TsIoClient<typeof chatContract> | null
}

const TsIoCtx = createContext<ChatSocketCtxState>({} as ChatSocketCtxState)

export function TsIoProvider({ children }: { children: ReactNode }) {
  const [tsIoClient] = useState<TsIoClient<typeof chatContract>>(() => {
    const socket = io({ transports: ['websocket'] })
    const adapter = socketioClient(socket)
    return createClient(chatContract, adapter)
  })

  return <TsIoCtx.Provider value={{ tsIo: tsIoClient }}>{children}</TsIoCtx.Provider>
}

export const useTsIo = () => {
  const context = useContext(TsIoCtx)
  if (!context) {
    throw new Error('useTsIo must be used within a TsIoProvider')
  }
  return context.tsIo
}
