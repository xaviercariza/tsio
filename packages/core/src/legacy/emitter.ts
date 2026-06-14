import type { ValueAtPath } from './contract'
import type { ContractListener, ContractPaths, ContractRouterType } from './contract'
import type { ParseSchema } from './types'

type AnyEmitEventToFunction = EmitEventToFunction<any>

type EmitEventToFunction<Contract extends ContractRouterType> = <
  ListenerKey extends ContractPaths<Contract, 'listener'>,
>(
  listenerKey: ListenerKey,
  socketId: string,
  listenerSchema: ValueAtPath<Contract, ListenerKey> extends ContractListener
    ? ParseSchema<ValueAtPath<Contract, ListenerKey>['data']>
    : never
) => void

export type { AnyEmitEventToFunction, EmitEventToFunction }
