/** @type {import('next').NextConfig} */
const nextConfig = {
  serverRuntimeConfig: {
    API_URL: process.env.API_URL || "https://this-aniket1129-library-backend.hf.space"
  },
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || "https://this-aniket1129-library-backend.hf.space"
  }
};

export default nextConfig;
