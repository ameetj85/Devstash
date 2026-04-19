'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { FileCode2, Menu, X } from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 backdrop-blur-xl transition-all duration-300 ${
        scrolled || menuOpen
          ? 'border-b border-[#2a2a3a] bg-[#0a0a0f]/95'
          : 'border-b border-transparent bg-[#0a0a0f]/60'
      }`}
    >
      <div className="flex items-center justify-between px-6 py-4">
        <a href="/" className="flex items-center gap-2 text-xl font-bold text-[#f0f0f5]">
          <FileCode2 className="size-7" />
          DevStash
        </a>

        <ul className="hidden items-center gap-8 md:flex">
          <li>
            <a href="/#features" className="text-sm text-[#8888a0] transition-colors hover:text-[#f0f0f5]">
              Features
            </a>
          </li>
          <li>
            <a href="/#pricing" className="text-sm text-[#8888a0] transition-colors hover:text-[#f0f0f5]">
              Pricing
            </a>
          </li>
        </ul>

        <div className="hidden md:flex items-center gap-3">
          <Link
            href="/sign-in"
            className={cn(
              buttonVariants({ variant: 'ghost' }),
              'text-[#8888a0] hover:text-[#f0f0f5]'
            )}
          >
            Sign In
          </Link>
          <Link
            href="/register"
            className={cn(
              buttonVariants(),
              'bg-[#3b82f6] text-white hover:bg-[#2563eb]'
            )}
          >
            Get Started
          </Link>
        </div>

        <button
          type="button"
          onClick={() => setMenuOpen((v) => !v)}
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={menuOpen}
          className="md:hidden inline-flex items-center justify-center p-2 rounded-md text-[#f0f0f5] hover:bg-[#1a1a25] transition-colors"
        >
          {menuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </div>

      {menuOpen && (
        <div className="md:hidden border-t border-[#2a2a3a] px-6 py-4 space-y-3">
          <a
            href="/#features"
            onClick={() => setMenuOpen(false)}
            className="block text-sm text-[#8888a0] hover:text-[#f0f0f5] transition-colors"
          >
            Features
          </a>
          <a
            href="/#pricing"
            onClick={() => setMenuOpen(false)}
            className="block text-sm text-[#8888a0] hover:text-[#f0f0f5] transition-colors"
          >
            Pricing
          </a>
          <div className="pt-2 flex flex-col gap-2">
            <Link
              href="/sign-in"
              onClick={() => setMenuOpen(false)}
              className={cn(
                buttonVariants({ variant: 'ghost' }),
                'w-full text-[#8888a0] hover:text-[#f0f0f5]'
              )}
            >
              Sign In
            </Link>
            <Link
              href="/register"
              onClick={() => setMenuOpen(false)}
              className={cn(
                buttonVariants(),
                'w-full bg-[#3b82f6] text-white hover:bg-[#2563eb]'
              )}
            >
              Get Started
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}
