import axios from "axios";
import { PaymentService } from "../payments/payments.service";
import { prisma } from "../../infra/database/client";
import { randomUUID } from "crypto";

export class CheckoutService {
  private paymentService = new PaymentService();

  async createCheckout(userId: string, planId: string) {
    // 🔎 valida plano
    const plan = await prisma.plan.findUnique({
      where: { id: planId },
    });

    if (!plan || !plan.isActive) {
      throw new Error("PLAN_NOT_FOUND");
    }

    // 🔐 idempotência REAL
    const idempotencyKey = `${userId}-${planId}`;

    // 💾 cria payment
    const payment = await this.paymentService.createPayment({
      userId,
      planId,
      amount: plan.price,
      type: plan.type,
      idempotencyKey,
    });

    // 💳 cria preferência no MP
    const response = await axios.post(
      "https://api.mercadopago.com/checkout/preferences",
      {
        items: [
          {
            title: plan.name,
            quantity: 1,
            currency_id: "BRL",
            unit_price: plan.price,
          },
        ],
        metadata: {
          paymentId: payment.id,
        },
        notification_url: `${process.env.API_URL}/billing/webhook/mercadopago`,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}`,
        },
      },
    );

    const externalId = response.data.id;
    const checkoutUrl = response.data.init_point;

    // 🔄 salva externalId
    await prisma.payment.update({
      where: { id: payment.id },
      data: { externalId },
    });

    return {
      checkoutUrl,
      paymentId: payment.id,
    };
  }
}
