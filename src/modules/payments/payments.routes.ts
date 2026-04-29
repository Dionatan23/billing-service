import { FastifyInstance } from "fastify";
import { paymentsController } from "./payments.controller";

export async function paymentsRoutes(app: FastifyInstance) {
  app.get("/user/:userId", paymentsController.getUserPayments);
  app.get("/:id", paymentsController.getPaymentById);
}