import { MercadoPagoProvider } from './mercado-pago/mercado-pago.provider'

export function getPaymentProvider() {
  return new MercadoPagoProvider()
}