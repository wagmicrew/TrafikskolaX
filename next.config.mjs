/** @type {import('next').NextConfig} */
const nextConfig = {
  // Build optimizations
  eslint: {
    ignoreDuringBuilds: process.env.NODE_ENV === 'development', // Only ignore in dev
  },
  typescript: {
    ignoreBuildErrors: process.env.NODE_ENV === 'development', // Only ignore in dev
  },
  
  // Image optimization
  images: {
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    domains: ['localhost'], // Add your image domains here
  },
  
  // Performance optimizations
  swcMinify: true,
  reactStrictMode: true,
  productionBrowserSourceMaps: false,
  poweredByHeader: false,
  
  // Bundle optimization
  experimental: {
    turbo: {
      rules: {
        '*.svg': {
          loaders: ['@svgr/webpack'],
          as: '*.js',
        },
      },
    },
    optimizePackageImports: [
      'lucide-react',
      '@radix-ui/react-dialog',
      '@radix-ui/react-select',
      '@radix-ui/react-tabs',
      'react-hot-toast'
    ],
    serverComponentsExternalPackages: ['bcryptjs', 'jsonwebtoken'],
  },
  
  // Tree shaking optimizations
  modularizeImports: {
    'lucide-react': {
      transform: 'lucide-react/icons/{{member}}',
      preventFullImport: true,
    },
    'react-icons/fa': {
      transform: 'react-icons/fa/{{member}}',
      preventFullImport: true,
    },
    '@radix-ui/react-icons': {
      transform: '@radix-ui/react-icons/dist/{{member}}',
      preventFullImport: true,
    },
  },
  webpack: (config, { isServer, dev }) => {
    // Client-side optimizations
    if (!isServer) {
      config.resolve.fallback = {
        fs: false,
        path: false,
        os: false,
        crypto: false,
      };
      
      // Split chunks for better caching
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          chunks: 'all',
          cacheGroups: {
            vendor: {
              test: /[\\/]node_modules[\\/]/,
              name: 'vendors',
              chunks: 'all',
              priority: 10,
            },
            ui: {
              test: /[\\/]node_modules[\\/](@radix-ui|lucide-react)[\\/]/,
              name: 'ui-components',
              chunks: 'all',
              priority: 20,
            },
          },
        },
      };
    }
    
    // Production optimizations
    if (!dev) {
      config.optimization = {
        ...config.optimization,
        usedExports: true,
        sideEffects: false,
      };
    }
    
    return config;
  },
  
  // Compiler optimizations
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? { exclude: ['error', 'warn'] } : false,
    styledComponents: false, // We're not using styled-components
  },
  
  // Headers for performance
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
        ],
      },
      {
        source: '/api/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, max-age=0',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
