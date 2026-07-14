import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';

const projectRoot = dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Vaizer is served at its own domain (vaizer.com), so it lives at the domain
  // root, no basePath.
  reactStrictMode: true,
  // Other lockfiles exist higher up the tree (C:\Users\phili). Pin the tracing
  // root to this project so file tracing for deployment is correct.
  outputFileTracingRoot: projectRoot,
  // MDX is compiled at the component level via next-mdx-remote (see lib/mdx.ts),
  // so no @next/mdx page extension wiring is needed here.
};

export default nextConfig;
