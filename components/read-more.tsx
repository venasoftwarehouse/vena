"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { formatAIText } from "@/lib/format-ai-text"

interface ReadMoreProps {
  text: string
  maxLength?: number
  className?: string
}

export function ReadMore({ text, maxLength = 150, className = "" }: ReadMoreProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  if (text.length <= maxLength) {
    return (
      <span className={className}>
        {formatAIText(text)}
      </span>
    )
  }

  const truncatedText = text.substring(0, maxLength) + "..."

  return (
    <span className={className}>
      <span>
        {formatAIText(isExpanded ? text : truncatedText)}
      </span>
      <Button
        variant="link"
        className="p-0 h-auto text-sm font-normal"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        {isExpanded ? "Tampilkan Lebih Sedikit" : "Baca Selengkapnya"}
      </Button>
    </span>
  )
}