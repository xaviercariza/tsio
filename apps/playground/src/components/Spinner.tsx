import type React from 'react'
import { twMerge } from 'tailwind-merge'

type Props = React.SVGProps<SVGSVGElement>

export function Spinner({ className, ...rest }: Props) {
  return (
    <svg
      className={twMerge('h-6 w-6 animate-spin text-indigo-200', className)}
      viewBox="0 0 100 100"
      {...rest}
    >
      <title>Loading spinner</title>
      <circle
        fill="none"
        strokeWidth="10"
        className="stroke-current opacity-40"
        cx="50"
        cy="50"
        r="40"
      />
      <circle
        fill="none"
        strokeWidth="10"
        className="stroke-current"
        strokeDasharray="250"
        strokeDashoffset="210"
        cx="50"
        cy="50"
        r="40"
      />
    </svg>
  )
}
