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

  images: {
    remotePatterns: [
      // Notion-hosted images (pre-signed S3 — use unoptimized on these)
      { protocol: "https", hostname: "prod-files-secure.s3.us-west-2.amazonaws.com" },
      { protocol: "https", hostname: "*.amazonaws.com" },
      // Notion page covers and external images pasted into Notion
      { protocol: "https", hostname: "www.notion.so" },
      { protocol: "https", hostname: "notion.so" },
      // Common image CDNs used in Notion embeds
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "**.unsplash.com" },
    ],
  },
};

export default nextConfig;
