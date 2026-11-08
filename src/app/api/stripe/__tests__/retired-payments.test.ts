import { describe, expect, it } from 'vitest'
import { POST as checkout } from '../checkout/route'
import { POST as portal } from '../portal/route'
import { POST as webhook } from '../../webhooks/stripe/route'

describe('retired payment endpoints', () => {
  it.each([
    ['checkout', checkout],
    ['portal', portal],
    ['webhook', webhook],
  ])('%s returns HTTP 410 without processing payments', async (_name, handler) => {
    const response = handler()

    expect(response.status).toBe(410)
    expect(await response.json()).toEqual({ error: 'Payments are no longer available.' })
  })
})
