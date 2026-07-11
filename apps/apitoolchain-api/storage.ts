import { CreateBucketCommand, S3Client } from "@aws-sdk/client-s3";
import { AwsS3StorageAdapter } from "@flystorage/aws-s3";
import { FileStorage } from "@flystorage/file-storage";
import { LocalStorageAdapter } from "@flystorage/local-fs";
import { config } from "./config";

function s3Client(): S3Client {
  const s = config.storage;
  return new S3Client({
    endpoint: s.s3Endpoint,
    region: s.s3Region,
    credentials: { accessKeyId: s.s3AccessKey, secretAccessKey: s.s3SecretKey },
    forcePathStyle: true,
  });
}

/** One `FileStorage` over S3/MinIO/local for generated SDK/docs/MCP artifacts. */
export function makeStorage(): FileStorage {
  const s = config.storage;
  if (s.driver === "local") {
    return new FileStorage(
      new LocalStorageAdapter(`${s.localRoot}/${s.bucket}`),
    );
  }
  return new FileStorage(
    new AwsS3StorageAdapter(s3Client(), { bucket: s.bucket }),
  );
}

export async function ensureBucket(): Promise<void> {
  if (config.storage.driver !== "s3") return;
  try {
    await s3Client().send(
      new CreateBucketCommand({ Bucket: config.storage.bucket }),
    );
  } catch {
    // already exists — fine
  }
}

export const storage = makeStorage();
