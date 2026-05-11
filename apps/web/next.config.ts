import type { NextConfig } from "next";

function getAllowedDevOrigins() {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;

  if (!appUrl) {
    return [];
  }

  try {
    const url = new URL(appUrl);

    return [url.host, url.hostname];
  } catch {
    return [];
  }
}

const nextConfig: NextConfig = {
  output: "standalone",
  allowedDevOrigins: getAllowedDevOrigins(),
  typedRoutes: true,
  experimental: {
    missingSuspenseWithCSRBailout: false,
  },
};

export default nextConfig;
