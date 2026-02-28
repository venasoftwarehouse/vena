import React from "react"

/**
 * Format AI text with markdown-like syntax: bold (**text**), italic (*text*), and line breaks.
 * Supports basic formatting for chatbot output.
 */
export function formatAIText(text: string): React.ReactNode {
  if (!text) return null

  // Bullet list: detect lines starting with * or -
  const bulletListRegex = /^(\s*[*-]\s+.*(?:\n\s*[*-]\s+.*)*)/gm
  let formatted = text
    // Replace bullet lists with <ul><li>...</li></ul>
    .replace(bulletListRegex, (match) => {
      const items = match.split(/\n/).map(line => {
        const item = line.replace(/^\s*[*-]\s+/, "").trim()
        return item ? `<li>${item}</li>` : ""
      }).join("")
      return `<ul>${items}</ul>`
    })
    // Replace **bold** and *italic* using regex
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/\n/g, '<br />')

  // Return as JSX
  return <span dangerouslySetInnerHTML={{ __html: formatted }} />
}
