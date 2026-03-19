import Image from 'next/image'
import { cn } from '@/lib/utils'

interface UserAvatarProps {
  name?: string | null
  image?: string | null
  className?: string
}

function getInitials(name: string | null | undefined): string {
  if (!name) return '?'
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('')
}

export default function UserAvatar({ name, image, className }: UserAvatarProps) {
  if (image) {
    return (
      <Image
        src={image}
        alt={name ?? 'User'}
        width={28}
        height={28}
        className={cn('rounded-full object-cover shrink-0', className)}
      />
    )
  }

  return (
    <div
      className={cn(
        'w-7 h-7 rounded-full bg-primary flex items-center justify-center text-xs font-bold text-primary-foreground shrink-0',
        className
      )}
    >
      {getInitials(name)}
    </div>
  )
}
