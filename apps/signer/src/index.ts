import fastify from 'fastify';
import { signRoute } from './routes/sign';
import * as jwt from 'jsonwebtoken';

const server = fastify({ logger: true });

// Secret for internal JWT authentication
const INTERNAL_SIGNER_SECRET = process.env.INTERNAL_SIGNER_SECRET || 'dev-internal-secret';

// Auth hook to protect all routes
server.addHook('onRequest', async (request, reply) => {
  try {
    const authHeader = request.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new Error('Missing or invalid Authorization header');
    }

    const token = authHeader.split(' ')[1];
    jwt.verify(token, INTERNAL_SIGNER_SECRET);
    // JWT is valid, request proceeds
  } catch (err) {
    server.log.error(`Authentication failed: ${err}`);
    reply.status(401).send({ error: 'Unauthorized' });
  }
});

server.register(signRoute, { prefix: '/internal' });

const start = async () => {
  try {
    await server.listen({ port: 4001, host: '::' });
    server.log.info(`Signer service listening on port 4001`);
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

start();

export { server }; // exported for testing
