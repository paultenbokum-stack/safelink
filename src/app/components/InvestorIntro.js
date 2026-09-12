export default function InvestorIntro() {
  return <div className="text-center space-y-4">
    <p className="text-lg font-semibold text-on-surface">Your safety ecosystem.<br /><span className="text-secondary">One app, every device, any response.</span></p>
    <div className="grid grid-cols-3 gap-2">
      {[
        ['📡', 'Live Sentinel GPS tracking'],
        ['🏘️', 'Community safety network'],
        ['🚨', 'Armed response dispatch'],
      ].map(([icon, label]) => <div key={label} className="glass-panel rounded-xl px-2 py-3 text-xs leading-relaxed text-on-surface-variant"><span className="block text-xl mb-1" aria-hidden="true">{icon}</span>{label}</div>)}
    </div>
  </div>;
}
