'use client'

import { Sparkles, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface ProAIButtonProps {
  loading: boolean
  onClick: () => void
  title: string
}

export default function ProAIButton({ loading, onClick, title }: ProAIButtonProps) {
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
