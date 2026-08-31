export default async function (fastify, opts) {
  fastify.addHook('onRequest', fastify.authenticate);

  fastify.post('/apply', async (request, reply) => {
    return { success: true, message: 'Application submitted for review' };
  });

  fastify.get('/dashboard', async (request, reply) => {
    return {
      stats: { totalDispatches: 42, activeResponders: 3 },
      recentDispatches: [
        { id: 'disp_1', type: 'medical', time: '10:30 AM', status: 'completed' }
      ]
    };
  });

  fastify.post('/responders', async (request, reply) => {
    return { success: true, responderId: 'resp_123' };
  });

  fastify.put('/responders/:id/status', async (request, reply) => {
    return { success: true, status: request.body?.status || 'on_duty' };
  });

  fastify.get('/dispatches', async (request, reply) => {
    return {
      requests: [
        { id: 'disp_2', type: 'security', gps: { lat: -26.11, lng: 28.05 }, firstName: 'Thabo', ref: 'REF-889' }
      ]
    };
  });

  fastify.put('/dispatches/:id/accept', async (request, reply) => {
    return { success: true, message: 'Dispatch accepted, proceed to location' };
  });
}
