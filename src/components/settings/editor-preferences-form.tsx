'use client'

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { useEditorPreferences } from '@/contexts/editor-preferences-context'

const FONT_SIZES = [10, 11, 12, 13, 14, 16, 18, 20, 24]
const TAB_SIZES = [2, 4, 8]
const THEMES = [
  { value: 'vs-dark', label: 'VS Dark' },
  { value: 'monokai', label: 'Monokai' },
  { value: 'github-dark', label: 'GitHub Dark' },
] as const

export default function EditorPreferencesForm() {
  const { preferences, updatePreference } = useEditorPreferences()

  return (
    <div className="space-y-5">
      {/* Font Size */}
      <div className="flex items-center justify-between">
        <Label htmlFor="fontSize" className="text-sm text-foreground">
          Font Size
        </Label>
        <Select
          value={String(preferences.fontSize)}
          onValueChange={(v) => updatePreference('fontSize', Number(v))}
        >
          <SelectTrigger id="fontSize" className="w-24">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {FONT_SIZES.map((size) => (
              <SelectItem key={size} value={String(size)}>
                {size}px
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Tab Size */}
      <div className="flex items-center justify-between">
        <Label htmlFor="tabSize" className="text-sm text-foreground">
          Tab Size
        </Label>
        <Select
          value={String(preferences.tabSize)}
          onValueChange={(v) => updatePreference('tabSize', Number(v))}
        >
          <SelectTrigger id="tabSize" className="w-24">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {TAB_SIZES.map((size) => (
              <SelectItem key={size} value={String(size)}>
                {size} spaces
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Theme */}
      <div className="flex items-center justify-between">
        <Label htmlFor="theme" className="text-sm text-foreground">
          Theme
        </Label>
        <Select
          value={preferences.theme}
          onValueChange={(v) => updatePreference('theme', v as typeof preferences.theme)}
        >
          <SelectTrigger id="theme" className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {THEMES.map((t) => (
              <SelectItem key={t.value} value={t.value}>
                {t.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Word Wrap */}
      <div className="flex items-center justify-between">
        <Label htmlFor="wordWrap" className="text-sm text-foreground">
          Word Wrap
        </Label>
        <Switch
          id="wordWrap"
          checked={preferences.wordWrap}
          onCheckedChange={(v) => updatePreference('wordWrap', v)}
        />
      </div>

      {/* Minimap */}
      <div className="flex items-center justify-between">
        <Label htmlFor="minimap" className="text-sm text-foreground">
          Minimap
        </Label>
        <Switch
          id="minimap"
          checked={preferences.minimap}
          onCheckedChange={(v) => updatePreference('minimap', v)}
        />
      </div>
    </div>
  )
}
