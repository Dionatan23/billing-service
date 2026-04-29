import { FastifyRequest, FastifyReply } from "fastify";
import { CheckoutService } from "./checkout.service";
import { billingLogger } from "../billing/billing.logger";

const service = new CheckoutService();

export class CheckoutController {
  async create(request: FastifyRequest, reply: FastifyReply) {
    const { userId, planId } = request.body as any;

    try {
      const result = await service.createCheckout(userId, planId);

      billingLogger.paymentCreated(request.log, {
        userId,
        planId,
        paymentId: result.paymentId,
      });

      return reply.send(result);
    } catch (error: any) {
      if (error.message === "PLAN_NOT_FOUND") {
        return reply.status(400).send({
          message: "Plano inválido",
        });
      }

      request.log.error({
        event: "checkout_error",
        error,
        body: request.body,
      });

      return reply.status(500).send({
        message: "Erro ao criar checkout",
      });
    }
  }
}