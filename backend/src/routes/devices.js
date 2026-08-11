export default async function (fastify, opts) {
  // Public route first
  fastify.get('/nfc/:tagId/owner', async (request, reply) => {
    return {
      firstName: 'Lerato',
      contact: '086 123 4567 (SB Security)'
    };
  });

  // Protected routes below
  fastify.register(async function(protectedRoutes) {
    protectedRoutes.addHook('onRequest', fastify.authenticate);
    
    protectedRoutes.post('/ble/register', async (request, reply) => {
      return { success: true, deviceId: request.body?.imei, type: 'ble' };
    });

    protectedRoutes.post('/nfc/register', async (request, reply) => {
      return { success: true, tagId: request.body?.tagId, type: 'nfc' };
    });

    protectedRoutes.get('/mine', async (request, reply) => {
      return {
        devices: [
          { id: 'imei_123', type: 'ble_panic_button', name: 'Keys Panic Button' },
          { id: 'tag_456', type: 'nfc_tag', name: 'Wallet Tag' }
        ]
      };
    });

    protectedRoutes.get('/ble/:imei/location', async (request, reply) => {
      return {
        imei: request.params.imei,
        location: { lat: -26.09, lng: 28.06 },
        lastSeen: Date.now() - 60000
      };
    });
  });
}
