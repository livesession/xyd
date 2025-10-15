import path from "node:path";
import fs from "node:fs/promises";

import { redirect } from "react-router";
import { MIME_TYPES } from "./constants";

const BINARY_FILE_EXTENSIONS = [
  ".png",
  ".jpg",
  ".jpeg",
  ".gif",
  ".ico",
  ".webp",
];

export async function loader({ params }: any) {
  const filePath = path.join(
    process.cwd(),
    "public",
    params["*"]
  );

  try {
    await fs.access(filePath);
  } catch (e) {
    return redirect("/404");
  }

  const ext = path.extname(filePath).toLowerCase();
  const isBinaryFile = BINARY_FILE_EXTENSIONS.includes(ext);
  const fileContent = await fs.readFile(
    filePath,
    isBinaryFile ? null : "utf-8"
  );
  const contentType = MIME_TYPES[ext] || "application/octet-stream";

  return new Response(fileContent, {
    status: 200,
    headers: {
      "Content-Type": contentType,
    },
  });
}
