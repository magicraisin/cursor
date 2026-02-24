import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: {
    buildActivity: false
  },
  async redirects() {
    return [
      { source: "/personality-test-2", destination: "/prototypes/personality-test-2", permanent: false },
      { source: "/pt2", destination: "/prototypes/personality-test-2", permanent: false },
    ];
  },
};

export default nextConfig;
