import { FastifyInstance } from "fastify";
import { CheckoutController } from "./checkout.controller";

const controller = new CheckoutController();

export async function checkoutRoutes(app: FastifyInstance) {
  app.post("/checkout", controller.create);
}