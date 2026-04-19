'use client'

import { useState } from 'react'
import { Sparkles, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { generateDescription } from '@/actions/ai'

interface GenerateDescriptionButtonProps {
  title: string
  typeName: string
  content?: string
  url?: string
  fileName?: string
  language?: string
  tags?: string[]
  isPro: boolean
  onGenerated: (description: string) => void
}

export default function GenerateDescriptionButton({
  title,
  typeName,
  content,
  url,
  fileName,
  language,
  tags,
  isPro,
  onGenerated,
}: GenerateDescriptionButtonProps) {
  const [loading, setLoading] = useState(false)

  if (!isPro) return null

  async function handleClick() {
    const hasSignal =
      title.trim().length > 0 ||
      (content?.trim().length ?? 0) > 0 ||
      (url?.trim().length ?? 0) > 0 ||
      (fileName?.trim().length ?? 0) > 0

    if (!hasSignal) {
      toast.error('Add a title or some content first')
      return
    }

    setLoading(true)

    const result = await generateDescription({
      title: title.trim() || null,
      typeName,
      content: content || null,
      url: url?.trim() || null,
      fileName: fileName?.trim() || null,
      language: language?.trim() || null,
      tags: tags && tags.length > 0 ? tags : undefined,
    })

    setLoading(false)

    if (!result.success) {
      toast.error(result.error)
      return
    }

    onGenerated(result.data.description)
    toast.success('Description generated')
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      className="gap-1 text-xs h-6 px-2 text-muted-foreground"
      onClick={handleClick}
      disabled={loading}
      title="Generate description with AI"
    >
      {loading ? (
        <Loader2 className="w-3 h-3 animate-spin" />
      ) : (
        <Sparkles className="w-3 h-3" />
      )}
      {loading ? 'Describing…' : 'Describe'}
    </Button>
  )
}
