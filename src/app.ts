import Fastify from "fastify";
import cors from "@fastify/cors";
import rateLimit from "@fastify/rate-limit";
import routes from "./routes";

export async function buildApp() {
  // const app = Fastify({
  //   logger: true,
  // });

  const app = Fastify({
    logger: {
      level: "info",
      redact: [
        "req.headers.authorization",
        "req.headers.cookie",
        "req.body.password",
        "req.body.token",
        "DATABASE_URL",
      ],
    },
  });

  app.setErrorHandler((error, request, reply) => {
    request.log.error({
      err: error,
      url: request.url,
      method: request.method,
      body: request.body,
    });

    reply.status(500).send({
      message: "Internal Server Error",
    });
  });

  await app.register(cors);

  await app.register(rateLimit, {
    max: 100,
    timeWindow: "1 minute",
  });

  app.register(routes);

  return app;
}
