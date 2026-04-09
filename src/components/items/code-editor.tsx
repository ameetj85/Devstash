'use client'

import { useMemo, useRef } from 'react'
import Editor, { type Monaco } from '@monaco-editor/react'
import { Copy } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { useEditorPreferences } from '@/contexts/editor-preferences-context'

// ─── Types ─────────────────────────────────────────────────────────────────

interface CodeEditorProps {
  value: string
  onChange?: (value: string) => void
  language?: string | null
  readonly?: boolean
}

// ─── Constants ─────────────────────────────────────────────────────────────

const PADDING_VERTICAL = 24
const MAX_HEIGHT = 400
const MIN_HEIGHT = 80

// ─── Custom Themes ────────────────────────────────────────────────────────

function defineCustomThemes(monaco: Monaco) {
  monaco.editor.defineTheme('monokai', {
    base: 'vs-dark',
    inherit: true,
    rules: [
      { token: 'comment', foreground: '75715E', fontStyle: 'italic' },
      { token: 'keyword', foreground: 'F92672' },
      { token: 'string', foreground: 'E6DB74' },
      { token: 'number', foreground: 'AE81FF' },
      { token: 'type', foreground: '66D9EF', fontStyle: 'italic' },
      { token: 'function', foreground: 'A6E22E' },
      { token: 'variable', foreground: 'F8F8F2' },
    ],
    colors: {
      'editor.background': '#272822',
      'editor.foreground': '#F8F8F2',
      'editor.lineHighlightBackground': '#3E3D32',
      'editorCursor.foreground': '#F8F8F0',
      'editor.selectionBackground': '#49483E',
    },
  })

  monaco.editor.defineTheme('github-dark', {
    base: 'vs-dark',
    inherit: true,
    rules: [
      { token: 'comment', foreground: '8B949E', fontStyle: 'italic' },
      { token: 'keyword', foreground: 'FF7B72' },
      { token: 'string', foreground: 'A5D6FF' },
      { token: 'number', foreground: '79C0FF' },
      { token: 'type', foreground: 'FFA657' },
      { token: 'function', foreground: 'D2A8FF' },
      { token: 'variable', foreground: 'C9D1D9' },
    ],
    colors: {
      'editor.background': '#0D1117',
      'editor.foreground': '#C9D1D9',
      'editor.lineHighlightBackground': '#161B22',
      'editorCursor.foreground': '#C9D1D9',
      'editor.selectionBackground': '#264F78',
    },
  })
}

// ─── Component ─────────────────────────────────────────────────────────────

export default function CodeEditor({
  value,
  onChange,
  language,
  readonly = false,
}: CodeEditorProps) {
  const lang = language?.trim().toLowerCase() || 'plaintext'
  const { preferences } = useEditorPreferences()
  const themesDefinedRef = useRef(false)

  const lineHeight = preferences.fontSize + 8
  const editorHeight = useMemo(() => {
    const lineCount = (value || '').split('\n').length
    const computed = lineCount * lineHeight + PADDING_VERTICAL
    return Math.min(Math.max(computed, MIN_HEIGHT), MAX_HEIGHT)
  }, [value, lineHeight])

  function handleCopy() {
    navigator.clipboard.writeText(value || '')
    toast.success('Copied to clipboard')
  }

  function handleBeforeMount(monaco: Monaco) {
    if (!themesDefinedRef.current) {
      defineCustomThemes(monaco)
      themesDefinedRef.current = true
    }
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
        theme={preferences.theme}
        height={editorHeight}
        beforeMount={handleBeforeMount}
        options={{
          readOnly: readonly,
          minimap: { enabled: preferences.minimap },
          scrollBeyondLastLine: false,
          fontSize: preferences.fontSize,
          tabSize: preferences.tabSize,
          lineHeight,
          padding: { top: 12, bottom: 12 },
          scrollbar: {
            verticalScrollbarSize: 5,
            horizontalScrollbarSize: 5,
            vertical: 'auto',
            horizontal: 'auto',
            useShadows: false,
          },
          wordWrap: preferences.wordWrap ? 'on' : 'off',
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
