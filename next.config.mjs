/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return [
      {
        source: "/ai-automation",
        destination: "/ai-tech-automation",
        permanent: true,
      },
      {
        source: "/health",
        destination: "/health-wellness",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
