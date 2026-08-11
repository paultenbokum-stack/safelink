'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { createIncident, resolveIncident, getHousehold } from '@/lib/db';
import AuthGuard from '@/app/components/AuthGuard';
import BottomNav from '@/app/components/BottomNav';

const HOLD_DURATION = 3000; // ms to hold

export default function SOSPage() {
  return (
    <AuthGuard>
      <SOSContent />
    </AuthGuard>
  );
}

function SOSContent() {
  const { user }  = useAuth();
  const router    = useRouter();

  const [phase, setPhase]           = useState('idle');  // idle | holding | active | cancelling
  const [progress, setProgress]     = useState(0);       // 0-100
  const [incidentId, setIncidentId] = useState(null);
  const [household, setHousehold]   = useState(null);
  const [location, setLocation]     = useState(null);
  const [error, setError]           = useState('');

  const holdTimerRef  = useRef(null);
  const progressRef   = useRef(null);
  const startTimeRef  = useRef(null);

  useEffect(() => {
    if (user) {
      getHousehold(user.uid).then(setHousehold).catch(() => {});
    }
    // Attempt to get location early
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        pos => setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => {},
        { timeout: 5000 }
      );
    }
  }, [user]);

  const startHold = useCallback(() => {
    if (phase !== 'idle') return;
    setPhase('holding');
    setProgress(0);
    startTimeRef.current = Date.now();

    progressRef.current = setInterval(() => {
      const elapsed = Date.now() - startTimeRef.current;
      const pct = Math.min((elapsed / HOLD_DURATION) * 100, 100);
      setProgress(pct);
      if (pct >= 100) {
        clearInterval(progressRef.current);
        triggerSOS();
      }
    }, 30);
  }, [phase]);

  const cancelHold = useCallback(() => {
    if (phase !== 'holding') return;
    clearInterval(progressRef.current);
    setPhase('idle');
    setProgress(0);
  }, [phase]);

  const triggerSOS = async () => {
    setPhase('active');
    try {
      const id = await createIncident(user.uid, {
        type: 'SOS',
        location,
        address: household?.address || null,
        householdName: household?.householdName || null,
        phone: household?.phone || null,
        triggeredAt: new Date().toISOString(),
      });
      setIncidentId(id);
    } catch (err) {
      setError('SOS logged — contact armed response directly if needed.');
      console.error(err);
    }
  };

  const cancelSOS = async () => {
    setPhase('cancelling');
    if (incidentId) {
      try {
        await resolveIncident(incidentId);
      } catch (err) {
        console.error(err);
      }
    }
    setIncidentId(null);
    setPhase('idle');
    setProgress(0);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearInterval(progressRef.current);
    };
  }, []);

  const circumference = 2 * Math.PI * 52; // radius=52

  return (
    <div className="sos-page">
      {phase !== 'active' ? (
        <>
          {/* Header */}
          <div className="sos-header">
            <button className="back-btn" onClick={() => router.push('/dashboard')}>← Home</button>
            <div className="sos-header-title">Emergency SOS</div>
          </div>

          {/* Main button area */}
          <div className="sos-centre">
            <div className="sos-instruction">
              {phase === 'idle' ? 'Hold the button for 3 seconds to activate' : 'Keep holding…'}
            </div>

            {/* Hold button with SVG progress ring */}
            <div
              className="sos-hold-wrapper"
              onMouseDown={startHold}
              onMouseUp={cancelHold}
              onMouseLeave={cancelHold}
              onTouchStart={startHold}
              onTouchEnd={cancelHold}
              style={{ userSelect: 'none', WebkitUserSelect: 'none' }}
            >
              <svg className="progress-ring" width="130" height="130" viewBox="0 0 130 130">
                {/* Background ring */}
                <circle cx="65" cy="65" r="52" fill="none" stroke="rgba(229,62,62,0.15)" strokeWidth="6" />
                {/* Progress ring */}
                <circle
                  cx="65" cy="65" r="52" fill="none"
                  stroke="var(--emergency, #e53e3e)"
                  strokeWidth="6"
                  strokeDasharray={circumference}
                  strokeDashoffset={circumference - (progress / 100) * circumference}
                  strokeLinecap="round"
                  transform="rotate(-90 65 65)"
                  style={{ transition: 'stroke-dashoffset 0.03s linear' }}
                />
              </svg>
              <button className={`sos-hold-btn ${phase === 'holding' ? 'holding' : ''}`}>
                <span className="sos-hold-label">SOS</span>
                <span className="sos-hold-sub">{phase === 'holding' ? `${Math.round(progress)}%` : 'Hold'}</span>
              </button>
            </div>

            {/* Pulse rings (idle only) */}
            {phase === 'idle' && (
              <>
                <div className="sos-pulse-ring ring-1" />
                <div className="sos-pulse-ring ring-2" />
              </>
            )}

            {error && <div className="sos-error">{error}</div>}
          </div>

          {/* Quick call options */}
          <div className="quick-calls">
            <div className="qc-title">Direct Emergency Lines</div>
            <div className="qc-grid">
              <a href="tel:10111" className="qc-btn qc-red">
                <span className="qc-icon">🚔</span>
                <span className="qc-label">Police</span>
                <span className="qc-number">10111</span>
              </a>
              <a href="tel:10177" className="qc-btn qc-blue">
                <span className="qc-icon">🚑</span>
                <span className="qc-label">Ambulance</span>
                <span className="qc-number">10177</span>
              </a>
              <a href="tel:112" className="qc-btn qc-orange">
                <span className="qc-icon">🔥</span>
                <span className="qc-label">Fire Dept</span>
                <span className="qc-number">112</span>
              </a>
              {household?.emergency?.phone && (
                <a href={`tel:${household.emergency.phone}`} className="qc-btn qc-green">
                  <span className="qc-icon">👤</span>
                  <span className="qc-label">{household.emergency.name || 'Emergency Contact'}</span>
                  <span className="qc-number">{household.emergency.phone}</span>
                </a>
              )}
            </div>
          </div>
        </>
      ) : (
        /* ── ACTIVE SOS SCREEN ── */
        <div className="active-sos">
          <div className="active-sos-pulse-container">
            <div className="active-pulse ring-a" />
            <div className="active-pulse ring-b" />
            <div className="active-pulse ring-c" />
            <div className="active-sos-icon">🚨</div>
          </div>

          <div className="active-title">SOS ACTIVATED</div>
          <div className="active-sub">Armed response has been notified</div>

          {incidentId && (
            <div className="incident-badge">
              Incident ID: #{incidentId.slice(0, 8).toUpperCase()}
            </div>
          )}

          <div className="active-info-list">
            {location && (
              <div className="active-info-row">
                <span>📍</span>
                <span>GPS location shared: {location.lat.toFixed(4)}, {location.lng.toFixed(4)}</span>
              </div>
            )}
            {household && (
              <div className="active-info-row">
                <span>🏠</span>
                <span>{household.address?.line1}, {household.address?.suburb}</span>
              </div>
            )}
            <div className="active-info-row">
              <span>⏱</span>
              <span>SOS signal active — stay on the line</span>
            </div>
          </div>

          <div className="active-emergency-numbers">
            <a href="tel:10111" className="emergency-call-btn">📞 Call Police (10111)</a>
            <a href="tel:10177" className="emergency-call-btn">📞 Call Ambulance (10177)</a>
          </div>

          <button className="cancel-sos-btn" onClick={cancelSOS}>
            ✕ Cancel SOS — I am safe
          </button>
        </div>
      )}

      <BottomNav />

      <style dangerouslySetInnerHTML={{ __html: `
        .sos-page {
          min-height: 100vh;
          background: var(--bg-dark, #0f1923);
          color: var(--text-primary, #fff);
          display: flex; flex-direction: column;
          padding-bottom: 90px;
        }
        .sos-header {
          display: flex; align-items: center; gap: 16px;
          padding: 24px 20px 0;
        }
        .back-btn { background: none; border: none; color: var(--accent); font-size: 14px; font-weight: 600; cursor: pointer; padding: 0; }
        .sos-header-title { font-size: 18px; font-weight: 800; color: var(--emergency, #e53e3e); }

        .sos-centre {
          display: flex; flex-direction: column; align-items: center;
          padding: 40px 20px; position: relative; flex: 1;
        }
        .sos-instruction {
          font-size: 14px; color: var(--text-secondary);
          text-align: center; margin-bottom: 40px;
          height: 20px;
        }

        .sos-hold-wrapper {
          position: relative; width: 130px; height: 130px;
          display: flex; align-items: center; justify-content: center;
          cursor: pointer;
        }
        .progress-ring { position: absolute; inset: 0; }
        .sos-hold-btn {
          width: 108px; height: 108px; border-radius: 50%;
          background: linear-gradient(135deg, #f56565, var(--emergency, #e53e3e));
          border: none; color: #fff; cursor: pointer; z-index: 10;
          display: flex; flex-direction: column; align-items: center; justify-content: center;
          box-shadow: 0 4px 24px rgba(229,62,62,0.5);
          transition: transform 0.1s, box-shadow 0.2s;
          gap: 2px;
        }
        .sos-hold-btn.holding { transform: scale(0.95); box-shadow: 0 2px 12px rgba(229,62,62,0.3); }
        .sos-hold-label { font-size: 28px; font-weight: 900; letter-spacing: 2px; }
        .sos-hold-sub   { font-size: 11px; color: rgba(255,255,255,0.8); font-weight: 600; }

        .sos-pulse-ring {
          position: absolute;
          width: 130px; height: 130px; border-radius: 50%;
          background: rgba(229,62,62,0.2);
          pointer-events: none;
        }
        .ring-1 { animation: pulse-ring 2s ease-out infinite; }
        .ring-2 { animation: pulse-ring 2s ease-out infinite 1s; }
        @keyframes pulse-ring {
          0%   { transform: scale(1); opacity: 0.6; }
          100% { transform: scale(1.8); opacity: 0; }
        }

        .sos-error {
          margin-top: 20px;
          background: rgba(229,62,62,0.15);
          border: 1px solid rgba(229,62,62,0.4);
          border-radius: 10px; padding: 12px; font-size: 13px; color: #fc8181;
          max-width: 320px; text-align: center;
        }

        .quick-calls { padding: 0 20px 20px; }
        .qc-title { font-size: 12px; font-weight: 700; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 1px; margin-bottom: 12px; }
        .qc-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
        .qc-btn {
          display: flex; flex-direction: column; align-items: center;
          padding: 14px 10px; border-radius: 14px; gap: 4px;
          text-decoration: none; color: #fff;
          border: 1px solid rgba(255,255,255,0.1);
          transition: opacity 0.2s;
        }
        .qc-btn:active { opacity: 0.8; }
        .qc-red    { background: rgba(229,62,62,0.15); border-color: rgba(229,62,62,0.3); }
        .qc-blue   { background: rgba(66,153,225,0.15); border-color: rgba(66,153,225,0.3); }
        .qc-orange { background: rgba(221,107,32,0.15); border-color: rgba(221,107,32,0.3); }
        .qc-green  { background: rgba(56,161,105,0.15); border-color: rgba(56,161,105,0.3); }
        .qc-icon   { font-size: 22px; }
        .qc-label  { font-size: 11px; font-weight: 600; color: rgba(255,255,255,0.7); }
        .qc-number { font-size: 16px; font-weight: 800; }

        /* Active SOS */
        .active-sos {
          display: flex; flex-direction: column; align-items: center;
          padding: 48px 24px; gap: 20px; flex: 1; text-align: center;
        }
        .active-sos-pulse-container {
          position: relative; width: 120px; height: 120px;
          display: flex; align-items: center; justify-content: center;
        }
        .active-pulse {
          position: absolute; border-radius: 50%;
          background: rgba(229,62,62,0.3);
          animation: active-pulse 1.5s ease-out infinite;
        }
        .ring-a { width: 120px; height: 120px; }
        .ring-b { width: 120px; height: 120px; animation-delay: 0.5s; }
        .ring-c { width: 120px; height: 120px; animation-delay: 1s; }
        @keyframes active-pulse {
          0%   { transform: scale(1); opacity: 0.6; }
          100% { transform: scale(2.5); opacity: 0; }
        }
        .active-sos-icon { position: relative; z-index: 1; font-size: 52px; }
        .active-title { font-size: 32px; font-weight: 900; color: var(--emergency, #e53e3e); letter-spacing: 2px; }
        .active-sub   { font-size: 14px; color: var(--text-secondary); }
        .incident-badge {
          background: rgba(229,62,62,0.15);
          border: 1px solid rgba(229,62,62,0.3);
          padding: 6px 16px; border-radius: 20px;
          font-size: 12px; font-weight: 700; color: #fc8181; font-family: monospace;
        }
        .active-info-list { display: flex; flex-direction: column; gap: 10px; width: 100%; }
        .active-info-row {
          display: flex; align-items: flex-start; gap: 10px;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 10px; padding: 12px;
          font-size: 13px; text-align: left;
        }
        .active-emergency-numbers { display: flex; flex-direction: column; gap: 10px; width: 100%; }
        .emergency-call-btn {
          display: block; text-align: center;
          background: rgba(229,62,62,0.15);
          border: 1px solid rgba(229,62,62,0.3);
          border-radius: 12px; padding: 14px;
          color: #fc8181; font-size: 15px; font-weight: 700;
          text-decoration: none; transition: opacity 0.2s;
        }
        .emergency-call-btn:active { opacity: 0.8; }
        .cancel-sos-btn {
          width: 100%; padding: 15px;
          background: rgba(255,255,255,0.08);
          border: 1px solid rgba(255,255,255,0.2);
          border-radius: 14px; color: var(--text-secondary);
          font-size: 14px; font-weight: 700; cursor: pointer;
        }
      `}} />
    </div>
  );
}
