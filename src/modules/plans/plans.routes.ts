import { FastifyInstance } from 'fastify'
import { getPlans } from './plans.controller'

export default async function plansRoutes(app: FastifyInstance) {
  app.get('/', getPlans)
}