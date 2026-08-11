'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { getHousehold, createOrder, createDevice } from '@/lib/db';
import AuthGuard from '@/app/components/AuthGuard';

const PAYSTACK_KEY = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY || '';

export default function CheckoutPage() {
  return (
    <AuthGuard>
      <CheckoutContent />
    </AuthGuard>
  );
}

function CheckoutContent() {
  const { user } = useAuth();
  const router   = useRouter();

  const [cart, setCart]       = useState([]);
  const [household, setHousehold] = useState(null);
  const [step, setStep]       = useState(1); // 1=review, 2=delivery, 3=payment
  const [busy, setBusy]       = useState(false);
  const [error, setError]     = useState('');
  const [orderId, setOrderId] = useState(null);
  const [refCode, setRefCode] = useState('');

  const [delivery, setDelivery] = useState({
    name: '', phone: '', addressLine1: '',
    suburb: '', city: '', province: '', postalCode: '',
  });

  useEffect(() => {
    const stored = sessionStorage.getItem('safelink_cart');
    if (!stored) { router.replace('/store'); return; }
    setCart(JSON.parse(stored));
  }, [router]);

  useEffect(() => {
    if (!user) return;
    getHousehold(user.uid).then(h => {
      if (h) {
        setHousehold(h);
        setDelivery({
          name:         `${h.adminFirstName} ${h.adminLastName}`,
          phone:        h.phone || '',
          addressLine1: h.address?.line1 || '',
          suburb:       h.address?.suburb || '',
          city:         h.address?.city || '',
          province:     h.address?.province || '',
          postalCode:   h.address?.postalCode || '',
        });
      }
    });
  }, [user]);

  const subtotal = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const vat      = Math.round(subtotal * 0.15);
  const total    = subtotal + vat;

  const updateDelivery = (field) => (e) =>
    setDelivery(d => ({ ...d, [field]: e.target.value }));

  // ── Payment via Paystack popup ────────────────────────────────
  const initPaystack = () => {
    if (!window.PaystackPop) {
      setError('Payment gateway not loaded. Please refresh and try again.');
      return;
    }
    setBusy(true);
    const handler = window.PaystackPop.setup({
      key:       PAYSTACK_KEY,
      email:     user.email,
      amount:    total * 100, // Paystack uses kobo/cents
      currency:  'ZAR',
      ref:       `SBSec-${Date.now()}`,
      metadata: {
        household_id: user.uid,
        cart:         JSON.stringify(cart.map(i => ({ id: i.id, name: i.name, qty: i.qty }))),
      },
      callback: (response) => {
        setBusy(false);
        handlePaymentSuccess(response.reference);
      },
      onClose: () => {
        setBusy(false);
      },
    });
    handler.openIframe();
  };

  const handlePaymentSuccess = async (paystackRef) => {
    setBusy(true);
    setError('');
    try {
      const newOrderId = await createOrder(user.uid, {
        items:       cart,
        subtotal,
        vat,
        total,
        paystackRef,
        delivery,
        householdId: user.uid,
      });

      // Create device records for IMEI-required items
      for (const item of cart) {
        if (item.imeiRequired) {
          for (let i = 0; i < item.qty; i++) {
            await createDevice(user.uid, newOrderId, item.id, item.name);
          }
        }
      }

      setOrderId(newOrderId);
      sessionStorage.removeItem('safelink_cart');
      setStep(4); // confirmation
    } catch (err) {
      setError('Payment was received but order creation failed. Contact support with your Paystack reference: ' + paystackRef);
      console.error(err);
    } finally {
      setBusy(false);
    }
  };

  // Load Paystack script
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://js.paystack.co/v1/inline.js';
    script.async = true;
    document.head.appendChild(script);
    return () => document.head.removeChild(script);
  }, []);

  // ── Step 4: Confirmation ─────────────────────────────────────
  if (step === 4 && orderId) {
    return (
      <div className="checkout-page">
        <ConfirmationScreen orderId={orderId} total={total} onDone={() => router.push('/orders')} />
        <CheckoutStyles />
      </div>
    );
  }

  return (
    <div className="checkout-page">
      {/* Header */}
      <div className="checkout-header">
        <button className="back-btn" onClick={() => step === 1 ? router.back() : setStep(s => s - 1)}>
          ← Back
        </button>
        <h1 className="checkout-title">Checkout</h1>
        <div style={{ width: 60 }} />
      </div>

      {/* Step indicator */}
      <div className="step-indicators">
        {['Review', 'Delivery', 'Payment'].map((label, i) => (
          <div key={label} className={`step-ind ${step >= i + 1 ? 'active' : ''}`}>
            <div className="step-ind-dot">{step > i + 1 ? '✓' : i + 1}</div>
            <span>{label}</span>
          </div>
        ))}
      </div>

      {error && <div className="checkout-error">{error}</div>}

      {/* Step 1: Review cart */}
      {step === 1 && (
        <div className="checkout-body">
          <h2 className="section-head">Order Summary</h2>
          {cart.map(item => (
            <div key={item.id} className="cart-line">
              <div className="cart-line-name">
                <div style={{ fontWeight: 700 }}>{item.name}</div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Qty: {item.qty}</div>
              </div>
              <div className="cart-line-price">R{(item.price * item.qty).toLocaleString()}</div>
            </div>
          ))}
          <div className="price-row"><span>Subtotal</span><span>R{subtotal.toLocaleString()}</span></div>
          <div className="price-row"><span>VAT (15%)</span><span>R{vat.toLocaleString()}</span></div>
          <div className="price-row total"><span>Total</span><span>R{total.toLocaleString()}</span></div>
          <button className="checkout-btn" onClick={() => setStep(2)}>Confirm Order →</button>
        </div>
      )}

      {/* Step 2: Delivery */}
      {step === 2 && (
        <form className="checkout-body" onSubmit={(e) => { e.preventDefault(); setStep(3); }}>
          <h2 className="section-head">Delivery Details</h2>
          {household && (
            <div className="prefill-notice">
              ✓ Pre-filled from your household profile — update if needed
            </div>
          )}
          <CField label="Full Name"     value={delivery.name}         onChange={updateDelivery('name')} />
          <CField label="Phone"         value={delivery.phone}        onChange={updateDelivery('phone')} type="tel" />
          <CField label="Street Address" value={delivery.addressLine1} onChange={updateDelivery('addressLine1')} />
          <CField label="Suburb"         value={delivery.suburb}       onChange={updateDelivery('suburb')} />
          <CField label="City"           value={delivery.city}         onChange={updateDelivery('city')} />
          <CField label="Province"       value={delivery.province}     onChange={updateDelivery('province')} />
          <CField label="Postal Code"    value={delivery.postalCode}   onChange={updateDelivery('postalCode')} pattern="[0-9]{4}" />
          <button type="submit" className="checkout-btn">Proceed to Payment →</button>
        </form>
      )}

      {/* Step 3: Payment */}
      {step === 3 && (
        <div className="checkout-body">
          <h2 className="section-head">Payment</h2>
          <div className="payment-summary-card">
            <div className="psc-label">Amount due</div>
            <div className="psc-amount">R{total.toLocaleString()}</div>
            <div className="psc-items">{cart.reduce((s, i) => s + i.qty, 0)} item{cart.length !== 1 ? 's' : ''} · delivery to {delivery.suburb}</div>
          </div>

          <div className="paystack-info">
            <div className="paystack-logo">
              <svg viewBox="0 0 120 40" width="120" height="40" fill="none">
                <rect width="120" height="40" rx="8" fill="rgba(255,255,255,0.05)" />
                <text x="10" y="26" fill="white" fontSize="16" fontWeight="bold" fontFamily="Arial">Paystack</text>
              </svg>
            </div>
            <p style={{ margin: 0, fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              Secured by Paystack · KS Consulting gateway. Your card details are never stored by SafeLink.
            </p>
          </div>

          <button className="checkout-btn paystack-pay-btn" onClick={initPaystack} disabled={busy}>
            {busy ? <span className="spinner" /> : `Pay R${total.toLocaleString()} Securely →`}
          </button>

          <div className="secure-badges">
            <span>🔒 SSL Encrypted</span>
            <span>🏦 PCI Compliant</span>
            <span>✅ Paystack Secured</span>
          </div>
        </div>
      )}

      <CheckoutStyles />
    </div>
  );
}

function ConfirmationScreen({ orderId, total, onDone }) {
  return (
    <div className="confirmation">
      <div className="confirm-icon">✅</div>
      <h2 className="confirm-title">Order Confirmed!</h2>
      <p className="confirm-sub">Your Sentinel devices are on their way</p>

      <div className="confirm-card">
        <div className="confirm-row"><span>Order ID</span><span className="confirm-val">#{orderId.slice(0, 8).toUpperCase()}</span></div>
        <div className="confirm-row"><span>Referral Code</span><span className="confirm-val">SBSec-{orderId.slice(0, 6).toUpperCase()}</span></div>
        <div className="confirm-row"><span>Amount Paid</span><span className="confirm-val">R{total.toLocaleString()}</span></div>
        <div className="confirm-row"><span>Delivery</span><span className="confirm-val">5–7 business days</span></div>
      </div>

      <div className="confirm-note">
        <span>📦</span>
        <span>We are processing your order with Sentinel and will confirm delivery details via email and SMS.</span>
      </div>

      <button className="checkout-btn" onClick={onDone}>Track My Orders →</button>
    </div>
  );
}

function CField({ label, value, onChange, type = 'text', pattern }) {
  return (
    <div className="field-group">
      <label className="field-label">{label}</label>
      <input
        type={type}
        className="field-input"
        value={value}
        onChange={onChange}
        required
        pattern={pattern}
      />
    </div>
  );
}

function CheckoutStyles() {
  return (
    <style dangerouslySetInnerHTML={{ __html: `
      .checkout-page {
        min-height: 100vh;
        background: var(--bg-dark, #0f1923);
        color: var(--text-primary, #fff);
        display: flex; flex-direction: column;
      }
      .checkout-header {
        display: flex; align-items: center; justify-content: space-between;
        padding: 20px 20px 0;
      }
      .back-btn {
        background: none; border: none; color: var(--accent);
        font-size: 15px; font-weight: 600; cursor: pointer; padding: 0;
      }
      .checkout-title { margin: 0; font-size: 20px; font-weight: 800; }

      .step-indicators {
        display: flex; padding: 20px 20px 0; gap: 0;
      }
      .step-ind {
        display: flex; flex-direction: column; align-items: center;
        gap: 4px; flex: 1; position: relative;
        color: var(--text-secondary); font-size: 11px; font-weight: 600;
        text-transform: uppercase;
      }
      .step-ind::before {
        content: '';
        position: absolute; top: 12px; left: 50%; right: -50%;
        height: 2px; background: rgba(255,255,255,0.1); z-index: 0;
      }
      .step-ind:last-child::before { display: none; }
      .step-ind-dot {
        width: 24px; height: 24px; border-radius: 50%;
        background: rgba(255,255,255,0.08);
        border: 2px solid rgba(255,255,255,0.15);
        display: flex; align-items: center; justify-content: center;
        font-size: 11px; font-weight: 700; z-index: 1;
        transition: all 0.3s;
      }
      .step-ind.active .step-ind-dot {
        background: var(--primary); border-color: var(--primary);
        box-shadow: 0 0 12px rgba(44,90,133,0.5);
      }

      .checkout-body {
        padding: 24px 20px; display: flex; flex-direction: column; gap: 14px;
        flex: 1;
      }
      .checkout-error {
        margin: 16px 20px 0;
        background: rgba(229,62,62,0.15);
        border: 1px solid rgba(229,62,62,0.4);
        border-radius: 10px; padding: 12px;
        font-size: 13px; color: #fc8181; line-height: 1.4;
      }

      .section-head { margin: 0 0 4px; font-size: 18px; font-weight: 700; }

      .cart-line {
        display: flex; justify-content: space-between; align-items: flex-start;
        padding: 12px 14px;
        background: rgba(255,255,255,0.04);
        border-radius: 10px; border: 1px solid rgba(255,255,255,0.07);
      }
      .cart-line-name { display: flex; flex-direction: column; gap: 2px; }
      .cart-line-price { font-size: 16px; font-weight: 700; color: var(--accent); }

      .price-row {
        display: flex; justify-content: space-between;
        font-size: 14px; color: var(--text-secondary);
        padding: 4px 0;
      }
      .price-row.total {
        font-size: 18px; font-weight: 800;
        color: var(--text-primary);
        border-top: 1px solid rgba(255,255,255,0.1);
        padding-top: 12px; margin-top: 4px;
      }

      .checkout-btn {
        width: 100%; padding: 16px;
        background: linear-gradient(135deg, var(--primary), #1a3a5c);
        border: none; border-radius: 14px;
        color: #fff; font-size: 16px; font-weight: 700;
        cursor: pointer; margin-top: 8px;
        box-shadow: 0 4px 20px rgba(44,90,133,0.4);
        display: flex; align-items: center; justify-content: center;
        min-height: 52px;
        transition: opacity 0.2s;
      }
      .checkout-btn:disabled { opacity: 0.6; cursor: not-allowed; }
      .paystack-pay-btn { background: linear-gradient(135deg, #00b300, #007700); box-shadow: 0 4px 20px rgba(0,179,0,0.3); }

      .prefill-notice {
        background: rgba(56,161,105,0.12);
        border: 1px solid rgba(56,161,105,0.3);
        border-radius: 10px; padding: 10px 12px;
        font-size: 12px; color: #68d391;
      }

      .payment-summary-card {
        background: rgba(44,90,133,0.15);
        border: 1px solid rgba(44,90,133,0.3);
        border-radius: 14px; padding: 20px;
        text-align: center;
      }
      .psc-label { font-size: 12px; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 1px; }
      .psc-amount { font-size: 40px; font-weight: 900; color: var(--accent); margin: 4px 0; }
      .psc-items { font-size: 13px; color: var(--text-secondary); }

      .paystack-info {
        background: rgba(255,255,255,0.04);
        border: 1px solid rgba(255,255,255,0.08);
        border-radius: 12px; padding: 16px;
        display: flex; flex-direction: column; gap: 10px;
      }
      .paystack-logo { display: flex; }

      .secure-badges {
        display: flex; justify-content: center; gap: 16px;
        flex-wrap: wrap;
        font-size: 11px; color: var(--text-secondary);
      }

      .field-group { display: flex; flex-direction: column; gap: 6px; }
      .field-label { font-size: 11px; font-weight: 700; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.5px; }
      .field-input {
        padding: 13px 15px;
        background: rgba(255,255,255,0.05);
        border: 1px solid rgba(255,255,255,0.1);
        border-radius: 12px; color: var(--text-primary); font-size: 15px;
        outline: none; transition: border-color 0.2s;
      }
      .field-input:focus { border-color: var(--primary); }

      /* Confirmation */
      .confirmation {
        display: flex; flex-direction: column; align-items: center;
        padding: 48px 24px; gap: 16px; text-align: center;
      }
      .confirm-icon { font-size: 72px; }
      .confirm-title { margin: 0; font-size: 28px; font-weight: 800; }
      .confirm-sub   { margin: 0; font-size: 14px; color: var(--text-secondary); }
      .confirm-card {
        width: 100%;
        background: rgba(22,34,49,0.7);
        border: 1px solid rgba(255,255,255,0.07);
        border-radius: 16px; padding: 16px;
        display: flex; flex-direction: column; gap: 10px;
        text-align: left;
      }
      .confirm-row { display: flex; justify-content: space-between; font-size: 14px; color: var(--text-secondary); }
      .confirm-val  { font-weight: 700; color: var(--text-primary); }
      .confirm-note {
        display: flex; gap: 10px; align-items: flex-start;
        background: rgba(44,90,133,0.12);
        border: 1px solid rgba(44,90,133,0.25);
        border-radius: 10px; padding: 14px;
        font-size: 13px; color: var(--text-secondary); line-height: 1.5;
        text-align: left;
      }
      .spinner {
        display: inline-block; width: 22px; height: 22px;
        border: 2px solid rgba(255,255,255,0.3);
        border-top-color: #fff; border-radius: 50%;
        animation: spin 0.7s linear infinite;
      }
      @keyframes spin { to { transform: rotate(360deg); } }
    `}} />
  );
}
