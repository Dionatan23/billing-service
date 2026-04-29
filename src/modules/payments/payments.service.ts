import { PaymentRepository } from "./payment.repository";

export class PaymentService {
  private repo = new PaymentRepository();

  // 🔐 cria pagamento com idempotência REAL
  async createPayment(input: {
    userId: string;
    planId: string;
    amount: number;
    type: "PREPAID" | "SUBSCRIPTION";
    idempotencyKey: string;
  }) {
    // 🔒 evita duplicidade
    const existing = await this.repo.findByIdempotencyKey(
      input.idempotencyKey
    );

    if (existing) {
      return existing;
    }

    return this.repo.create({
      userId: input.userId,
      planId: input.planId,
      amount: input.amount,
      currency: "BRL",
      type: input.type,
      provider: "mercadopago",
      status: "PENDING",
      idempotencyKey: input.idempotencyKey,

      // placeholder até MP responder
      externalId: "pending",
    });
  }

  // 🔄 atualiza após retorno do provider
  async updatePaymentByExternalId(externalId: string, data: {
    status?: "APPROVED" | "REJECTED" | "PENDING";
    providerResponse?: any;
  }) {
    const payment = await this.repo.findByExternalId(externalId);

    if (!payment) {
      throw new Error("PAYMENT_NOT_FOUND");
    }

    // 🔒 idempotência webhook
    if (payment.status === "APPROVED") {
      return payment;
    }

    return this.repo.updateById(payment.id, data);
  }

  async getUserPayments(userId: string) {
    return this.repo.findManyByUserId(userId);
  }

  async getPaymentById(id: string) {
    return this.repo.findById(id);
  }
}   