import { z } from "zod";

const EnvSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  HOST: z.string().min(1).default("0.0.0.0"),
  PORT: z.coerce.number().int().positive().default(3000),
  LOG_LEVEL: z.enum(["fatal", "error", "warn", "info", "debug", "trace", "silent"]).default("info"),
  MAX_FILE_SIZE_MB: z.coerce.number().positive().default(5),
});

export type AppEnv = z.infer<typeof EnvSchema>;

export const loadEnv = (source: NodeJS.ProcessEnv = process.env): AppEnv => EnvSchema.parse(source);
