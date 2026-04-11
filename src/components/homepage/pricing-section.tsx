'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Check, X } from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const FREE_FEATURES = [
  { text: '50 items', included: true },
  { text: '3 collections', included: true },
  { text: 'Text & URL types', included: true },
  { text: 'Basic search', included: true },
  { text: 'File uploads', included: false },
  { text: 'AI features', included: false },
];

const PRO_FEATURES = [
  { text: 'Unlimited items', included: true },
  { text: 'Unlimited collections', included: true },
  { text: 'All item types', included: true },
  { text: 'File & image uploads', included: true },
  { text: 'AI auto-tagging & summaries', included: true },
  { text: 'Export (JSON / ZIP)', included: true },
];

export function PricingSection() {
  const [yearly, setYearly] = useState(false);

  return (
    <section id="pricing" className="mx-auto max-w-[1200px] px-5 py-24 text-center">
      <div className="homepage-fade-in">
        <div className="mb-3 text-xs font-semibold uppercase tracking-wider text-[#3b82f6]">
          Pricing
        </div>
        <h2 className="mb-3 text-[clamp(1.75rem,4vw,2.5rem)] font-bold text-[#f0f0f5]">
          Simple, developer-friendly pricing
        </h2>
        <p className="mx-auto mb-12 max-w-[550px] text-[#8888a0]">
          Start free, upgrade when you need more power.
        </p>
      </div>

      {/* Billing toggle */}
      <div className="homepage-fade-in mb-12 inline-flex items-center gap-3 text-sm text-[#8888a0]">
        <span>Monthly</span>
        <button
          onClick={() => setYearly(!yearly)}
          className={`relative h-6 w-11 rounded-full transition-colors duration-200 ${
            yearly ? 'bg-[#3b82f6]' : 'bg-[#2a2a3a]'
          }`}
        >
          <div
            className={`absolute top-0.5 size-5 rounded-full bg-white transition-all duration-200 ${
              yearly ? 'left-[22px]' : 'left-0.5'
            }`}
          />
        </button>
        <span>Yearly</span>
        <span className="text-xs font-semibold text-[#22c55e]">Save 25%</span>
      </div>

      {/* Cards */}
      <div className="homepage-fade-in mx-auto grid max-w-[700px] grid-cols-1 gap-6 md:grid-cols-2">
        {/* Free */}
        <div className="rounded-2xl border border-[#2a2a3a] bg-[#1a1a25] p-8 text-left">
          <div className="mb-2 text-lg font-semibold text-[#f0f0f5]">Free</div>
          <div className="mb-1 text-[2.5rem] font-extrabold text-[#f0f0f5]">$0</div>
          <div className="mb-6 text-sm text-[#8888a0]">Perfect for getting started</div>
          <ul className="mb-6 flex flex-col gap-2.5">
            {FREE_FEATURES.map((f) => (
              <li
                key={f.text}
                className={`flex items-center gap-2 text-sm ${
                  f.included ? 'text-[#8888a0]' : 'text-[#55556a]'
                }`}
              >
                {f.included ? (
                  <Check className="size-4 shrink-0 text-[#22c55e]" />
                ) : (
                  <X className="size-4 shrink-0 text-[#55556a]" />
                )}
                {f.text}
              </li>
            ))}
          </ul>
          <Link
            href="/register"
            className={cn(
              buttonVariants({ variant: 'outline' }),
              'w-full py-2.5 border-[#2a2a3a] text-[#f0f0f5] hover:border-[#8888a0] hover:bg-[#1a1a25]'
            )}
          >
            Get Started
          </Link>
        </div>

        {/* Pro */}
        <div className="relative rounded-2xl border border-[#3b82f6] bg-[#1a1a25] p-8 text-left">
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-[#3b82f6] px-4 py-1 text-[0.7rem] font-semibold text-white">
            Most Popular
          </div>
          <div className="mb-2 text-lg font-semibold text-[#f0f0f5]">Pro</div>
          <div className="mb-1 text-[2.5rem] font-extrabold text-[#f0f0f5]">
            {yearly ? '$6' : '$8'}
            <span className="text-base font-normal text-[#8888a0]">/mo</span>
          </div>
          <div className="mb-6 text-sm text-[#8888a0]">For serious developers</div>
          <ul className="mb-6 flex flex-col gap-2.5">
            {PRO_FEATURES.map((f) => (
              <li key={f.text} className="flex items-center gap-2 text-sm text-[#8888a0]">
                <Check className="size-4 shrink-0 text-[#22c55e]" />
                {f.text}
              </li>
            ))}
          </ul>
          <Link
            href="/register"
            className={cn(
              buttonVariants(),
              'w-full py-2.5 bg-[#3b82f6] text-white hover:bg-[#2563eb]'
            )}
          >
            Upgrade to Pro
          </Link>
        </div>
      </div>
    </section>
  );
}
