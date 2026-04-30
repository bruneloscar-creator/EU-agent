/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: [
      "better-sqlite3",
      "sqlite-vec",
      "onnxruntime-node",
      "@xenova/transformers"
    ]
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals.push({
        "better-sqlite3": "commonjs better-sqlite3",
        "sqlite-vec": "commonjs sqlite-vec",
        "onnxruntime-node": "commonjs onnxruntime-node",
        "@xenova/transformers": "commonjs @xenova/transformers"
      });
    }

    return config;
  }
};

export default nextConfig;
