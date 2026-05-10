import { afterEach, describe, expect, it } from "vitest";

import { buildApp } from "../../src/app.js";
import type { AppEnv } from "../../src/config/env.js";
import { ApiErrorSchema, ImportTradesResponseSchema } from "../../src/schemas/api.js";
import { buildMultipartBody, readFixture } from "../test-helpers.js";

describe("POST /import", () => {
  const env: AppEnv = {
    NODE_ENV: "test",
    HOST: "127.0.0.1",
    PORT: 3000,
    LOG_LEVEL: "silent",
    MAX_FILE_SIZE_MB: 5,
  };

  const apps = new Set<Awaited<ReturnType<typeof buildApp>>>();

  afterEach(async () => {
    for (const app of apps) {
      await app.close();
      apps.delete(app);
    }
  });

  it("imports a multipart CSV upload and returns a normalized response", async () => {
    const app = await buildApp({ env });
    apps.add(app);

    const multipart = buildMultipartBody("zerodha.csv", readFixture("zerodha-mixed.csv"));

    const response = await app.inject({
      method: "POST",
      url: "/import",
      headers: {
        "content-type": multipart.contentType,
      },
      payload: multipart.body,
    });

    expect(response.statusCode).toBe(200);
    expect(response.headers["x-response-time-ms"]).toMatch(/^\d+\.\d{2}$/);

    const trades = ImportTradesResponseSchema.parse(response.json());
    expect(trades).toHaveLength(5);
  });

  it("returns a clear error when no file is provided", async () => {
    const app = await buildApp({ env });
    apps.add(app);

    const response = await app.inject({
      method: "POST",
      url: "/import",
      headers: {
        "content-type": "multipart/form-data; boundary=missing",
      },
      payload: "--missing--\r\n",
    });

    expect(response.statusCode).toBe(400);
    expect(ApiErrorSchema.parse(response.json())).toEqual({
      error: {
        code: "MISSING_FILE",
        message: "Request must include a CSV file upload in the `file` form field.",
      },
    });
  });

  it("documents the import endpoint as a multipart file upload", async () => {
    const app = await buildApp({ env });
    apps.add(app);
    await app.ready();

    const spec = app.swagger() as {
      paths?: Record<string, { post?: { requestBody?: unknown } }>;
    };
    const post = spec.paths?.["/import"]?.post;

    expect(post?.requestBody).toMatchObject({
      required: true,
      content: {
        "multipart/form-data": {
          schema: {
            type: "object",
            required: ["file"],
            properties: {
              file: {
                type: "string",
                format: "binary",
              },
            },
          },
        },
      },
    });
  });

  it("returns HTTP 400 for unknown broker formats", async () => {
    const app = await buildApp({ env });
    apps.add(app);

    const multipart = buildMultipartBody("unknown.csv", readFixture("unknown-broker.csv"));

    const response = await app.inject({
      method: "POST",
      url: "/import",
      headers: {
        "content-type": multipart.contentType,
      },
      payload: multipart.body,
    });

    expect(response.statusCode).toBe(400);
    expect(ApiErrorSchema.parse(response.json())).toEqual({
      error: {
        code: "UNKNOWN_BROKER",
        message: "Unable to detect broker from CSV headers.",
        details: {
          headers: ["ticker", "action", "shares", "amount", "date"],
        },
      },
    });
  });
});
