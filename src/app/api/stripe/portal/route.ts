import { NextResponse } from 'next/server'

export function POST() {
  return NextResponse.json({ error: 'Payments are no longer available.' }, { status: 410 })
}
