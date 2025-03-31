import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import fs, { createWriteStream } from "fs";
import path from "path";
import { promisify } from "util";
import { pipeline } from "stream";

const BUCKET_NAME = "as-findata-tech-challenge";
const REGION = "us-west-2";
const FILE_KEYS = ["company-data/CT4OAR0154.zip"];

const pipelineAsync = promisify(pipeline);

const s3 = new S3Client({ region: REGION });

async function downloadFile(fileKey: string, outputPath: string) {
  try {
    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: fileKey,
    });

    const { Body } = await s3.send(command);

    if (!(Body instanceof ReadableStream)) {
      throw new Error("S3 Body is not a readable stream.");
    }

    const nodeStream = Body as unknown as NodeJS.ReadableStream;

    const fileStream = createWriteStream(outputPath);
    await pipelineAsync(nodeStream, fileStream);

    console.log(`${outputPath}`);
  } catch (error) {
    console.error(error);
  }
}

async function downloadAllFiles(destFolder: string) {
  if (!fs.existsSync(destFolder)) fs.mkdirSync(destFolder);
  await Promise.all(FILE_KEYS.map((key) => downloadFile(key, destFolder)));
}

(async () => {
  await downloadAllFiles(path.resolve(__dirname, "./data/downloads"));
})();
