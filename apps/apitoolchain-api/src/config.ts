/** Runtime config from env, with dev defaults matching docker-compose. */
export const config = {
  port: Number(process.env.PORT ?? 8788),
  databaseUrl:
    process.env.DATABASE_URL ??
    "postgres://apitoolchain:apitoolchain@localhost:5433/apitoolchain",
  registryApiUrl: process.env.REGISTRY_API_URL ?? "http://localhost:8787",
  artifactUrlTtlSeconds: Number(process.env.ARTIFACT_URL_TTL_SECONDS ?? 900),
  storage: {
    driver: (process.env.STORAGE_DRIVER ?? "s3") as "s3" | "local",
    bucket: process.env.STORAGE_BUCKET_ARTIFACTS ?? "apitoolchain-artifacts",
    s3Endpoint: process.env.S3_ENDPOINT_URL ?? "http://localhost:9000",
    s3Region: process.env.S3_REGION ?? "us-east-1",
    s3AccessKey: process.env.S3_ACCESS_KEY ?? "apitoolchain",
    s3SecretKey: process.env.S3_SECRET_KEY ?? "apitoolchain-secret",
    localRoot: process.env.STORAGE_LOCAL_ROOT ?? "/tmp/apitoolchain-storage",
  },
};
