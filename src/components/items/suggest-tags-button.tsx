'use client'

import { useState } from 'react'
import { Sparkles, Check, X, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { generateAutoTags } from '@/actions/ai'

interface SuggestTagsButtonProps {
  title: string
  content: string
  typeName: string
  onAcceptTag: (tag: string) => void
  isPro: boolean
}

export default function SuggestTagsButton({
  title,
  content,
  typeName,
  onAcceptTag,
  isPro,
}: SuggestTagsButtonProps) {
  const [loading, setLoading] = useState(false)
  const [suggestions, setSuggestions] = useState<string[]>([])

  if (!isPro) return null

  async function handleSuggest() {
    if (!title.trim()) {
      toast.error('Add a title first to get tag suggestions')
      return
    }

    setLoading(true)
    setSuggestions([])

    const result = await generateAutoTags({
      title: title.trim(),
      content: content || null,
      typeName,
    })

    setLoading(false)

    if (!result.success) {
      toast.error(result.error)
      return
    }

    setSuggestions(result.data.tags)
  }

  function handleAccept(tag: string) {
    onAcceptTag(tag)
    setSuggestions((prev) => prev.filter((t) => t !== tag))
  }

  function handleReject(tag: string) {
    setSuggestions((prev) => prev.filter((t) => t !== tag))
  }

  return (
    <div className="relative">
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="gap-1 text-xs h-6 px-2 text-muted-foreground"
        onClick={handleSuggest}
        disabled={loading}
      >
        {loading ? (
          <Loader2 className="w-3 h-3 animate-spin" />
        ) : (
          <Sparkles className="w-3 h-3" />
        )}
        {loading ? 'Suggesting...' : 'Suggest Tags'}
      </Button>

      {suggestions.length > 0 && (
        <div className="absolute right-0 top-full mt-1 z-50 flex flex-wrap gap-1.5 rounded-lg bg-popover p-2 shadow-md ring-1 ring-foreground/10 max-w-xs max-h-32 overflow-y-auto">
          {suggestions.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-0.5 text-xs px-2 py-1 rounded-md border border-primary/30 bg-primary/10 text-primary"
            >
              {tag}
              <button
                type="button"
                onClick={() => handleAccept(tag)}
                className="p-0.5 rounded hover:bg-primary/20 transition-colors"
                title="Accept tag"
              >
                <Check className="w-3 h-3" />
              </button>
              <button
                type="button"
                onClick={() => handleReject(tag)}
                className="p-0.5 rounded hover:bg-destructive/20 text-muted-foreground hover:text-destructive transition-colors"
                title="Reject tag"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
