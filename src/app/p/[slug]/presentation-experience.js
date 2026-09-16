'use client';

/* eslint-disable @next/next/no-img-element */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import styles from './presentation.module.css';

const slides = [
  { id: 'signal', kicker: '', eyebrow: 'WHITE-LABEL SECURITY PLATFORM', title: 'The operating system for private security.', body: 'Your brand. Your control room. Modern safety and recurring margins.', type: 'hero' },
  { id: 'choice', kicker: '01 / THE DECISION', title: 'Own the relationship. Skip the build trap.', body: 'SafeLink lets a security company deploy a branded native experience in weeks, without becoming a software house.', type: 'choice' },
  { id: 'touchpoints', kicker: '02 / CUSTOMER APP', title: 'One client app. Four daily reasons to stay.', body: 'Service, accounts, safety and family visibility live inside your brand.', type: 'modules' },
  { id: 'sos', kicker: '03 / DUAL-ROUTE SOS', title: 'Local response first. Coverage wherever the client goes.', body: 'SafeLink connects your control room to Aura’s national responder network while protecting local response income.', type: 'flow' },
  { id: 'advantage', kicker: '04 / MARKET POSITION', title: 'A partner platform with an edge that is difficult to copy.', body: 'White-label ownership, dual-route response, Sentinel hardware and Family Radar sit in one operating model.', type: 'matrix' },
  { id: 'sentinel', kicker: '05 / SENTINEL IOT', title: 'A hardware bridge that stays on when infrastructure does not.', body: 'Battery-powered SOS, vehicle, pet and asset devices turn safety into a retail opportunity inside the app.', type: 'hardware' },
  { id: 'backbone', kicker: '06 / CREAM TECHNOLOGIES', title: 'Engineering credibility behind every alert.', body: 'National deployments, enterprise operational systems, resilient Firebase architecture and POPIA-aware delivery.', type: 'backbone' },
  { id: 'economics', kicker: '07 / PARTNER ECONOMICS', title: 'Three revenue streams. One stronger client relationship.', body: 'Subscription share, fleet call-out reimbursement and Sentinel hardware margins compound over time.', type: 'economics' },
  { id: 'next', kicker: '08 / NEXT STEP', title: 'A two-week route to a branded security experience.', body: 'Start with a control-room integration session, then package brand assets and prepare app-store deployment.', type: 'next' },
];

const featureModules = [
  ['01', 'SERVICE & MAINTENANCE', 'Book technicians, gate repairs and alarm upgrades without dispatcher bottlenecks.'],
  ['02', 'ACCOUNTS & BILLING', 'Check balances, review invoices, retrieve statements and settle payments in app.'],
  ['03', 'DUAL-ROUTE SOS', 'Send GPS telemetry to the local control room, with an automated nationwide fallback.'],
  ['04', 'FAMILY RADAR', 'Live household visibility with Home, School and Work geofence notifications.'],
];

const presentationVars = (profile) => ({
  '--partner-primary': profile.primaryColor,
  '--partner-secondary': profile.secondaryColor,
  '--partner-warning': profile.warningColor,
});

