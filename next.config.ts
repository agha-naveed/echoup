import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "ntvb.tmsimg.com"
      },
      {
        protocol: "https",
        hostname: "t4.ftcdn.net"
      },
      {
        protocol: "https",
        hostname: "static.vecteezy.com"
      },
      {
        protocol: "https",
        hostname: "encrypted-tbn0.gstatic.com"
      },
      {
        protocol: "https",
        hostname: "scontent.fisb29-1.fna.fbcdn.net"
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com"
      },
      {
        protocol: "https",
        hostname: "res.cloudinary.com"
      },
      {
        protocol: "https",
        hostname: "cdn.pixabay.com"
      }
    ]
  }
};

export default nextConfig;
