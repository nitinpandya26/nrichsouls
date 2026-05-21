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
      // Supabase Storage (uploaded images + DALL-E generated images)
      { protocol: "https", hostname: "*.supabase.co" },
      // Common external image CDNs used in blog content
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "**.unsplash.com" },
      // Site-hosted images
      { protocol: "https", hostname: "nrichsouls.in" },
      { protocol: "https", hostname: "www.nrichsouls.in" },
    ],
  },
};

export default nextConfig;
