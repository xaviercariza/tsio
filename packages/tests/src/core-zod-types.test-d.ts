import { contract, createClient, type TResponse, type TsIoClientAdapter } from '@tsio/core'
import { expectTypeOf } from 'vitest'
import { z as z4 } from 'zod'
import { z as z3 } from 'zod/v3'

const zod4Api = contract({
  actions: {
    createMessage: {
      type: 'action',
      input: z4.object({ text: z4.string() }),
      response: z4.object({ id: z4.string(), text: z4.string() }),
    },
  },
  events: {
    onMessage: {
      type: 'event',
      data: z4.object({ id: z4.string(), text: z4.string() }),
    },
  },
})

declare const zod4Adapter: TsIoClientAdapter<typeof zod4Api>
const zod4Client = createClient(zod4Api, zod4Adapter)

expectTypeOf<Parameters<typeof zod4Client.actions.actions.createMessage>[0]>().toEqualTypeOf<{
  text: string
}>()
expectTypeOf<Awaited<ReturnType<typeof zod4Client.actions.actions.createMessage>>>().toEqualTypeOf<
  TResponse<{ id: string; text: string }>
>()
zod4Client.events.events.onMessage(message => {
  expectTypeOf(message).toEqualTypeOf<{ id: string; text: string }>()
})

const zod3Api = contract({
  actions: {
    createCounter: {
      type: 'action',
      input: z3.object({ amount: z3.number() }),
      response: z3.object({ total: z3.number() }),
    },
  },
  events: {
    onCounter: {
      type: 'event',
      data: z3.object({ total: z3.number() }),
    },
  },
})

declare const zod3Adapter: TsIoClientAdapter<typeof zod3Api>
const zod3Client = createClient(zod3Api, zod3Adapter)

expectTypeOf<Parameters<typeof zod3Client.actions.actions.createCounter>[0]>().toEqualTypeOf<{
  amount: number
}>()
expectTypeOf<Awaited<ReturnType<typeof zod3Client.actions.actions.createCounter>>>().toEqualTypeOf<
  TResponse<{ total: number }>
>()
zod3Client.events.events.onCounter(counter => {
  expectTypeOf(counter).toEqualTypeOf<{ total: number }>()
})
