import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: false,
  outputFileTracingExcludes: {
    "/*": ["./data/**/*", "./.env*", "./.git/**/*", "./tests/**/*", "./docs/**/*"],
  },
};

export default nextConfig;
