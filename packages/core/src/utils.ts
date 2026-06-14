import type { ContractRouterType } from './contract'

type Merge<T, U> = (T extends object
  ? {
      [K in keyof T]: K extends keyof U ? Merge<T[K], U[K]> : T[K]
    }
  : unknown) &
  U

function isObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function deepMerge<T extends object>(target: T, source: T): T {
  if (!isObject(target) || !isObject(source)) {
    return source
  }

  const result = { ...target } as Record<string, unknown>

  Object.keys(source).forEach(key => {
    const targetValue = result[key]
    const sourceValue = source[key]

    if (Array.isArray(targetValue) && Array.isArray(sourceValue)) {
      result[key] = sourceValue.concat(targetValue)
    } else if (isObject(targetValue) && isObject(sourceValue)) {
      result[key] = deepMerge(targetValue, sourceValue)
    } else {
      result[key] = sourceValue
    }
  })

  return result as T
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
