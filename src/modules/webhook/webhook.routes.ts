import { FastifyInstance } from "fastify";
import { WebhookController } from "./webhook.controller";

const controller = new WebhookController();

export async function webhookRoutes(app: FastifyInstance) {
  app.post("/webhook/mercadopago", controller.handleMercadoPago);
}