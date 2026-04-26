import { FileCode2 } from 'lucide-react';

const FOOTER_COLUMNS = [
  {
    title: 'Product',
    links: [
      { label: 'Features', href: '#features' },
      { label: 'Pricing', href: '#pricing' },
      { label: 'Changelog', href: '#' },
    ],
  },
  {
    title: 'Resources',
    links: [
      { label: 'Documentation', href: '#' },
      { label: 'API', href: '#' },
      { label: 'Blog', href: '#' },
    ],
  },
  {
    title: 'Company',
    links: [
      { label: 'About', href: '#' },
      { label: 'Privacy', href: '#' },
      { label: 'Terms', href: '#' },
    ],
  },
];

export function Footer() {
  return (
    <footer className="mx-auto max-w-[1200px] border-t border-[#2a2a3a] px-5 py-12">
      <div className="mb-8 grid grid-cols-[2fr_1fr_1fr_1fr] gap-8 max-md:grid-cols-2 max-md:gap-6">
        {/* Brand */}
        <div className="max-md:col-span-2">
          <a href="#" className="mb-3 flex items-center gap-2 text-xl font-bold text-[#f0f0f5]">
            <FileCode2 className="size-6" />
            Scribbles
          </a>
          <p className="max-w-[250px] text-sm text-[#8888a0]">
            Your developer knowledge hub. One place for snippets, prompts, commands, and more.
          </p>
        </div>

        {/* Link columns */}
        {FOOTER_COLUMNS.map((col) => (
          <div key={col.title}>
            <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-[#f0f0f5]">
              {col.title}
            </h4>
            <ul className="flex flex-col gap-1.5">
              {col.links.map((link) => (
                <li key={link.label}>
                  <a href={link.href} className="text-sm text-[#8888a0] transition-colors hover:text-[#f0f0f5]">
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between border-t border-[#2a2a3a] pt-6 text-xs text-[#55556a] max-md:flex-col max-md:gap-2 max-md:text-center">
        <span>&copy; {new Date().getFullYear()} Scribbles. All rights reserved.</span>
        <span>Built for developers, by developers.</span>
      </div>
    </footer>
  );
}
