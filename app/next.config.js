const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ['node-edge-tts'],
  devIndicators: false,
  outputFileTracingRoot: path.join(__dirname, '../'),
  experimental: {
    externalDir: true,
  },
};

module.exports = nextConfig;
