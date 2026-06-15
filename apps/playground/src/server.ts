import http from 'node:http'
import express from 'express'
import { createServer as createViteServer } from 'vite'
import { createIOServer } from './io'
import { getDemoSnapshot, seedDemoData } from './server/store'

const port = 3010

async function createMainServer() {
  const app = express()
  const server = http.createServer(app)

  seedDemoData()

  app.use(express.json())

  app.get('/health', (_req, res) => {
    return res.send('Ok')
  })

  app.get('/api/demo', (_req, res) => {
    return res.send(getDemoSnapshot())
  })

  createIOServer(server)

  const vite = await createViteServer({
    server: {
      middlewareMode: true,
      hmr: {
        server,
      },
    },
    appType: 'spa',
  })

  app.use(vite.middlewares)
  app.use(express.static('static'))

  server.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`)
  })
}

createMainServer()
