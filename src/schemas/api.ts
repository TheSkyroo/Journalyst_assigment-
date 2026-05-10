import { z } from "zod";

import { TradeSchema } from "./trade.js";

export const ImportTradesResponseSchema = z.array(TradeSchema);

export const ApiErrorSchema = z.object({
  error: z.object({
    code: z.string().min(1),
    message: z.string().min(1),
    details: z.record(z.string(), z.unknown()).optional(),
  }),
});

export type ApiErrorResponse = z.infer<typeof ApiErrorSchema>;
