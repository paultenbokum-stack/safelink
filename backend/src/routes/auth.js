export default async function (fastify, opts) {
  fastify.post('/otp/send', async (request, reply) => {
    const { phone } = request.body || {};
    return {
      success: true,
      message: `OTP sent to ${phone || '+27821234567'}`
    };
  });

  fastify.post('/otp/verify', async (request, reply) => {
    const { phone, code } = request.body || {};
    
    // Accept any 6-digit code for dev
    const token = fastify.jwt.sign({ 
      id: 'usr_123', 
      phone,
      role: 'user' 
    });
    
    return {
      success: true,
      token,
      user: {
        id: 'usr_123',
        phone,
        role: 'user',
        membershipStatus: 'active'
      }
    };
  });
}
