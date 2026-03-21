import { describe, it, expect } from 'vitest'
import { cn } from '@/lib/utils'

describe('cn', () => {
  it('merges class names', () => {
    expect(cn('px-2', 'py-2')).toBe('px-2 py-2')
  })

  it('resolves tailwind conflicts — last value wins', () => {
    expect(cn('px-2', 'px-4')).toBe('px-4')
  })

  it('filters out falsy values', () => {
    expect(cn('px-2', false && 'py-2', undefined, null, '')).toBe('px-2')
  })

  it('handles conditional classes', () => {
    const active = true
    expect(cn('base', active && 'active')).toBe('base active')
  })
})
