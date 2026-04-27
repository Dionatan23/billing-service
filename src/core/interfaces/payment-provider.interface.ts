export interface PaymentProvider {
  createPayment(data: any): Promise<any>
  createSubscription(data: any): Promise<any>
  cancelSubscription(id: string): Promise<void>
  handleWebhook(payload: any): Promise<any>
}