import { FastifyInstance } from "fastify";
import { billingController } from "./billing.controller";

export async function billingRoutes(app: FastifyInstance) {
  app.get("/user/:id/billing", billingController.getUserBilling);

  app.post("/consume-credit", billingController.consumeCredit);

  app.post("/webhook/mercadopago", billingController.webhookMercadoPago);
}