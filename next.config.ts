import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  agentRules: false,
  // The practice hub used to be /quiz; keep old links and bookmarks working.
  async redirects() {
    return [
      { source: "/quiz", destination: "/learn", permanent: true },
      { source: "/quiz/:deck", destination: "/learn/:deck/quiz", permanent: true },
    ];
  },
};

export default nextConfig;