function GlobeCanvas({ accent, secondary }) {
  const canvasRef = useRef(null);
  const motionRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    let frame;
    let width = 0;
    let height = 0;
    let rotation = 0;
    const stars = Array.from({ length: 94 }, (_, i) => ({ x: ((i * 71) % 100) / 100, y: ((i * 43) % 100) / 100, r: i % 9 === 0 ? 1.4 : 0.7, alpha: 0.15 + (i % 5) * 0.1 }));
    const nodes = [
      [-0.55, -0.08], [-0.29, 0.24], [-0.07, -0.32], [0.14, 0.15], [0.38, -0.1], [0.56, 0.28], [0.08, 0.44], [-0.43, -0.35], [0.42, -0.4],
    ];

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = rect.width; height = rect.height;
      canvas.width = width * dpr; canvas.height = height * dpr;
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const draw = () => {
      rotation += 0.0018;
      context.clearRect(0, 0, width, height);
      stars.forEach((star) => {
        context.fillStyle = `rgba(226, 248, 255, ${star.alpha})`;
        context.beginPath(); context.arc(star.x * width, star.y * height, star.r, 0, Math.PI * 2); context.fill();
      });

      const radius = Math.min(width, height) * 0.29;
      const cx = width * (0.68 + motionRef.current.x * 0.025);
      const cy = height * (0.48 + motionRef.current.y * 0.025);
      const planet = context.createRadialGradient(cx - radius * 0.35, cy - radius * 0.3, radius * 0.08, cx, cy, radius * 1.15);
      planet.addColorStop(0, 'rgba(76, 193, 255, 0.92)');
      planet.addColorStop(0.42, 'rgba(16, 93, 150, 0.86)');
      planet.addColorStop(0.77, 'rgba(3, 22, 56, 0.94)');
      planet.addColorStop(1, 'rgba(1, 5, 19, 0)');
      context.fillStyle = planet; context.beginPath(); context.arc(cx, cy, radius, 0, Math.PI * 2); context.fill();

      context.save(); context.beginPath(); context.arc(cx, cy, radius * 0.97, 0, Math.PI * 2); context.clip();
      context.strokeStyle = 'rgba(190, 239, 255, 0.18)'; context.lineWidth = 0.7;
      for (let row = -3; row <= 3; row += 1) {
        context.beginPath();
        for (let step = -1; step <= 1.04; step += 0.04) {
          const x = cx + step * radius;
          const y = cy + row * radius * 0.22 + Math.sin(step * Math.PI + rotation) * radius * 0.055;
          if (step === -1) context.moveTo(x, y); else context.lineTo(x, y);
        }
        context.stroke();
      }
      context.restore();

      const projected = nodes.map(([nx, ny], index) => {
        const wave = Math.sin(rotation * 1.4 + index) * 0.035;
        return { x: cx + (nx + wave) * radius * 1.56, y: cy + ny * radius * 1.35 };
      });
      context.lineWidth = 1;
      projected.forEach((node, index) => {
        const target = projected[(index + 3) % projected.length];
        context.strokeStyle = index % 2 ? `${accent}99` : `${secondary}88`;
        context.beginPath();
        context.moveTo(node.x, node.y);
        const controlX = (node.x + target.x) / 2;
        const controlY = Math.min(node.y, target.y) - radius * (0.35 + (index % 3) * 0.1);
        context.quadraticCurveTo(controlX, controlY, target.x, target.y);
        context.stroke();
      });
      projected.forEach((node, index) => {
        context.fillStyle = index % 2 ? accent : secondary;
        context.shadowBlur = 16; context.shadowColor = index % 2 ? accent : secondary;
        context.beginPath(); context.arc(node.x, node.y, index % 3 === 0 ? 4 : 2.4, 0, Math.PI * 2); context.fill();
      });
      context.shadowBlur = 0;
      frame = requestAnimationFrame(draw);
    };

    const move = (event) => {
      const rect = canvas.getBoundingClientRect();
      motionRef.current = { x: (event.clientX - rect.left) / rect.width - 0.5, y: (event.clientY - rect.top) / rect.height - 0.5 };
    };
    resize(); draw(); window.addEventListener('resize', resize); canvas.addEventListener('pointermove', move);
    return () => { cancelAnimationFrame(frame); window.removeEventListener('resize', resize); canvas.removeEventListener('pointermove', move); };
  }, [accent, secondary]);

  return <canvas ref={canvasRef} className={styles.globeCanvas} aria-hidden="true" />;
}

