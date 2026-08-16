import type { SVGProps } from "react"

type XecuteMarkProps = SVGProps<SVGSVGElement> & {
  title?: string
}

export function XecuteMark({ title, ...props }: XecuteMarkProps) {
  return (
    <svg
      viewBox="0 0 100 100"
      fill="none"
      aria-hidden={title ? undefined : true}
      aria-label={title}
      role={title ? "img" : undefined}
      {...props}
    >
      {title ? <title>{title}</title> : null}
      <path d="M15 22H38.5L52.5 36.5L95 4L7 92L45.5 48.5L15 22Z" fill="currentColor" />
      <path d="M31 78L56.5 59.5L69 72H90L62.5 44L31 78Z" fill="currentColor" />
    </svg>
  )
}
