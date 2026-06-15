import { socketio } from '@tsio/socketio/server'
import type http from 'node:http'
import { Server } from 'socket.io'
import { connectUser, disconnectUser, getUserById } from './server/store'
import { chatRouter } from './server/tsio/router'
import { attach } from './server/tsio/tsio'

const createIOServer = (server: http.Server) => {
  const io = new Server(server)

  io.on('connection', async socket => {
    const userId = typeof socket.handshake.auth.userId === 'string' ? socket.handshake.auth.userId : ''
    const user = getUserById(userId)

    if (user) {
      await connectUser(user.id, socket.id)

      socket.on('disconnect', async () => {
        await disconnectUser(user.id)
      })
    }

    const adapter = socketio(socket)
    attach({ router: chatRouter, adapter, createContext: () => ({ user, socket }) })
  })
}

export { createIOServer }
