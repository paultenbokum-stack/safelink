import { v4 as uuidv4 } from 'uuid';

export default async function (fastify, opts) {
  fastify.addHook('onRequest', fastify.authenticate);

  fastify.post('/trigger', async (request, reply) => {
    const { type, location, audioEnabled } = request.body || {};
    const sosId = uuidv4();
    
    return {
      success: true,
      sosId,
      status: 'dispatched',
      responder: {
        name: 'Sipho Ndlovu',
        vehicle: 'SB Security Response Unit 4',
        eta: '4 mins',
        location: { lat: -26.107, lng: 28.056 }
      }
    };
  });

  fastify.put('/:id/cancel', async (request, reply) => {
    return { success: true, message: `SOS ${request.params.id} cancelled` };
  });

  fastify.get('/:id/status', async (request, reply) => {
    return {
      sosId: request.params.id,
      status: 'en_route',
      responder: {
        name: 'Sipho Ndlovu',
        eta: '2 mins',
        location: { lat: -26.108, lng: 28.055 }
      }
    };
  });

  fastify.get('/:id/audio', { websocket: true }, (connection, req) => {
    connection.socket.on('message', message => {
      // Echo back for mock audio stream
      connection.socket.send(message);
    });
  });
}
