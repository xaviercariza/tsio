import { socketio } from '@tsio/socketio/server'
import type express from 'express'
import type http from 'node:http'
import { Server } from 'socket.io'
import { connectUser, disconnectUser } from './server/services'
import { chatRouter } from './server/tsio/router'
import { attach } from './server/tsio/tsio'

const createIOServer = (server: http.Server, sessionMiddleware: express.RequestHandler) => {
  const io = new Server(server)
  io.engine.use(sessionMiddleware)

  io.on('connection', async socket => {
    const user = socket.request.session?.user ?? null

    if (user) {
      await connectUser(user.id, socket.id)

      console.log(`A user connected ${socket.id}`)

      const adapter = socketio(socket)
      attach({ router: chatRouter, adapter, createContext: () => ({ user, socket }) })

      socket.on('disconnect', async () => {
        console.log(`user disconnected ${socket.id}`)
        await disconnectUser(user.id)
      })
    }
  })
}

export { createIOServer }
