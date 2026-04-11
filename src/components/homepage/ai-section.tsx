import { Sparkles, Check } from 'lucide-react';

const AI_FEATURES = [
  'Auto-suggest relevant tags on save',
  'Generate plain-English code explanations',
  'Summarize any item in one click',
  'Optimize and refine AI prompts',
];

export function AISection() {
  return (
    <section className="mx-auto max-w-[1200px] px-5 py-24">
      <div className="homepage-fade-in grid items-center gap-12 max-md:grid-cols-1 md:grid-cols-2">
        {/* Left - Text */}
        <div>
          <div className="mb-5 inline-flex items-center gap-1.5 rounded-full bg-[rgba(139,92,246,0.15)] px-3 py-1 text-xs font-semibold text-[#a78bfa]">
            <Sparkles className="size-3.5" />
            Pro Feature
          </div>
          <h2 className="mb-3 text-[clamp(1.75rem,4vw,2.5rem)] font-bold text-[#f0f0f5]">
            AI that understands your code
          </h2>
          <p className="mb-6 max-w-[550px] text-[#8888a0]">
            Let AI handle the tedious parts so you can focus on building.
          </p>
          <ul className="flex flex-col gap-3">
            {AI_FEATURES.map((feature) => (
              <li key={feature} className="flex items-center gap-3 text-[0.95rem] text-[#8888a0]">
                <Check className="size-[18px] shrink-0 text-[#a78bfa]" />
                {feature}
              </li>
            ))}
          </ul>
        </div>

        {/* Right - Code editor mockup */}
        <div className="overflow-hidden rounded-xl border border-[#2a2a3a] bg-[#12121a]">
          {/* Editor header */}
          <div className="flex items-center gap-2 border-b border-[#2a2a3a] bg-[#1e1e2e] px-4 py-3">
            <div className="size-2.5 rounded-full bg-[#ff5f57]" />
            <div className="size-2.5 rounded-full bg-[#febc2e]" />
            <div className="size-2.5 rounded-full bg-[#28c840]" />
            <span className="ml-2 text-xs text-[#55556a]">useDebounce.ts</span>
          </div>

          {/* Editor body */}
          <div className="p-4 font-mono text-[0.8rem] leading-[1.7]">
            <span className="text-[#c678dd]">import</span>
            {' { '}
            <span className="text-[#e5c07b]">useState</span>
            {', '}
            <span className="text-[#e5c07b]">useEffect</span>
            {' } '}
            <span className="text-[#c678dd]">from</span>
            {' '}
            <span className="text-[#98c379]">&apos;react&apos;</span>;
            <br /><br />
            <span className="text-[#c678dd]">export function</span>
            {' '}
            <span className="text-[#61afef]">useDebounce</span>
            {'<'}
            <span className="text-[#e5c07b]">T</span>
            {'>('}
            <br />
            {'  '}
            <span className="text-[#e5c07b]">value</span>
            {': '}
            <span className="text-[#e5c07b]">T</span>,
            <br />
            {'  '}
            <span className="text-[#e5c07b]">delay</span>
            {': '}
            <span className="text-[#e5c07b]">number</span>
            {' = '}
            <span className="text-[#98c379]">500</span>
            <br />
            {'): '}
            <span className="text-[#e5c07b]">T</span>
            {' {'}
            <br />
            {'  '}
            <span className="text-[#c678dd]">const</span>
            {' ['}
            <span className="text-[#e5c07b]">debounced</span>
            {', '}
            <span className="text-[#e5c07b]">setDebounced</span>
            {'] = '}
            <span className="text-[#61afef]">useState</span>
            {'('}
            <span className="text-[#e5c07b]">value</span>
            {');'}
            <br /><br />
            {'  '}
            <span className="text-[#61afef]">useEffect</span>
            {'(() => {'}
            <br />
            {'    '}
            <span className="text-[#c678dd]">const</span>
            {' '}
            <span className="text-[#e5c07b]">timer</span>
            {' = '}
            <span className="text-[#61afef]">setTimeout</span>
            {'('}
            <br />
            {'      () => '}
            <span className="text-[#61afef]">setDebounced</span>
            {'('}
            <span className="text-[#e5c07b]">value</span>
            {'), '}
            <span className="text-[#e5c07b]">delay</span>
            <br />
            {'    );'}
            <br />
            {'    '}
            <span className="text-[#c678dd]">return</span>
            {' () => '}
            <span className="text-[#61afef]">clearTimeout</span>
            {'('}
            <span className="text-[#e5c07b]">timer</span>
            {');'}
            <br />
            {'  }, ['}
            <span className="text-[#e5c07b]">value</span>
            {', '}
            <span className="text-[#e5c07b]">delay</span>
            {']);'}
            <br /><br />
            {'  '}
            <span className="text-[#c678dd]">return</span>
            {' '}
            <span className="text-[#e5c07b]">debounced</span>;
            <br />
            {'}'}
          </div>

          {/* AI Tags */}
          <div className="flex flex-wrap items-center gap-2 border-t border-[#2a2a3a] px-4 py-3">
            <span className="flex items-center gap-1.5 text-[0.7rem] font-semibold text-[#a78bfa]">
              <Sparkles className="size-3" />
              AI Generated Tags
            </span>
            {['react', 'hooks', 'debounce', 'typescript', 'performance'].map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-[rgba(139,92,246,0.12)] px-2.5 py-0.5 font-mono text-[0.7rem] text-[#a78bfa]"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
