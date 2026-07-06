/** Runtime config from env, with dev defaults matching docker-compose. */
export const config = {
  port: Number(process.env.PORT ?? 8788),
  databaseUrl:
    process.env.DATABASE_URL ??
    "postgres://apitoolchain:apitoolchain@localhost:5433/apitoolchain",
  registryApiUrl: process.env.REGISTRY_API_URL ?? "http://localhost:8787",
  gitProviderApiUrl: process.env.GITPROVIDER_API_URL ?? "http://localhost:8790",
  artifactUrlTtlSeconds: Number(process.env.ARTIFACT_URL_TTL_SECONDS ?? 900),
  /** Public origin git providers POST release-PR webhooks to (empty → manual
   * "Publish" only). The dev plugin sets it to a host.docker.internal URL. */
  platformPublicUrl: process.env.PLATFORM_PUBLIC_URL ?? "",
  /** Local Gitea provider to auto-register at seed time (set by the dev plugin). */
  gitea: {
    url: process.env.GITEA_URL ?? "",
    token: process.env.GITEA_TOKEN ?? "",
    user: process.env.GITEA_USER ?? "",
    repo: process.env.GITEA_REPO ?? "",
  },
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
