import { CreateBucketCommand, S3Client } from "@aws-sdk/client-s3";
import { AwsS3StorageAdapter } from "@flystorage/aws-s3";
import { FileStorage } from "@flystorage/file-storage";
import { LocalStorageAdapter } from "@flystorage/local-fs";
import { config } from "./config";

/**
 * One `FileStorage` interface over any backend. `s3` covers real AWS S3 and any
 * S3-compatible store (MinIO in dev, R2, Backblaze, …); `local` for zero-infra
 * dev. A GCS adapter (`@flystorage/google-cloud-storage`) is a drop-in `case`.
 */
export function makeStorage(): FileStorage {
  const s = config.storage;
  if (s.driver === "local") {
    return new FileStorage(
      new LocalStorageAdapter(`${s.localRoot}/${s.bucket}`),
    );
  }
  const client = new S3Client({
    endpoint: s.s3Endpoint,
    region: s.s3Region,
    credentials: {
      accessKeyId: s.s3AccessKey,
      secretAccessKey: s.s3SecretKey,
    },
    forcePathStyle: true, // required for MinIO / path-style S3
  });
  return new FileStorage(new AwsS3StorageAdapter(client, { bucket: s.bucket }));
}

/** Best-effort bucket creation (MinIO dev). No-op if it already exists. */
export async function ensureBucket(): Promise<void> {
  const s = config.storage;
  if (s.driver !== "s3") return;
  const client = new S3Client({
    endpoint: s.s3Endpoint,
    region: s.s3Region,
    credentials: {
      accessKeyId: s.s3AccessKey,
      secretAccessKey: s.s3SecretKey,
    },
    forcePathStyle: true,
  });
  try {
    await client.send(new CreateBucketCommand({ Bucket: s.bucket }));
  } catch {
    // already exists / owned — fine
  }
}

export const storage = makeStorage();
