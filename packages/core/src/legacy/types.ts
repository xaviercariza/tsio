import type { ZodType, z } from 'zod'

type WithoutIndexSignature<TObj> = {
  [K in keyof TObj as string extends K ? never : number extends K ? never : K]: TObj[K]
}

type Overwrite<TType, TWith> = TWith extends any
  ? TType extends object
    ? {
        [K in
          | keyof WithoutIndexSignature<TType>
          | keyof WithoutIndexSignature<TWith>]: K extends keyof TWith
          ? TWith[K]
          : K extends keyof TType
            ? TType[K]
            : never
      } & (string extends keyof TWith
        ? { [key: string]: TWith[string] }
        : number extends keyof TWith
          ? { [key: number]: TWith[number] }
          : Record<string, any>)
    : TWith
  : never

type Simplify<TType> = TType extends any[] | Date ? TType : { [K in keyof TType]: TType[K] }

type MaybePromise<TType> = Promise<TType> | TType

const unsetMarker = Symbol('unsetMarker')
type UnsetMarker = typeof unsetMarker

type DefaultValue<TValue, TFallback> = TValue extends UnsetMarker ? TFallback : TValue

type ParseSchema<Schema extends ZodType | undefined> = Schema extends undefined
  ? UnsetMarker
  : Schema extends ZodType
    ? z.infer<Schema>
    : never

type TSuccessResponse<Data> = { success: true; data: Data }
type ErrorResponse = { success: false; error: string }
type TResponse<Data> = TSuccessResponse<Data> | ErrorResponse

export type { Overwrite, Simplify, MaybePromise, UnsetMarker, DefaultValue, ParseSchema, TResponse }
