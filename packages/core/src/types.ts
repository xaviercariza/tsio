type MaybePromise<TType> = Promise<TType> | TType

type Simplify<TType> = TType extends any[] | Date
  ? TType
  : {
      [K in keyof TType]: TType[K]
    } & {}

type Overwrite<TType, TWith> = Simplify<Omit<TType, keyof TWith> & TWith>
type MergeContext<TContext, TContextOverride> = Overwrite<TContext, TContextOverride>

type TsIoSchema<TOutput = any> = {
  _output: TOutput
  parse(data: unknown): TOutput
}

type InferSchema<Schema> = Schema extends TsIoSchema<infer Output> ? Output : never

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
  TsIoSchema,
  TResponse,
  TSuccessResponse,
}
