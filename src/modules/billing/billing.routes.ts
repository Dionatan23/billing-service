import { FastifyInstance } from 'fastify'
import { createCheckout } from './billing.controller'

export default async function billingRoutes(app: FastifyInstance) {
  app.post('/checkout', createCheckout)
}