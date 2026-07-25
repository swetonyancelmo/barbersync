/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  env: {
    // URL do painel admin (destino do CTA "Cadastre sua barbearia").
    // Dev: admin roda na 3001. Prod: ex. https://admin.barbersync.com
    NEXT_PUBLIC_ADMIN_URL:
      process.env.NEXT_PUBLIC_ADMIN_URL || 'http://localhost:3001',
  },
};

module.exports = nextConfig;
