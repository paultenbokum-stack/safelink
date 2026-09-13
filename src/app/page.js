import Image from 'next/image';
import Link from 'next/link';
import styles from './home.module.css';

export const metadata = {
  title: 'SafeLink | Connected safety for every family',
  description: 'One connected safety platform for panic alerts, family and device tracking, security company response, and national dispatch support.',
  openGraph: { title: 'SafeLink | Safety that moves with you', description: 'Connect people, security companies, responders and Sentinel tracking hardware through one safety platform.', type: 'website' },
};

const stats = [
  { value: '17,146', label: 'active security businesses', detail: 'registered and active in South Africa at 31 March 2025', source: 'PSiRA Annual Report 2024/25', href: 'https://www.psira.co.za/dmdocuments/PSIRA_Annual%20Report%202025_v24_061125.pdf' },
  { value: '1.3m', label: 'personal-property thefts', detail: 'estimated incidents experienced in South Africa during 2024/25', source: 'Statistics South Africa', href: 'https://www.statssa.gov.za/?p=18715' },
  { value: '2.4/day', label: 'ransom kidnappings', detail: '216 cases recorded by SAPS from January to March 2026', source: 'SAPS Q4 crime statistics', href: 'https://www.saps.gov.za/services/downloads/2025/2025-2026_-_4th_Quarter_WEB.pdf' },
  { value: '36.1%', label: 'feel safe after dark', detail: 'share of people who felt safe walking alone in their area at night', source: 'Statistics South Africa', href: 'https://www.statssa.gov.za/?PPN=P0341&SCH=74041&page_id=1856' },
];

const capabilities = [
  { number: '01', icon: 'emergency', title: 'One-tap panic', copy: 'Send an SOS with the person, location and incident context already connected—so the response journey can start immediately.' },
  { number: '02', icon: 'hub', title: 'Connected response', copy: 'Route incidents through the family circle, the customer’s security company and, where enabled, AURA’s nationwide response network.' },
  { number: '03', icon: 'radar', title: 'Live safety map', copy: 'Bring family members, phone GPS and Sentinel devices together on one permission-controlled map with current telemetry.' },
  { number: '04', icon: 'language', title: 'Tracking beyond home', copy: 'Use global-capable GPS and connected hardware wherever the selected device, mobile network and roaming coverage support it.' },
];

const audiences = [
  { icon: 'family_restroom', title: 'For families', copy: 'A calm, shared view of the people and things that matter—with consent at the centre.' },
  { icon: 'local_police', title: 'For security companies', copy: 'A branded digital layer for customers, subscriptions, devices, incidents, dispatch and service growth.' },
  { icon: 'sensors', title: 'For connected hardware', copy: 'Sentinel tags and trackers turn everyday valuables, vehicles and loved ones into visible safety signals.' },
];

