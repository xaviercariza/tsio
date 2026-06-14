import type { z } from 'zod'
import type { TsIoClientAdapter } from './adapter'
import {
  type AnyContractActions,
  type AnyContractListeners,
  type ContractAction,
  type ContractActions,
  type ContractListener,
  type ContractListeners,
  type ContractRouterType,
  type TActionWithAck,
  type TBaseAction,
  isActionWithAck,
  isContractAction,
  isContractListener,
  isContractRouter,
} from './contract'
import type { TResponse } from './types'

type BasicAction<Action extends TBaseAction> = (
  body: z.infer<Action['input']>
) => Promise<void> | void

type ActionWithAck<Action extends TActionWithAck> = (
  body: z.infer<Action['input']>
) => Promise<TResponse<z.infer<Action['response']>>> | TResponse<z.infer<Action['response']>>

type ListenerFunction<Listener extends ContractListener> = (
  callback: (response: z.infer<Listener['data']>) => void
) => { unsubscribe: () => void }

type ClientAction<Action> = Action extends TActionWithAck
  ? ActionWithAck<Action>
  : Action extends TBaseAction
    ? BasicAction<Action>
    : never

type ClientListener<Listener> = Listener extends ContractListener
  ? ListenerFunction<Listener>
  : never

type RecursiveActionsProxyObj<Actions extends AnyContractActions> = {
  [Key in keyof Actions]: Actions[Key] extends ContractRouterType
    ? RecursiveActionsProxyObj<Actions[Key]>
    : Actions[Key] extends ContractAction
      ? ClientAction<Actions[Key]>
      : never
}

type RecursiveListenersProxyObj<Listeners extends AnyContractListeners> = {
  [Key in keyof Listeners]: Listeners[Key] extends ContractRouterType
    ? RecursiveListenersProxyObj<Listeners[Key]>
    : Listeners[Key] extends ContractListener
      ? ClientListener<Listeners[Key]>
      : never
}

type TsIoClientActions<Contract extends ContractRouterType> = RecursiveActionsProxyObj<
  ContractActions<Contract>
>
type TsIoClientListeners<Contract extends ContractRouterType> = RecursiveListenersProxyObj<
  ContractListeners<Contract>
>

type TsIoClient<Contract extends ContractRouterType> = {
  actions: TsIoClientActions<Contract>
  listeners: TsIoClientListeners<Contract>
}

const getBasicAction =
  <TAction extends TBaseAction, Adapter extends TsIoClientAdapter<any>>(
    adapter: Adapter,
    actionKey: string
  ): BasicAction<TAction> =>
  body => {
    adapter.emit(actionKey as any, body)
  }
const getActionWithAck =
  <TAction extends TActionWithAck, Adapter extends TsIoClientAdapter<any>>(
    adapter: Adapter,
    actionKey: string
  ): ActionWithAck<TAction> =>
  body => {
    return new Promise<TResponse<z.infer<TAction['response']>>>(resolve => {
      adapter.emit(actionKey as any, body, resolve)
    })
  }

const getListener = <Listener extends ContractListener, Adapter extends TsIoClientAdapter<any>>(
  adapter: Adapter,
  listenerKey: string
): ListenerFunction<Listener> => {
  return callback => {
    adapter.on(listenerKey as any, callback)
    return {
      unsubscribe: () => {
        console.log('UNSUBSCRIBIIIING')
        adapter.unsubscribe(listenerKey)
      },
    }
  }
}

const createClientActions = <
  TContract extends ContractRouterType,
  Adapter extends TsIoClientAdapter<ContractRouterType>,
>(
  contract: TContract,
  adapter: Adapter,
  path = ''
): TsIoClientActions<TContract> => {
  return Object.entries(contract).reduce((acc, [key, subRouter]) => {
    const actionPath = path ? `${path}.${key}` : key

    if (isContractRouter(subRouter)) {
      return { ...acc, [key]: createClientActions(subRouter, adapter, actionPath) }
    }

    if (isContractListener(subRouter)) {
      return acc
    }

    if (!isActionWithAck(subRouter)) {
      return {
        ...acc,
        [key]: getBasicAction(adapter, actionPath),
      }
    }

    return {
      ...acc,
      [key]: getActionWithAck(adapter, actionPath),
    }
  }, {} as TsIoClientActions<TContract>)
}

const createClientListeners = <
  TContract extends ContractRouterType,
  Adapter extends TsIoClientAdapter<ContractRouterType>,
>(
  contract: TContract,
  adapter: Adapter,
  path = ''
): TsIoClientListeners<TContract> => {
  return Object.entries(contract).reduce((acc, [key, subRouter]) => {
    const listenerPath = path ? `${path}.${key}` : key

    if (isContractRouter(subRouter)) {
      return { ...acc, [key]: createClientListeners(subRouter, adapter, listenerPath) }
    }

    if (isContractAction(subRouter)) {
      return acc
    }

    return {
      ...acc,
      [key]: getListener(adapter, listenerPath),
    }
  }, {} as TsIoClientListeners<TContract>)
}

const initNewClient = <
  Contract extends ContractRouterType,
  Adapter extends TsIoClientAdapter<ContractRouterType>,
>(
  adapter: Adapter,
  contract: Contract
): TsIoClient<Contract> => {
  return {
    actions: createClientActions(contract, adapter),
    listeners: createClientListeners(contract, adapter),
  }
}

export { initNewClient }
export type { TsIoClient }
