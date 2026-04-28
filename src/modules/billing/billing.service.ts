import { prisma } from "../../infra/database/client";

export class BillingService {
  async getUserBilling(userId: string) {
    return prisma.userBilling.findUnique({
      where: { userId },
      include: { plan: true },
    });
  }

  async addCredits(userId: string, credits: number) {
    return prisma.userBilling.update({
      where: { userId },
      data: {
        credits: {
          increment: credits,
        },
      },
    });
  }

  async consumeCredit(userId: string) {
    const user = await prisma.userBilling.findUnique({
      where: { userId },
    });

    if (!user || user.credits <= 0) {
      throw new Error("NO_CREDITS"); // 🔥 PADRÃO
    }

    return prisma.userBilling.update({
      where: { userId },
      data: {
        credits: {
          decrement: 1,
        },
      },
    });
  }

  async activatePlan(userId: string, planId: string) {
    const plan = await prisma.plan.findUnique({
      where: { id: planId },
    });

    if (!plan) throw new Error("Plano não encontrado");

    return prisma.userBilling.upsert({
      where: { userId },
      update: {
        planId: plan.id,
        credits: {
          increment: plan.credits,
        },
        status: "ACTIVE",
      },
      create: {
        userId,
        planId: plan.id,
        credits: plan.credits,
        status: "ACTIVE",
      },
    });
  }
}
