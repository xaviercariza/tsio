import type { ZodType } from 'zod'
import type {
  Action,
  ActionCallOptions,
  ActionResolver,
  AnyAction,
  AnyActionResolver,
} from './action'
import type { ContractRouterType } from './contract'
import {
  type AnyMiddlewareFn,
  type AnyMiddlewareFunctionParams,
  type MiddlewareBuilder,
  type MiddlewareFunction,
  type MiddlewareResult,
  isMiddlewareResolver,
} from './middleware'
import type { DefaultValue, Overwrite, ParseSchema, UnsetMarker } from './types'
import { mergeWithoutOverrides } from './utils'

type ActionBuilderDef = {
  input?: ZodType
  resolver?: AnyActionResolver
  middlewares: AnyMiddlewareFn[]
}

type AnyActionBuilderDef = ActionBuilderDef

type AnyActionBuilder = ActionBuilder<any, any, any, any, any>

export interface ActionBuilder<
  Contract extends ContractRouterType,
  TInitialContext,
  TContextOverrides,
  TInput,
  TOutput,
> {
  _def: ActionBuilderDef
  use<TContextOut>(
    fn:
      | MiddlewareBuilder<Overwrite<TInitialContext, TContextOverrides>, TContextOut, TInput>
      | MiddlewareFunction<TInitialContext, TContextOverrides, TContextOut, TInput>
  ): ActionBuilder<
    Contract,
    TInitialContext,
    Overwrite<TContextOverrides, TContextOut>,
    TInput,
    TOutput
  >
  handler(
    resolver: ActionResolver<Contract, TContextOverrides, TInput, TOutput>
  ): Action<Contract, TContextOverrides, TInput, DefaultValue<TOutput, UnsetMarker>>
}

function createNewBuilder(
  def1: AnyActionBuilderDef,
  def2: Partial<AnyActionBuilderDef>
): AnyActionBuilder {
  const { middlewares = [], ...rest } = def2

  return createBuilder({
    ...mergeWithoutOverrides(def1, rest),
    middlewares: [...def1.middlewares, ...middlewares],
  })
}

type BuilderDefinition<
  Contract extends ContractRouterType,
  TContext extends object,
  TInput,
  TOutput,
> = {
  contract: Contract
  ctx: TContext
  input: TInput
  output: TOutput
}

export function createBuilder<Definition extends BuilderDefinition<any, any, any, any>>(
  initDef: Partial<AnyActionBuilderDef> = {}
): ActionBuilder<
  Definition['contract'],
  Definition['ctx'],
  object,
  ParseSchema<Definition['input']>,
  ParseSchema<Definition['output']>
> {
  const _def: AnyActionBuilderDef = {
    middlewares: [],
    ...initDef,
  }

  const builder: AnyActionBuilder = {
    _def,
    use(middlewareBuilderOrFn) {
      const middlewares =
        '_middlewares' in middlewareBuilderOrFn
          ? middlewareBuilderOrFn._middlewares
          : [middlewareBuilderOrFn]

      return createNewBuilder(_def, {
        middlewares: middlewares.map(mw => ({ type: 'middleware', fn: mw })),
      })
    },
    handler(resolver) {
      return createResolver(_def, resolver) as AnyAction
    },
  }

  return builder
}

function createResolver(_defIn: AnyActionBuilderDef, resolver: AnyActionResolver) {
  const finalBuilder = createNewBuilder(_defIn, {
    resolver,
    middlewares: [
      {
        type: 'resolver',
        fn: async function resolveMiddleware(opts) {
          const data = await resolver(opts)
          return {
            ok: true,
            data,
            ctx: opts.ctx,
          } as const
        },
      },
    ],
  })

  const invoke = createActionCaller(finalBuilder._def)
  return invoke
}

function createActionCaller(_def: AnyActionBuilderDef): AnyAction {
  async function action(opts: ActionCallOptions<any, unknown, AnyActionBuilderDef['input']>) {
    async function callRecursive(
      callOpts: {
        ctx: any
        index: number
      } = {
        index: 0,
        ctx: opts.ctx,
      }
    ): Promise<MiddlewareResult<any>> {
      try {
        const middleware = _def.middlewares[callOpts.index]
        if (!middleware) {
          throw new Error(`Middleware not found at position ${callOpts.index}`)
        }

        const params: AnyMiddlewareFunctionParams = {
          ctx: callOpts.ctx,
          path: opts.path,
          input: opts.input,
        }

        if (isMiddlewareResolver(middleware)) {
          return await middleware.fn({
            ...params,
            emitEventTo: opts.emitTo,
          })
        }

        return await middleware.fn({
          ...params,
          next(_nextOpts?: any) {
            const nextOpts = _nextOpts as
              | {
                  ctx?: Record<string, unknown>
                }
              | undefined

            return callRecursive({
              index: callOpts.index + 1,
              ctx:
                nextOpts && 'ctx' in nextOpts ? { ...callOpts.ctx, ...nextOpts.ctx } : callOpts.ctx,
            })
          },
        })
      } catch (cause) {
        return {
          ok: false,
          error: cause as Error,
        }
      }
    }

    const result = await callRecursive()
    if (!result) {
      throw new Error('No result from middlewares - did you forget to `return next()`?')
    }
    if (!result.ok) {
      throw result.error
    }
    return result.data
  }

  action._def = _def

  // FIXME typecast shouldn't be needed - fixittt
  return action as unknown as AnyAction
}
