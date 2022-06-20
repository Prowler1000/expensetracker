/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
}

module.exports = {
  nextConfig,
  experimental: {
    outputStandalone: true,
  },
  async redirects() {
    return [
      {
        source: '/',
        destination: '/expenses',
        permanent: false,
      },
    ]
  },
}
