export default async function (fastify, opts) {
  fastify.addHook('onRequest', fastify.authenticate);

  fastify.get('/members', async (request, reply) => {
    return { members: [{ id: 'usr_1', name: 'John Doe', status: 'active' }] };
  });

  fastify.get('/partners', async (request, reply) => {
    return { partners: [{ id: 'part_1', name: 'Rapid Response Sandton', status: 'approved' }] };
  });

  fastify.put('/partners/:id/approve', async (request, reply) => {
    return { success: true, message: 'Partner approved' };
  });

  fastify.get('/sos/active', async (request, reply) => {
    return { activeEvents: [{ id: 'sos_123', type: 'panic', location: { lat: -26.1, lng: 28.05 } }] };
  });

  fastify.get('/analytics', async (request, reply) => {
    return { totalUsers: 15420, activeSOS: 1, averageResponseTimeMins: 4.2 };
  });
}
