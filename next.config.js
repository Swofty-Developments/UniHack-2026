import nextEnv from "@next/env";

// Ensure `.env*` files are loaded before env schema validation runs.
const { loadEnvConfig } = nextEnv;
loadEnvConfig(process.cwd());

await import("./src/env.js");

/** @type {import("next").NextConfig} */
const config = {
  experimental: {
    serverActions: {
      bodySizeLimit: "100mb",
    },
  },
};

export default config;
