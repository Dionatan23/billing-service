import axios from "axios";
import { PaymentService } from "../payments/payments.service";
import { prisma } from "../../infra/database/client";

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

    // 🔐 idempotência REAL (assinatura segura)
    const idempotencyKey = `${userId}-${planId}`;

    // 💾 cria payment
    const payment = await this.paymentService.createPayment({
      userId,
      planId,
      amount: plan.price,
      type: plan.type,
      idempotencyKey,
    });

    // 💳 cria preferência Mercado Pago
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
          userId,
          planId,
        },

        statement_descriptor: "SERVILO",

        // 🔥 CONTROLE DE PAGAMENTO (PIX + CARTÃO)
        payment_methods: {
          installments: 12,

          excluded_payment_types: [
            { id: "ticket" }, // ❌ remove boleto
            { id: "atm" }, // ❌ remove lotérica
          ],

          excluded_payment_methods: [],
        },

        // 🔗 webhook
        notification_url: `${process.env.API_URL}/webhook/mercadopago`,

        // 🔁 retorno UX
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
      },
    );

    const externalId = response.data.id;
    const checkoutUrl = response.data.init_point;

    // 🔄 salva externalId
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
