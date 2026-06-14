import type { AnyEmitEventToFunction } from './emitter'
import type { Overwrite, Simplify } from './types'

interface MiddlewareOKResult<_TContextOverride> {
  ok: true
  data: unknown
}

interface MiddlewareErrorResult<_TContextOverride> {
  ok: false
  error: Error
}

export type MiddlewareResult<_TContextOverride> =
  | MiddlewareErrorResult<_TContextOverride>
  | MiddlewareOKResult<_TContextOverride>

export interface MiddlewareBuilder<TContext, TContextOverrides, TInput> {
  pipe<$ContextOverridesOut>(
    fn:
      | MiddlewareFunction<TContext, TContextOverrides, $ContextOverridesOut, TInput>
      | MiddlewareBuilder<Overwrite<TContext, TContextOverrides>, $ContextOverridesOut, TInput>
  ): MiddlewareBuilder<TContext, Overwrite<TContextOverrides, $ContextOverridesOut>, TInput>
  _middlewares: MiddlewareFunction<TContext, TContextOverrides, object, TInput>[]
}

export type MiddlewareFunctionParams<TContext, TContextOverridesIn, TInput> = {
  ctx: Simplify<Overwrite<TContext, TContextOverridesIn>>
  path: string
  input: TInput
}
export type AnyMiddlewareFunctionParams = MiddlewareFunctionParams<any, any, any>

export type MiddlewareFunction<TContext, TContextOverridesIn, $ContextOverridesOut, TInput> = (
  opts: MiddlewareFunctionParams<TContext, TContextOverridesIn, TInput> & {
    next: {
      (): Promise<MiddlewareResult<TContext>>
      <TNextContext>(opts: { ctx?: TNextContext }): Promise<MiddlewareResult<TNextContext>>
    }
  }
) => Promise<MiddlewareResult<$ContextOverridesOut>>
type Middleware<TContext, TContextOverridesIn, $ContextOverridesOut, TInput> = {
  type: 'middleware'
  fn: MiddlewareFunction<TContext, TContextOverridesIn, $ContextOverridesOut, TInput>
}

export type MiddlewareResolverFunction<
  TContext,
  TContextOverridesIn,
  $ContextOverridesOut,
  TInput,
> = (
  opts: MiddlewareFunctionParams<TContext, TContextOverridesIn, TInput> & {
    emitEventTo: AnyEmitEventToFunction
  }
) => Promise<MiddlewareResult<$ContextOverridesOut>>
type MiddlewareResolver<TContext, TContextOverridesIn, $ContextOverridesOut, TInput> = {
  type: 'resolver'
  fn: MiddlewareResolverFunction<TContext, TContextOverridesIn, $ContextOverridesOut, TInput>
}

export type MiddlewareFn<TContext, TContextOverridesIn, $ContextOverridesOut, TInput> =
  | Middleware<TContext, TContextOverridesIn, $ContextOverridesOut, TInput>
  | MiddlewareResolver<TContext, TContextOverridesIn, $ContextOverridesOut, TInput>

export type AnyMiddlewareFn = MiddlewareFn<any, any, any, any>

export type AnyMiddlewareFunction = MiddlewareFunction<any, any, any, any>
export type AnyMiddlewareResolver = MiddlewareResolver<any, any, any, any>
export type AnyMiddlewareBuilder = MiddlewareBuilder<any, any, any>

export const isMiddlewareResolver = (
  middleware: AnyMiddlewareFn
): middleware is AnyMiddlewareResolver => {
  return middleware.type === 'resolver'
}

export function createMiddlewareFactory<TContext, TInputOut = unknown>() {
  function createMiddlewareInner(middlewares: AnyMiddlewareFunction[]): AnyMiddlewareBuilder {
    return {
      _middlewares: middlewares,
      pipe(middlewareBuilderOrFn) {
        const pipedMiddleware =
          '_middlewares' in middlewareBuilderOrFn
            ? middlewareBuilderOrFn._middlewares
            : [middlewareBuilderOrFn]

        return createMiddlewareInner([...middlewares, ...pipedMiddleware])
      },
    }
  }

  function createMiddleware<$ContextOverrides>(
    fn: MiddlewareFunction<TContext, object, $ContextOverrides, TInputOut>
  ): MiddlewareBuilder<TContext, $ContextOverrides, TInputOut> {
    return createMiddlewareInner([fn])
  }

  return createMiddleware
}
