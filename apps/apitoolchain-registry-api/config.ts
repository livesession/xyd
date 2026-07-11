const port = Number(process.env.PORT ?? 8787);

/** Runtime config from env, with dev defaults matching docker-compose. */
export const config = {
  port,
  /** Public origin used to build each API's resolvable `registryUrl`. */
  publicUrl: process.env.REGISTRY_PUBLIC_URL ?? `http://localhost:${port}`,
  databaseUrl:
    process.env.DATABASE_URL ??
    "postgres://apitoolchain:apitoolchain@localhost:5433/apitoolchain",
  storage: {
    driver: (process.env.STORAGE_DRIVER ?? "s3") as "s3" | "local",
    bucket: process.env.STORAGE_BUCKET_SPECS ?? "apitoolchain-specs",
    s3Endpoint: process.env.S3_ENDPOINT_URL ?? "http://localhost:9000",
    s3Region: process.env.S3_REGION ?? "us-east-1",
    s3AccessKey: process.env.S3_ACCESS_KEY ?? "apitoolchain",
    s3SecretKey: process.env.S3_SECRET_KEY ?? "apitoolchain-secret",
    localRoot: process.env.STORAGE_LOCAL_ROOT ?? "/tmp/apitoolchain-storage",
  },
};
