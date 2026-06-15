# tsio

**Contract-first, type-safe realtime APIs for TypeScript.**

`tsio` lets you define your realtime protocol once and use it to type your server handlers, client actions, server-emitted events, middleware context, and transport adapters.

It is built for apps where the client calls server actions and the server pushes typed events back to connected clients: chat, presence, multiplayer rooms, collaborative tools, live dashboards, and internal realtime systems.

## Features

- Contract-first API powered by Zod schemas
- Fully typed client actions and server-emitted events
- Typed server handlers with inferred `ctx`, `input`, `path`, and `emit`
- Middleware that can refine handler context
- Optional runtime validation at the transport boundary
- Socket.IO and `ws` adapters
- Transport-agnostic core package

## Install

```bash
pnpm add @tsio/core zod
```

Install a transport adapter:

```bash
pnpm add @tsio/socketio socket.io socket.io-client
```

or:

```bash
pnpm add @tsio/ws ws
```

## Quick example

Define a shared contract:

```ts
import { contract } from '@tsio/core'
import { z } from 'zod'

const MessageSchema = z.object({
  id: z.string(),
  text: z.string(),
})

export const api = contract({
  chat: {
    sendMessage: {
      type: 'action',
      input: z.object({ text: z.string() }),
      response: MessageSchema,
    },
    onMessage: {
      type: 'event',
      data: MessageSchema,
    },
  },
})
```

Create a server router:

```ts
import { createServer } from '@tsio/core'
import { api } from './contract'

type Context = {
  socketId: string
}

const tsio = createServer.context<Context>().create(api)

export const router = tsio.router.create(a => ({
  chat: {
    sendMessage: a.chat.sendMessage.handle(({ ctx, input, emit }) => {
      const message = {
        id: crypto.randomUUID(),
        text: input.text,
      }

      emit('chat.onMessage', ctx.socketId, message)

      return {
        success: true,
        data: message,
      }
    }),
  },
}))
```

Create a typed client:

```ts
import { createClient } from '@tsio/core'
import { socketioClient } from '@tsio/socketio/client'
import { io } from 'socket.io-client'
import { api } from './contract'

const socket = io('http://localhost:3000')
const client = createClient(api, socketioClient(socket))

const result = await client.actions.chat.sendMessage({ text: 'hello' })

client.events.chat.onMessage(message => {
  message.id
  message.text
})
```

## Packages

| Package | Description |
|---|---|
| `@tsio/core` | Core contract, router, middleware, client, and adapter interfaces |
| `@tsio/socketio` | Socket.IO client and server adapters |
| `@tsio/ws` | `ws` client and server adapters |
| `@tsio/docs` | Documentation and landing page app |
| `@tsio/playground` | Local playground app |

## Documentation

Read the full documentation at:

```txt
https://tsio-docs.vercel.app
```

## Development

Install dependencies:

```bash
pnpm install
```

Build packages:

```bash
pnpm build
```

Run tests:

```bash
pnpm test
```

Run type checks:

```bash
pnpm types-check
```

Run the docs app:

```bash
pnpm --filter @tsio/docs dev
```

Run the playground:

```bash
pnpm --filter @tsio/playground start
```

## Repository structure

```txt
apps/
  docs/        Documentation and landing page
  playground/  Example realtime app

packages/
  core/        Core type system and runtime
  socketio/    Socket.IO adapter
  ws/          ws adapter
  tests/       Runtime and type tests
```

## Status

`tsio` is under active development. The public API is being stabilized before a stable `1.0.0` release.

## License

MIT
