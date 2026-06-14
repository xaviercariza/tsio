import type { AnyEmitEventToFunction } from './contract'
import type { MaybePromise, Overwrite, Simplify } from './types'

interface MiddlewareOKResult<TContextOverride = object> {
  ok: true
  data?: unknown
  ctx?: TContextOverride
}

interface MiddlewareErrorResult {
  ok: false
  error: Error
}

export type MiddlewareResult<TContextOverride = object> =
  | MiddlewareErrorResult
  | MiddlewareOKResult<TContextOverride>

export type MiddlewareFunctionParams<TContext, TInput> = {
  ctx: Simplify<TContext>
  path: string
  input: TInput
}
export type AnyMiddlewareFunctionParams = MiddlewareFunctionParams<any, any>

type NextFunction = {
  <TNextContext extends object = object>(opts?: { ctx?: TNextContext }): Promise<
    MiddlewareResult<TNextContext>
  >
}

export type MiddlewareFunction<TContext, TContextOverridesOut, TInput> = (
  opts: MiddlewareFunctionParams<TContext, TInput> & {
    next: NextFunction
  }
) => MaybePromise<MiddlewareResult<TContextOverridesOut>>

type Middleware<TContext, TContextOverridesOut, TInput> = {
  type: 'middleware'
  fn: MiddlewareFunction<TContext, TContextOverridesOut, TInput>
}

export type MiddlewareResolverFunction<TContext, TContextOverridesOut, TInput> = (
  opts: MiddlewareFunctionParams<TContext, TInput> & {
    emitEventTo: AnyEmitEventToFunction
  }
) => MaybePromise<MiddlewareResult<TContextOverridesOut>>

type MiddlewareResolver<TContext, TContextOverridesOut, TInput> = {
  type: 'resolver'
  fn: MiddlewareResolverFunction<TContext, TContextOverridesOut, TInput>
}

export type MiddlewareFn<TContext, TContextOverridesOut, TInput> =
  | Middleware<TContext, TContextOverridesOut, TInput>
  | MiddlewareResolver<TContext, TContextOverridesOut, TInput>

export type AnyMiddlewareFn = MiddlewareFn<any, any, any>
export type AnyMiddlewareFunction = MiddlewareFunction<any, any, any>
export type AnyMiddlewareResolver = MiddlewareResolver<any, any, any>

export interface MiddlewareBuilder<TContext, TContextOverrides, TInput> {
  pipe<TRequiredContext, TNextContextOverrides extends object>(
    fn: Simplify<Overwrite<TContext, TContextOverrides>> extends TRequiredContext
      ? MiddlewareFunction<TRequiredContext, TNextContextOverrides, any> | MiddlewareBuilder<TRequiredContext, TNextContextOverrides, any>
      : never
  ): MiddlewareBuilder<TContext, Overwrite<TContextOverrides, TNextContextOverrides>, TInput>
  _middlewares: AnyMiddlewareFunction[]
}

export type AnyMiddlewareBuilder = MiddlewareBuilder<any, any, any>

export const isMiddlewareResolver = (
  middleware: AnyMiddlewareFn
): middleware is AnyMiddlewareResolver => {
  return middleware.type === 'resolver'
}

export function createMiddlewareFactory<TContext, TInputOut = unknown>() {
  function createMiddlewareInner<TBaseContext, TContextOverrides, TInput>(
    middlewares: AnyMiddlewareFunction[]
  ): MiddlewareBuilder<TBaseContext, TContextOverrides, TInput> {
    return {
      _middlewares: middlewares,
      pipe<TRequiredContext, TNextContextOverrides extends object>(middlewareBuilderOrFn: Simplify<Overwrite<TBaseContext, TContextOverrides>> extends TRequiredContext
        ? MiddlewareFunction<TRequiredContext, TNextContextOverrides, any> | MiddlewareBuilder<TRequiredContext, TNextContextOverrides, any>
        : never) {
        const pipedMiddlewares =
          typeof middlewareBuilderOrFn === 'object' && '_middlewares' in middlewareBuilderOrFn
            ? middlewareBuilderOrFn._middlewares
            : [middlewareBuilderOrFn]

        return createMiddlewareInner<
          TBaseContext,
          Overwrite<TContextOverrides, TNextContextOverrides>,
          TInput
        >([...middlewares, ...pipedMiddlewares])
      },
    }
  }

  function createMiddleware<TContextOverrides extends object>(
    fn: MiddlewareFunction<TContext, TContextOverrides, TInputOut>
  ): MiddlewareBuilder<TContext, TContextOverrides, TInputOut> {
    return createMiddlewareInner<TContext, TContextOverrides, TInputOut>([fn])
  }

  return createMiddleware
}
