import Fastify from "fastify";
import multipart, { ajvFilePlugin } from "@fastify/multipart";
import swagger from "@fastify/swagger";
import swaggerUi from "@fastify/swagger-ui";

import type { AppEnv } from "./config/env.js";
import { loadEnv } from "./config/env.js";
import { isAppError } from "./domain/errors.js";
import { importRoutes } from "./routes/import-route.js";
import { ImportService } from "./services/import-service.js";
import { toApiErrorResponse } from "./utils/error-formatting.js";

interface BuildAppOptions {
  env?: AppEnv;
  importService?: ImportService;
}

const requestTimings = new WeakMap<object, bigint>();
const isClientRequestError = (
  error: unknown,
): error is Error & { statusCode: number; code?: string; validation?: unknown } =>
  typeof error === "object" &&
  error !== null &&
  "statusCode" in error &&
  typeof error.statusCode === "number" &&
  error.statusCode >= 400 &&
  error.statusCode < 500;

export const buildApp = async (options: BuildAppOptions = {}) => {
  const env = options.env ?? loadEnv();
  const importService = options.importService ?? new ImportService();

  const app = Fastify({
    ajv: {
      plugins: [
        (ajv) => {
          ajvFilePlugin(ajv);
          return ajv;
        },
      ],
    },
    logger: env.NODE_ENV === "test" ? false : { level: env.LOG_LEVEL },
  });

  app.addHook("onRequest", (request, _reply, done) => {
    requestTimings.set(request, process.hrtime.bigint());
    done();
  });

  app.addHook("onSend", (request, reply, payload, done) => {
    const startedAt = requestTimings.get(request);

    if (startedAt) {
      const elapsedMilliseconds = Number(process.hrtime.bigint() - startedAt) / 1_000_000;
      reply.header("x-response-time-ms", elapsedMilliseconds.toFixed(2));
    }

    done(null, payload);
  });

  app.addHook("onResponse", (request, reply, done) => {
    const startedAt = requestTimings.get(request);

    if (!startedAt) {
      done();
      return;
    }

    const elapsedMilliseconds = Number(process.hrtime.bigint() - startedAt) / 1_000_000;
    request.log.info(
      {
        method: request.method,
        url: request.url,
        statusCode: reply.statusCode,
        responseTimeMs: Number.parseFloat(elapsedMilliseconds.toFixed(2)),
      },
      "request completed",
    );
    done();
  });

  app.register(multipart, {
    attachFieldsToBody: true,
    limits: {
      files: 1,
      fileSize: env.MAX_FILE_SIZE_MB * 1024 * 1024,
    },
  });

  app.register(swagger, {
    openapi: {
      info: {
        title: "Broker CSV Trade Import Service",
        version: "1.0.0",
        description: "CSV import API for normalizing trades from heterogeneous broker exports.",
      },
    },
  });

  app.register(swaggerUi, {
    routePrefix: "/docs",
  });

  app.get("/health", () => ({
    status: "ok",
  }));

  app.setErrorHandler((error, request, reply) => {
    if (isAppError(error)) {
      return reply.status(error.statusCode).send(toApiErrorResponse(error));
    }

    if (isClientRequestError(error)) {
      return reply.status(error.statusCode).send({
        error: {
          code: error.code ?? "BAD_REQUEST",
          message: error.message,
          ...(error.validation ? { details: { validation: error.validation } } : {}),
        },
      });
    }

    request.log.error({ error }, "Unhandled application error");
    return reply.status(500).send(toApiErrorResponse(error));
  });

  await app.register(importRoutes, { importService });

  return app;
};
