'use client';

/**
 * Reusable "Coming Soon" placeholder for feature-flagged sections.
 */
export default function ComingSoon({ icon = '🚀', title, description, accentColor = 'var(--primary)' }) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '60vh',
      padding: '40px 24px',
      textAlign: 'center',
      gap: 20,
    }}>
      {/* Glowing icon */}
      <div style={{
        width: 100,
        height: 100,
        borderRadius: '50%',
        background: `radial-gradient(circle, ${accentColor}22, ${accentColor}08)`,
        border: `2px solid ${accentColor}44`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 44,
        boxShadow: `0 0 30px ${accentColor}33`,
        animation: 'cs-pulse 3s ease-in-out infinite',
      }}>
        {icon}
      </div>

      {/* Badge */}
      <div style={{
        backgroundColor: `${accentColor}22`,
        color: accentColor,
        border: `1px solid ${accentColor}44`,
        borderRadius: 20,
        padding: '4px 14px',
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: 1.5,
        textTransform: 'uppercase',
      }}>
        Coming Soon
      </div>

      <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: 'var(--text-primary)' }}>
        {title}
      </h2>

      <p style={{
        margin: 0,
        fontSize: 14,
        color: 'var(--text-secondary)',
        lineHeight: 1.6,
        maxWidth: 280,
      }}>
        {description}
      </p>

      <div style={{
        marginTop: 8,
        background: 'rgba(255,255,255,0.04)',
        borderRadius: 12,
        border: '1px solid rgba(255,255,255,0.08)',
        padding: '12px 20px',
        fontSize: 13,
        color: 'var(--text-secondary)',
      }}>
        🔔 You will be notified when this feature launches
      </div>

      <style>{`
        @keyframes cs-pulse {
          0%, 100% { transform: scale(1); box-shadow: 0 0 30px ${accentColor}33; }
          50% { transform: scale(1.05); box-shadow: 0 0 50px ${accentColor}55; }
        }
      `}</style>
    </div>
  );
}
