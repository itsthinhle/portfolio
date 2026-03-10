/** @type {import('next').NextConfig} */
const nextConfig = {
  // https://nextjs.org/docs/app/api-reference/config/next-config-js/serverExternalPackages
  serverExternalPackages: ['onnxruntime-node', '@xenova/transformers'],
}

export default nextConfig
 