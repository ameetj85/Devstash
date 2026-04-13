import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { prisma } from '@/lib/prisma'
import type Stripe from 'stripe'

export async function POST(req: NextRequest) {
  const body = await req.text()
  const signature = req.headers.get('stripe-signature')

  if (!signature) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 })
  }

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session
      const userId = session.metadata?.userId
      if (userId) {
        await prisma.user.updateMany({
          where: { id: userId },
          data: {
            isPro: true,
            stripeCustomerId: session.customer as string,
            stripeSubscriptionId: session.subscription as string,
          },
        })
      }
      break
    }

    case 'customer.subscription.updated': {
      const subscription = event.data.object as Stripe.Subscription
      const isActive = subscription.status === 'active' || subscription.status === 'trialing'
      await prisma.user.updateMany({
        where: { stripeCustomerId: subscription.customer as string },
        data: {
          isPro: isActive,
          stripeSubscriptionId: subscription.id,
        },
      })
      break
    }

    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription
      await prisma.user.updateMany({
        where: { stripeCustomerId: subscription.customer as string },
        data: {
          isPro: false,
          stripeSubscriptionId: null,
        },
      })
      break
    }

    case 'invoice.payment_succeeded': {
      const invoice = event.data.object as Stripe.Invoice
      if (invoice.parent?.subscription_details) {
        await prisma.user.updateMany({
          where: { stripeCustomerId: invoice.customer as string },
          data: { isPro: true },
        })
      }
      break
    }

    case 'invoice.payment_failed': {
      const invoice = event.data.object as Stripe.Invoice
      if (invoice.parent?.subscription_details) {
        await prisma.user.updateMany({
          where: { stripeCustomerId: invoice.customer as string },
          data: { isPro: false },
        })
      }
      break
    }
  }

  return NextResponse.json({ received: true })
}
