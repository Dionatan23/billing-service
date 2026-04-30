import { prisma } from "../../infra/database/client";
import { PaymentService } from "../payments/payments.service";
import { billingLogger } from "../billing/billing.logger";
import { MercadoPagoService } from "../../adapters/payment-providers/mercado-pago/mercadopago.service";

export class WebhookService {
  private paymentService = new PaymentService();
  private mpService = new MercadoPagoService();

  async handleMercadoPago(body: any, log: any) {
    try {
      const paymentId = body?.data?.id;

      if (!paymentId) {
        throw new Error("INVALID_WEBHOOK");
      }

      // 🔒 valida direto no MP
      const mpPayment = await this.mpService.getPayment(paymentId);

      const externalId = mpPayment.id.toString();
      const status = mpPayment.status;

      // 🔎 busca no banco (COM PLAN)
      const payment = await prisma.payment.findUnique({
        where: { externalId },
        include: { plan: true },
      });

      if (!payment) {
        throw new Error("PAYMENT_NOT_FOUND");
      }

      // 🚨 VALIDAÇÕES CRÍTICAS
      if (!payment.userId) {
        throw new Error("USER_ID_MISSING");
      }

      if (!payment.plan) {
        throw new Error("PLAN_NOT_LOADED");
      }

      // 🔒 idempotência
      if (payment.status === "APPROVED") {
        log.info({
          event: "webhook_already_processed",
          externalId,
        });
        return;
      }

      if (status === "approved") {
        // ✅ atualiza pagamento
        await this.paymentService.updatePaymentByExternalId(externalId, {
          status: "APPROVED",
          metadata: mpPayment,
        });

        // ✅ ativa plano / adiciona créditos
        await prisma.userBilling.upsert({
          where: { userId: payment.userId },
          update: {
            credits: {
              increment: payment.plan.credits,
            },
            planId: payment.planId,
            status: "ACTIVE",
          },
          create: {
            userId: payment.userId,
            credits: payment.plan.credits,
            planId: payment.planId,
            status: "ACTIVE",
          },
        });

        billingLogger.paymentApproved(log, {
          userId: payment.userId,
          planId: payment.planId,
          amount: payment.amount,
          externalId,
        });
      } else {
        await this.paymentService.updatePaymentByExternalId(externalId, {
          status: "REJECTED",
          metadata: mpPayment,
        });

        billingLogger.paymentRejected(log, {
          externalId,
          status,
        });
      }
    } catch (error: any) {
      // 🔥 LOG CRÍTICO (isso vai te salvar muito tempo)
      log.error({
        event: "webhook_error",
        message: error.message,
        stack: error.stack,
        body,
      });

      throw error; // mantém comportamento atual
    }
  }
}
