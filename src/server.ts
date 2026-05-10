import { buildApp } from "./app.js";
import { loadEnv } from "./config/env.js";

const startServer = async (): Promise<void> => {
  const env = loadEnv();
  const app = await buildApp({ env });

  try {
    await app.listen({
      host: env.HOST,
      port: env.PORT,
    });
  } catch (error) {
    app.log.error({ error }, "Failed to start server");
    process.exitCode = 1;
  }
};

void startServer();
