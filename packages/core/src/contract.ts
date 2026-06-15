import type { InferSchema, TsIoSchema } from './types'

type ActionOptions = {
  validate?: boolean
}

type EventOptions = {
  validate?: boolean
}

type TBaseAction<TInput extends TsIoSchema = TsIoSchema> = {
  type: 'action'
  input: TInput
  options?: ActionOptions
  response?: undefined
}

type TActionWithAck<
  TInput extends TsIoSchema = TsIoSchema,
  TOutput extends TsIoSchema = TsIoSchema,
> = {
  type: 'action'
  input: TInput
  response: TOutput
  options?: ActionOptions
}

type IoAction = TBaseAction | TActionWithAck
type IoEvent<TData extends TsIoSchema = TsIoSchema> = EventOptions & {
  type: 'event'
  data: TData
}

type ContractType = 'action' | 'event'
type ContractAction = IoAction
type ContractEvent = IoEvent
type ContractRouterType = {
  [key: string]: ContractRouterType | ContractAction | ContractEvent
}

const contract = <TContractRouter extends ContractRouterType>(
  definition: TContractRouter
): TContractRouter => definition

const isContractRouter = (
  node: ContractRouterType | ContractAction | ContractEvent
): node is ContractRouterType => {
  const type = (node as { type?: unknown }).type
  return type !== 'action' && type !== 'event'
}

const isContractEvent = (
  node: ContractRouterType | ContractAction | ContractEvent
): node is ContractEvent => {
  return (node as { type?: unknown }).type === 'event'
}

const isContractAction = (
  node: ContractRouterType | ContractAction | ContractEvent
): node is ContractAction => {
  return (node as { type?: unknown }).type === 'action'
}

const isActionWithAck = (action: ContractAction): action is TActionWithAck => {
  return 'response' in action && action.response !== undefined
}

type InferActionInput<Action> = Action extends { input: infer Input extends TsIoSchema }
  ? InferSchema<Input>
  : never

type InferActionOutput<Action> = Action extends { response: infer Output extends TsIoSchema }
  ? InferSchema<Output>
  : void

type InferEventData<Event> = Event extends { data: infer Data extends TsIoSchema }
  ? InferSchema<Data>
  : never

type AnyContractActions = ContractActions<any>
type ContractActions<Contract extends ContractRouterType> = {
  [K in keyof Contract as Contract[K] extends ContractEvent ? never : K]: Contract[K] extends ContractAction
    ? Contract[K]
    : Contract[K] extends ContractRouterType
      ? ContractActions<Contract[K]>
      : never
}

type AnyContractEvents = ContractEvents<any>
type ContractEvents<Contract extends ContractRouterType> = {
  [K in keyof Contract as Contract[K] extends ContractAction ? never : K]: Contract[K] extends ContractEvent
    ? Contract[K]
    : Contract[K] extends ContractRouterType
      ? ContractEvents<Contract[K]>
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

type EmitFunction<Contract extends ContractRouterType> = <
  EventKey extends ContractPaths<Contract, 'event'>,
>(
  event: EventKey,
  socketId: string,
  data: InferEventData<ValueAtPath<Contract, EventKey>>
) => void

type AnyEmitFunction = EmitFunction<any>

export { contract, isActionWithAck, isContractAction, isContractEvent, isContractRouter }
export type {
  ActionOptions,
  AnyContractActions,
  AnyContractEvents,
  AnyEmitFunction,
  ContractAction,
  ContractActions,
  ContractEvent,
  ContractEvents,
  ContractPaths,
  ContractRouterType,
  ContractType,
  EmitFunction,
  EventOptions,
  InferActionInput,
  InferActionOutput,
  InferEventData,
  IoAction,
  IoEvent,
  TActionWithAck,
  TBaseAction,
  ValueAtPath,
}
