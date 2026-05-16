import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "static.doctronic.ai",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "maps.googleapis.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "ioofmlovhjvnnqvczeri.supabase.co",
        pathname: "/storage/**",
      },
      // Google user avatars (OAuth profile pictures)
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
        pathname: "/**",
      },
      // Instagram CDN domains for profile pics and posts
      {
        protocol: "https",
        hostname: "**.cdninstagram.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "**.fbcdn.net",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
