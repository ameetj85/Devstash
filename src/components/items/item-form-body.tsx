'use client'

import type { ReactNode } from 'react'
import { toast } from 'sonner'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import CodeEditor from '@/components/items/code-editor'
import MarkdownEditor from '@/components/items/markdown-editor'
import LanguageSelect from '@/components/items/language-select'
import CollectionPicker from '@/components/items/collection-picker'
import SuggestTagsButton from '@/components/items/suggest-tags-button'
import GenerateDescriptionButton from '@/components/items/generate-description-button'
import { CONTENT_TYPES, LANGUAGE_TYPES, MARKDOWN_TYPES } from '@/lib/item-type-config'

export type ItemFormState = {
  title: string
  description: string
  content: string
  url: string
  language: string
  tags: string
}

interface ItemFormBodyProps {
  form: ItemFormState
  onFormChange: (patch: Partial<ItemFormState>) => void
  typeName: string
  selectedCollections: string[]
  onCollectionsChange: (ids: string[]) => void
  allCollections: { id: string; name: string }[]
  isPro: boolean
  descriptionFileName?: string
  descriptionRows?: number
  optimizeToastMessage?: string
  fileUploadSlot?: ReactNode
  urlRequired?: boolean
  urlLabelSuffix?: ReactNode
}

export default function ItemFormBody({
  form,
  onFormChange,
  typeName,
  selectedCollections,
  onCollectionsChange,
  allCollections,
  isPro,
  descriptionFileName,
  descriptionRows = 3,
  optimizeToastMessage = 'Optimized prompt applied.',
  fileUploadSlot,
  urlRequired = false,
  urlLabelSuffix,
}: ItemFormBodyProps) {
  const showContent = CONTENT_TYPES.includes(typeName)
  const showLanguage = LANGUAGE_TYPES.includes(typeName)
  const showUrl = typeName === 'link'

  const tagList = form.tags
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean)

  return (
    <>
      {/* Description */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Description
          </Label>
          <GenerateDescriptionButton
            title={form.title}
            typeName={typeName}
            content={form.content}
            url={form.url}
            fileName={descriptionFileName}
            language={form.language}
            tags={tagList}
            isPro={isPro}
            onGenerated={(description) => onFormChange({ description })}
          />
        </div>
        <Textarea
          value={form.description}
          onChange={(e) => onFormChange({ description: e.target.value })}
          placeholder="Optional description"
          className="text-sm resize-none"
          rows={descriptionRows}
        />
      </div>

      {/* File / Image upload slot (create mode) */}
      {fileUploadSlot}

      {/* Language (above content for immediate highlighting) */}
      {showLanguage && (
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Language
          </Label>
          <LanguageSelect
            value={form.language}
            onChange={(v) => onFormChange({ language: v })}
          />
        </div>
      )}

      {/* Content */}
      {showContent && (
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Content
          </Label>
          {showLanguage ? (
            <CodeEditor
              value={form.content}
              onChange={(v) => onFormChange({ content: v })}
              language={form.language}
            />
          ) : MARKDOWN_TYPES.includes(typeName) ? (
            <MarkdownEditor
              value={form.content}
              onChange={(v) => onFormChange({ content: v })}
              optimize={typeName === 'prompt' ? {
                typeName: 'prompt',
                title: form.title || undefined,
                isPro,
                onAccept: (optimized) => {
                  onFormChange({ content: optimized })
                  toast.success(optimizeToastMessage)
                },
              } : undefined}
            />
          ) : (
            <Textarea
              value={form.content}
              onChange={(e) => onFormChange({ content: e.target.value })}
              placeholder="Content"
              className="text-xs font-mono resize-none"
              rows={8}
            />
          )}
        </div>
      )}

      {/* URL */}
      {showUrl && (
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            URL {urlLabelSuffix}
          </Label>
          <Input
            value={form.url}
            onChange={(e) => onFormChange({ url: e.target.value })}
            placeholder="https://..."
            className="text-sm"
            type="url"
            required={urlRequired}
          />
        </div>
      )}

      {/* Tags */}
      <div className="space-y-1.5">
        <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
          Tags
        </Label>
        <Input
          value={form.tags}
          onChange={(e) => onFormChange({ tags: e.target.value })}
          placeholder="react, typescript, hooks"
          className="text-sm"
        />
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <p className="text-xs text-muted-foreground">Comma-separated</p>
          <SuggestTagsButton
            title={form.title}
            content={form.content}
            typeName={typeName}
            isPro={isPro}
            onAcceptTag={(tag) => {
              const existing = form.tags.split(',').map((t) => t.trim()).filter(Boolean)
              if (existing.includes(tag)) return
              onFormChange({
                tags: existing.length > 0 ? `${form.tags}, ${tag}` : tag,
              })
            }}
          />
        </div>
      </div>

      {/* Collections */}
      {allCollections.length > 0 && (
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Collections
          </Label>
          <CollectionPicker
            collections={allCollections}
            selected={selectedCollections}
            onChange={onCollectionsChange}
          />
        </div>
      )}
    </>
  )
}
