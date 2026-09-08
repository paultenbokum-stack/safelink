import { NextResponse } from 'next/server';
import { authenticateFirebaseRequest, getAdminFirestore } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

/**
 * GET /api/control-room/company?companyId=...
 * Fetch security company profile, camera feeds, and Aura config.
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('companyId') || 'help24_security';
    const firestore = getAdminFirestore();

    const doc = await firestore.collection('security_companies').doc(companyId).get();

    if (!doc.exists) {
      // Seed default initial company profile for Help24 / Global Security
      const defaultCompany = {
        id: companyId,
        name: companyId === 'help24_security' ? 'Help24 Security Command' : 'Global Security Consulting',
        registrationNumber: 'PSIRA-2024/99182',
        dispatchPhone: '+27 11 123 4567',
        contactEmail: 'controlroom@help24.co.za',
        status: 'active',
        aura: {
          enabled: true,
          environment: 'staging',
          clientId: process.env.AURA_CLIENT_ID || '',
          clientSecret: process.env.AURA_CLIENT_SECRET ? '••••••••••••' : '',
          defaultCustomerId: '1',
        },
        accounting: {
          provider: 'sage', // sage | zoho | xero | quickbooks | listener | patriot | custom_api
          environment: 'production',
          apiKey: '',
          clientId: '',
          companyId: 'ZA-SEC-001',
          autoSyncClients: true,
          status: 'configured',
          lastSync: new Date().toISOString(),
        },
        cameraSystem: {
          defaultBrand: 'Hikvision', // Hikvision | Dahua | EZVIZ | Uniview | Axis | Provision-ISR | Milesight | ONVIF
          cloudApiKey: '',
          cloudAccount: 'sec-command-cloud',
          gatewayUrl: 'rtsp-gateway.safelink.co.za:8554',
          status: 'connected',
        },
        cameras: [
          {
            id: 'cam_01',
            name: 'North Gate LPR Camera',
            brand: 'Hikvision',
            ipOrHost: '196.25.1.10',
            port: 554,
            channel: 1,
            streamUrl: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
            status: 'online',
          },
          {
            id: 'cam_02',
            name: 'Substation Perimeter Dahua PTZ',
            brand: 'Dahua',
            ipOrHost: '196.25.1.11',
            port: 37777,
            channel: 2,
            streamUrl: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
            status: 'online',
          },
          {
            id: 'cam_03',
            name: 'Clubhouse Entrance EZVIZ',
            brand: 'EZVIZ',
            ipOrHost: 'ezviz-cloud.open.com',
            port: 443,
            channel: 1,
            streamUrl: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
            status: 'online',
          },
        ],
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      };

      await firestore.collection('security_companies').doc(companyId).set(defaultCompany);
      return NextResponse.json({ company: defaultCompany });
    }

    const data = doc.data();
    // Mask sensitive secrets for safety
    if (data.aura?.clientSecret) {
      data.aura.hasSecret = true;
      data.aura.clientSecret = '••••••••••••';
    }
    if (data.accounting?.apiKey) {
      data.accounting.hasApiKey = true;
      data.accounting.apiKey = '••••••••••••';
    }
    if (data.cameraSystem?.cloudApiKey) {
      data.cameraSystem.hasKey = true;
      data.cameraSystem.cloudApiKey = '••••••••••••';
    }

    return NextResponse.json({ company: { id: doc.id, ...data } });
  } catch (err) {
    console.error('[api/control-room/company] GET Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/control-room/company
 * Create or update security company settings, camera list, accounting, and Aura integration.
 */
export async function POST(request) {
  try {
    const body = await request.json();
    const companyId = body.id || body.companyId || 'help24_security';
    const firestore = getAdminFirestore();

    const companyRef = firestore.collection('security_companies').doc(companyId);
    const existing = await companyRef.get();
    const existingData = existing.exists ? existing.data() : {};

    const updatePayload = {
      name: body.name || existingData.name || 'Security Command',
      registrationNumber: body.registrationNumber || existingData.registrationNumber || '',
      dispatchPhone: body.dispatchPhone || existingData.dispatchPhone || '',
      contactEmail: body.contactEmail || existingData.contactEmail || '',
      status: body.status || existingData.status || 'active',
      updatedAt: FieldValue.serverTimestamp(),
    };

    if (body.cameras) {
      updatePayload.cameras = body.cameras;
    }

    if (body.aura) {
      // Don't overwrite secret if placeholder sent
      const secretToSave = body.aura.clientSecret && !body.aura.clientSecret.includes('••••')
        ? body.aura.clientSecret
        : (existingData.aura?.clientSecret || '');

      updatePayload.aura = {
        enabled: typeof body.aura.enabled === 'boolean' ? body.aura.enabled : true,
        environment: body.aura.environment || 'staging',
        clientId: body.aura.clientId || existingData.aura?.clientId || '',
        clientSecret: secretToSave,
        defaultCustomerId: body.aura.defaultCustomerId || existingData.aura?.defaultCustomerId || '1',
      };
    }

    if (body.accounting) {
      const accountingKeyToSave = body.accounting.apiKey && !body.accounting.apiKey.includes('••••')
        ? body.accounting.apiKey
        : (existingData.accounting?.apiKey || '');

      updatePayload.accounting = {
        provider: body.accounting.provider || existingData.accounting?.provider || 'sage',
        environment: body.accounting.environment || existingData.accounting?.environment || 'production',
        apiKey: accountingKeyToSave,
        clientId: body.accounting.clientId ?? (existingData.accounting?.clientId || ''),
        companyId: body.accounting.companyId ?? (existingData.accounting?.companyId || ''),
        endpoint: body.accounting.endpoint ?? (existingData.accounting?.endpoint || ''),
        autoSyncClients: typeof body.accounting.autoSyncClients === 'boolean'
          ? body.accounting.autoSyncClients
          : (existingData.accounting?.autoSyncClients ?? true),
        status: body.accounting.status || existingData.accounting?.status || 'configured',
        lastSync: body.accounting.lastSync || existingData.accounting?.lastSync || new Date().toISOString(),
      };
    }

    if (body.cameraSystem) {
      const cameraKeyToSave = body.cameraSystem.cloudApiKey && !body.cameraSystem.cloudApiKey.includes('••••')
        ? body.cameraSystem.cloudApiKey
        : (existingData.cameraSystem?.cloudApiKey || '');

      updatePayload.cameraSystem = {
        defaultBrand: body.cameraSystem.defaultBrand || existingData.cameraSystem?.defaultBrand || 'Hikvision',
        cloudApiKey: cameraKeyToSave,
        cloudAccount: body.cameraSystem.cloudAccount ?? (existingData.cameraSystem?.cloudAccount || ''),
        gatewayUrl: body.cameraSystem.gatewayUrl ?? (existingData.cameraSystem?.gatewayUrl || ''),
        status: body.cameraSystem.status || existingData.cameraSystem?.status || 'connected',
      };
    }

    await companyRef.set(updatePayload, { merge: true });

    return NextResponse.json({ success: true, message: 'Security company settings updated successfully' });
  } catch (err) {
    console.error('[api/control-room/company] POST Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
