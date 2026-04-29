import axios from "axios";

export class MercadoPagoService {
  async getPayment(paymentId: string) {
    const response = await axios.get(
      `https://api.mercadopago.com/v1/payments/${paymentId}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}`,
        },
      }
    );

    return response.data;
  }
}