const integrations = [
  ['Patriot CMS', 'Ready (SIA DC-09)', 'Partner connection pending'],
  ['Listener CMS', 'Ready (REST API)', 'Partner API access and validation pending'],
  ['Aura Dispatch', 'API available', 'Partnership pending · UI demonstration only'],
  ['Ajax Hardware', 'Partner application required', 'Access not yet approved'],
  ...['HIKVision Cameras', 'Dahua Cameras', 'EZViz Cameras', 'Sage Accounting', 'Xero Accounting', 'Zoho Books', 'QuickBooks'].map(name => [name, 'Configured', 'Demo configuration · credentials and live validation pending']),
];

export default function PartnerIntegrations() {
  return <section className="glass-panel rounded-2xl p-5 border border-secondary/20"><div className="flex flex-wrap gap-2 justify-between items-center mb-3"><h2 className="text-xl font-bold">Partner Integrations</h2><span className="text-xs text-on-surface-variant">[Demo] Integration readiness</span></div><p className="text-xs text-on-surface-variant mb-4">Illustrative partner configuration. These statuses do not indicate active production connections.</p><div className="grid sm:grid-cols-2 gap-x-6">{integrations.map(([name, status, detail]) => <div key={name} className="py-3 border-t border-white/10"><div className="flex justify-between gap-2 text-sm"><strong>{name === 'Ajax Hardware' ? '⏳' : '✅'} {name}</strong><span className="text-secondary text-right">{status}</span></div><p className="text-[11px] text-on-surface-variant mt-1">[Demo] {detail}</p></div>)}</div></section>;
}
