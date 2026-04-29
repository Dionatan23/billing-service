
import { randomUUID } from "crypto";
import axios from "axios";
import { prisma } from "../../infra/database/client";

export class CheckoutService {
  async createCheckout(userId: string, planId: string) {
    // 🔎 valida plano
    const plan = await prisma.plan.findUnique({
      where: { id: planId },
    });

    if (!plan || !plan.isActive) {
      throw new Error("PLAN_NOT_FOUND");
    }

    // 🔐 idempotência
    const idempotencyKey = randomUUID();

    // 💾 cria pagamento PENDING
    const payment = await prisma.payment.create({
      data: {
        userId,
        planId,
        amount: plan.price,
        currency: "BRL",
        status: "PENDING",
        provider: "mercadopago",
        type: plan.type,
        idempotencyKey,
      },
    });

    // 💳 integração Mercado Pago
    const mpResponse = await axios.post(
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
          userId,
          planId,
        },
        notification_url: `${process.env.API_URL}/webhook/mercadopago`,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}`,
          "Content-Type": "application/json",
        },
      }
    );

    const checkoutUrl = mpResponse.data.init_point;
    const externalId = mpResponse.data.id;

    // 🔄 atualiza payment com ID externo
    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        externalId,
      },
    });

    return {
      checkoutUrl,
      paymentId: payment.id,
    };
  }
}