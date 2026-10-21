import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Performance optimizations
  compress: true,
  poweredByHeader: false,
  
  // Security headers (also handled in middleware, but adding here for static assets)
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload'
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin'
          },
          {
            key: 'Permissions-Policy',
            // Allow same-origin interview pages to call getUserMedia for C5 video scoring.
            value: 'camera=(self), microphone=(self), geolocation=()'
          }
        ]
      }
    ];
  },

  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "fonts.gstatic.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "images.example.com",
        port: "",
        pathname: "/storage/v1/object/public/**",
      },
      {
        protocol: "https",
        hostname: "i.pravatar.cc",
        port: "",
        pathname: "/**",
      },
    ],
  },

  // Experimental features for performance
  // optimizeCss disabled: avoids critters resolution issues in Next dev/server
  experimental: {
    optimizePackageImports: ['@radix-ui/react-icons', 'recharts'],
    serverActions: {
      bodySizeLimit: '5mb',
    },
  },

  // Fix middleware.js.nft.json errors on Vercel
  outputFileTracingExcludes: {
    '*': [
      'node_modules/canvas/**',
      'node_modules/pdfjs-dist/**',
      'node_modules/@swc/**',
    ],
  },

  /** Đảm bảo CSV câu hỏi phỏng vấn có trong bundle server (standalone / Vercel). */
  outputFileTracingIncludes: {
    "/**": ["./src/HOEX_Interview_Questions_Dataset.csv"],
  },

  // React strict mode
  reactStrictMode: true,
  
  // TypeScript configuration
  typescript: {
    ignoreBuildErrors: false,
  },

  // Turbopack configuration (Next.js 16+)
  turbopack: {
    resolveAlias: {
      // Stub out canvas module - use our custom stub
      canvas: './src/lib/canvas-stub.js',
    },
  },

  // Không bundle Prisma — tránh Turbopack giữ schema client cũ sau `prisma generate` (lỗi Unknown field previous_rank).
  // Canvas: pdfjs-dist.
  serverExternalPackages: ['canvas', '@prisma/client', '@prisma/adapter-pg', 'pg'],

  // Webpack configuration fallback (for production build)
  webpack: (config, { isServer }) => {
    // Ignore canvas module (used by pdfjs-dist for Node.js, not needed in browser)
    config.resolve.alias.canvas = false;

    // Also handle encoding module if needed
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        canvas: false,
        encoding: false,
      };
    }

    return config;
  },
};

export default nextConfig;
