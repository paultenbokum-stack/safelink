export const authMiddleware = (fastify) => {
  return async (request, reply) => {
    try {
      // Skip auth for specific routes
      const publicRoutes = ['/auth/otp/send', '/auth/otp/verify'];
      
      // Allow dynamic public routes like /devices/nfc/:tagId/owner
      if (publicRoutes.includes(request.routerPath) || 
          (request.routerPath && request.routerPath.match(/^\/devices\/nfc\/.*\/owner$/))) {
        return;
      }
      
      await request.jwtVerify();
    } catch (err) {
      reply.code(401).send({ error: 'Unauthorized', message: err.message });
    }
  };
};
