import type { ContractRouterType } from './contract'

type Merge<T, U> = (T extends object
  ? {
      [K in keyof T]: K extends keyof U ? Merge<T[K], U[K]> : T[K]
    }
  : unknown) &
  U
function deepMerge<T extends object>(target: T, source: T): T {
  const isObject = (obj: any) => obj && typeof obj === 'object'

  if (!isObject(target) || !isObject(source)) {
    return source
  }

  Object.keys(source).forEach(key => {
    const anyTarget = target as any
    const anySource = source as any
    const targetValue = anyTarget[key]
    const sourceValue = anySource[key]

    if (Array.isArray(targetValue) && Array.isArray(sourceValue)) {
      anyTarget[key] = sourceValue.concat(targetValue)
    } else if (isObject(targetValue) && isObject(sourceValue)) {
      anyTarget[key] = deepMerge(Object.assign({}, targetValue), sourceValue)
    } else {
      anyTarget[key] = sourceValue
    }
  })

  return target
}

function mergeWithoutOverrides<TType extends Record<string, unknown>>(
  obj1: TType,
  ...objs: Partial<TType>[]
): TType {
  const newObj: TType = Object.assign(Object.create(null), obj1)

  for (const overrides of objs) {
    for (const key in overrides) {
      if (key in newObj && newObj[key] !== overrides[key]) {
        throw new Error(`Duplicate key ${key}`)
      }
      newObj[key as keyof TType] = overrides[key] as TType[keyof TType]
    }
  }
  return newObj
}

type MergedContracts<R extends ContractRouterType[]> = R extends [infer First, ...infer Rest]
  ? Rest extends ContractRouterType[]
    ? Merge<First, MergedContracts<Rest>>
    : never
  : unknown
const mergeContracts = <R extends ContractRouterType[]>(...routers: R): MergedContracts<R> => {
  return routers.reduce((prev, current) => {
    return deepMerge(prev, current)
  }, {} as ContractRouterType) as MergedContracts<R>
}

export { mergeContracts, mergeWithoutOverrides }
