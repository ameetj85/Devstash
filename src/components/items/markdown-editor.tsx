'use client'

import { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Copy, Sparkles, Loader2, Check, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import ProAIButton from './pro-ai-button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { toast } from 'sonner'
import { optimizePrompt } from '@/actions/ai'

// ─── Types ─────────────────────────────────────────────────────────────────

interface MarkdownEditorProps {
  value: string
  onChange?: (value: string) => void
  readonly?: boolean
  minRows?: number
  optimize?: {
    typeName: 'prompt'
    title?: string
    isPro: boolean
    onAccept: (optimized: string) => void | Promise<void>
  }
}

// ─── Component ─────────────────────────────────────────────────────────────

export default function MarkdownEditor({
  value,
  onChange,
  readonly = false,
  minRows = 8,
  optimize,
}: MarkdownEditorProps) {
  const [tab, setTab] = useState<'write' | 'preview'>(readonly ? 'preview' : 'write')
  const [optimizing, setOptimizing] = useState(false)
  const [accepting, setAccepting] = useState(false)
  const [suggestion, setSuggestion] = useState<{
    optimized: string
    rationale?: string
  } | null>(null)

  function handleCopy() {
    navigator.clipboard.writeText(value || '')
    toast.success('Copied to clipboard')
  }

  async function handleOptimize() {
    if (!optimize || optimizing) return
    if (!value?.trim()) {
      toast.error('Nothing to optimize')
      return
    }
    setOptimizing(true)
    try {
      const result = await optimizePrompt({
        content: value,
        typeName: optimize.typeName,
        title: optimize.title ?? null,
      })
      if (!result.success) {
        toast.error(result.error)
        return
      }
      if (!result.data.changed) {
        toast.success(result.data.rationale || 'Prompt is already well-optimized.')
        return
      }
      setSuggestion({
        optimized: result.data.optimized,
        rationale: result.data.rationale,
      })
    } catch (error) {
      console.error('Optimize prompt error:', error)
      toast.error('Failed to optimize prompt. Please try again.')
    } finally {
      setOptimizing(false)
    }
  }

  async function handleAccept() {
    if (!suggestion || !optimize) return
    setAccepting(true)
    try {
      await optimize.onAccept(suggestion.optimized)
      setSuggestion(null)
    } finally {
      setAccepting(false)
    }
  }

  function handleReject() {
    setSuggestion(null)
  }

  const showOptimizeUI = !!optimize

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

        {/* Optimize button (prompt type only) */}
        {showOptimizeUI && (
          <ProAIButton
            isPro={optimize!.isPro}
            loading={optimizing}
            onClick={handleOptimize}
            title="Optimize prompt with AI"
          />
        )}

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

      {/* Optimize suggestion dialog */}
      <Dialog open={!!suggestion} onOpenChange={(o) => !o && !accepting && setSuggestion(null)}>
        <DialogContent className="sm:max-w-3xl overflow-y-auto max-h-[90dvh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#8b5cf6]" />
              Optimized prompt
            </DialogTitle>
          </DialogHeader>

          {suggestion && (
            <div className="flex flex-col gap-4">
              {suggestion.rationale && (
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {suggestion.rationale}
                </p>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Original
                  </p>
                  <pre className="rounded-lg border border-border bg-muted/40 p-3 text-xs whitespace-pre-wrap break-words max-h-[50vh] overflow-y-auto font-mono leading-relaxed">
                    {value}
                  </pre>
                </div>
                <div className="flex flex-col gap-1.5">
                  <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: '#8b5cf6' }}>
                    Optimized
                  </p>
                  <pre
                    className="rounded-lg border p-3 text-xs whitespace-pre-wrap break-words max-h-[50vh] overflow-y-auto font-mono leading-relaxed"
                    style={{ borderColor: '#8b5cf666', backgroundColor: '#8b5cf611' }}
                  >
                    {suggestion.optimized}
                  </pre>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleReject}
              disabled={accepting}
              className="gap-1.5"
            >
              <X className="w-3.5 h-3.5" />
              Reject
            </Button>
            <Button
              type="button"
              onClick={handleAccept}
              disabled={accepting}
              className="gap-1.5"
            >
              {accepting ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Check className="w-3.5 h-3.5" />
              )}
              {accepting ? 'Applying…' : 'Accept'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
