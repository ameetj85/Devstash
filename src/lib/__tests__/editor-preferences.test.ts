import { describe, it, expect } from 'vitest'
import { parseEditorPreferences, DEFAULT_EDITOR_PREFERENCES } from '@/lib/editor-preferences'

describe('parseEditorPreferences', () => {
  it('returns defaults for null', () => {
    expect(parseEditorPreferences(null)).toEqual(DEFAULT_EDITOR_PREFERENCES)
  })

  it('returns defaults for undefined', () => {
    expect(parseEditorPreferences(undefined)).toEqual(DEFAULT_EDITOR_PREFERENCES)
  })

  it('returns defaults for non-object', () => {
    expect(parseEditorPreferences('string')).toEqual(DEFAULT_EDITOR_PREFERENCES)
    expect(parseEditorPreferences(42)).toEqual(DEFAULT_EDITOR_PREFERENCES)
  })

  it('returns defaults for empty object', () => {
    expect(parseEditorPreferences({})).toEqual(DEFAULT_EDITOR_PREFERENCES)
  })

  it('parses valid preferences', () => {
    const input = {
      fontSize: 16,
      tabSize: 4,
      wordWrap: false,
      minimap: true,
      theme: 'monokai',
    }
    expect(parseEditorPreferences(input)).toEqual(input)
  })

  it('uses defaults for invalid individual fields', () => {
    const input = {
      fontSize: 'big',
      tabSize: true,
      wordWrap: 'yes',
      minimap: 123,
      theme: 'invalid-theme',
    }
    expect(parseEditorPreferences(input)).toEqual(DEFAULT_EDITOR_PREFERENCES)
  })

  it('merges partial valid with defaults', () => {
    const input = { fontSize: 20, theme: 'github-dark' }
    expect(parseEditorPreferences(input)).toEqual({
      ...DEFAULT_EDITOR_PREFERENCES,
      fontSize: 20,
      theme: 'github-dark',
    })
  })
})
