import { PaymentProvider } from "../../../core/interfaces/payment-provider.interface"


export class MercadoPagoProvider implements PaymentProvider {
  async createPayment(data: any) {
    console.log('Criando pagamento Mercado Pago', data)

    return {
      checkoutUrl: 'https://mock.mercadopago.com/checkout'
    }
  }

  async createSubscription(data: any) {
    return { id: 'mock-subscription' }
  }

  async cancelSubscription(id: string) {
    console.log('Cancelando assinatura', id)
  }

  async handleWebhook(payload: any) {
    console.log('Webhook recebido', payload)
    return payload
  }
}