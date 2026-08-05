"use client"

import React from "react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { cn } from "@/lib/utils"

interface MarkdownRendererProps {
  content: string
  className?: string
}

export function MarkdownRenderer({ content, className }: MarkdownRendererProps) {
  return (
    <div className={cn("prose-sm text-xs sm:text-sm max-w-none leading-relaxed", className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          p: ({ children }) => <p className="mb-2 last:mb-0 leading-relaxed">{children}</p>,
          h1: ({ children }) => (
            <h1 className="text-base font-bold mt-3 mb-2 text-foreground border-b pb-1">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-sm font-bold mt-3 mb-1.5 text-foreground">{children}</h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-sm font-semibold mt-2.5 mb-1 text-foreground">{children}</h3>
          ),
          ul: ({ children }) => (
            <ul className="list-disc list-inside my-2 space-y-1 pl-1">{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal list-inside my-2 space-y-1 pl-1">{children}</ol>
          ),
          li: ({ children }) => <li className="leading-relaxed">{children}</li>,
          blockquote: ({ children }) => (
            <blockquote className="border-l-2 border-primary/60 pl-3 my-2 italic text-muted-foreground bg-muted/30 py-1 rounded-r">
              {children}
            </blockquote>
          ),
          code: ({ className: codeClassName, children, ...props }) => {
            const isInline = !codeClassName && !String(children).includes("\n")
            if (isInline) {
              return (
                <code
                  className="rounded bg-muted-foreground/20 px-1.5 py-0.5 font-mono text-[0.85em] text-foreground font-medium"
                  {...props}
                >
                  {children}
                </code>
              )
            }
            return (
              <div className="my-2 overflow-x-auto rounded-md bg-muted p-3 font-mono text-xs text-foreground border border-border">
                <code className={codeClassName} {...props}>
                  {children}
                </code>
              </div>
            )
          },
          table: ({ children }) => (
            <div className="my-3 overflow-x-auto rounded-lg border border-border">
              <table className="w-full text-left text-xs border-collapse">{children}</table>
            </div>
          ),
          thead: ({ children }) => (
            <thead className="bg-muted/80 text-muted-foreground font-semibold">{children}</thead>
          ),
          th: ({ children }) => (
            <th className="border-b border-border px-3 py-2 text-left text-xs font-semibold">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="border-b border-border/40 px-3 py-1.5 text-xs">{children}</td>
          ),
          a: ({ href, children }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-primary underline underline-offset-4 hover:opacity-80"
            >
              {children}
            </a>
          ),
          strong: ({ children }) => (
            <strong className="font-semibold text-foreground">{children}</strong>
          ),
          hr: () => <hr className="my-3 border-border" />,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}
