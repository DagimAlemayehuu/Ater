/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  serverExternalPackages: ['node-edge-tts'],
  devIndicators: false,
};

module.exports = nextConfig;
