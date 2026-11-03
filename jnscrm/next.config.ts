import type { NextConfig } from "next";

// Backend (NestJS) URL. Browser calls go to /backend/* on the frontend's own domain and
// Next.js proxies them here, so there is no CORS and the auth cookie lands on the frontend domain.
const BACKEND_URL =
  process.env.BACKEND_URL ||
  (process.env.NODE_ENV === "production"
    ? "https://jnsenterprise-65uv-alpha.vercel.app"
    : "http://localhost:4000");

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  async rewrites() {
    return [
      {
        source: "/backend/:path*",
        destination: `${BACKEND_URL}/:path*`,
      },
    ];
  },
};

export default nextConfig;
