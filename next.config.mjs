/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Prefer fixing TypeScript/ESLint issues rather than ignoring them in production builds.
  // Temporarily left as-is for compatibility; remove ignore* flags once clean.
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  webpack: (config) => {
    config.watchOptions = {
      ...config.watchOptions,
      ignored: ['**/node_modules/**', '**/.next/**'],
    };
    return config;
  },
  async headers() {
    return [
      {
        source: '/models/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=604800, stale-while-revalidate=86400' },
        ],
      },
      {
        // Apply security headers to all routes
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()' },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          // CSP is intentionally permissive for now.
          // Spline + Three.js + Draco decoder need gstatic.com, blob workers, etc.
          // A tight CSP broke the 3D scene on production (apl-delta.vercel.app).
          // Keep the other security headers; tighten CSP later once all asset origins are fully mapped.
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://prod.spline.design https://unpkg.com https://www.gstatic.com",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: blob: https: http:",
              "font-src 'self' data: https:",
              "connect-src 'self' https: wss: blob:",
              "worker-src 'self' blob:",
              "child-src 'self' blob:",
              "frame-src 'self' https://prod.spline.design",
              "media-src 'self' blob: https:",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'",
              "frame-ancestors 'none'",
            ].join('; '),
          },
        ],
      },
    ];
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**.supabase.co' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'parsefiles.back4app.com' },
      { protocol: 'https', hostname: 'prod.spline.design' },
    ],
  },
};
export default nextConfig;
