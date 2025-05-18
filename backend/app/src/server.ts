import Fastify, { FastifyRequest, FastifyReply } from "fastify"
import cors from "@fastify/cors"
import fastifyJwt from "@fastify/jwt"

const server = Fastify({ logger: true })

// CORS for local dev & ALB
server.register(cors, { origin: true })

// JWT plugin – in prod we will validate Cognito public keys
// For now it accepts any token if `JWT_SECRET` is set
if (process.env.JWT_SECRET) {
  server.register(fastifyJwt as any, {
    secret: process.env.JWT_SECRET,
    sign: { algorithm: "HS256" },
  })

  server.decorate("authenticate", async function (request: any, reply: any) {
    try {
      await request.jwtVerify()
    } catch (err) {
      reply.send(err)
    }
  })
} else {
  server.decorate("authenticate", async function () {})
}

type Authenticated = typeof server & { authenticate: any }

server.get("/health", async (_request: FastifyRequest, _reply: FastifyReply) => {
  return { status: "ok", time: new Date().toISOString() }
})

server.get("/dashboard/overview", async (_request: FastifyRequest, _reply: FastifyReply) => {
  // TODO: pull from DynamoDB – for now mock
  return {
    revenue: 45231.89,
    listeners: 2350412,
    engagement: 3827,
  }
})

const start = async () => {
  try {
    const port = Number(process.env.PORT) || 3001
    await server.listen({ port, host: "0.0.0.0" })
    console.log(`🚀 Fastify server listening on ${port}`)
  } catch (err) {
    server.log.error(err)
    process.exit(1)
  }
}

void start() 