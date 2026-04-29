import { FastifyInstance } from "fastify";
import { checkoutController } from "./checkout.controller";

export async function checkoutRoutes(app: FastifyInstance) {
  app.post("/", checkoutController.createCheckout);
}