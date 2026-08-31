export default async function (fastify, opts) {
  fastify.addHook('onRequest', fastify.authenticate);

  fastify.post('/update', async (request, reply) => {
    return { success: true, message: 'Location updated' };
  });

  fastify.get('/history/:userId', async (request, reply) => {
    return {
      userId: request.params.userId,
      history: [
        { lat: -26.105, lng: 28.053, timestamp: Date.now() - 3600000 },
        { lat: -26.106, lng: 28.054, timestamp: Date.now() - 1800000 },
        { lat: -26.108, lng: 28.055, timestamp: Date.now() }
      ]
    };
  });

  fastify.get('/stream', { websocket: true }, (connection, req) => {
    const interval = setInterval(() => {
      connection.socket.send(JSON.stringify({
        lat: -26.108 + (Math.random() * 0.002 - 0.001),
        lng: 28.055 + (Math.random() * 0.002 - 0.001),
        timestamp: Date.now()
      }));
    }, 5000);
    
    connection.socket.on('close', () => {
      clearInterval(interval);
    });
  });
}
