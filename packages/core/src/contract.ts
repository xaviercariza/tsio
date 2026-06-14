import type { z } from 'zod'
import type { InferSchema } from './types'

type ActionOptions = {
  validate?: boolean
}

type ListenerOptions = {
  validate?: boolean
}

type TBaseAction<TInput extends z.ZodTypeAny = z.ZodTypeAny> = {
  type: 'action'
  input: TInput
  options?: ActionOptions
  response?: undefined
}

type TActionWithAck<
  TInput extends z.ZodTypeAny = z.ZodTypeAny,
  TOutput extends z.ZodTypeAny = z.ZodTypeAny,
> = {
  type: 'action'
  input: TInput
  response: TOutput
  options?: ActionOptions
}

type IoAction = TBaseAction | TActionWithAck
type IoListener<TData extends z.ZodTypeAny = z.ZodTypeAny> = ListenerOptions & {
  type: 'listener'
  data: TData
}

type ContractType = 'action' | 'listener'
type ContractAction = IoAction
type ContractListener = IoListener
type ContractRouterType = {
  [key: string]: ContractRouterType | ContractAction | ContractListener
}

const defineContract = <TContractRouter extends ContractRouterType>(
  definition: TContractRouter
): TContractRouter => definition

const isContractRouter = (
  contract: ContractRouterType | ContractAction | ContractListener
): contract is ContractRouterType => {
  const type = (contract as { type?: unknown }).type
  return type !== 'action' && type !== 'listener'
}

const isContractListener = (
  contract: ContractRouterType | ContractAction | ContractListener
): contract is ContractListener => {
  return (contract as { type?: unknown }).type === 'listener'
}

const isContractAction = (
  contract: ContractRouterType | ContractAction | ContractListener
): contract is ContractAction => {
  return (contract as { type?: unknown }).type === 'action'
}

const isActionWithAck = (action: ContractAction): action is TActionWithAck => {
  return 'response' in action && action.response !== undefined
}

type InferActionInput<Action> = Action extends { input: infer Input extends z.ZodTypeAny }
  ? InferSchema<Input>
  : never

type InferActionOutput<Action> = Action extends { response: infer Output extends z.ZodTypeAny }
  ? InferSchema<Output>
  : void

type InferListenerData<Listener> = Listener extends { data: infer Data extends z.ZodTypeAny }
  ? InferSchema<Data>
  : never

type AnyContractActions = ContractActions<any>
type ContractActions<Contract extends ContractRouterType> = {
  [K in keyof Contract as Contract[K] extends ContractListener ? never : K]: Contract[K] extends ContractAction
    ? Contract[K]
    : Contract[K] extends ContractRouterType
      ? ContractActions<Contract[K]>
      : never
}

type AnyContractListeners = ContractListeners<any>
type ContractListeners<Contract extends ContractRouterType> = {
  [K in keyof Contract as Contract[K] extends ContractAction ? never : K]: Contract[K] extends ContractListener
    ? Contract[K]
    : Contract[K] extends ContractRouterType
      ? ContractListeners<Contract[K]>
      : never
}

type ContractPaths<
  Contract extends ContractRouterType,
  Type extends ContractType,
> = {
  [K in keyof Contract & string]: Contract[K] extends { type: Type }
    ? K
    : Contract[K] extends ContractRouterType
      ? `${K}.${ContractPaths<Contract[K], Type>}`
      : never
}[keyof Contract & string]

type ValueAtPath<T, P extends string> = P extends `${infer Key}.${infer Rest}`
  ? Key extends keyof T
    ? ValueAtPath<T[Key], Rest>
    : never
  : P extends keyof T
    ? T[P]
    : never

type EmitEventToFunction<Contract extends ContractRouterType> = <
  ListenerKey extends ContractPaths<Contract, 'listener'>,
>(
  listenerKey: ListenerKey,
  socketId: string,
  data: InferListenerData<ValueAtPath<Contract, ListenerKey>>
) => void

type AnyEmitEventToFunction = EmitEventToFunction<any>

export { defineContract, isActionWithAck, isContractAction, isContractListener, isContractRouter }
export type {
  ActionOptions,
  AnyContractActions,
  AnyContractListeners,
  AnyEmitEventToFunction,
  ContractAction,
  ContractActions,
  ContractListener,
  ContractListeners,
  ContractPaths,
  ContractRouterType,
  ContractType,
  EmitEventToFunction,
  InferActionInput,
  InferActionOutput,
  InferListenerData,
  IoAction,
  IoListener,
  TActionWithAck,
  TBaseAction,
  ValueAtPath,
}
