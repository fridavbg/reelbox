import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Stops `next dev` from writing its agent-rules block into CLAUDE.md; the
  // same hint is one line under "Stack" there instead.
  agentRules: false,
};

export default nextConfig;
