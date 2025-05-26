import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "befitting-jay-762.convex.cloud",
      },
    ],
  },
};

export default nextConfig;
