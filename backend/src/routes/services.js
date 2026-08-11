export default async function (fastify, opts) {
  fastify.addHook('onRequest', fastify.authenticate);

  fastify.post('/bookings/technician', async (request, reply) => {
    return { success: true, bookingId: 'book_123', date: '2026-07-28', time: '14:00' };
  });

  fastify.post('/alarm/test', async (request, reply) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({ success: true, result: 'Alarm received successfully by SB Control Room' });
      }, 1000);
    });
  });

  fastify.post('/appointments/create', async (request, reply) => {
    return { success: true, appointmentId: 'app_123' };
  });

  fastify.post('/appointments/:id/share', async (request, reply) => {
    return { success: true, message: 'Appointment shared with circle members' };
  });

  fastify.get('/appointments', async (request, reply) => {
    return {
      appointments: [
        { id: 'app_1', title: 'Doctor Visit', date: '2026-07-26', location: 'Sandton MediClinic' }
      ]
    };
  });
}