function SlideContent({ slide, profile, households, setHouseholds, goTo }) {
  if (slide.type === 'hero') {
    return <div className={styles.heroLayout}>
      <div className={styles.heroCopy}>
        <div className={styles.systemLabel}><span className={styles.liveDot} /> PRIVATE SECURITY / PLATFORM PRESENTATION</div>
        <div className={styles.heroPartners}>
          {profile.logoUrl ? <img src={profile.logoUrl} alt={`${profile.partnerName} logo`} width={148} height={44} className={styles.partnerLogo} /> : <span className={styles.partnerWordmark}>{profile.partnerName}</span>}
          <span className={styles.xMark}>×</span><img src="/presentation/safelink-logo-horizontal.png" alt="SafeLink" className={styles.safeLinkLogo} />
        </div>
        <h1>{slide.title}</h1><p>{slide.body}</p>
        <div className={styles.heroActions}><button onClick={() => goTo(1)} className={styles.primaryAction}>Explore the platform <span>↘</span></button><a href="https://safelink-app-peach.vercel.app/" target="_blank" rel="noopener noreferrer" className={styles.underActionLink}>SafeLink Web-site <span className={styles.linkArrow}>↗</span></a></div>
      </div>
      <div className={styles.heroFullBackground} aria-hidden="true"><img src="/presentation/globe-network.jpeg" alt="" className={styles.heroFullBackgroundImage} /><div className={styles.heroBackgroundGradient} /></div><div className={styles.globeCaptionWrap}><div className={styles.globeCaption}><span>01</span><strong>SAFETY WITHOUT BORDERS</strong><small>Dual-route dispatch • connected response</small></div></div>
    </div>;
  }
  if (slide.type === 'choice') return <div className={styles.twoColumn}>
    <article className={`${styles.strategyCard} ${styles.warningCard}`}><span>THE BUILD TRAP</span><h3>R300k–R600k+</h3><p>Custom native development, 9–12 months to market, app-store compliance and permanent DevOps overhead.</p><div className={styles.cardMeasure}><b>9–12</b><small>months before launch</small></div></article>
    <article className={`${styles.strategyCard} ${styles.successCard}`}><span>THE WHITE-LABEL EDGE</span><h3>Partner-owned apps in weeks.</h3><p>Native iOS and Android deployment under your company name, with a standard control-room integration path.</p><ul><li>Immediate client retention</li><li>Zero development overhead</li><li>Brand stays in your hands</li></ul></article>
  </div>;
  if (slide.type === 'modules') return <div className={styles.moduleGrid}>{featureModules.map(([number, title, description], index) => <article key={title} className={`${styles.moduleCard} ${index === 2 ? styles.featuredModule : ''}`}><span>{number}</span><h3>{title}</h3><p>{description}</p><i>↗</i></article>)}</div>;
  if (slide.type === 'flow') return <div><div className={styles.dispatchPath}>{[['01','CLIENT SOS','Phone or Sentinel fob'],['02','LOCAL CONTROL ROOM','Your fleet has first call'],['03','AURA FALLBACK','Vetted responder nationwide'],['04','REIMBURSED RESPONSE','Local incident revenue']].map(([number,title,body], index) => <div key={title} className={styles.flowStep}><span>{number}</span><h3>{title}</h3><p>{body}</p>{index < 3 && <b>→</b>}</div>)}</div><aside className={styles.insightStrip}><span>COMMERCIAL EFFECT</span><strong>Your fleet remains the preferred local responder. Aura protects the client outside your territory.</strong></aside></div>;
  if (slide.type === 'matrix') return <div className={styles.matrixWrap}><table className={styles.matrix}><thead><tr><th>Feature</th><th>Namola</th><th>MyPanic</th><th>Corporate apps</th><th>Community apps</th><th>SafeLink</th></tr></thead><tbody>{[['White-labeling','—','—','—','—','100% partner brand'],['Response routing','Network','Network','Own fleet','Community','Local fleet + Aura'],['Local reimbursement','—','—','Internal','—','Reimbursed response'],['IoT catalogue','—','Limited','—','—','8-device Sentinel suite'],['Family Radar','—','—','Limited','—','Full family view']].map((row) => <tr key={row[0]}>{row.map((cell, index) => <td key={cell} className={index === 5 ? styles.highlightedCell : ''}>{cell}</td>)}</tr>)}</tbody></table></div>;
  if (slide.type === 'hardware') return <div className={styles.hardwareLayout}><div className={styles.hardwareVisual}><Image src="/presentation/earth-orbit.jpeg" alt="Connected global response network" fill sizes="(max-width: 900px) 100vw, 42vw" className={styles.hardwareImage} /><div className={styles.hardwareGlow} /><span className={styles.deviceRing}>SENTINEL<br />BLE / LTE</span></div><div className={styles.hardwarePoints}>{[['8 DEVICE CATALOGUE','Wearable SOS fobs, vehicle tags, pet monitors and asset trackers.'],['LOAD-SHEDDING INDEPENDENT','Two to 36-month battery life, independent of mains power and Wi-Fi.'],['IN-APP RETAIL','Zero stock holding with direct hardware margin on every sale.']].map(([title,copy],index)=><article key={title}><span>0{index+1}</span><div><h3>{title}</h3><p>{copy}</p></div></article>)}</div></div>;
  if (slide.type === 'backbone') return <div><div className={styles.credentialRow}>{[['16','YEARS','software architecture'],['1,000+','PEOPLE','national-scale systems'],['30+','SITES','automotive deployments']].map(([metric,label,copy])=><article key={metric}><strong>{metric}</strong><span>{label}</span><small>{copy}</small></article>)}</div><div className={styles.platformList}>{[['GUESTWAVE','National ordering and guest automation platform.'],['SPORTAL','High-volume school administration infrastructure.'],['NANOTECH','Operational platform across automotive dealerships.'],['INFRASTRUCTURE','Firebase resilience, dispatch adapters, encryption and POPIA-aware delivery.']].map(([name,copy])=><div key={name}><span>{name}</span><p>{copy}</p></div>)}</div></div>;
  if (slide.type === 'economics') { const value = Math.round(households * 52.5); return <div><div className={styles.revenueCards}>{[['SUBSCRIPTION SHARE','R35 Standard / R70 Premium retained per active user.'],['FLEET CALL-OUTS','Per-incident reimbursement for local Aura-routed response.'],['SENTINEL MARGIN','Retail and commission margin from every accessory sale.']].map(([title,copy],index)=><article key={title}><span>0{index+1}</span><h3>{title}</h3><p>{copy}</p></article>)}</div><section className={styles.calculator}><div><span>ACTIVE HOUSEHOLDS</span><strong>{households.toLocaleString()}</strong></div><input aria-label="Active household count" type="range" min="250" max="5000" step="250" value={households} onChange={(event)=>setHouseholds(Number(event.target.value))} /><div><span>MONTHLY SUBSCRIPTION MARGIN</span><strong>R{value.toLocaleString()}</strong><small>R{(value * 12).toLocaleString()} annually</small></div></section></div>; }
  return <div className={styles.nextLayout}><div className={styles.rolloutSteps}>{[['01','CONTROL-ROOM INTEGRATION','Confirm the dispatch adapter and response workflow.'],['02','WHITE-LABEL PACKAGING','Apply brand, colour, store assets and presentation link.'],['03','APP-STORE DEPLOYMENT','Prepare the branded iOS and Android release.']].map(([n,t,c])=><article key={n}><span>{n}</span><div><h3>{t}</h3><p>{c}</p></div></article>)}</div><aside className={styles.ctaCard}><span>READY WHEN YOU ARE</span><h2>Schedule a 20-minute product session.</h2><p>Product walkthrough and Q&A with CREAM.</p><a href={`mailto:${profile.contactEmail}?subject=SafeLink presentation request`}>Request a session <b>↗</b></a></aside></div>;
}

