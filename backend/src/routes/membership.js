export default async function (fastify, opts) {
  fastify.addHook('onRequest', fastify.authenticate);
  
  fastify.get('/status', async (request, reply) => {
    return {
      status: 'active',
      tier: 'SafeLink Member',
      fee: 'R100',
      nextBillingDate: '2026-08-01'
    };
  });

  fastify.post('/subscribe', async (request, reply) => {
    return { success: true, message: 'Subscription confirmed' };
  });

  fastify.post('/cancel', async (request, reply) => {
    return { success: true, message: 'Subscription cancelled' };
  });

  fastify.get('/verify-existing', async (request, reply) => {
    return { isExistingClient: true, clientId: 'SB_789456' };
  });
}
