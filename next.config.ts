import type { NextConfig } from "next";

// Netlify exposes COMMIT_REF during the build, but it is not guaranteed to be
// present inside the deployed Next server-function runtime. Bake the revision
// into the bundle so /api/health can prove exactly which Git commit is live.
const buildRevision =
  process.env.COMMIT_REF?.trim() ||
  process.env.VERCEL_GIT_COMMIT_SHA?.trim() ||
  process.env.GITHUB_SHA?.trim() ||
  "";

const nextConfig: NextConfig = {
  env: {
    ACADEMIC_COMPLETION_BUILD_REVISION: buildRevision,
  },
};

export default nextConfig;
