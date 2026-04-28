import { FastifyRequest, FastifyReply } from "fastify";
import { BillingService } from "./billing.service";
import { billingLogger } from "./billing.logger";

const service = new BillingService();

export const billingController = {
  async getUserBilling(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as any;

    const data = await service.getUserBilling(id);

    return reply.send(data);
  },

  async consumeCredit(request: FastifyRequest, reply: FastifyReply) {
    const { userId } = request.body as any;

    try {
      const result = await service.consumeCredit(userId);

      billingLogger.creditConsumed(request.log, {
        userId,
        remainingCredits: result.credits,
      });

      return reply.send(result);
    } catch (error: any) {
      // 🔹 REGRA DE NEGÓCIO
      if (error.message === "NO_CREDITS") {
        request.log.info({
          event: "business_error",
          type: "NO_CREDITS",
          userId,
        });

        return reply.status(400).send({
          message: "Sem créditos",
        });
      }

      // 🔴 ERRO REAL
      request.log.error({
        event: "internal_error",
        userId,
        error,
      });

      return reply.status(500).send({
        message: "Erro interno",
      });
    }
  },

  async webhookMercadoPago(request: FastifyRequest, reply: FastifyReply) {
    const body = request.body as any;

    const status = body?.data?.status;
    const userId = body?.data?.user_id;
    const planId = body?.data?.plan_id;

    try {
      if (status === "approved") {
        await service.activatePlan(userId, planId);

        billingLogger.paymentApproved(request.log, {
          userId,
          planId,
        });
      } else {
        billingLogger.paymentRejected(request.log, {
          userId,
          status,
        });
      }

      return reply.send({ ok: true });
    } catch (error) {
      request.log.error({
        event: "webhook_error",
        error,
        body,
      });

      return reply.status(500).send({ ok: false });
    }
  },
};
