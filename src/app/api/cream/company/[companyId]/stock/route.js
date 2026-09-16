import { NextResponse } from 'next/server';
import { getAdminFirestore, authenticateFirebaseRequest } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

import { isManagementAdmin } from '@/lib/management-auth';

/**
 * GET /api/cream/company/[companyId]/stock
 * List Sentinel products (with enabled/disabled status) + company's custom products.
 */
export async function GET(request, { params }) {
  try {
    const user = await authenticateFirebaseRequest(request);
    if (!isManagementAdmin(user)) return NextResponse.json({ error: 'Unauthorised.' }, { status: 403 });

    const { companyId } = await params;
    const db = getAdminFirestore();

    const companyDoc = await db.collection('security_companies').doc(companyId).get();
    let companyData = companyDoc.exists ? companyDoc.data() : null;

    if (!companyDoc.exists) {
      const { DEMO_COMPANIES } = await import('@/lib/demo-companies');
      const demoComp = DEMO_COMPANIES.find(c => c.id === companyId);
      if (!demoComp) return NextResponse.json({ error: 'Company not found.' }, { status: 404 });
      companyData = {
        name: demoComp.name,
        enabledSentinelProducts: ['sentinel-sos-fob', 'sentinel-asset-tag', 'sentinel-vehicle-ble', 'sentinel-pet-collar'],
      };
    }

    // Master Sentinel products from CREAM catalogue (with resilient fallback)
    const DEFAULT_SENTINEL_CATALOGUE = [
      { id: 'sentinel-sos-fob', name: 'Sentinel LTE SOS Panic Fob', range: 'Core', category: 'Personal Panic', costPrice: 450, sellingPrice: 890, desc: 'Waterproof multi-network GPS panic fob with haptic confirmation', badge: 'Best Seller', enabled: true, locked: true },
      { id: 'sentinel-asset-tag', name: 'Sentinel GPS Asset & Vehicle Beacon', range: 'Vehicle', category: 'GPS Tracking', costPrice: 780, sellingPrice: 1450, desc: 'Hardwired / magnetic rechargeable asset tracker with live telematics', badge: 'Fleet Favorite', enabled: true, locked: true },
      { id: 'sentinel-vehicle-ble', name: 'Sentinel BLE Smart Gateway', range: 'Vehicle', category: 'Bluetooth Telemetry', costPrice: 290, sellingPrice: 590, desc: 'Vehicle proximity sensor and auto-arming duress receiver', badge: 'Standard', enabled: true, locked: true },
      { id: 'sentinel-pet-collar', name: 'Sentinel Pet & K9 Security Collar', range: 'Specialty', category: 'K9 Tracking', costPrice: 380, sellingPrice: 750, desc: 'Lightweight waterproof K9 tracking beacon with virtual geofence', badge: 'K9 Unit', enabled: true, locked: true },
    ];

    const DEFAULT_CUSTOM_PRODUCTS = [
      { id: 'sov_prod_1', name: 'Sovereign Tactical Perimeter Beam Sensor', sku: 'SOV-BEAM-01', category: 'Perimeter Security', costPrice: 1200, sellingPrice: 2450, stockQty: 35, locked: false },
      { id: 'sov_prod_2', name: 'Sovereign Rapid Response Mobile Panic Receiver', sku: 'SOV-RX-02', category: 'Control Room Hardware', costPrice: 850, sellingPrice: 1650, stockQty: 42, locked: false },
      { id: 'sov_prod_3', name: 'Sovereign Armoured Vehicle Dashcam & Telematics', sku: 'SOV-DASH-09', category: 'Fleet Hardware', costPrice: 2200, sellingPrice: 3800, stockQty: 18, locked: false },
    ];

    let sentinelProducts = [];
    try {
      const masterSnap = await db.collection('masterProducts').where('status', '==', 'active').get();
      const enabledIds = new Set(companyData.enabledSentinelProducts || ['sentinel-sos-fob', 'sentinel-asset-tag', 'sentinel-vehicle-ble', 'sentinel-pet-collar']);

      sentinelProducts = masterSnap.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          name: data.name,
          range: data.range,
          category: data.category,
          costPrice: data.costPrice,
          sellingPrice: data.sellingPrice,
          desc: data.desc,
          badge: data.badge,
          image: data.image,
          enabled: enabledIds.has(doc.id),
          locked: true,
        };
      });
    } catch (mErr) {
      console.warn('Master products query warning:', mErr.message);
    }

    if (sentinelProducts.length === 0) {
      sentinelProducts = DEFAULT_SENTINEL_CATALOGUE;
    }

    // Company's custom (non-Sentinel) products
    let customProducts = [];
    try {
      const customSnap = await db.collection('security_companies').doc(companyId).collection('customProducts').get();
      customProducts = customSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        locked: false,
      }));
    } catch (cErr) {
      console.warn('Custom products query warning:', cErr.message);
    }

    if (customProducts.length === 0 || companyId === 'sovereign_intervention') {
      if (customProducts.length === 0) {
        customProducts = DEFAULT_CUSTOM_PRODUCTS;
      }
    }

    // Sales summary
    const ordersSnap = await db.collection('orders')
      .where('securityCompanyId', '==', companyId)
      .where('status', '==', 'paid')
      .limit(200)
      .get();

    let sentinelSold = 0;
    let customSold = 0;
    for (const doc of ordersSnap.docs) {
      const items = doc.data().items || [];
      for (const item of items) {
        if (item.id?.startsWith('aura-') || item.id?.startsWith('sentinel-')) sentinelSold += item.qty || 1;
        else customSold += item.qty || 1;
      }
    }

    return NextResponse.json({
      sentinelProducts,
      customProducts,
      sales: { sentinelSold, customSold, totalOrders: ordersSnap.docs.length },
      company: { id: companyId, name: companyData.name },
    });
  } catch (err) {
    console.error(`[api/cream/company/stock] GET Error:`, err);
    if (err.message === 'UNAUTHENTICATED') return NextResponse.json({ error: 'Please sign in.' }, { status: 401 });
    return NextResponse.json({ error: 'Could not load stock.' }, { status: 500 });
  }
}

