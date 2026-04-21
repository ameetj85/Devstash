'use client'

import { Save, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import ItemFormBody, { type ItemFormState } from './item-form-body'
import type { ItemDetailResponse } from './item-drawer-types'
import { formatDate } from './item-drawer-types'

interface ItemDrawerEditProps {
  item: ItemDetailResponse
  form: ItemFormState
  onFormChange: (patch: Partial<ItemFormState>) => void
  selectedCollections: string[]
  onCollectionsChange: (ids: string[]) => void
  allCollections: { id: string; name: string }[]
  isPro: boolean
  saving: boolean
  onSave: () => void
  onCancel: () => void
}

export default function ItemDrawerEdit({
  item,
  form,
  onFormChange,
  selectedCollections,
  onCollectionsChange,
  allCollections,
  isPro,
  saving,
  onSave,
  onCancel,
}: ItemDrawerEditProps) {
  return (
    <>
      {/* Edit action bar */}
      <div className="flex items-center gap-2">
        <Button
          size="sm"
          className="gap-1.5 text-xs"
          onClick={onSave}
          disabled={saving || !form.title.trim()}
        >
          <Save className="w-3.5 h-3.5" />
          {saving ? 'Saving…' : 'Save'}
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5 text-xs"
          onClick={onCancel}
          disabled={saving}
        >
          <X className="w-3.5 h-3.5" />
          Cancel
        </Button>
      </div>

      <ItemFormBody
        form={form}
        onFormChange={onFormChange}
        typeName={item.itemType.name}
        selectedCollections={selectedCollections}
        onCollectionsChange={onCollectionsChange}
        allCollections={allCollections}
        isPro={isPro}
        descriptionFileName={item.fileName ?? undefined}
        descriptionRows={3}
        optimizeToastMessage="Optimized prompt applied. Click Save to persist."
      />

      {/* Non-editable: Details */}
      <section>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
          Details
        </p>
        <dl className="space-y-1.5 text-sm">
          <div className="flex items-center justify-between">
            <dt className="text-muted-foreground">Created</dt>
            <dd>{formatDate(item.createdAt)}</dd>
          </div>
          <div className="flex items-center justify-between">
            <dt className="text-muted-foreground">Updated</dt>
            <dd>{formatDate(item.updatedAt)}</dd>
          </div>
        </dl>
      </section>
    </>
  )
}
