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
};
