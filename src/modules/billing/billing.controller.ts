import { FastifyRequest, FastifyReply } from "fastify";
import { prisma } from "../../infra/database/client";
import { billingLogger } from "./billing.logger";
import { WebhookService } from "../webhook/webhook.service";

const webhookService = new WebhookService();

export const billingController = {
  // 📊 CONSULTA BILLING
  async getUserBilling(
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
  ) {
    const { id } = request.params;

    try {
      const billing = await prisma.userBilling.findUnique({
        where: { userId: id },
        include: { plan: true },
      });

      return reply.send(billing);
    } catch (error) {
      request.log.error({
        event: "billing_fetch_error",
        error,
        userId: id,
      });

      return reply.status(500).send({
        message: "Internal Server Error",
      });
    }
  },

  // ⚡ CONSUMO DE CRÉDITO
  async consumeCredit(
    request: FastifyRequest<{
      Body: { userId: string; amount: number };
    }>,
    reply: FastifyReply
  ) {
    const { userId, amount } = request.body;

    try {
      const billing = await prisma.userBilling.findUnique({
        where: { userId },
      });

      if (!billing || billing.credits < amount) {
        return reply.status(400).send({
          message: "INSUFFICIENT_CREDITS",
        });
      }

      const updated = await prisma.userBilling.update({
        where: { userId },
        data: {
          credits: {
            decrement: amount,
          },
        },
      });

      billingLogger.creditConsumed(request.log, {
        userId,
        amount,
        remaining: updated.credits,
      });

      return reply.send(updated);
    } catch (error) {
      request.log.error({
        event: "credit_consume_error",
        error,
        userId,
      });

      return reply.status(500).send({
        message: "Internal Server Error",
      });
    }
  },

  // 🔔 WEBHOOK
  async webhookMercadoPago(
    request: FastifyRequest,
    reply: FastifyReply
  ) {
    try {
      await webhookService.handleMercadoPago(
        request.body,
        request.log
      );

      return reply.send({ ok: true });
    } catch (error) {
      request.log.error({
        event: "webhook_error",
        error,
        body: request.body,
      });

      return reply.status(500).send({ ok: false });
    }
  },
};