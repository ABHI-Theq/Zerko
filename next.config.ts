import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */ 
  outputFileTracingRoot: __dirname,
  images: {
    remotePatterns: [
      { hostname: "lh3.googleusercontent.com" },
      { hostname: "avatars.githubusercontent.com" },
      {hostname:"res.cloudinary.com"}
    ],
  },
   reactStrictMode: false,
};

export default nextConfig;
