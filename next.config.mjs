import { randomUUID } from 'node:crypto';
const releaseId = process.env.SAFELINK_RELEASE_ID || process.env.VERCEL_GIT_COMMIT_SHA || randomUUID();
const nextConfig = {
  env: { NEXT_PUBLIC_APP_RELEASE: releaseId },
  generateBuildId: async () => releaseId,
  async headers() {
    return [
      { source: '/api/:path*', headers: [{ key: 'Cache-Control', value: 'private, no-store' }] },
      { source: '/sw.js', headers: [{ key: 'Cache-Control', value: 'no-cache, no-store, must-revalidate' }, { key: 'Service-Worker-Allowed', value: '/' }] },
    ];
  },
};
export default nextConfig;
