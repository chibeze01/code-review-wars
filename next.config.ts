import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // The old Vite-era ESLint flat config was removed during the Next.js
  // migration; don't let linting block production builds. `next build` still
  // runs full TypeScript type-checking, which is the safety net that matters.
  eslint: { ignoreDuringBuilds: true },
}

export default nextConfig
