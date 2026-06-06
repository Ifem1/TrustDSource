import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["genlayer-js"],
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**.supabase.co" },
      { protocol: "https", hostname: "avatars.githubusercontent.com" },
    ],
  },
  env: {
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  },
  // Empty Turbopack config: tells Next.js this project is Turbopack-compatible
  // even though we use a webpack hook below for optional-dep aliases.
  turbopack: {
    resolveAlias: {
      "@react-native-async-storage/async-storage": { browser: "empty" },
      "pino-pretty": { browser: "empty" },
    },
  },
  webpack: (config) => {
    config.resolve.fallback = {
      ...(config.resolve.fallback ?? {}),
      "@react-native-async-storage/async-storage": false,
      "pino-pretty": false,
      encoding: false,
    };
    config.externals = [...(config.externals ?? []), "pino-pretty"];
    return config;
  },
};

export default nextConfig;
