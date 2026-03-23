'use client'

import { useMemo } from 'react'
import Editor from '@monaco-editor/react'
import { Copy } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

// ─── Types ─────────────────────────────────────────────────────────────────

interface CodeEditorProps {
  value: string
  onChange?: (value: string) => void
  language?: string | null
  readonly?: boolean
}

// ─── Constants ─────────────────────────────────────────────────────────────

const LINE_HEIGHT = 20
const PADDING_VERTICAL = 24
const MAX_HEIGHT = 400
const MIN_HEIGHT = 80

// ─── Component ─────────────────────────────────────────────────────────────

export default function CodeEditor({
  value,
  onChange,
  language,
  readonly = false,
}: CodeEditorProps) {
  const lang = language?.trim().toLowerCase() || 'plaintext'

  const editorHeight = useMemo(() => {
    const lineCount = (value || '').split('\n').length
    const computed = lineCount * LINE_HEIGHT + PADDING_VERTICAL
    return Math.min(Math.max(computed, MIN_HEIGHT), MAX_HEIGHT)
  }, [value])

  function handleCopy() {
    navigator.clipboard.writeText(value || '')
    toast.success('Copied to clipboard')
  }

  return (
    <div className="rounded-lg overflow-hidden border border-[#3d3d3d] bg-[#1e1e1e]">
      {/* macOS-style header */}
      <div className="flex items-center gap-2 px-3 py-2 bg-[#2d2d2d] border-b border-[#3d3d3d]">
        {/* Window dots */}
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-[#FF5F57]" />
          <div className="w-3 h-3 rounded-full bg-[#FEBC2E]" />
          <div className="w-3 h-3 rounded-full bg-[#28C840]" />
        </div>

        {/* Language label */}
        {lang && lang !== 'plaintext' && (
          <span className="ml-2 text-xs text-[#8a8a8a] font-mono">{lang}</span>
        )}

        <div className="flex-1" />

        {/* Copy button */}
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

      {/* Monaco Editor */}
      <Editor
        value={value}
        onChange={(v) => onChange?.(v ?? '')}
        language={lang}
        theme="vs-dark"
        height={editorHeight}
        options={{
          readOnly: readonly,
          minimap: { enabled: false },
          scrollBeyondLastLine: false,
          fontSize: 12,
          lineHeight: LINE_HEIGHT,
          padding: { top: 12, bottom: 12 },
          scrollbar: {
            verticalScrollbarSize: 5,
            horizontalScrollbarSize: 5,
            vertical: 'auto',
            horizontal: 'auto',
            useShadows: false,
          },
          wordWrap: 'on',
          lineNumbers: 'on',
          renderLineHighlight: readonly ? 'none' : 'line',
          contextmenu: false,
          folding: false,
          automaticLayout: true,
          overviewRulerLanes: 0,
          hideCursorInOverviewRuler: true,
          overviewRulerBorder: false,
          cursorStyle: readonly ? 'line' : 'line',
        }}
      />
    </div>
  )
}