export default function PresentationExperience({ profile }) {
  const [active, setActive] = useState(0);
  const [households, setHouseholds] = useState(2000);
  const [menuOpen, setMenuOpen] = useState(false);
  const touchStart = useRef(null);
  const activeSlide = slides[active];
  const profileStyle = useMemo(() => presentationVars(profile), [profile]);
  const goTo = useCallback((index) => setActive(Math.max(0, Math.min(slides.length - 1, index))), []);

  useEffect(() => {
    const onKey = (event) => { if (event.key === 'ArrowRight' || event.key === 'ArrowDown' || event.key === ' ') { event.preventDefault(); goTo(active + 1); } if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') { event.preventDefault(); goTo(active - 1); } if (event.key === 'Escape') setMenuOpen(false); };
    window.addEventListener('keydown', onKey); return () => window.removeEventListener('keydown', onKey);
  }, [active, goTo]);

  return <main className={styles.presentation} style={profileStyle} onTouchStart={(e)=>{touchStart.current=e.changedTouches[0].clientX;}} onTouchEnd={(e)=>{if(touchStart.current===null)return; const delta=e.changedTouches[0].clientX-touchStart.current; if(Math.abs(delta)>60)goTo(active+(delta<0?1:-1)); touchStart.current=null;}}>
    <div className={styles.ambient} /><div className={styles.grid} />
    <header className={styles.topbar}><div className={styles.brandMark}><span className={styles.cream}>CREAM</span><span>TECHNOLOGIES</span></div><div className={styles.partnerBadge}>{profile.logoUrl ? <img src={profile.logoUrl} alt="" width={80} height={24} /> : profile.shortName}<em>×</em>SafeLink</div><button className={styles.menuButton} onClick={()=>setMenuOpen(!menuOpen)} aria-expanded={menuOpen}>INDEX <span>0{active + 1}/0{slides.length}</span></button></header>
    <nav className={`${styles.slideMenu} ${menuOpen ? styles.slideMenuOpen : ''}`} aria-label="Presentation slides">{slides.map((slide,index)=><button key={slide.id} className={index===active?styles.activeMenuItem:''} onClick={()=>{goTo(index);setMenuOpen(false);}}><span>0{index+1}</span>{slide.kicker ? slide.kicker.replace(/^\d+ \/ /,'') : 'OVERVIEW'}</button>)}</nav>
    <section className={styles.stage}><div className={styles.copyHeader}>{activeSlide.kicker ? <span>{activeSlide.kicker}</span> : null}{activeSlide.type !== 'hero' && <><h2>{activeSlide.title}</h2><p>{activeSlide.body}</p></>}</div><div className={`${styles.slideBody} ${styles[`body${activeSlide.type[0].toUpperCase()}${activeSlide.type.slice(1)}`]}`} key={activeSlide.id}><SlideContent slide={activeSlide} profile={profile} households={households} setHouseholds={setHouseholds} goTo={goTo} /></div></section>
    <footer className={styles.controls}><div className={styles.controlHint}>← → <span>KEYBOARD NAVIGATION</span></div><div className={styles.progress}>{slides.map((slide,index)=><button aria-label={`Go to slide ${index+1}`} key={slide.id} onClick={()=>goTo(index)} className={index===active?styles.activeProgress:''} />)}</div><div className={styles.controlHint}>{profile.contactWebsite}</div></footer>
  </main>;
}
