import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

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
  },
  
  // Optimize images
  images: {
    unoptimized: true,
    domains: ['imagedelivery.net', 'soundcharts.com'],
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
    
    // Reduce bundle size
    config.optimization = {
      ...config.optimization,
      splitChunks: {
        chunks: 'all',
        cacheGroups: {
          default: false,
          vendors: false,
          // Only create vendor bundle for large libraries
          vendor: {
            name: 'vendor',
            chunks: 'all',
            test: /node_modules/,
            priority: 20,
          },
          // Common components bundle
          common: {
            name: 'common',
            minChunks: 2,
            chunks: 'all',
            priority: 10,
            reuseExistingChunk: true,
            enforce: true,
          },
        },
      },
    }
    
    // Fix AWS Amplify imports
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      }
    }
    
    return config
  },
  
  // Experimental features to improve performance
  experimental: {
    optimizeCss: false, // Disabled for dev performance
    optimizePackageImports: ['@aws-amplify/auth', 'aws-amplify', 'framer-motion'],
    typedRoutes: false,
  },
  
  // Reduce memory usage
  onDemandEntries: {
    maxInactiveAge: 60 * 1000,
    pagesBufferLength: 5,
  },
}

export default nextConfig
