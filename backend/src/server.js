import Fastify from 'fastify';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import websocket from '@fastify/websocket';

import { authMiddleware } from './middleware/auth.js';
import authRoutes from './routes/auth.js';
import membershipRoutes from './routes/membership.js';
import sosRoutes from './routes/sos.js';
import locationRoutes from './routes/location.js';
import circlesRoutes from './routes/circles.js';
import devicesRoutes from './routes/devices.js';
import storeRoutes from './routes/store.js';
import servicesRoutes from './routes/services.js';
import partnersRoutes from './routes/partners.js';
import adminRoutes from './routes/admin.js';

const fastify = Fastify({
  logger: true
});

fastify.register(cors, {
  origin: '*'
});

fastify.register(jwt, {
  secret: 'safelink-dev-secret-key'
});

fastify.register(websocket);

// Register middleware
fastify.decorate('authenticate', authMiddleware(fastify));

// Register routes
fastify.register(authRoutes, { prefix: '/auth' });
fastify.register(membershipRoutes, { prefix: '/membership' });
fastify.register(sosRoutes, { prefix: '/sos' });
fastify.register(locationRoutes, { prefix: '/location' });
fastify.register(circlesRoutes, { prefix: '/circles' });
fastify.register(devicesRoutes, { prefix: '/devices' });
fastify.register(storeRoutes, { prefix: '/store' });
fastify.register(servicesRoutes, { prefix: '/services' });
fastify.register(partnersRoutes, { prefix: '/partners' });
fastify.register(adminRoutes, { prefix: '/admin' });

// Setup server
const start = async () => {
  try {
    await fastify.listen({ port: 3001, host: '0.0.0.0' });
    console.log(`
=========================================
  SafeLink API — SB Security
=========================================
Server listening on port 3001
`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
