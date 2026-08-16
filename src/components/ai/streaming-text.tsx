"use client"

import { useEffect, useState, useSyncExternalStore } from "react"

import { MarkdownContent } from "@/components/chat/markdown-content"
import { cn } from "@/lib/utils"

type StreamingTextProps = {
  text: string
  className?: string
  charsPerTick?: number
  tickMs?: number
  onProgress?: () => void
  onComplete?: () => void
}

export function StreamingText({
  text,
  className,
  charsPerTick = 4,
  tickMs = 8,
  onProgress,
  onComplete,
}: StreamingTextProps) {
  const [visible, setVisible] = useState(0)
  const reduceMotion = useSyncExternalStore(
    (callback) => {
      const media = window.matchMedia("(prefers-reduced-motion: reduce)")
      media.addEventListener("change", callback)
      return () => media.removeEventListener("change", callback)
    },
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    () => false,
  )

  useEffect(() => {
    if (reduceMotion) {
      onComplete?.()
      return
    }

    const interval = window.setInterval(() => {
      setVisible((current) => {
        const next = Math.min(current + charsPerTick, text.length)
        if (next === text.length) {
          window.clearInterval(interval)
          onComplete?.()
        }
        return next
      })
    }, tickMs)

    return () => window.clearInterval(interval)
  }, [charsPerTick, onComplete, reduceMotion, text, tickMs])

  const renderedLength = reduceMotion ? text.length : visible
  const isStreaming = renderedLength < text.length
  const rendered = text.slice(0, renderedLength)

  useEffect(() => {
    if (!onProgress) return
    const animationFrame = window.requestAnimationFrame(onProgress)
    return () => window.cancelAnimationFrame(animationFrame)
  }, [onProgress, renderedLength])

  return (
    <div className={cn("relative", className)}>
      <MarkdownContent content={rendered} />
      {isStreaming ? <span aria-hidden className="xecute-stream-caret inline-block ml-0.5" /> : null}
    </div>
  )
}
