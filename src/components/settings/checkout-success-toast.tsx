'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

export default function CheckoutSuccessToast() {
  const router = useRouter()

  useEffect(() => {
    toast.success('Welcome to Pro! Your subscription is now active.')
    router.replace('/settings', { scroll: false })
  }, [router])

  return null
}
