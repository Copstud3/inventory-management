import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    remotePatterns: [new URL('https://s3-inventorymanagement.s3.us-east-2.amazonaws.com/**')]
  }
};

export default nextConfig;
