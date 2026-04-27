import Fastify from 'fastify'
import cors from '@fastify/cors'
import rateLimit from '@fastify/rate-limit'
import routes from './routes'

export async function buildApp() {
  const app = Fastify({
    logger: true
  })

  await app.register(cors)

  await app.register(rateLimit, {
    max: 100,
    timeWindow: '1 minute'
  })

  app.register(routes)

  return app
}