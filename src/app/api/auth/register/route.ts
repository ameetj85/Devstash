import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'

export async function POST(request: Request) {
  const body = await request.json()
  const { name, email, password, confirmPassword } = body

  if (!name || !email || !password || !confirmPassword) {
    return NextResponse.json({ error: 'All fields are required' }, { status: 400 })
  }

  if (password !== confirmPassword) {
    return NextResponse.json({ error: 'Passwords do not match' }, { status: 400 })
  }

  const existingUser = await prisma.user.findUnique({ where: { email } })
  if (existingUser) {
    return NextResponse.json({ error: 'User already exists' }, { status: 409 })
  }

  const hashedPassword = await bcrypt.hash(password, 12)

  await prisma.user.create({
    data: { name, email, hashedPassword },
  })

  return NextResponse.json({ message: 'User registered successfully' }, { status: 201 })
}