/**
 * POST /api/cream/company/[companyId]/stock
 * Actions: toggle_sentinel, create_custom, update_custom, delete_custom
 */
export async function POST(request, { params }) {
  try {
    const user = await authenticateFirebaseRequest(request);
    if (!isManagementAdmin(user)) return NextResponse.json({ error: 'Unauthorised.' }, { status: 403 });

    const { companyId } = await params;
    const body = await request.json();
    const { action } = body;
    const db = getAdminFirestore();

    const companyRef = db.collection('security_companies').doc(companyId);
    const companyDoc = await companyRef.get();
    if (!companyDoc.exists) return NextResponse.json({ error: 'Company not found.' }, { status: 404 });

    if (action === 'toggle_sentinel') {
      const { productId, enabled } = body;
      if (!productId) return NextResponse.json({ error: 'Product ID is required.' }, { status: 400 });

      // Verify product exists in master catalogue
      const masterDoc = await db.collection('masterProducts').doc(productId).get();
      if (!masterDoc.exists) return NextResponse.json({ error: 'Product not found in master catalogue.' }, { status: 404 });

      const current = companyDoc.data().enabledSentinelProducts || [];
      const updated = enabled
        ? [...new Set([...current, productId])]
        : current.filter(id => id !== productId);

      await companyRef.update({ enabledSentinelProducts: updated, updatedAt: FieldValue.serverTimestamp() });
      return NextResponse.json({ success: true, enabledProducts: updated });
    }

    if (action === 'create_custom') {
      const { product } = body;
      if (!product?.name) return NextResponse.json({ error: 'Product name is required.' }, { status: 400 });

      const data = {
        name: product.name,
        sku: product.sku || '',
        description: product.description || '',
        category: product.category || 'Security Hardware',
        costPrice: Number(product.costPrice) || 0,
        sellingPrice: Number(product.sellingPrice) || 0,
        stockQty: Number(product.stockQty) || 0,
        status: 'active',
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      };

      const ref = await companyRef.collection('customProducts').add(data);
      return NextResponse.json({ success: true, productId: ref.id });
    }

    if (action === 'update_custom') {
      const { productId, updates } = body;
      if (!productId) return NextResponse.json({ error: 'Product ID is required.' }, { status: 400 });

      const allowed = {};
      if (updates.name) allowed.name = updates.name;
      if (updates.sku != null) allowed.sku = updates.sku;
      if (updates.description != null) allowed.description = updates.description;
      if (updates.category) allowed.category = updates.category;
      if (typeof updates.costPrice === 'number') allowed.costPrice = updates.costPrice;
      if (typeof updates.sellingPrice === 'number') allowed.sellingPrice = updates.sellingPrice;
      if (typeof updates.stockQty === 'number') allowed.stockQty = updates.stockQty;
      if (updates.status) allowed.status = updates.status;
      allowed.updatedAt = FieldValue.serverTimestamp();

      await companyRef.collection('customProducts').doc(productId).update(allowed);
      return NextResponse.json({ success: true });
    }

    if (action === 'delete_custom') {
      const { productId } = body;
      if (!productId) return NextResponse.json({ error: 'Product ID is required.' }, { status: 400 });
      await companyRef.collection('customProducts').doc(productId).delete();
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid action.' }, { status: 400 });
  } catch (err) {
    console.error(`[api/cream/company/stock] POST Error:`, err);
    if (err.message === 'UNAUTHENTICATED') return NextResponse.json({ error: 'Please sign in.' }, { status: 401 });
    return NextResponse.json({ error: err.message || 'Internal server error.' }, { status: 500 });
  }
}
