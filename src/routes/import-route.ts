import type { MultipartFile } from "@fastify/multipart";
import type { FastifyPluginCallback } from "fastify";

import { MissingFileUploadError } from "../domain/errors.js";
import type { ImportService } from "../services/import-service.js";

interface ImportRouteOptions {
  importService: ImportService;
}

interface ImportMultipartBody {
  file?: MultipartFile;
}

const getUploadedFile = (request: { body?: unknown }): MultipartFile | undefined => {
  const body = request.body as ImportMultipartBody | undefined;
  const file = body?.file;

  return file?.type === "file" ? file : undefined;
};

export const importRoutes: FastifyPluginCallback<ImportRouteOptions> = (app, options, done) => {
  app.post(
    "/import",
    {
      preValidation: (request, _reply, done) => {
        if (!getUploadedFile(request)) {
          done(new MissingFileUploadError());
          return;
        }

        done();
      },
      schema: {
        tags: ["import"],
        summary: "Import a broker CSV file",
        consumes: ["multipart/form-data"],
        body: {
          type: "object",
          properties: {
            file: { isFile: true },
          },
          required: ["file"],
        },
        response: {
          200: {
            type: "array",
            items: {
              type: "object",
              properties: {
                symbol: { type: "string" },
                side: { type: "string", enum: ["BUY", "SELL"] },
                quantity: { type: "number" },
                price: { type: "number" },
                totalAmount: { type: "number" },
                currency: { type: "string" },
                executedAt: { type: "string", format: "date-time" },
                broker: { type: "string" },
                rawData: {
                  type: "object",
                  additionalProperties: true,
                },
              },
              required: [
                "symbol",
                "side",
                "quantity",
                "price",
                "totalAmount",
                "currency",
                "executedAt",
                "broker",
                "rawData",
              ],
            },
          },
          400: {
            type: "object",
            properties: {
              error: {
                type: "object",
                properties: {
                  code: { type: "string" },
                  message: { type: "string" },
                  details: {
                    type: "object",
                    additionalProperties: true,
                  },
                },
                required: ["code", "message"],
              },
            },
            required: ["error"],
          },
        },
      },
    },
    async (request, reply) => {
      const file = getUploadedFile(request);

      if (!file) {
        throw new MissingFileUploadError();
      }

      const csv = (await file.toBuffer()).toString("utf8");
      const trades = await options.importService.importTrades(csv);

      return reply.status(200).send(trades);
    },
  );

  done();
};
