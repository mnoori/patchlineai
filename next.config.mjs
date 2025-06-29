import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Bundle analyzer configuration
const withBundleAnalyzer = process.env.ANALYZE === 'true' 
  ? (await import('@next/bundle-analyzer')).default({
      enabled: true,
      openAnalyzer: false,
    })
  : (config) => config

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Performance optimizations
  swcMinify: true,
  reactStrictMode: true,
  
  // Reduce build time
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Disable type-checking in the production build to keep memory usage under the 2 GB Node.js limit used by Amplify.
  // The CI workflow and local development should still run `pnpm type-check` so we don't lose safety.
  typescript: {
    ignoreBuildErrors: true,
    tsconfigPath: './tsconfig.json',
  },
  
  // Optimize images - Re-enable Next.js image optimization for performance
  images: {
    unoptimized: false, // Enable optimization for automatic AVIF/WebP conversion
    domains: ['imagedelivery.net', 'soundcharts.com'],
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60,
  },
  
  // Webpack optimizations
  webpack: (config, { isServer, dev }) => {
    // Development-specific optimizations
    if (dev) {
      config.watchOptions = {
        poll: 1000,
        aggregateTimeout: 300,
        ignored: ['**/node_modules', '**/.git', '**/.next'],
      }
    }
    
    // Production optimizations
    if (!dev) {
      // Minimize bundle size
      config.optimization = {
        ...config.optimization,
        minimize: true,
        sideEffects: false,
        usedExports: true,
        splitChunks: {
          chunks: 'all',
          maxInitialRequests: 25,
          minSize: 20000,
          maxSize: 244000,
          cacheGroups: {
            default: false,
            vendors: false,
            // Framework bundle
            framework: {
              name: 'framework',
              chunks: 'all',
              test: /[\\/]node_modules[\\/](react|react-dom|scheduler|prop-types|use-sync-external-store)[\\/]/,
              priority: 40,
              enforce: true,
            },
            // AWS SDK bundle
            aws: {
              name: 'aws',
              chunks: 'all',
              test: /[\\/]node_modules[\\/]@aws-sdk[\\/]/,
              priority: 35,
              enforce: true,
            },
            // Solana/Web3 bundle (lazy loaded)
            web3: {
              name: 'web3',
              chunks: 'async',
              test: /[\\/]node_modules[\\/](@solana|@metaplex|@dynamic-labs)[\\/]/,
              priority: 30,
              enforce: true,
            },
            // UI libraries bundle
            lib: {
              name: 'lib',
              chunks: 'all',
              test: /[\\/]node_modules[\\/]/,
              priority: 20,
              minChunks: 2,
              reuseExistingChunk: true,
            },
            // Common components
            common: {
              name: 'common',
              minChunks: 2,
              chunks: 'all',
              priority: 10,
              reuseExistingChunk: true,
            },
          },
        },
      }
      
      // Tree shake unused icons
      config.module.rules.push({
        test: /lucide-react/,
        sideEffects: false,
      })
    }
    
    // Fix AWS Amplify imports
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        dns: false,
        child_process: false,
        canvas: false,
      }
    }
    
    // Ignore optional dependencies
    config.externals = [...(config.externals || []), 
      { 
        'puppeteer': 'puppeteer',
        'pdf-parse': 'pdf-parse',
        'xlsx': 'xlsx',
        'canvas': 'canvas'
      }
    ]
    
    return config
  },
  
  // Experimental features to improve performance
  experimental: {
    optimizeCss: false, // Disabled for dev performance
    optimizePackageImports: [
      '@aws-amplify/auth', 
      'aws-amplify', 
      'framer-motion',
      'lucide-react',
      '@radix-ui/react-*',
      'recharts',
      '@solana/web3.js',
      '@aws-sdk/*'
    ],
    typedRoutes: false,
  },
  
  // Add aggressive caching headers for static assets
  async headers() {
    return [
      {
        source: '/_next/static/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, immutable, max-age=31536000',
          },
        ],
      },
      {
        source: '/fonts/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, immutable, max-age=31536000',
          },
        ],
      },
      {
        source: '/images/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, must-revalidate',
          },
        ],
      },
    ]
  },
  
  // Reduce memory usage
  onDemandEntries: {
    maxInactiveAge: 60 * 1000,
    pagesBufferLength: 5,
  },
}

export default withBundleAnalyzer(nextConfig)
