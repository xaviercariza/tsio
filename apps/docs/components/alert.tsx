export default function Alert() {
  return (
    <div className="bg-blue-400 w-full h-auto">
      Responses in tsio are a discriminated union type, TResponseData. It can represent either a
      successful response containing data (TSuccessResponseData) or an error response
      (ErrorResponse).
    </div>
  )
}
