import axios from "axios";
import { PaymentService } from "../payments/payments.service";
import { prisma } from "../../infra/database/client";
import { randomUUID } from "crypto";

export class CheckoutService {
  private paymentService = new PaymentService();

  async createCheckout(userId: string, planId: string) {
    // 🔒 valida entrada
    if (!userId) throw new Error("USER_ID_REQUIRED");
    if (!planId) throw new Error("PLAN_ID_REQUIRED");

    // 🔎 valida plano
    const plan = await prisma.plan.findUnique({
      where: { id: planId },
    });

    if (!plan || !plan.isActive) {
      throw new Error("PLAN_NOT_FOUND");
    }

    // 🔐 idempotência REAL (única por transação)
    const idempotencyKey = `${userId}-${planId}-${Date.now()}-${randomUUID()}`;

    // 💾 cria payment
    const payment = await this.paymentService.createPayment({
      userId,
      planId,
      amount: plan.price,
      type: plan.type,
      idempotencyKey,
    });

    // 🔒 valida envs críticas
    if (!process.env.MP_ACCESS_TOKEN) {
      throw new Error("MP_ACCESS_TOKEN_NOT_SET");
    }

    if (!process.env.API_URL) {
      throw new Error("API_URL_NOT_SET");
    }

    if (!process.env.FRONT_URL) {
      throw new Error("FRONT_URL_NOT_SET");
    }

    // 💳 cria preferência Mercado Pago
    let response;

    try {
      response = await axios.post(
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

          statement_descriptor: "SERVILO",

          payment_methods: {
            installments: 12,
            excluded_payment_types: [
              { id: "ticket" },
              { id: "atm" },
            ],
          },

          notification_url: `${process.env.API_URL}/webhook/mercadopago`,

          back_urls: {
            success: `${process.env.FRONT_URL}/payment/success`,
            failure: `${process.env.FRONT_URL}/payment/failure`,
            pending: `${process.env.FRONT_URL}/payment/pending`,
          },

          auto_return: "approved",
        },
        {
          headers: {
            Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}`,
            "Content-Type": "application/json",
          },
        }
      );
    } catch (error: any) {
      console.error("Erro ao criar preferência MP:", error.response?.data || error.message);

      // ❗ opcional: marcar payment como cancelado
      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: "CANCELLED",
        },
      });

      throw new Error("CHECKOUT_CREATION_FAILED");
    }

    const externalId = response?.data?.id;
    const checkoutUrl = response?.data?.init_point;

    // 🔒 valida resposta
    if (!externalId || !checkoutUrl) {
      throw new Error("INVALID_MP_RESPONSE");
    }

    // 🔄 salva externalId
    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        externalId: externalId.toString(),
      },
    });

    return {
      checkoutUrl,
      paymentId: payment.id,
    };
  }
}