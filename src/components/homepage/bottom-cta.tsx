import Link from 'next/link';

export function BottomCTA() {
  return (
    <section className="homepage-fade-in mx-auto max-w-[600px] px-5 py-24 text-center">
      <h2 className="mb-4 text-[clamp(1.75rem,4vw,2.25rem)] font-bold text-[#f0f0f5]">
        Ready to Organize Your Knowledge?
      </h2>
      <p className="mb-8 text-[#8888a0]">
        Join developers who&apos;ve stopped losing their best work. Free to start, no credit card required.
      </p>
      <Link
        href="/register"
        className="inline-flex items-center justify-center rounded-lg h-11 px-8 text-base font-medium bg-[#3b82f6] text-white transition-all hover:bg-[#2563eb] hover:-translate-y-px"
      >
        Get Started &mdash; It&apos;s Free
      </Link>
    </section>
  );
}
