import type { AnyAction } from './action'
import type {
  ContractAction,
  ContractPaths,
  ContractRouterType,
  InferActionInput,
  InferActionOutput,
  InferEventData,
  TActionWithAck,
  ValueAtPath,
} from './contract'
import type { AnyRouter } from './router'
import type { MaybePromise, TResponse } from './types'

type TsIoServerHandler<Action extends ContractAction = ContractAction> = (
  input: InferActionInput<Action>
) => MaybePromise<Action extends TActionWithAck ? TResponse<InferActionOutput<Action>> : void>

type TsIoEventMessage<Data> = { messageId: string; event: string; data: Data }
type TsIoServerEmitter = (to: string, output: TsIoEventMessage<any>) => void

type TsIoServerAdapter<Action extends ContractAction = ContractAction> = {
  emitTo<Event extends string, Data>(event: Event, to: string, data: Data): void
  on<Event extends string>(event: Event, handler: TsIoServerHandler<Action>): MaybePromise<void>
}

type EventDataAt<Contract extends ContractRouterType, Path extends ContractPaths<Contract, 'event'>> =
  InferEventData<ValueAtPath<Contract, Path>>

type TsIoClientAdapter<Contract extends ContractRouterType> = {
  emit: <ActionEvent extends ContractPaths<Contract, 'action'>>(
    action: ActionEvent,
    payload: ValueAtPath<Contract, ActionEvent> extends ContractAction
      ? InferActionInput<ValueAtPath<Contract, ActionEvent>>
      : never,
    callback?: ValueAtPath<Contract, ActionEvent> extends TActionWithAck
      ? (response: TResponse<InferActionOutput<ValueAtPath<Contract, ActionEvent>>>) => void
      : never
  ) => void
  on: <Event extends ContractPaths<Contract, 'event'>>(
    event: Event,
    cb: (data: EventDataAt<Contract, Event>) => void
  ) => void
  unsubscribe: <Event extends ContractPaths<Contract, 'event'>>(event: Event) => void
}

const isRouter = (action: AnyRouter | AnyAction): action is AnyRouter => {
  return typeof action !== 'function'
}

type AttachParams<TContext> = {
  router: AnyRouter
  adapter: TsIoServerAdapter<any>
  createContext: () => TContext
}

function maybeValidateInput(action: AnyAction, input: unknown) {
  const def = action._def
  if (!def?.validateInput || !def.input) {
    return input
  }
  return def.input.parse(input)
}

function maybeValidateResponse(action: AnyAction, response: unknown) {
  const def = action._def
  if (!def?.validateResponse || !def.response) {
    return response
  }

  if (
    response &&
    typeof response === 'object' &&
    'success' in response &&
    (response as { success: unknown }).success === true &&
    'data' in response
  ) {
    return {
      ...response,
      data: def.response.parse((response as { data: unknown }).data),
    }
  }

  return response
}

const attach = <TContext>({
  router,
  adapter,
  createContext,
}: AttachParams<TContext>) => {
  function attachRouter(subRouter: AnyRouter, path = '') {
    for (const key of Object.keys(subRouter)) {
      const actionKey = key as keyof typeof subRouter
      const action = subRouter[actionKey]
      if (!action) {
        throw new Error(`Can not find ${key} action`)
      }

      const actionPath = path ? `${path}.${key}` : key

      if (isRouter(action)) {
        attachRouter(action, actionPath)
        continue
      }

      adapter.on(actionPath, async input => {
        const parsedInput = maybeValidateInput(action, input)
        const actionResult = await action({
          path: actionPath,
          input: parsedInput,
          ctx: createContext(),
          emit: adapter.emitTo,
        })

        return maybeValidateResponse(action, actionResult) as any
      })
    }
  }

  return attachRouter(router)
}

export { attach }
export type { AttachParams, TsIoClientAdapter, TsIoEventMessage, TsIoServerAdapter, TsIoServerEmitter }
