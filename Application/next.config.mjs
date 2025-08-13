/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  experimental: {
    // Dev에서 127.0.0.1 접근 시 /_next/* 교차 출처 경고/자산 404 방지
    allowedDevOrigins: ["127.0.0.1", "localhost"],
  },
};

export default nextConfig;
