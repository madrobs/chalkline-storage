import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

export async function createObjectStore() {
  const bucket = process.env.OBJECTS_BUCKET;

  if (bucket) {
    const { PutObjectCommand, S3Client } = await import("@aws-sdk/client-s3");
    const client = new S3Client({
      region: process.env.AWS_REGION ?? "us-east-1",
    });

    return {
      async put({ key, body, contentType }) {
        await client.send(
          new PutObjectCommand({
            Bucket: bucket,
            Key: key,
            Body: body,
            ContentType: contentType,
          }),
        );
      },
    };
  }

  const root = path.join(process.cwd(), "data");
  return {
    async put({ key, body }) {
      const destination = path.join(root, key);
      await mkdir(path.dirname(destination), { recursive: true });
      await writeFile(destination, body);
    },
  };
}
