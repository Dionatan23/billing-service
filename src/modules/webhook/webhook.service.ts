import { prisma } from "../../infra/database/client";


export class WebhookService {
  async handleMercadoPago(data: any) {
    const externalId = data?.id;
    const status = data?.status;

    if (!externalId || !status) {
      throw new Error("INVALID_WEBHOOK");
    }

    // 🔎 busca pagamento
    const payment = await prisma.payment.findUnique({
      where: { externalId },
      include: {
        plan: true,
      },
    });

    if (!payment) {
      throw new Error("PAYMENT_NOT_FOUND");
    }

    // 🛑 idempotência (já processado)
    if (payment.status === "APPROVED") {
      return { alreadyProcessed: true };
    }

    // 🔄 processa dentro de transação
    return prisma.$transaction(async (tx: any) => {
      // 🔄 atualiza status
      await tx.payment.update({
        where: { id: payment.id },
        data: {
          status: this.mapStatus(status),
          metadata: data,
        },
      });

      // ✅ só processa se aprovado
      if (status === "approved") {
        // 🔎 busca ou cria billing
        const billing = await tx.userBilling.findUnique({
          where: { userId: payment.userId },
        });

        if (!billing) {
          await tx.userBilling.create({
            data: {
              userId: payment.userId,
              credits: payment.plan.credits,
              planId: payment.planId,
              status: "ACTIVE",
              expiresAt: this.calculateExpiration(payment.plan.duration),
            },
          });
        } else {
          await tx.userBilling.update({
            where: { userId: payment.userId },
            data: {
              credits: {
                increment: payment.plan.credits,
              },
              planId: payment.planId,
              status: "ACTIVE",
              expiresAt: this.calculateExpiration(payment.plan.duration),
            },
          });
        }
      }

      return { success: true };
    });
  }

  private mapStatus(status: string) {
    switch (status) {
      case "approved":
        return "APPROVED";
      case "rejected":
        return "REJECTED";
      case "cancelled":
        return "CANCELLED";
      default:
        return "PENDING";
    }
  }

  private calculateExpiration(days: number) {
    const date = new Date();
    date.setDate(date.getDate() + days);
    return date;
  }
}