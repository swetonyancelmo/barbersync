/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Transpila o pacote compartilhado (consumido direto do TS via paths).
  transpilePackages: ['@barbersync/shared'],
  env: {
    NEXT_PUBLIC_API_URL:
      process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333/api',
  },
};

module.exports = nextConfig;
