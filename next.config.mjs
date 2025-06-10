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
  typescript: {
    // Skip type checking during builds (rely on IDE/CI)
    ignoreBuildErrors: false,
  },
  
  // Optimize images
  images: {
    unoptimized: true,
    domains: ['imagedelivery.net', 'soundcharts.com'],
  },
  
  // Webpack optimizations
  webpack: (config, { isServer }) => {
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
    optimizeCss: true,
    optimizePackageImports: ['@aws-amplify/auth', 'aws-amplify', 'lucide-react', 'framer-motion'],
    typedRoutes: false,
  },
  
  // Reduce memory usage
  onDemandEntries: {
    maxInactiveAge: 60 * 1000,
    pagesBufferLength: 5,
  },
}

export default nextConfig