export default function MarketingHome() {
  return (
    <main className={styles.site}>
      <header className={styles.navbar}>
        <Link href="/" className={styles.brand} aria-label="SafeLink home"><Image src="/safelink-shield.png" alt="" width={50} height={50} priority /><span><strong>SafeLink</strong><small>Connected safety</small></span></Link>
        <nav aria-label="Main navigation"><a href="#platform">Platform</a><a href="#network">Network</a><a href="#partners">For partners</a><a href="#contact">Contact</a></nav>
        <div className={styles.navActions}><Link href="/login?mode=partner" className={styles.portalLink}>Portal login</Link><Link href="/dashboard" className={styles.appLink}>Open SafeLink <span>↗</span></Link></div>
      </header>

      <section className={styles.hero}>
        <div className={styles.heroGlow} />
        <div className={styles.heroCopy}>
          <div className={styles.eyebrow}><span /> South African technology. Connected protection.</div>
          <h1>Safety that<br /><em>moves with you.</em></h1>
          <p>SafeLink connects people, security companies, emergency responders and intelligent tracking hardware through one beautifully simple platform.</p>
          <div className={styles.heroActions}><a href="mailto:kyle@creamtech.co.za?subject=SafeLink%20partnership%20enquiry" className={styles.primaryCta}>Partner with SafeLink <span>arrow_forward</span></a><a href="#platform" className={styles.secondaryCta}>Explore the platform</a></div>
          <div className={styles.trustLine}><span><i className="material-symbols-outlined">verified_user</i> Permission controlled</span><span><i className="material-symbols-outlined">location_on</i> Location aware</span><span><i className="material-symbols-outlined">bolt</i> Built for urgent moments</span></div>
        </div>
        <div className={styles.heroVisual} aria-label="SafeLink mobile safety platform preview">
          <div className={styles.orbitOne} /><div className={styles.orbitTwo} />
          <div className={styles.phone}>
            <div className={styles.phoneTop}><Image src="/safelink-shield.png" alt="SafeLink" width={36} height={36} /><span>Hi Kyle</span><i className="material-symbols-outlined">notifications</i></div>
            <div className={styles.sos}><span className="material-symbols-outlined">emergency</span><strong>SOS</strong></div><p>Tap for emergency assistance</p>
            <div className={styles.mapCard}><div className={styles.mapGrid} /><span className={`${styles.mapPin} ${styles.pinOne}`}><i /></span><span className={`${styles.mapPin} ${styles.pinTwo}`}><i /></span><div className={styles.liveBadge}><b /> 3 people &amp; devices live</div></div>
          </div>
          <div className={`${styles.signalCard} ${styles.responseCard}`}><span className="material-symbols-outlined">near_me</span><div><small>RESPONSE CONNECTED</small><strong>Nearest unit notified</strong></div></div>
          <div className={`${styles.signalCard} ${styles.trackerCard}`}><Image src="/products/aura-pebble-cutout.png" alt="Sentinel personal tracker" width={72} height={72} /><div><small>SENTINEL PEBBLE</small><strong>Live · 84% battery</strong></div></div>
        </div>
      </section>

      <section className={styles.reality} id="network">
        <div className={styles.sectionIntro}><span className={styles.kicker}>The reality</span><h2>Personal safety cannot stop at the property line.</h2><p>South Africa has deep security capability. SafeLink creates the digital thread that helps connect it to people wherever life takes them.</p></div>
        <div className={styles.statsGrid}>{stats.map(stat => <article key={stat.label} className={styles.statCard}><strong>{stat.value}</strong><h3>{stat.label}</h3><p>{stat.detail}</p><a href={stat.href} target="_blank" rel="noreferrer">{stat.source} <span>↗</span></a></article>)}</div>
        <p className={styles.statNote}>Kidnapping circumstances vary. The daily figure shown is calculated from SAPS-recorded ransom-related cases for the stated 90-day period; it is not a claim about all missing persons or abductions.</p>
      </section>

      <section className={styles.platform} id="platform">
        <div className={styles.sectionIntro}><span className={styles.kicker}>One connected platform</span><h2>From a moment of danger<br />to a coordinated response.</h2></div>
        <div className={styles.capabilityGrid}>{capabilities.map(item => <article key={item.number} className={styles.capabilityCard}><span className={styles.cardNumber}>{item.number}</span><div className={styles.iconBox}><span className="material-symbols-outlined">{item.icon}</span></div><h3>{item.title}</h3><p>{item.copy}</p></article>)}</div>
      </section>

      <section className={styles.dispatchSection}>
        <div className={styles.dispatchVisual}><div className={styles.dispatchMap} /><span className={`${styles.pulsePoint} ${styles.pulseA}`} /><span className={`${styles.pulsePoint} ${styles.pulseB}`} /><span className={`${styles.pulsePoint} ${styles.pulseC}`} />
          <div className={styles.dispatchPanel}><small>LIVE INCIDENT FLOW</small><div><span className="material-symbols-outlined">person_pin_circle</span><p><b>Member location</b><em>Verified GPS signal</em></p><i>01</i></div><div><span className="material-symbols-outlined">shield</span><p><b>Security partner</b><em>Local response layer</em></p><i>02</i></div><div><span className="material-symbols-outlined">near_me</span><p><b>National dispatch</b><em>AURA integration pathway</em></p><i>03</i></div></div>
        </div>
        <div className={styles.dispatchCopy}><span className={styles.kicker}>Connected response</span><h2>Local relationships.<br />National reach.</h2><p>SafeLink gives a security company’s customers one place to call for help, share their live location and connect with the response network configured for their service.</p><ul><li><span className="material-symbols-outlined">check_circle</span> Your security company remains central to the customer relationship</li><li><span className="material-symbols-outlined">check_circle</span> AURA integration supports nationwide response coverage where available</li><li><span className="material-symbols-outlined">check_circle</span> Incident context and telemetry travel with the panic alert</li></ul><a href="https://aura.services/wp-content/uploads/2024/03/aura_global-digital-brochuredraft-5.pdf" target="_blank" rel="noreferrer">About AURA’s response network <span>↗</span></a></div>
      </section>

      <section className={styles.audiences} id="partners"><div className={styles.sectionIntro}><span className={styles.kicker}>A stronger safety ecosystem</span><h2>One platform. Three powerful connections.</h2></div><div className={styles.audienceGrid}>{audiences.map(item => <article key={item.title}><span className="material-symbols-outlined">{item.icon}</span><h3>{item.title}</h3><p>{item.copy}</p></article>)}</div></section>

      <section className={styles.partnerBanner}><div><span className={styles.kicker}>Security company portal</span><h2>Your brand. Your customers.<br />A more connected service.</h2><p>Once onboarded, security partners receive access to their SafeLink environment for customer, device and service operations.</p></div><div className={styles.partnerActions}><Link href="/login?mode=partner" className={styles.primaryCta}>Security partner login <span>login</span></Link><Link href="/company-signup" className={styles.secondaryCta}>Apply to become a partner</Link></div></section>

      <section className={styles.contact} id="contact"><div><span className={styles.kicker}>Build the network with us</span><h2>Let’s make safety<br />more connected.</h2></div><div className={styles.contactCards}><a href="mailto:kyle@creamtech.co.za?subject=SafeLink%20enquiry"><span className="material-symbols-outlined">mail</span><small>EMAIL</small><strong>kyle@creamtech.co.za</strong><i className="material-symbols-outlined">arrow_forward</i></a><a href="tel:+27721699422"><span className="material-symbols-outlined">call</span><small>CALL</small><strong>072 169 9422</strong><i className="material-symbols-outlined">arrow_forward</i></a></div></section>

      <footer className={styles.footer}><div className={styles.brand}><Image src="/safelink-shield.png" alt="" width={44} height={44} /><span><strong>SafeLink</strong><small>by CREAM Technologies</small></span></div><p>Connected safety for people, families and communities.</p><div><Link href="/terms">Terms</Link><Link href="/about">About</Link><Link href="/login">App login</Link></div><small>© {new Date().getFullYear()} CREAM Technologies. Service coverage and response are subject to partner availability, device connectivity and applicable service terms.</small></footer>
    </main>
  );
}
