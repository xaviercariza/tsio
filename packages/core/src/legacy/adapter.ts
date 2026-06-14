import type { z } from 'zod'
import type { AnyAction } from './action'
import type {
  ContractAction,
  ContractActions,
  ContractListener,
  ContractListeners,
  ContractRouterType,
  TActionWithAck,
  TBaseAction,
} from './contract'
import type { AnyRouter } from './router'
import type { MaybePromise, TResponse } from './types'

type TsIoServerHandler<Action extends ContractAction> = Action extends TActionWithAck
  ? (input: Action['input']) => Promise<TResponse<z.infer<Action['response']>>>
  : Action extends TBaseAction
    ? (input: Action['input']) => Promise<void>
    : never

type TsIoEventMessage<Data> = { messageId: string; event: string; data: Data }
type TsIoServerEmitter = (to: string, output: TsIoEventMessage<TResponse<any>>) => void

type TsIoServerAdapter<Action extends ContractAction> = {
  emitTo<Event extends string, Response extends TResponse<any>>(
    to: string,
    event: Event,
    data: Response
  ): void
  on<Event extends string>(event: Event, handler: TsIoServerHandler<Action>): MaybePromise<void>
}

type TsIoClientAdapter<Contract extends ContractRouterType> = {
  emit: <
    ActionEvent extends keyof ContractActions<Contract>,
    ListenerEvent extends keyof ContractListeners<Contract>,
  >(
    action: ActionEvent,
    payload: ContractActions<Contract>[ActionEvent] extends ContractAction
      ? ContractActions<Contract>[ActionEvent]['input']
      : never,
    callback?: ContractListeners<Contract>[ListenerEvent] extends ContractListener
      ? ContractActions<Contract>[ActionEvent] extends TActionWithAck
        ? (response: TResponse<ContractListeners<Contract>[ListenerEvent]['data']>) => void
        : never
      : never
  ) => void
  on: <ListenerEvent extends keyof ContractListeners<Contract>>(
    action: ListenerEvent,
    cb: ContractListeners<Contract>[ListenerEvent] extends ContractListener
      ? (data: ContractListeners<Contract>[ListenerEvent]['data']) => void
      : never
  ) => void
  unsubscribe: <ListenerEvent extends keyof ContractListeners<Contract>>(
    event: ListenerEvent
  ) => void
}

const isRouter = (action: AnyRouter | AnyAction): action is AnyRouter => {
  return typeof action !== 'function'
}

type AttachTsIoWebSocketParams<TContext> = {
  router: AnyRouter
  adapter: TsIoServerAdapter<any>
  createContext: () => TContext
}

const attachTsIoToWebSocket = <TContext>({
  router,
  adapter,
  createContext,
}: AttachTsIoWebSocketParams<TContext>) => {
  function attach(subRouter: AnyRouter, path = '') {
    Object.keys(subRouter).forEach(key => {
      const actionKey = key as keyof typeof subRouter
      const action = subRouter[actionKey]
      if (!action) {
        throw new Error(`Can not find ${key} action`)
      }

      const actionPath = path ? `${path}.${key}` : key

      if (isRouter(action)) {
        return attach(action, actionPath)
      }

      adapter.on(actionPath, async input => {
        const ctx = createContext()
        const actionResult = await action({
          path: actionPath,
          input,
          ctx,
          // @ts-expect-error TODO: FIX THIS
          emitTo: adapter.emitTo,
        })
        return actionResult as any
      })
    })
  }
  return attach(router)
}

export { attachTsIoToWebSocket }
export type { TsIoClientAdapter, TsIoServerAdapter, TsIoServerEmitter }
