'use client'

import { useState } from 'react'
import { ChevronsUpDown, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from '@/components/ui/popover'

type CollectionOption = {
  id: string
  name: string
}

interface CollectionPickerProps {
  collections: CollectionOption[]
  selected: string[]
  onChange: (ids: string[]) => void
}

export default function CollectionPicker({ collections, selected, onChange }: CollectionPickerProps) {
  const [open, setOpen] = useState(false)

  function toggle(id: string) {
    if (selected.includes(id)) {
      onChange(selected.filter((s) => s !== id))
    } else {
      onChange([...selected, id])
    }
  }

  const selectedNames = collections
    .filter((c) => selected.includes(c.id))
    .map((c) => c.name)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button
            variant="outline"
            size="sm"
            className="w-full justify-between text-sm font-normal h-9"
          />
        }
      >
        <span className="truncate text-left flex-1">
          {selectedNames.length > 0
            ? selectedNames.join(', ')
            : 'Select collections…'}
        </span>
        <ChevronsUpDown className="w-3.5 h-3.5 shrink-0 opacity-50 ml-2" />
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-1" align="start">
        {collections.length === 0 ? (
          <p className="text-xs text-muted-foreground px-2 py-3 text-center">
            No collections yet
          </p>
        ) : (
          <div className="max-h-48 overflow-y-auto">
            {collections.map((col) => {
              const isSelected = selected.includes(col.id)
              return (
                <button
                  key={col.id}
                  type="button"
                  onClick={() => toggle(col.id)}
                  className="flex items-center gap-2 w-full px-2 py-1.5 text-sm rounded hover:bg-accent transition-colors text-left"
                >
                  <div className="w-4 h-4 shrink-0 flex items-center justify-center">
                    {isSelected && <Check className="w-3.5 h-3.5" />}
                  </div>
                  <span className="truncate">{col.name}</span>
                </button>
              )
            })}
          </div>
        )}
      </PopoverContent>
    </Popover>
  )
}
