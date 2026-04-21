'use client'

import { Sparkles, Loader2, Crown } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface ProAIButtonProps {
  isPro: boolean
  loading: boolean
  onClick: () => void
  title: string
}

export default function ProAIButton({ isPro, loading, onClick, title }: ProAIButtonProps) {
  if (!isPro) {
    return (
      <Button
        variant="ghost"
        size="icon"
        className="h-6 w-6 text-[#8a8a8a] hover:text-white hover:bg-[#3d3d3d] cursor-not-allowed opacity-70"
        type="button"
        title="AI features require Pro subscription"
        disabled
      >
        <Crown className="w-3 h-3" />
      </Button>
    )
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      className="h-6 w-6 text-[#8a8a8a] hover:text-white hover:bg-[#3d3d3d]"
      onClick={onClick}
      type="button"
      title={title}
      disabled={loading}
    >
      {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
    </Button>
  )
}
