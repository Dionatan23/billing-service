import { FastifyInstance } from 'fastify'
import plansRoutes from '../modules/plans/plans.routes'
import billingRoutes from '../modules/billing/billing.routes'

export default async function routes(app: FastifyInstance) {
  app.register(plansRoutes, { prefix: '/plans' })
  app.register(billingRoutes, { prefix: '/billing' })
}