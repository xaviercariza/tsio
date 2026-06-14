import type { z } from 'zod'
import type { ContractRouterType, EmitEventToFunction } from './contract'
import type { AnyMiddlewareFn } from './middleware'
import type { MaybePromise, TResponse } from './types'

type ActionRuntimeDefinition = {
  input?: z.ZodTypeAny
  response?: z.ZodTypeAny
  validateInput: boolean
  validateResponse: boolean
  middlewares: AnyMiddlewareFn[]
}

interface ActionCallOptions<Contract extends ContractRouterType, TContext, TInput> {
  path: string
  ctx: TContext
  input: TInput
  emitTo: EmitEventToFunction<Contract>
}

type ActionResolverParams<Contract extends ContractRouterType, TContext, TInput> = {
  path: string
  ctx: TContext
  input: TInput
  emitEventTo: EmitEventToFunction<Contract>
}

type ActionResult<TOutput> = TOutput extends void ? void : TResponse<TOutput>

type AnyActionResolver = ActionResolver<any, any, any, any>
type ActionResolver<Contract extends ContractRouterType, TContext, TInput, TOutput> = (
  params: ActionResolverParams<Contract, TContext, TInput>
) => MaybePromise<ActionResult<TOutput>>

type AnyAction = Action<any, any, any, any>
type Action<Contract extends ContractRouterType, TContext, TInput, TOutput> = ((
  params: ActionCallOptions<Contract, TContext, TInput>
) => MaybePromise<ActionResult<TOutput>>) & {
  _def?: ActionRuntimeDefinition
}

export type {
  Action,
  ActionCallOptions,
  ActionResolver,
  ActionResolverParams,
  ActionResult,
  ActionRuntimeDefinition,
  AnyAction,
  AnyActionResolver,
}
