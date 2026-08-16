import type { SVGProps } from "react"

import { cn } from "@/lib/utils"

export function XLayerIcon({ className, ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("size-3.5 shrink-0", className)}
      {...props}
    >
      <circle cx="16" cy="16" r="16" fill="#18191d" />
      {/* 5 White Pixel Squares */}
      <rect x="6.5" y="8.75" width="4.5" height="4.5" rx="1" fill="#ffffff" />
      <rect x="11.5" y="13.75" width="4.5" height="4.5" rx="1" fill="#ffffff" />
      <rect x="6.5" y="18.75" width="4.5" height="4.5" rx="1" fill="#ffffff" />
      <rect x="16.5" y="8.75" width="4.5" height="4.5" rx="1" fill="#ffffff" />
      <rect x="16.5" y="18.75" width="4.5" height="4.5" rx="1" fill="#ffffff" />
      {/* 2 Gray Pixel Blocks on Right */}
      <rect x="22.5" y="8.75" width="3" height="4.5" rx="1" fill="#8e929b" />
      <rect x="22.5" y="18.75" width="3" height="4.5" rx="1" fill="#8e929b" />
    </svg>
  )
}
