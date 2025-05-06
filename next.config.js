/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  env: {
    AWS_REGION: process.env.AWS_REGION,
    AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID,
    AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY,
    S3_BUCKET_NAME: process.env.S3_BUCKET_NAME,
    DYNAMODB_FILES_TABLE: process.env.DYNAMODB_FILES_TABLE,
    DYNAMODB_USERS_TABLE: process.env.DYNAMODB_USERS_TABLE,
  },
  // Server-specific configuration for production runtime
  serverExternalPackages: ['aws-sdk']
};

module.exports = nextConfig;
