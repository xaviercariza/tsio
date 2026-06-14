import type { z } from 'zod'

type ActionOptions = {
  validate?: boolean
}
type ListenerOptions = {
  validate?: boolean
}

type TBaseAction = {
  input: z.ZodSchema
  options?: ActionOptions
}

type TActionWithAck = TBaseAction & {
  response: z.ZodSchema
}
type IoAction = TBaseAction | TActionWithAck
type IoListener = ListenerOptions & { data: z.ZodSchema | Zod.ZodVoid }
type ContractType = 'action' | 'listener'
type ContractAction = { type: 'action' } & IoAction
type ContractListener = { type: 'listener' } & IoListener
type ContractRouterType = {
  [key: string]: ContractRouterType | ContractAction | ContractListener
}

const defineContract = <TContractRouter extends ContractRouterType>(
  definition: TContractRouter
): TContractRouter => definition

const isContractRouter = (
  contract: ContractRouterType | ContractAction | ContractListener
): contract is ContractRouterType => {
  return contract.type !== 'action' && contract.type !== 'listener'
}

const isContractListener = (
  contract: ContractRouterType | ContractAction | ContractListener
): contract is ContractListener => {
  return contract.type === 'listener'
}

const isContractAction = (
  contract: ContractRouterType | ContractAction | ContractListener
): contract is ContractAction => {
  return contract.type === 'action'
}

const isActionWithAck = (action: TActionWithAck | TBaseAction): action is TActionWithAck => {
  return (action as TActionWithAck).response !== undefined
}

type AnyContractActions = ContractActions<any>
type ContractActions<Contract extends ContractRouterType> = {
  [K in keyof Contract as Contract[K] extends ContractListener
    ? never
    : K]: Contract[K] extends ContractRouterType
    ? ContractActions<Contract[K]>
    : Contract[K] extends ContractAction
      ? Contract[K]
      : never
}

type AnyContractListeners = ContractListeners<any>
type ContractListeners<Contract extends ContractRouterType> = {
  [K in keyof Contract as Contract[K] extends ContractAction
    ? never
    : K]: Contract[K] extends ContractRouterType
    ? ContractListeners<Contract[K]>
    : Contract[K] extends ContractListener
      ? Contract[K]
      : never
}

type FilterPathsByType<
  Contract extends ContractRouterType,
  Path extends string,
  Type extends ContractType,
> =
  ValueAtPath<Contract, Path> extends ContractAction | ContractListener
    ? ValueAtPath<Contract, Path>['type'] extends Type
      ? Path
      : never
    : never
type Leaves<T> = T extends object
  ? {
      [K in keyof T]: T[K] extends IoAction | IoListener
        ? Exclude<K, symbol>
        : `${Exclude<K, symbol>}${Leaves<T[K]> extends never ? '' : `.${Leaves<T[K]>}`}`
    }[keyof T]
  : never

type ValueAtPath<T, P> = P extends `${infer Key}.${infer Rest}`
  ? Key extends keyof T
    ? ValueAtPath<T[Key], Rest>
    : never
  : P extends keyof T
    ? T[P]
    : never

type GetKeys<Obj extends object> = keyof Obj

type ContractPaths<Contract extends ContractRouterType, Type extends ContractType> = GetKeys<{
  [Path in Leaves<Contract> as FilterPathsByType<Contract, Path, Type>]: Path
}>

export { defineContract, isContractAction, isContractListener, isContractRouter, isActionWithAck }
export type {
  TBaseAction,
  TActionWithAck,
  AnyContractActions,
  AnyContractListeners,
  ContractAction,
  ContractActions,
  ContractListener,
  ContractListeners,
  ContractPaths,
  ContractRouterType,
  ValueAtPath,
}
