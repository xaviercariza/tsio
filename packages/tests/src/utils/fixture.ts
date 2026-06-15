import { attach } from '@tsio/core'
import { test } from 'vitest'
import { setupSocketIo } from './socketio'
import { setupWs } from './ws'

type SocketsFixture = {
  socketIoFixture: {
    setupSocketIo: typeof setupSocketIo
    attach: typeof attach
  }
  wsFixture: {
    setupWs: typeof setupWs
    attach: typeof attach
  }
}

export const socketsTest = test.extend<SocketsFixture>({
  socketIoFixture: async ({}, use) => {
    await use({ setupSocketIo, attach })
  },
  wsFixture: async ({}, use) => {
    await use({ setupWs, attach })
  },
})
