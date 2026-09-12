import { NextResponse } from 'next/server';
import { getAdminFirestore, authenticateFirebaseRequest } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { SENTINEL_PRODUCTS } from '@/lib/products';

const CREAM_ADMINS = (process.env.CREAM_ADMIN_UIDS || '').split(',').map(s => s.trim()).filter(Boolean);
function isCreamAdmin(uid) { return CREAM_ADMINS.includes(uid); }

/**
 * GET /api/cream/products
 * List all master products. Public to authenticated users (security companies need to read the catalogue).
 */
export async function GET(request) {
  try {
    await authenticateFirebaseRequest(request);
    const db = getAdminFirestore();
    const snap = await db.collection('masterProducts').orderBy('sortOrder', 'asc').get();

    if (snap.empty) {
      // Seed from hardcoded catalogue on first access
      const batch = db.batch();
      SENTINEL_PRODUCTS.forEach((product, index) => {
        const ref = db.collection('masterProducts').doc(product.id);
        batch.set(ref, {
          ...product,
          status: 'active',
          sortOrder: index,
          createdAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
        });
      });
      await batch.commit();

      return NextResponse.json({
        products: SENTINEL_PRODUCTS.map((p, i) => ({ ...p, status: 'active', sortOrder: i })),
        seeded: true,
      });
    }

    const products = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return NextResponse.json({ products });
  } catch (err) {
    console.error('[api/cream/products] GET Error:', err);
    if (err.message === 'UNAUTHENTICATED') return NextResponse.json({ error: 'Please sign in.' }, { status: 401 });
    return NextResponse.json({ error: 'Could not load products.' }, { status: 500 });
  }
}

/**
 * POST /api/cream/products
 * Actions: create, update, archive, reorder
 * CREAM admin only — security companies cannot modify master products.
 */
export async function POST(request) {
  try {
    const user = await authenticateFirebaseRequest(request);
    if (!isCreamAdmin(user.uid)) return NextResponse.json({ error: 'Only CREAM administrators can manage the master catalogue.' }, { status: 403 });

    const body = await request.json();
    const { action } = body;
    const db = getAdminFirestore();

    if (action === 'create' || action === 'update') {
      const { product } = body;
      if (!product?.id || !product?.name) return NextResponse.json({ error: 'Product ID and name are required.' }, { status: 400 });

      const id = product.id.toLowerCase().replace(/[^a-z0-9-]/g, '-');
      const data = {
        name: product.name,
        ref: product.ref || null,
        range: product.range || 'AURA',
        category: product.category || 'Asset Trackers',
        badge: product.badge || null,
        desc: product.desc || '',
        specs: Array.isArray(product.specs) ? product.specs : [],
        useCases: Array.isArray(product.useCases) ? product.useCases : [],
        icon: product.icon || null,
        image: product.image || null,
        connectivity: product.connectivity || '',
        platform: product.platform || '',
        costPrice: Number(product.costPrice) || 0,
        sellingPrice: Number(product.sellingPrice) || 0,
        priceTiers: Array.isArray(product.priceTiers) ? product.priceTiers.map(tier => ({
          minQty: Number(tier.minQty) || 1,
          maxQty: tier.maxQty != null ? Number(tier.maxQty) : null,
          label: tier.label || '',
          sourceLabel: tier.sourceLabel || undefined,
          unitPriceExVat: Number(tier.unitPriceExVat) || 0,
        })) : [],
        status: product.status || 'active',
        sortOrder: typeof product.sortOrder === 'number' ? product.sortOrder : 999,
        updatedAt: FieldValue.serverTimestamp(),
      };

      if (action === 'create') data.createdAt = FieldValue.serverTimestamp();

      await db.collection('masterProducts').doc(id).set(data, { merge: action === 'update' });
      return NextResponse.json({ success: true, productId: id });
    }

    if (action === 'archive') {
      const { productId } = body;
      if (!productId) return NextResponse.json({ error: 'Product ID is required.' }, { status: 400 });
      await db.collection('masterProducts').doc(productId).update({
        status: 'archived',
        updatedAt: FieldValue.serverTimestamp(),
      });
      return NextResponse.json({ success: true });
    }

    if (action === 'restore') {
      const { productId } = body;
      if (!productId) return NextResponse.json({ error: 'Product ID is required.' }, { status: 400 });
      await db.collection('masterProducts').doc(productId).update({
        status: 'active',
        updatedAt: FieldValue.serverTimestamp(),
      });
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid action.' }, { status: 400 });
  } catch (err) {
    console.error('[api/cream/products] POST Error:', err);
    if (err.message === 'UNAUTHENTICATED') return NextResponse.json({ error: 'Please sign in.' }, { status: 401 });
    return NextResponse.json({ error: err.message || 'Internal server error.' }, { status: 500 });
  }
}
