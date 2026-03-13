/** @type {import('next').NextConfig} */
const nextConfig = {
  // https://huggingface.co/spaces/Xenova/next-server-example-app/tree/main
  // (Optional) Export as a standalone site
  output: 'standalone',
  // https://nextjs.org/docs/app/api-reference/config/next-config-js/serverExternalPackages
  // Indicate that these packages should not be bundled by webpack
  serverExternalPackages: ['sharp', 'onnxruntime-node'],
}

export default nextConfig
 