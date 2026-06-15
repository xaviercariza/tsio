import type { AnyEmitFunction } from './contract'
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

type NextFunction = <TNextContext extends object = object>(opts?: {
  ctx?: TNextContext
}) => Promise<MiddlewareResult<TNextContext>>

export type MiddlewareFunction<TContext, TContextOverridesOut, TInput> = (
  opts: MiddlewareFunctionParams<TContext, TInput> & {
    next: NextFunction
  }
) => MaybePromise<MiddlewareResult<TContextOverridesOut>>

export type MiddlewareFactoryFunction<TContext, TInput> = (
  opts: MiddlewareFunctionParams<TContext, TInput> & {
    next: NextFunction
  }
) => MaybePromise<MiddlewareResult<any>>

type AwaitedReturn<T> = T extends PromiseLike<infer Inner> ? AwaitedReturn<Inner> : T

type InferContextFromMiddlewareResult<TResult> = [Extract<AwaitedReturn<TResult>, { ok: true }>] extends [
  never,
]
  ? object
  : Extract<AwaitedReturn<TResult>, { ok: true }> extends { ctx?: infer TContextOverride }
    ? NonNullable<TContextOverride> extends object
      ? NonNullable<TContextOverride>
      : object
    : object

export type MiddlewareContextOut<TMiddleware> = TMiddleware extends MiddlewareBuilder<
  any,
  infer TContextOverrides,
  any
>
  ? TContextOverrides
  : TMiddleware extends (...args: any[]) => infer TResult
    ? InferContextFromMiddlewareResult<TResult>
    : object

export type MiddlewareInput<TContext, TInput> =
  | MiddlewareFactoryFunction<TContext, TInput>
  | MiddlewareBuilder<TContext, any, any>

type Middleware<TContext, TContextOverridesOut, TInput> = {
  type: 'middleware'
  fn: MiddlewareFunction<TContext, TContextOverridesOut, TInput>
}

export type MiddlewareResolverFunction<TContext, TContextOverridesOut, TInput> = (
  opts: MiddlewareFunctionParams<TContext, TInput> & {
    emit: AnyEmitFunction
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
  pipe<
    TMiddleware extends MiddlewareFactoryFunction<
      Simplify<Overwrite<TContext, TContextOverrides>>,
      any
    >,
  >(
    fn: TMiddleware
  ): MiddlewareBuilder<TContext, Overwrite<TContextOverrides, MiddlewareContextOut<TMiddleware>>, TInput>
  pipe<TRequiredContext, TNextContextOverrides extends object>(
    fn: Simplify<Overwrite<TContext, TContextOverrides>> extends TRequiredContext
      ? MiddlewareBuilder<TRequiredContext, TNextContextOverrides, any>
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

function getMiddlewaresFromInput(
  middlewareBuilderOrFn: AnyMiddlewareFunction | AnyMiddlewareBuilder
): AnyMiddlewareFunction[] {
  return typeof middlewareBuilderOrFn === 'object' && '_middlewares' in middlewareBuilderOrFn
    ? middlewareBuilderOrFn._middlewares
    : [middlewareBuilderOrFn]
}

export function createMiddlewareFactory<TContext, TInputOut = unknown>() {
  function createMiddlewareInner<TBaseContext, TContextOverrides, TInput>(
    middlewares: AnyMiddlewareFunction[]
  ): MiddlewareBuilder<TBaseContext, TContextOverrides, TInput> {
    const builder = {
      _middlewares: middlewares,
      pipe(middlewareBuilderOrFn: AnyMiddlewareFunction | AnyMiddlewareBuilder) {
        const pipedMiddlewares = getMiddlewaresFromInput(middlewareBuilderOrFn)

        return createMiddlewareInner([...middlewares, ...pipedMiddlewares])
      },
    }

    return builder as MiddlewareBuilder<TBaseContext, TContextOverrides, TInput>
  }

  function createMiddleware<TMiddleware extends MiddlewareFactoryFunction<TContext, TInputOut>>(
    fn: TMiddleware
  ): MiddlewareBuilder<TContext, MiddlewareContextOut<TMiddleware>, TInputOut> {
    return createMiddlewareInner<TContext, MiddlewareContextOut<TMiddleware>, TInputOut>([
      fn as AnyMiddlewareFunction,
    ])
  }

  return createMiddleware
}
