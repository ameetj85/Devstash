import Link from 'next/link';
import { ChaosVisual } from './chaos-visual';
import { ArrowRight } from 'lucide-react';

const TYPE_COLORS = {
  snippet: '#3b82f6',
  prompt: '#8b5cf6',
  command: '#f97316',
  note: '#fde047',
  link: '#10b981',
  file: '#6b7280',
  image: '#ec4899',
};

export function HeroSection() {
  return (
    <section className="mx-auto max-w-[1200px] px-5 pt-40 pb-16 text-center max-md:px-5 max-md:pt-32">
      <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#2a2a3a] bg-[#12121a] px-4 py-1.5 text-xs text-[#8888a0]">
        <span className="text-[#3b82f6]">&#9679;</span>
        Built for developers who ship
      </div>

      <h1 className="mb-5 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 bg-clip-text text-transparent text-[clamp(2.5rem,6vw,4rem)] font-extrabold leading-[1.1]">
        Stop Losing Your Developer Knowledge
      </h1>

      <p className="mx-auto mb-8 max-w-[600px] text-[clamp(1rem,2.5vw,1.25rem)] text-[#8888a0]">
        Your code snippets, AI prompts, commands, and notes are scattered everywhere. DevStash brings them into one fast, searchable hub.
      </p>

      <div className="mb-16 flex flex-wrap items-center justify-center gap-4 max-md:flex-col">
        <Link
          href="/register"
          className="inline-flex items-center justify-center rounded-lg h-11 px-8 text-base font-medium bg-[#3b82f6] text-white transition-all hover:bg-[#2563eb] hover:-translate-y-px"
        >
          Get Started &mdash; It&apos;s Free
        </Link>
        <a
          href="#features"
          className="inline-flex items-center justify-center rounded-lg h-11 px-8 text-base font-medium border border-[#2a2a3a] text-[#f0f0f5] transition-all hover:border-[#8888a0] hover:bg-[#1a1a25]"
        >
          See How It Works
        </a>
      </div>

      {/* Chaos → Order Visual */}
      <div className="homepage-fade-in mx-auto flex max-w-[1000px] items-center justify-center gap-8 max-md:flex-col max-md:gap-4">
        {/* Chaos box */}
        <div className="flex-1 overflow-hidden rounded-2xl border border-[#2a2a3a] bg-[#12121a] max-md:w-full">
          <div className="border-b border-[#2a2a3a] px-4 py-3 text-xs font-medium text-[#55556a]">
            Your knowledge today...
          </div>
          <ChaosVisual />
        </div>

        {/* Arrow */}
        <div className="flex shrink-0 items-center justify-center max-md:rotate-90">
          <ArrowRight className="size-12 animate-pulse text-[#3b82f6]" />
        </div>

        {/* Order / Dashboard preview */}
        <div className="flex-1 overflow-hidden rounded-2xl border border-[#2a2a3a] bg-[#12121a] max-md:w-full">
          <div className="border-b border-[#2a2a3a] px-4 py-3 text-xs font-medium text-[#55556a]">
            ...with DevStash
          </div>
          <div className="flex h-[280px] max-md:h-[220px]">
            {/* Sidebar */}
            <div className="flex w-12 flex-col items-center gap-2.5 border-r border-[#2a2a3a] bg-[#1a1a25] py-3">
              {Object.values(TYPE_COLORS).map((color, i) => (
                <div key={i} className="size-2 rounded-full opacity-70" style={{ background: color }} />
              ))}
            </div>

            {/* Main area */}
            <div className="flex flex-1 flex-col gap-2 p-3">
              {/* Stats row */}
              <div className="flex gap-2">
                {[
                  { n: '142', l: 'Items' },
                  { n: '12', l: 'Collections' },
                  { n: '38', l: 'Favorites' },
                ].map((stat) => (
                  <div key={stat.l} className="flex-1 rounded-md border border-[#2a2a3a] bg-[#1a1a25] p-1.5 text-center">
                    <div className="text-sm font-bold text-[#f0f0f5]">{stat.n}</div>
                    <div className="text-[0.5rem] uppercase text-[#55556a]">{stat.l}</div>
                  </div>
                ))}
              </div>

              {/* Cards grid */}
              <div className="grid flex-1 grid-cols-2 gap-2">
                {(['snippet', 'prompt', 'command', 'note'] as const).map((type) => (
                  <div
                    key={type}
                    className="rounded-md border border-[#2a2a3a] bg-[#1a1a25] p-2"
                    style={{ borderTopWidth: 3, borderTopColor: TYPE_COLORS[type] }}
                  >
                    <div className="mb-1 h-1 rounded-full bg-[#2a2a3a]" style={{ width: `${65 + Math.random() * 25}%` }} />
                    <div className="h-1 w-[60%] rounded-full bg-[#2a2a3a]" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
