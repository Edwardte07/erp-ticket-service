import Fastify from 'fastify';
import fastifyJwt from '@fastify/jwt';
import fastifyCors from '@fastify/cors';
import { TicketsService } from './tickets.service';

const app = Fastify({ logger: false });
const ticketsService = new TicketsService();
const JWT_SECRET = process.env.JWT_SECRET || 'erp_secret_key';

async function main() {
  await app.register(fastifyCors, { origin: '*' });
  await app.register(fastifyJwt, { secret: JWT_SECRET });

  // Hook para verificar JWT en todas las rutas
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

  // GET /tickets
  app.get('/tickets', async (req: any, _reply) => {
    const groupIds = req.query.groupIds ? req.query.groupIds.split(',') : undefined;
    const data = await ticketsService.getAll(groupIds);
    return { statusCode: 200, intOpCode: 0, data };
  });

  // GET /tickets/:id
  app.get('/tickets/:id', async (req: any, _reply) => {
    const data = await ticketsService.getById(req.params.id);
    return { statusCode: 200, intOpCode: 0, data };
  });

  // GET /groups/:groupId/tickets
  app.get('/groups/:groupId/tickets', async (req: any, _reply) => {
    const data = await ticketsService.getByGroup(req.params.groupId);
    return { statusCode: 200, intOpCode: 0, data };
  });

  // POST /groups/:groupId/tickets
  app.post('/groups/:groupId/tickets', async (req: any, reply) => {
    const data = await ticketsService.create(
      req.params.groupId, req.body, req.user.sub
    );
    reply.code(201);
    return { statusCode: 201, intOpCode: 0, data };
  });

  // PUT /groups/:groupId/tickets/:id
  app.put('/groups/:groupId/tickets/:id', async (req: any, _reply) => {
    const data = await ticketsService.update(
      req.params.id, req.body, req.user.sub
    );
    return { statusCode: 200, intOpCode: 0, data };
  });

  // PATCH /groups/:groupId/tickets/:id
  app.patch('/groups/:groupId/tickets/:id', async (req: any, _reply) => {
    const body = req.body as { status: string };
    const data = await ticketsService.updateStatus(
      req.params.id, body.status, req.user.sub
    );
    return { statusCode: 200, intOpCode: 0, data };
  });

  // DELETE /groups/:groupId/tickets/:id
  app.delete('/groups/:groupId/tickets/:id', async (req: any, _reply) => {
    const data = await ticketsService.delete(req.params.id);
    return { statusCode: 200, intOpCode: 0, data };
  });

  // POST /groups/:groupId/tickets/:id/comments
  app.post('/groups/:groupId/tickets/:id/comments', async (req: any, reply) => {
    const data = await ticketsService.addComment(
      req.params.id, req.body, req.user.sub
    );
    reply.code(201);
    return { statusCode: 201, intOpCode: 0, data };
  });

  // Error handler
  app.setErrorHandler((error: any, _req, reply) => {
    reply.code(error.statusCode || 500).send({
      statusCode: error.statusCode || 500,
      intOpCode: 99,
      data: { message: error.message || 'Error interno del servidor' }
    });
  });

  await app.listen({ port: 3003, host: '0.0.0.0' });
  console.log('Ticket Service (Fastify) corriendo en http://localhost:3003');
}

main().catch(console.error);