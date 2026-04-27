import { getPaymentProvider } from "../../adapters/payment-providers"


export class BillingService {
  private provider = getPaymentProvider()

  async createCheckout(userId: string, planId: string) {
    return this.provider.createPayment({
      userId,
      planId
    })
  }
}