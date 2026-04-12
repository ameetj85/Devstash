export const STRIPE_PLANS = {
  monthly: {
    priceId: process.env.STRIPE_PRICE_ID_MONTHLY!,
    price: 8,
    interval: 'month' as const,
  },
  yearly: {
    priceId: process.env.STRIPE_PRICE_ID_YEARLY!,
    price: 72,
    interval: 'year' as const,
  },
}

export const FREE_LIMITS = {
  items: 50,
  collections: 3,
}
