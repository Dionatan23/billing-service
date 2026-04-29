import { FastifyInstance } from "fastify";
import plansRoutes from "../modules/plans/plans.routes";
import { billingRoutes } from "../modules/billing/billing.routes";
import { checkoutRoutes } from "../modules/checkout/checkout.routes";
import { webhookRoutes } from "../modules/webhook/webhook.routes";
import { paymentsRoutes } from "../modules/payments/payments.routes";

export default async function routes(app: FastifyInstance) {
  app.register(plansRoutes, { prefix: "/plans" });
  app.register(billingRoutes, { prefix: "/billing" });
  app.register(checkoutRoutes, { prefix: "/checkout" });
  app.register(paymentsRoutes, { prefix: "/payments" });
}
