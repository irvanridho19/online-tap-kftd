import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {},
};

// eslint-disable-next-line @typescript-eslint/no-require-imports
const withPWA = require("next-pwa")({
  dest: "public",
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === "development" // ✅ THIS IS THE FIX
});

module.exports = withPWA({
  reactStrictMode: true
});

export default nextConfig;
