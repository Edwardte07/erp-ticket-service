import Fastify from 'fastify';
import fastifyJwt from '@fastify/jwt';
import fastifyCors from '@fastify/cors';
import { TicketsService } from './tickets.service';

const app = Fastify({ logger: false });
const ticketsService = new TicketsService();
const JWT_SECRET = process.env['JWT_SECRET'] || 'erp_secret_key';

async function main() {
  await app.register(fastifyCors, { origin: '*' });
  await app.register(fastifyJwt, { secret: JWT_SECRET });

  app.addHook('onRequest', async (request, reply) => {
    try {
      await request.jwtVerify();
    } catch {
      reply.code(401).send({
        statusCode: 401, intOpCode: 1,
        data: { message: 'No autorizado' }
      });
    }
  });

  app.get('/tickets', async (req: any, _reply) => {
    const groupIds = req.query.groupIds ? req.query.groupIds.split(',') : undefined;
    const data = await ticketsService.getAll(groupIds);
    return { statusCode: 200, intOpCode: 0, data };
  });

  app.get('/tickets/:id', async (req: any, _reply) => {
    const data = await ticketsService.getById(req.params.id);
    return { statusCode: 200, intOpCode: 0, data };
  });

  app.get('/groups/:groupId/tickets', async (req: any, _reply) => {
    const data = await ticketsService.getByGroup(req.params.groupId);
    return { statusCode: 200, intOpCode: 0, data };
  });

  app.post('/groups/:groupId/tickets', async (req: any, reply) => {
    const data = await ticketsService.create(
      req.params.groupId, req.body, req.user.sub
    );
    reply.code(201);
    return { statusCode: 201, intOpCode: 0, data };
  });

  app.put('/groups/:groupId/tickets/:id', async (req: any, _reply) => {
    const data = await ticketsService.update(
      req.params.id, req.body, req.user.sub
    );
    return { statusCode: 200, intOpCode: 0, data };
  });

  app.patch('/groups/:groupId/tickets/:id', async (req: any, _reply) => {
    const body = req.body as { status: string };
    const data = await ticketsService.updateStatus(
      req.params.id, body.status, req.user.sub
    );
    return { statusCode: 200, intOpCode: 0, data };
  });

  app.delete('/groups/:groupId/tickets/:id', async (req: any, _reply) => {
    const data = await ticketsService.delete(req.params.id);
    return { statusCode: 200, intOpCode: 0, data };
  });

  app.post('/groups/:groupId/tickets/:id/comments', async (req: any, reply) => {
    const data = await ticketsService.addComment(
      req.params.id, req.body, req.user.sub
    );
    reply.code(201);
    return { statusCode: 201, intOpCode: 0, data };
  });

  app.setErrorHandler((error: any, _req, reply) => {
    reply.code(error.statusCode || 500).send({
      statusCode: error.statusCode || 500,
      intOpCode: 99,
      data: { message: error.message || 'Error interno del servidor' }
    });
  });

  const port = Number(process.env['PORT']) || 3003;
  await app.listen({ port, host: '0.0.0.0' });
  console.log(`Ticket Service corriendo en puerto ${port}`);
}

main().catch(console.error);