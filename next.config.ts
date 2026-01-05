import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // IMPORTANT:
  // Use hostnames (optionally with ports). Do NOT include http://
  // This allows your phone (LAN IP) to request /_next/* dev assets without being blocked.
  allowedDevOrigins: [
    "localhost:3000",
    "127.0.0.1:3000",
    "10.0.81.88:3000",
    "10.0.81.88",
  ],
};

export default nextConfig;
