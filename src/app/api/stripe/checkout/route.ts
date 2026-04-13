import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { stripe } from '@/lib/stripe'
import { STRIPE_PLANS } from '@/lib/stripe-config'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const plan = body.plan as string

  if (plan !== 'monthly' && plan !== 'yearly') {
    return NextResponse.json({ error: 'Invalid plan' }, { status: 400 })
  }

  const stripePlan = STRIPE_PLANS[plan]

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { email: true, stripeCustomerId: true },
  })

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  let stripeCustomerId = user.stripeCustomerId

  if (!stripeCustomerId) {
    const customer = await stripe.customers.create({
      email: user.email ?? undefined,
      metadata: { userId: session.user.id },
    })
    stripeCustomerId = customer.id
    await prisma.user.update({
      where: { id: session.user.id },
      data: { stripeCustomerId },
    })
  }

  const checkoutSession = await stripe.checkout.sessions.create({
    customer: stripeCustomerId,
    mode: 'subscription',
    line_items: [{ price: stripePlan.priceId, quantity: 1 }],
    metadata: { userId: session.user.id },
    success_url: `${request.nextUrl.origin}/settings?checkout=success`,
    cancel_url: `${request.nextUrl.origin}/upgrade?checkout=cancelled`,
  })

  return NextResponse.json({ url: checkoutSession.url })
}
