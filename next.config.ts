import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // pdf-parse (via pdfjs-dist) needs its native canvas dependency to stay
  // external rather than bundled, or PDF parsing breaks in serverless
  // (DOMMatrix is not defined).
  serverExternalPackages: ["pdf-parse", "@napi-rs/canvas"],
};

export default nextConfig;
