import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cinemaapi.kanocitymall.com.ng",
        port: "", // Leave empty for default HTTPS port
        pathname: "/**", // This ensures all paths under the domain are allowed
      },
    ],
  },
  // Optional: If you're seeing issues with trailing slashes in your API routes
  trailingSlash: false, 
};

export default nextConfig;