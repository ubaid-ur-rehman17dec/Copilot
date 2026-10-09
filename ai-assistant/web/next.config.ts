import type { NextConfig } from "next";

let rawApiUrl = (process.env.API_URL ?? "http://localhost:8001").trim();
if (rawApiUrl && !rawApiUrl.startsWith("http://") && !rawApiUrl.startsWith("https://")) {
  rawApiUrl = `https://${rawApiUrl}`;
}
const API_URL = rawApiUrl.replace(/\/+$/, "");


const nextConfig: NextConfig = {
  output: "standalone",
  poweredByHeader: false,
  // Compression would buffer the chat event stream; let your proxy/CDN compress instead.
  devIndicators: false,
  compress: false,
  async rewrites() {
    return [
      { source: "/api/:path*", destination: `${API_URL}/api/:path*` },
      { source: "/static/:path*", destination: `${API_URL}/static/:path*` },
    ];
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "DENY" },
        ],
      },
    ];
  },
};

export default nextConfig;
