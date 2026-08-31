export default async function (fastify, opts) {
  fastify.addHook('onRequest', fastify.authenticate);

  fastify.post('/create', async (request, reply) => {
    return { success: true, circleId: 'cir_123', name: 'Family' };
  });

  fastify.post('/:id/invite', async (request, reply) => {
    return { success: true, message: `Invite sent to ${request.body?.phone}` };
  });

  fastify.get('/:id/members', async (request, reply) => {
    return {
      circleId: request.params.id,
      members: [
        { id: 'usr_2', name: 'Thandi', phone: '+27820001111', location: { lat: -26.12, lng: 28.04, timestamp: Date.now() } },
        { id: 'usr_3', name: 'Johan', phone: '+27830002222', location: { lat: -25.75, lng: 28.23, timestamp: Date.now() } }
      ]
    };
  });

  fastify.delete('/:id/members/:memberId', async (request, reply) => {
    return { success: true, message: 'Member removed' };
  });
}
