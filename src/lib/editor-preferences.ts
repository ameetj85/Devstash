export type EditorPreferences = {
  fontSize: number
  tabSize: number
  wordWrap: boolean
  minimap: boolean
  theme: 'vs-dark' | 'monokai' | 'github-dark'
}

export const DEFAULT_EDITOR_PREFERENCES: EditorPreferences = {
  fontSize: 12,
  tabSize: 2,
  wordWrap: true,
  minimap: false,
  theme: 'vs-dark',
}

export function parseEditorPreferences(raw: unknown): EditorPreferences {
  if (!raw || typeof raw !== 'object') return DEFAULT_EDITOR_PREFERENCES

  const obj = raw as Record<string, unknown>
  return {
    fontSize: typeof obj.fontSize === 'number' ? obj.fontSize : DEFAULT_EDITOR_PREFERENCES.fontSize,
    tabSize: typeof obj.tabSize === 'number' ? obj.tabSize : DEFAULT_EDITOR_PREFERENCES.tabSize,
    wordWrap: typeof obj.wordWrap === 'boolean' ? obj.wordWrap : DEFAULT_EDITOR_PREFERENCES.wordWrap,
    minimap: typeof obj.minimap === 'boolean' ? obj.minimap : DEFAULT_EDITOR_PREFERENCES.minimap,
    theme: ['vs-dark', 'monokai', 'github-dark'].includes(obj.theme as string)
      ? (obj.theme as EditorPreferences['theme'])
      : DEFAULT_EDITOR_PREFERENCES.theme,
  }
}
