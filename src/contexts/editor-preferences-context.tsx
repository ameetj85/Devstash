'use client'

import { createContext, useContext, useState, useCallback } from 'react'
import { toast } from 'sonner'
import { updateEditorPreferences } from '@/actions/settings'
import {
  type EditorPreferences,
  DEFAULT_EDITOR_PREFERENCES,
} from '@/lib/editor-preferences'

type EditorPreferencesContextType = {
  preferences: EditorPreferences
  updatePreference: <K extends keyof EditorPreferences>(
    key: K,
    value: EditorPreferences[K]
  ) => void
}

const EditorPreferencesContext = createContext<EditorPreferencesContextType>({
  preferences: DEFAULT_EDITOR_PREFERENCES,
  updatePreference: () => {},
})

export function EditorPreferencesProvider({
  initialPreferences,
  children,
}: {
  initialPreferences: EditorPreferences
  children: React.ReactNode
}) {
  const [preferences, setPreferences] = useState<EditorPreferences>(initialPreferences)

  const updatePreference = useCallback(
    <K extends keyof EditorPreferences>(key: K, value: EditorPreferences[K]) => {
      const updated = { ...preferences, [key]: value }
      setPreferences(updated)

      updateEditorPreferences(updated).then((result) => {
        if (result.success) {
          toast.success('Editor preferences saved')
        } else {
          toast.error('Failed to save preferences')
          // Revert on failure
          setPreferences(preferences)
        }
      })
    },
    [preferences]
  )

  return (
    <EditorPreferencesContext.Provider value={{ preferences, updatePreference }}>
      {children}
    </EditorPreferencesContext.Provider>
  )
}

export function useEditorPreferences() {
  return useContext(EditorPreferencesContext)
}
