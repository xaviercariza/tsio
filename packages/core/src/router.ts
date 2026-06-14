import type { Action, ActionResolver, ActionRuntimeDefinition, AnyAction } from './action'
import {
  type ContractAction,
  type ContractListener,
  type ContractRouterType,
  type InferActionInput,
  type InferActionOutput,
  isActionWithAck,
  isContractListener,
  isContractRouter,
} from './contract'
import {
  type AnyMiddlewareBuilder,
  type AnyMiddlewareFn,
  type AnyMiddlewareFunction,
  type MiddlewareBuilder,
  type MiddlewareContextOut,
  type MiddlewareInput,
  type MiddlewareResult,
  isMiddlewareResolver,
} from './middleware'
import type { Overwrite } from './types'

type AnyRouter = Router<any, any, any>
type Router<
  Contract extends ContractRouterType,
  TContext,
  RootContract extends ContractRouterType,
> = {
  [K in keyof Contract as Contract[K] extends ContractListener ? never : K]: Contract[K] extends ContractAction
    ? Action<RootContract, TContext, InferActionInput<Contract[K]>, InferActionOutput<Contract[K]>>
    : Contract[K] extends ContractRouterType
      ? Router<Contract[K], TContext, RootContract>
      : never
}

type RouterActionsBuilder<
  Contract extends ContractRouterType,
  TContext,
  RootContract extends ContractRouterType,
> = {
  [K in keyof Contract as Contract[K] extends ContractListener ? never : K]: Contract[K] extends ContractAction
    ? ActionBuilder<
        RootContract,
        TContext,
        TContext,
        InferActionInput<Contract[K]>,
        InferActionOutput<Contract[K]>
      >
    : Contract[K] extends ContractRouterType
      ? RouterActionsBuilder<Contract[K], TContext, RootContract>
      : never
}

export interface ActionBuilder<
  RootContract extends ContractRouterType,
  TInitialContext,
  TCurrentContext,
  TInput,
  TOutput,
> {
  _def: ActionRuntimeDefinition
  use<TRequiredContext, TMiddleware extends MiddlewareInput<TRequiredContext, any>>(
    fn: TCurrentContext extends TRequiredContext ? TMiddleware : never
  ): ActionBuilder<
    RootContract,
    TInitialContext,
    Overwrite<TCurrentContext, MiddlewareContextOut<TMiddleware>>,
    TInput,
    TOutput
  >
  handler(
    resolver: ActionResolver<RootContract, TCurrentContext, TInput, TOutput>
  ): Action<RootContract, TInitialContext, TInput, TOutput>
}

type AnyActionBuilder = ActionBuilder<any, any, any, any, any>

type AnyRouterCreator = RouterCreator<any, any, any>
interface RouterCreator<
  TContract extends ContractRouterType,
  TContext,
  RootContract extends ContractRouterType,
> {
  create(
    createActions: (
      actions: RouterActionsBuilder<TContract, TContext, RootContract>
    ) => Router<TContract, TContext, RootContract>
  ): Router<TContract, TContext, RootContract>
  create(router: Router<TContract, TContext, RootContract>): Router<TContract, TContext, RootContract>
}

type Routers<
  TContract extends ContractRouterType,
  TContext,
  RootContract extends ContractRouterType,
> = RouterCreator<TContract, TContext, RootContract> & {
  [K in keyof TContract as TContract[K] extends ContractRouterType ? K : never]: TContract[K] extends ContractRouterType
    ? Routers<TContract[K], TContext, RootContract>
    : never
}

function getMiddlewareFnsFromInput(
  middlewareBuilderOrFn: AnyMiddlewareFunction | AnyMiddlewareBuilder
): AnyMiddlewareFunction[] {
  return typeof middlewareBuilderOrFn === 'object' && '_middlewares' in middlewareBuilderOrFn
    ? middlewareBuilderOrFn._middlewares
    : [middlewareBuilderOrFn]
}

function createActionBuilder<
  RootContract extends ContractRouterType,
  TInitialContext,
  TCurrentContext,
  TInput,
  TOutput,
