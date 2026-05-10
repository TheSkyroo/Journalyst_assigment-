import { readFileSync } from "node:fs";
import { resolve } from "node:path";

export const readFixture = (fixtureName: string): string =>
  readFileSync(resolve(process.cwd(), "tests", "fixtures", fixtureName), "utf8");

export const buildMultipartBody = (
  filename: string,
  content: string,
  fieldName = "file",
): {
  body: Buffer;
  contentType: string;
} => {
  const boundary = `----trade-import-${Date.now()}`;
  const body = Buffer.from(
    [
      `--${boundary}`,
      `Content-Disposition: form-data; name="${fieldName}"; filename="${filename}"`,
      "Content-Type: text/csv",
      "",
      content,
      `--${boundary}--`,
      "",
    ].join("\r\n"),
    "utf8",
  );

  return {
    body,
    contentType: `multipart/form-data; boundary=${boundary}`,
  };
};
