import { describe, it, expect } from 'vitest'
import * as subscription from '../subscription'

describe('subscription', () => {
  it('does not expose subscription gates', () => {
    expect(Object.keys(subscription)).toEqual([])
  })
})
