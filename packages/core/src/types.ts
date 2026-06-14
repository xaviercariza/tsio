import type { z } from 'zod'

type MaybePromise<TType> = Promise<TType> | TType

type Simplify<TType> = TType extends any[] | Date
  ? TType
  : {
      [K in keyof TType]: TType[K]
    } & {}

type Overwrite<TType, TWith> = Simplify<Omit<TType, keyof TWith> & TWith>
type MergeContext<TContext, TContextOverride> = Overwrite<TContext, TContextOverride>

type InferSchema<Schema> = Schema extends z.ZodTypeAny ? z.infer<Schema> : never

type TSuccessResponse<Data> = { success: true; data: Data }
type ErrorResponse = { success: false; error: string }
type TResponse<Data> = TSuccessResponse<Data> | ErrorResponse

export type {
  ErrorResponse,
  InferSchema,
  MaybePromise,
  MergeContext,
  Overwrite,
  Simplify,
  TResponse,
  TSuccessResponse,
}
