'use client'

import { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Copy } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'

// ─── Types ─────────────────────────────────────────────────────────────────

interface MarkdownEditorProps {
  value: string
  onChange?: (value: string) => void
  readonly?: boolean
  minRows?: number
}

// ─── Component ─────────────────────────────────────────────────────────────

export default function MarkdownEditor({
  value,
  onChange,
  readonly = false,
  minRows = 8,
}: MarkdownEditorProps) {
  const [tab, setTab] = useState<'write' | 'preview'>(readonly ? 'preview' : 'write')

  function handleCopy() {
    navigator.clipboard.writeText(value || '')
    toast.success('Copied to clipboard')
  }

  return (
    <div className="rounded-lg overflow-hidden border border-[#3d3d3d] bg-[#1e1e1e]">
      {/* Header */}
      <div className="flex items-center gap-1 px-3 py-2 bg-[#2d2d2d] border-b border-[#3d3d3d]">
        {!readonly && (
          <>
            <button
              type="button"
              onClick={() => setTab('write')}
              className={`px-3 py-0.5 rounded text-xs font-medium transition-colors ${
                tab === 'write'
                  ? 'bg-[#1e1e1e] text-white'
                  : 'text-[#8a8a8a] hover:text-white'
              }`}
            >
              Write
            </button>
            <button
              type="button"
              onClick={() => setTab('preview')}
              className={`px-3 py-0.5 rounded text-xs font-medium transition-colors ${
                tab === 'preview'
                  ? 'bg-[#1e1e1e] text-white'
                  : 'text-[#8a8a8a] hover:text-white'
              }`}
            >
              Preview
            </button>
          </>
        )}

        {readonly && (
          <span className="text-xs text-[#8a8a8a] font-medium">markdown</span>
        )}

        <div className="flex-1" />

        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 text-[#8a8a8a] hover:text-white hover:bg-[#3d3d3d]"
          onClick={handleCopy}
          type="button"
          title="Copy to clipboard"
        >
          <Copy className="w-3 h-3" />
        </Button>
      </div>

      {/* Body */}
      {tab === 'write' ? (
        <Textarea
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          placeholder="Write markdown..."
          className="rounded-none border-0 bg-[#1e1e1e] text-[#d4d4d4] text-xs font-mono resize-none focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-[#555]"
          rows={minRows}
        />
      ) : (
        <div className="markdown-preview min-h-[80px]">
          {value?.trim() ? (
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {value}
            </ReactMarkdown>
          ) : (
            <p className="text-[#555] text-xs italic">Nothing to preview.</p>
          )}
        </div>
      )}
    </div>
  )
}
