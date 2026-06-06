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
  webpack: (config) => {
    // Silence optional peer deps that wagmi/metamask-sdk pull in for RN/WC
    config.resolve.fallback = {
      ...(config.resolve.fallback ?? {}),
      "@react-native-async-storage/async-storage": false,
      "pino-pretty": false,
      encoding: false,
    };
    // viem 'externals' module not used in browser
    config.externals = [...(config.externals ?? []), "pino-pretty"];
    return config;
  },
};

export default nextConfig;
