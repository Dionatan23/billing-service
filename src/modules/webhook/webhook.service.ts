import { prisma } from "../../infra/database/client";
import { PaymentService } from "../payments/payments.service";
import { billingLogger } from "../billing/billing.logger";
import { MercadoPagoService } from "../../adapters/payment-providers/mercado-pago/mercadopago.service";

export class WebhookService {
  private paymentService = new PaymentService();
  private mpService = new MercadoPagoService();

  async handleMercadoPago(body: any, log: any) {
    const paymentId = body?.data?.id;

    if (!paymentId) {
      throw new Error("INVALID_WEBHOOK");
    }

    // 🔒 valida no Mercado Pago (CRÍTICO)
    const mpPayment = await this.mpService.getPayment(paymentId);

    const externalId = mpPayment.id.toString();
    const status = mpPayment.status;

    // 🔎 busca no banco
    const payment = await prisma.payment.findUnique({
      where: { externalId },
      include: { plan: true },
    });

    if (!payment) {
      throw new Error("PAYMENT_NOT_FOUND");
    }

    // 🔒 idempotência real
    if (payment.status === "APPROVED") {
      return;
    }

    if (status === "approved") {
      await this.paymentService.updatePaymentByExternalId(externalId, {
        status: "APPROVED",
        metadata: mpPayment, // 🔥 salva resposta completa
      });

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
  }
}