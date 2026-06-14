import { attachTsIoToWebSocket } from './adapter'
import type { ContractRouterType } from './contract'
import { createMiddlewareFactory } from './middleware'
import { createRouterFactory } from './router'

class TsIoBuilder<TContext extends object> {
  context<TNewContext extends object>() {
    return new TsIoBuilder<TNewContext>()
  }
  create<TContract extends ContractRouterType>(contract: TContract) {
    return {
      router: createRouterFactory<TContract, TContext>(contract),
      middleware: createMiddlewareFactory<TContext>(),
      attachRouterToSocket: attachTsIoToWebSocket<TContext>,
    }
  }
}
const initTsIo = new TsIoBuilder()

export { initTsIo }
