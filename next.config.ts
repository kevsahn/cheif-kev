import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // PGlite 带 WASM，交给 Node 运行时直接 require，不让打包器处理
  serverExternalPackages: ["@electric-sql/pglite"],
};

export default nextConfig;
