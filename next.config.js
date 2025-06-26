/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable experimental features for better performance
  experimental: {
    // App directory is enabled by default in Next.js 14, no need to specify
    
    // Optimize server components
    serverComponentsExternalPackages: [
      '@aws-sdk/client-bedrock',
      '@aws-sdk/client-bedrock-agent',
      '@aws-sdk/client-bedrock-agent-runtime',
      '@aws-sdk/client-bedrock-runtime',
      '@aws-sdk/client-dynamodb',
      '@aws-sdk/client-s3',
      '@aws-sdk/client-sts',
      '@aws-sdk/client-secretsmanager'
    ],
    
    // Enable turbo mode for development
    turbo: {
      rules: {
        '*.svg': {
          loaders: ['@svgr/webpack'],
          as: '*.js',
        },
      },
    },
  },

  // Optimize images
  images: {
    domains: [
      'localhost',
      'patchline.ai',
      'customer.soundcharts.com',
      'i.scdn.co', // Spotify images
      'platform-lookaside.fbsbx.com', // Instagram images
      'pbs.twimg.com', // Twitter images
    ],
    formats: ['image/webp', 'image/avif'],
  },

  // Environment variables
  env: {
    // Debug system configuration
    DEBUG_MODE: process.env.DEBUG_MODE || 'prod',
    S3_DEBUG_BUCKET: process.env.S3_DEBUG_BUCKET || 'patchline-files-us-east-1',
    
    // AWS configuration
    AWS_REGION: process.env.AWS_REGION || 'us-east-1',
    
    // Application configuration
    APP_ENV: process.env.NODE_ENV || 'production',
  },

  // Build optimizations
  compiler: {
    // Remove console.log in production
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn']
    } : false,
  },

  // Output configuration for Amplify
  output: 'standalone',
  
  // Disable strict mode in production to avoid double-rendering issues
  reactStrictMode: process.env.NODE_ENV !== 'production',

  // Webpack configuration
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    // Optimize AWS SDK imports
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
        stream: false,
        url: false,
        zlib: false,
        http: false,
        https: false,
        assert: false,
        os: false,
        path: false,
      };
    }

    // Optimize bundle size
    config.optimization = {
      ...config.optimization,
      splitChunks: {
        chunks: 'all',
        cacheGroups: {
          aws: {
            test: /[\\/]node_modules[\\/]@aws-sdk[\\/]/,
            name: 'aws-sdk',
            chunks: 'all',
            priority: 10,
          },
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            chunks: 'all',
            priority: 5,
          },
        },
      },
    };

    return config;
  },

  // Headers for security and performance
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
        ],
      },
    ];
  },

  // Redirects for SEO and user experience
  async redirects() {
    return [
      {
        source: '/agents',
        destination: '/dashboard/agents',
        permanent: true,
      },
      {
        source: '/chat',
        destination: '/dashboard/agents/supervisor',
        permanent: true,
      },
    ];
  },

  // Rewrites for API compatibility
  async rewrites() {
    return [
      {
        source: '/api/health',
        destination: '/api/health',
      },
    ];
  },
};

module.exports = nextConfig; 