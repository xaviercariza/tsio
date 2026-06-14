import type { ContractRouterType } from './contract'
import type { EmitEventToFunction } from './emitter'
import type { MaybePromise, TResponse, UnsetMarker } from './types'

interface ActionCallOptions<Contract extends ContractRouterType, TContext, TInput> {
  path: string
  ctx: TContext
  input: TInput
  emitTo: EmitEventToFunction<Contract>
}

type ActionResolverParams<Contract extends ContractRouterType, TContext, TInput> = {
  ctx: TContext
  input: TInput
  emitEventTo: EmitEventToFunction<Contract>
}

type AnyActionResolver = ActionResolver<any, any, any, any>
type ActionResolver<Contract extends ContractRouterType, TContext, TInput, TOutput> = (
  params: ActionResolverParams<Contract, TContext, TInput>
) => MaybePromise<TOutput extends UnsetMarker ? void : TResponse<TOutput>>

type AnyAction = Action<any, any, any, any>
type Action<Contract extends ContractRouterType, TContext, TInput, TOutput> = (
  params: ActionCallOptions<Contract, TContext, TInput>
) => TOutput extends UnsetMarker ? MaybePromise<void> : MaybePromise<TResponse<TOutput>>

export type { ActionCallOptions, AnyActionResolver, ActionResolver, AnyAction, Action }
