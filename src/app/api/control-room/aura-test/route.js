import { NextResponse } from 'next/server';
import { getAuraConfigForCompany, getAuraBearerToken } from '@/lib/aura';

export async function POST(request) {
  try {
    const body = await request.json();
    const companyId = body.companyId;

    const start = Date.now();
    const config = await getAuraConfigForCompany(companyId);

    // Override with in-flight inputs if testing unsaved credentials
    if (body.clientId) config.clientId = body.clientId;
    if (body.clientSecret && !body.clientSecret.includes('••••')) config.clientSecret = body.clientSecret;
    if (body.environment) {
      config.environment = body.environment;
      config.baseUrl = body.environment === 'production'
        ? 'https://panic.aura.services'
        : 'https://staging-panic.aura.services';
    }

    if (!config.clientId || !config.clientSecret) {
      return NextResponse.json({
        success: false,
        error: 'Client ID and Client Secret are required to test Aura connection.',
      }, { status: 400 });
    }

    // Attempt token exchange
    const token = await getAuraBearerToken(config);
    const latency = Date.now() - start;

    return NextResponse.json({
      success: true,
      environment: config.environment,
      baseUrl: config.baseUrl,
      latencyMs: latency,
      message: `Aura OAuth2 handshake verified successfully in ${latency}ms.`,
      tokenPrefix: token ? `${token.substring(0, 8)}...` : null,
    });
  } catch (err) {
    return NextResponse.json({
      success: false,
      error: err.message || 'Failed to authenticate with Aura Panic API',
    }, { status: 400 });
  }
}
