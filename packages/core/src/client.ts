import type { TsIoClientAdapter } from './adapter'
import {
  type ContractAction,
  type ContractListener,
  type ContractRouterType,
  type InferActionInput,
  type InferActionOutput,
  type InferListenerData,
  type TActionWithAck,
  isActionWithAck,
  isContractAction,
  isContractListener,
  isContractRouter,
} from './contract'
import type { TResponse } from './types'

type BasicAction<Action extends ContractAction> = (body: InferActionInput<Action>) => Promise<void> | void

type ActionWithAck<Action extends TActionWithAck> = (
  body: InferActionInput<Action>
) => Promise<TResponse<InferActionOutput<Action>>> | TResponse<InferActionOutput<Action>>

type ListenerFunction<Listener extends ContractListener> = (
  callback: (response: InferListenerData<Listener>) => void
) => { unsubscribe: () => void }

type ClientAction<Action> = Action extends TActionWithAck
  ? ActionWithAck<Action>
  : Action extends ContractAction
    ? BasicAction<Action>
    : never

type ClientListener<Listener> = Listener extends ContractListener ? ListenerFunction<Listener> : never

type TsIoClientActions<Contract extends ContractRouterType> = {
  [Key in keyof Contract as Contract[Key] extends ContractListener ? never : Key]: Contract[Key] extends ContractAction
    ? ClientAction<Contract[Key]>
    : Contract[Key] extends ContractRouterType
      ? TsIoClientActions<Contract[Key]>
      : never
}

type TsIoClientListeners<Contract extends ContractRouterType> = {
  [Key in keyof Contract as Contract[Key] extends ContractAction ? never : Key]: Contract[Key] extends ContractListener
    ? ClientListener<Contract[Key]>
    : Contract[Key] extends ContractRouterType
      ? TsIoClientListeners<Contract[Key]>
      : never
}

type TsIoClient<Contract extends ContractRouterType> = {
  actions: TsIoClientActions<Contract>
  listeners: TsIoClientListeners<Contract>
}

const getBasicAction =
  <TAction extends ContractAction, Adapter extends TsIoClientAdapter<any>>(
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
    return new Promise<TResponse<InferActionOutput<TAction>>>(resolve => {
      adapter.emit(actionKey as any, body, resolve as any)
    })
  }

const getListener = <Listener extends ContractListener, Adapter extends TsIoClientAdapter<any>>(
  adapter: Adapter,
  listenerKey: string
): ListenerFunction<Listener> => {
  return callback => {
    adapter.on(listenerKey as any, callback as any)
    return {
      unsubscribe: () => {
        adapter.unsubscribe(listenerKey as any)
      },
    }
  }
}

const createClientActions = <
  TContract extends ContractRouterType,
  Adapter extends TsIoClientAdapter<any>,
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
  Adapter extends TsIoClientAdapter<any>,
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
  Adapter extends TsIoClientAdapter<any>,
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
export type { TsIoClient, TsIoClientActions, TsIoClientListeners }