>(def: ActionRuntimeDefinition): ActionBuilder<RootContract, TInitialContext, TCurrentContext, TInput, TOutput> {
  const builder = {
    _def: def,
    use(middlewareBuilderOrFn: AnyMiddlewareFunction | AnyMiddlewareBuilder) {
      const middlewares = getMiddlewareFnsFromInput(middlewareBuilderOrFn)

      return createActionBuilder({
        ...def,
        middlewares: [
          ...def.middlewares,
          ...middlewares.map(middleware => ({ type: 'middleware', fn: middleware }) as AnyMiddlewareFn),
        ],
      })
    },
    handler(resolver: ActionResolver<any, any, any, any>) {
      return createResolver(def, resolver)
    },
  }

  return builder as ActionBuilder<RootContract, TInitialContext, TCurrentContext, TInput, TOutput>
}

function createResolver(_defIn: ActionRuntimeDefinition, resolver: ActionResolver<any, any, any, any>) {
  const _def: ActionRuntimeDefinition = {
    ..._defIn,
    middlewares: [
      ..._defIn.middlewares,
      {
        type: 'resolver',
        fn: async function resolveMiddleware(opts) {
          const data = await resolver({
            path: opts.path,
            ctx: opts.ctx,
            input: opts.input,
            emitEventTo: opts.emitEventTo,
          })

          return {
            ok: true,
            data,
            ctx: opts.ctx,
          } as const
        },
      },
    ],
  }

  const action = async (opts: any) => {
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

        const params = {
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
          next(nextOpts?: { ctx?: any }) {
            return callRecursive({
              index: callOpts.index + 1,
              ctx:
                nextOpts && 'ctx' in nextOpts && nextOpts.ctx !== undefined
                  ? { ...callOpts.ctx, ...nextOpts.ctx }
                  : callOpts.ctx,
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

  return action as AnyAction
}

const createContractActions = <
  TContract extends ContractRouterType,
  TContext,
  RootContract extends ContractRouterType,
>(
  contract: TContract
): RouterActionsBuilder<TContract, TContext, RootContract> => {
  return Object.entries(contract).reduce((acc, [key, subRouter]) => {
    if (isContractRouter(subRouter)) {
      return {
        ...acc,
        [key]: createContractActions<ContractRouterType, TContext, RootContract>(subRouter),
      }
    }

    if (isContractListener(subRouter)) {
      return acc
    }

    const action = subRouter as ContractAction
    return {
      ...acc,
      [key]: createActionBuilder({
        input: action.input,
        response: isActionWithAck(action) ? action.response : undefined,
        validateInput: action.options?.validate ?? false,
        validateResponse: action.options?.validate ?? false,
        middlewares: [],
      }),
    }
  }, {}) as RouterActionsBuilder<TContract, TContext, RootContract>
}

const getRouterCreator = <
  TContract extends ContractRouterType,
  TContext,
  RootContract extends ContractRouterType,
>(
  contract: TContract
): RouterCreator<TContract, TContext, RootContract> => {
  return {
    create: routerOrFactory => {
      if (typeof routerOrFactory === 'function') {
        return routerOrFactory(createContractActions<TContract, TContext, RootContract>(contract))
      }

      return routerOrFactory
    },
  }
}

function extractRouters<
  TContract extends ContractRouterType,
  TContext,
  RootContract extends ContractRouterType,
>(contract: TContract): Routers<TContract, TContext, RootContract> {
  const routers: Record<string, AnyRouterCreator> = {}

  function traverse(node: ContractRouterType) {
    for (const key in node) {
      const subRouter = node[key]
      if (subRouter && typeof subRouter === 'object' && isContractRouter(subRouter)) {
        routers[key] = getRouterCreator<ContractRouterType, TContext, RootContract>(subRouter)
        traverse(subRouter)
      }
    }
  }

  traverse(contract)

  return routers as Routers<TContract, TContext, RootContract>
}

function createRouterFactory<TContract extends ContractRouterType, TContext>(
  contract: TContract
): Routers<TContract, TContext, TContract> {
  return {
    ...getRouterCreator<TContract, TContext, TContract>(contract),
    ...extractRouters<TContract, TContext, TContract>(contract),
  }
}

export type { AnyRouter, Router, RouterCreator, RouterActionsBuilder }
export { createActionBuilder, createRouterFactory }
