import { attach } from './adapter'
import type { ContractRouterType } from './contract'
import { createMiddlewareFactory } from './middleware'
import { createRouterFactory } from './router'

class TsIoBuilder<TContext extends object = object> {
  context<TNewContext extends object>() {
    return new TsIoBuilder<TNewContext>()
  }

  create<TContract extends ContractRouterType>(contract: TContract) {
    return {
      router: createRouterFactory<TContract, TContext>(contract),
      middleware: createMiddlewareFactory<TContext>(),
      attach,
    }
  }
}

const createServer = new TsIoBuilder()

export { createServer }
