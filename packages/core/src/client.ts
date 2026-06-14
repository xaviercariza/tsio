import type { TsIoClientAdapter } from './adapter'
import {
  type ContractAction,
  type ContractEvent,
  type ContractRouterType,
  type InferActionInput,
  type InferActionOutput,
  type InferEventData,
  type TActionWithAck,
  isActionWithAck,
  isContractAction,
  isContractEvent,
  isContractRouter,
} from './contract'
import type { TResponse } from './types'

type BasicAction<Action extends ContractAction> = (body: InferActionInput<Action>) => Promise<void> | void

type ActionWithAck<Action extends TActionWithAck> = (
  body: InferActionInput<Action>
) => Promise<TResponse<InferActionOutput<Action>>> | TResponse<InferActionOutput<Action>>

type EventFunction<Event extends ContractEvent> = (
  callback: (response: InferEventData<Event>) => void
) => { unsubscribe: () => void }

type ClientAction<Action> = Action extends TActionWithAck
  ? ActionWithAck<Action>
  : Action extends ContractAction
    ? BasicAction<Action>
    : never

type ClientEvent<Event> = Event extends ContractEvent ? EventFunction<Event> : never

type TsIoClientActions<Contract extends ContractRouterType> = {
  [Key in keyof Contract as Contract[Key] extends ContractEvent ? never : Key]: Contract[Key] extends ContractAction
    ? ClientAction<Contract[Key]>
    : Contract[Key] extends ContractRouterType
      ? TsIoClientActions<Contract[Key]>
      : never
}

type TsIoClientEvents<Contract extends ContractRouterType> = {
  [Key in keyof Contract as Contract[Key] extends ContractAction ? never : Key]: Contract[Key] extends ContractEvent
    ? ClientEvent<Contract[Key]>
    : Contract[Key] extends ContractRouterType
      ? TsIoClientEvents<Contract[Key]>
      : never
}

type TsIoClient<Contract extends ContractRouterType> = {
  actions: TsIoClientActions<Contract>
  events: TsIoClientEvents<Contract>
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

const getEvent = <Event extends ContractEvent, Adapter extends TsIoClientAdapter<any>>(
  adapter: Adapter,
  eventKey: string
): EventFunction<Event> => {
  return callback => {
    adapter.on(eventKey as any, callback as any)
    return {
      unsubscribe: () => {
        adapter.unsubscribe(eventKey as any)
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

    if (isContractEvent(subRouter)) {
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

const createClientEvents = <
  TContract extends ContractRouterType,
  Adapter extends TsIoClientAdapter<any>,
>(
  contract: TContract,
  adapter: Adapter,
  path = ''
): TsIoClientEvents<TContract> => {
  return Object.entries(contract).reduce((acc, [key, subRouter]) => {
    const eventPath = path ? `${path}.${key}` : key

    if (isContractRouter(subRouter)) {
      return { ...acc, [key]: createClientEvents(subRouter, adapter, eventPath) }
    }

    if (isContractAction(subRouter)) {
      return acc
    }

    return {
      ...acc,
      [key]: getEvent(adapter, eventPath),
    }
  }, {} as TsIoClientEvents<TContract>)
}

const createClient = <
  Contract extends ContractRouterType,
  Adapter extends TsIoClientAdapter<any>,
>(
  contract: Contract,
  adapter: Adapter
): TsIoClient<Contract> => {
  return {
    actions: createClientActions(contract, adapter),
    events: createClientEvents(contract, adapter),
  }
}

export { createClient }
export type { TsIoClient, TsIoClientActions, TsIoClientEvents }
