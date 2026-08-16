import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const alertVariants = cva(
  "relative w-full rounded-xl border px-4 py-3 text-sm grid has-[>svg]:grid-cols-[calc(var(--spacing)*4)_1fr] grid-cols-[0_1fr] has-[>svg]:gap-x-3 gap-y-0.5 items-start [&>svg]:size-4 [&>svg]:translate-y-0.5 [&>svg]:text-current",
  {
    variants: {
      variant: {
        default: "bg-card text-card-foreground border-border",
        destructive:
          "text-destructive border-destructive/25 bg-destructive/5 dark:border-destructive/40 [&>svg]:text-current",
        warning:
          "text-[#a8651c] border-[#a8651c]/25 bg-[#a8651c]/5 [&>svg]:text-current",
        success:
          "text-[#16845c] border-[#16845c]/25 bg-[#16845c]/5 [&>svg]:text-current",
        brand:
          "text-[#FE6501] border-[#FE6501]/25 bg-[#FE6501]/5 [&>svg]:text-current",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Alert({
  className,
  variant,
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof alertVariants>) {
  return (
    <div
      data-slot="alert"
      role="alert"
      className={cn(alertVariants({ variant }), className)}
      {...props}
    />
  )
}

function AlertTitle({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-title"
      className={cn("font-medium tracking-tight text-xs col-start-2 leading-none", className)}
      {...props}
    />
  )
}

function AlertDescription({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-description"
      className={cn("text-xs text-muted-foreground col-start-2 leading-relaxed mt-1", className)}
      {...props}
    />
  )
}

export { Alert, AlertTitle, AlertDescription }
