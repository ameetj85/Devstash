import { Code2, Sparkles, Search, Terminal, FileText, LayoutGrid } from 'lucide-react';

const FEATURES = [
  {
    icon: Code2,
    title: 'Code Snippets',
    description: 'Save and organize reusable code with syntax highlighting, language detection, and instant copy.',
    color: '#3b82f6',
    bgColor: 'rgba(59,130,246,0.12)',
    borderColor: '#3b82f6',
  },
  {
    icon: Sparkles,
    title: 'AI Prompts',
    description: 'Store your best AI prompts, system messages, and context files. Never re-craft the same prompt.',
    color: '#8b5cf6',
    bgColor: 'rgba(139,92,246,0.12)',
    borderColor: '#8b5cf6',
  },
  {
    icon: Search,
    title: 'Instant Search',
    description: 'Find anything with Cmd+K. Search across titles, content, tags, and types in milliseconds.',
    color: '#6366f1',
    bgColor: 'rgba(99,102,241,0.12)',
    borderColor: '#6366f1',
  },
  {
    icon: Terminal,
    title: 'Commands',
    description: 'Keep your terminal one-liners, Docker commands, and deployment scripts at your fingertips.',
    color: '#f97316',
    bgColor: 'rgba(249,115,22,0.12)',
    borderColor: '#f97316',
  },
  {
    icon: FileText,
    title: 'Files & Docs',
    description: 'Upload config files, documentation, context files, and images. Everything in one place.',
    color: '#6b7280',
    bgColor: 'rgba(107,114,128,0.12)',
    borderColor: '#6b7280',
  },
  {
    icon: LayoutGrid,
    title: 'Collections',
    description: 'Group related items into collections. One item can live in multiple collections. Stay organized.',
    color: '#10b981',
    bgColor: 'rgba(16,185,129,0.12)',
    borderColor: '#10b981',
  },
];

export function FeaturesSection() {
  return (
    <section id="features" className="mx-auto max-w-[1200px] px-5 py-24">
      <div className="homepage-fade-in">
        <div className="mb-3 text-xs font-semibold uppercase tracking-wider text-[#3b82f6]">
          Features
        </div>
        <h2 className="mb-3 text-[clamp(1.75rem,4vw,2.5rem)] font-bold text-[#f0f0f5]">
          Everything you need, nothing you don&apos;t
        </h2>
        <p className="mb-12 max-w-[550px] text-[#8888a0]">
          DevStash is purpose-built for developers. Fast, keyboard-driven, and dark-mode by default.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map((feature) => (
          <div
            key={feature.title}
            className="homepage-fade-in group rounded-xl border border-[#2a2a3a] bg-[#1a1a25] p-6 transition-all duration-200 hover:-translate-y-0.5 hover:border-[var(--hover-border)]"
            style={{ '--hover-border': feature.borderColor } as React.CSSProperties}
          >
            <div
              className="mb-4 flex size-10 items-center justify-center rounded-[10px]"
              style={{ background: feature.bgColor, color: feature.color }}
            >
              <feature.icon className="size-5" />
            </div>
            <h3 className="mb-2 text-[1.05rem] font-semibold text-[#f0f0f5]">{feature.title}</h3>
            <p className="text-sm leading-relaxed text-[#8888a0]">{feature.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
