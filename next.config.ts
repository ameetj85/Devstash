import type { NextConfig } from "next";
import { IMAGE_HOSTNAMES } from './src/lib/image-hosts'

const nextConfig: NextConfig = {
  reactCompiler: true,
  devIndicators: false,
  async headers() {
    return [{ source: '/register', headers: [{ key: 'Referrer-Policy', value: 'no-referrer' }] }]
  },
  images: {
    remotePatterns: IMAGE_HOSTNAMES.map((hostname) => ({ protocol: 'https' as const, hostname })),
  },
};

export default nextConfig;
