import { prisma } from "../../infra/database/client";
import { CreatePaymentDTO } from "./payment.types";

export class PaymentRepository {
  async create(data: CreatePaymentDTO) {
    return prisma.payment.create({
      data,
    });
  }

  async findById(id: string) {
    return prisma.payment.findUnique({
      where: { id },
      include: { plan: true },
    });
  }

  async findByExternalId(externalId: string) {
    return prisma.payment.findUnique({
      where: { externalId },
    });
  }

  async findByIdempotencyKey(key: string) {
    return prisma.payment.findUnique({
      where: { idempotencyKey: key },
    });
  }

  async findManyByUserId(userId: string) {
    return prisma.payment.findMany({
      where: { userId },
      include: { plan: true },
      orderBy: { createdAt: "desc" },
    });
  }

  async updateById(id: string, data: any) {
    return prisma.payment.update({
      where: { id },
      data,
    });
  }
}