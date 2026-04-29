import { FastifyRequest, FastifyReply } from "fastify";
import { WebhookService } from "./webhook.service";
import { billingLogger } from "../billing/billing.logger";

const service = new WebhookService();

export class WebhookController {
  async handleMercadoPago(request: FastifyRequest, reply: FastifyReply) {
    const body = request.body as any;

    try {
      const result = await service.handleMercadoPago(body);

      // 🔁 já processado
      if ((result as any)?.alreadyProcessed) {
        request.log.info({
          event: "webhook_duplicate",
          externalId: body?.id,
        });

        return reply.send({ ok: true });
      }

      // ✅ aprovado
      if (body?.status === "approved") {
        billingLogger.paymentApproved(request.log, {
          externalId: body?.id,
          userId: body?.metadata?.userId,
        });
      } else {
        billingLogger.paymentRejected(request.log, {
          externalId: body?.id,
          status: body?.status,
        });
      }

      return reply.send({ ok: true });

    } catch (error: any) {
      // ⚠️ erro de negócio
      if (error.message === "PAYMENT_NOT_FOUND") {
        request.log.warn({
          event: "webhook_payment_not_found",
          body,
        });

        return reply.send({ ok: true });
      }

      request.log.error({
        event: "webhook_error",
        error,
        body,
      });

      return reply.status(500).send({ ok: false });
    }
  }
}