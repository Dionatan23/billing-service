import { FastifyReply, FastifyRequest } from 'fastify'
import { BillingService } from './billing.service'

const service = new BillingService()

export async function createCheckout(
  req: FastifyRequest,
  reply: FastifyReply
) {
  const { userId, planId } = req.body as any

  const checkout = await service.createCheckout(userId, planId)

  return reply.send(checkout)
}