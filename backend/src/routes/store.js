export default async function (fastify, opts) {
  fastify.addHook('onRequest', fastify.authenticate);

  fastify.get('/products', async (request, reply) => {
    return {
      products: [
        { id: 'prod_1', name: 'SafeLink BLE Panic Button', priceZAR: 250 },
        { id: 'prod_2', name: 'SafeLink NFC Tag (Pack of 3)', priceZAR: 150 }
      ]
    };
  });

  fastify.post('/orders', async (request, reply) => {
    return { success: true, orderId: 'ord_123', status: 'processing' };
  });

  fastify.get('/orders/:id', async (request, reply) => {
    return { orderId: request.params.id, status: 'shipped', trackingInfo: 'Courier Guy - WAYBILL123' };
  });
}
