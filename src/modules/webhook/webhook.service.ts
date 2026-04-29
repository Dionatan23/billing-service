import { PaymentService } from "../payments/payments.service";
import { prisma } from "../../infra/database/client";
import { billingLogger } from "../billing/billing.logger";

export class WebhookService {
  private paymentService = new PaymentService();

  async handleMercadoPago(body: any, log: any) {
    const externalId = body?.data?.id;
    const status = body?.data?.status;

    if (!externalId) {
      throw new Error("INVALID_WEBHOOK");
    }

    // 🔎 busca payment
    const payment = await prisma.payment.findUnique({
      where: { externalId },
      include: { plan: true },
    });

    if (!payment) {
      throw new Error("PAYMENT_NOT_FOUND");
    }

    // 🔒 evita duplicidade
    if (payment.status === "APPROVED") {
      return;
    }

    if (status === "approved") {
      // 🔄 atualiza payment
      await this.paymentService.updatePaymentByExternalId(externalId, {
        status: "APPROVED",
        metadata: body,
      });

      // 💰 adiciona créditos
      await prisma.userBilling.upsert({
        where: { userId: payment.userId },
        update: {
          credits: {
            increment: payment.plan.credits,
          },
          planId: payment.planId,
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
        credits: payment.plan.credits,
      });
    } else {
      await this.paymentService.updatePaymentByExternalId(externalId, {
        status: "REJECTED",
        metadata: body,
      });

      billingLogger.paymentRejected(log, {
        externalId,
        status,
      });
    }
  }
}
