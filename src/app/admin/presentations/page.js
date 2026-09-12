'use client';

import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { auth } from '@/lib/firebase';
import styles from './presentations.module.css';

const blankProfile = {
  slug: '', partnerName: '', shortName: '', websiteUrl: '', logoUrl: '', primaryColor: '#00E5FF', secondaryColor: '#00FFA3', warningColor: '#FF6B00', heroScene: 'network', status: 'draft', contactName: 'Kyle Saffy', contactEmail: 'kyle@creamtech.co.za', contactWebsite: 'creamtech.co.za',
};

const field = (name, label, type = 'text') => ({ name, label, type });
const fields = [field('partnerName','Partner company'), field('shortName','Short display name'), field('slug','Presentation URL slug'), field('websiteUrl','Client website URL','url'), field('logoUrl','Approved logo URL','url'), field('contactName','Presenter'), field('contactEmail','Contact email','email'), field('contactWebsite','Contact website')];

export default function PresentationAdminPage() {
  const { user, loading } = useAuth();
  const [profiles, setProfiles] = useState([]);
  const [form, setForm] = useState(blankProfile);
  const [notice, setNotice] = useState('');
  const [loadingProfiles, setLoadingProfiles] = useState(false);
  const [previewing, setPreviewing] = useState(false);

  const token = async () => auth.currentUser ? auth.currentUser.getIdToken() : null;
  const api = async (url, options = {}) => {
    const idToken = await token();
    if (!idToken) throw new Error('Sign in with an authorised CREAM account to manage presentation links.');
    const response = await fetch(url, { ...options, headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}`, ...(options.headers || {}) } });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'The request could not be completed.');
    return data;
  };
  const load = async () => {
    if (!auth.currentUser) return;
    setLoadingProfiles(true);
    try { setProfiles((await api('/api/presentations')).profiles); setNotice(''); }
    catch (error) { setNotice(error.message); }
    finally { setLoadingProfiles(false); }
  };
  useEffect(() => { if (user) load(); }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  const presentationUrl = useMemo(() => form.slug ? `/p/${form.slug.toLowerCase().replace(/[^a-z0-9-]/g,'-')}` : '/p/your-company', [form.slug]);
  const change = (event) => setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  const save = async (event) => { event.preventDefault(); try { const data = await api('/api/presentations', { method: 'POST', body: JSON.stringify(form) }); setForm(data.profile); setNotice(`Saved. Your live presentation URL is ${window.location.origin}/p/${data.profile.slug}`); await load(); } catch (error) { setNotice(error.message); } };
  const inspectSite = async () => { if (!form.websiteUrl) { setNotice('Enter a public client website URL first.'); return; } setPreviewing(true); try { const data = await api('/api/presentations/brand-preview', { method: 'POST', body: JSON.stringify({ websiteUrl: form.websiteUrl }) }); setForm((current) => ({ ...current, partnerName: current.partnerName || data.title, shortName: current.shortName || data.title, logoUrl: current.logoUrl || data.logoCandidate, primaryColor: /^#[0-9a-f]{6}$/i.test(data.themeColor) ? data.themeColor : current.primaryColor })); setNotice('Brand cues imported for review. Confirm logo rights and colours before publishing.'); } catch (error) { setNotice(error.message); } finally { setPreviewing(false); } };
  const remove = async (slug) => { if (!window.confirm(`Remove ${slug}? This cannot be undone.`)) return; try { await api('/api/presentations', { method: 'DELETE', body: JSON.stringify({ slug }) }); setProfiles((items) => items.filter((item) => item.slug !== slug)); if (form.slug === slug) setForm(blankProfile); } catch (error) { setNotice(error.message); } };

  if (loading) return <main className={styles.loading}>Checking secure access…</main>;
  if (!user) return <main className={styles.gate}><div><span>CREAM / PRESENTATION CONTROL</span><h1>Administrator sign-in required.</h1><p>Use an authorised CREAM Firebase account. Production access is granted through a Firebase custom claim or the server-side <code>PRESENTATION_ADMIN_EMAILS</code> allowlist.</p><a href="/login">Go to SafeLink sign in</a></div></main>;

  return <main className={styles.admin}><header><div><span>CREAM / PRESENTATION CONTROL</span><h1>Partner presentation links</h1></div><a href="/p/security-brokers" target="_blank" rel="noreferrer">Open demo ↗</a></header><div className={styles.layout}><section className={styles.editor}><div className={styles.editorTitle}><div><span>CONFIGURATION</span><h2>{form.slug ? `/${form.slug}` : 'New partner profile'}</h2></div><button onClick={() => setForm(blankProfile)}>+ New profile</button></div><form onSubmit={save}>{fields.map((input) => <label key={input.name}>{input.label}<input type={input.type} name={input.name} value={form[input.name] || ''} onChange={change} required={['partnerName','slug'].includes(input.name)} /></label>)}<div className={styles.brandRow}><label>Primary colour<input type="color" name="primaryColor" value={form.primaryColor} onChange={change} /></label><label>Sentinel teal<input type="color" name="secondaryColor" value={form.secondaryColor} onChange={change} /></label><label>Warning orange<input type="color" name="warningColor" value={form.warningColor} onChange={change} /></label></div><label>Presentation status<select name="status" value={form.status} onChange={change}><option value="draft">Draft: private configuration only</option><option value="published">Published: route visible to prospects</option></select></label><div className={styles.actions}><button type="button" className={styles.secondary} onClick={inspectSite} disabled={previewing}>{previewing ? 'Inspecting…' : 'Inspect website cues'}</button><button type="submit" className={styles.primary}>Save profile</button></div></form>{notice && <p className={styles.notice}>{notice}</p>}<div className={styles.routePreview}><span>CLIENT URL</span><strong>{presentationUrl}</strong><small>Only published profiles resolve publicly.</small></div></section><aside className={styles.list}><div><span>ACTIVE PROFILES</span><button onClick={load} disabled={loadingProfiles}>{loadingProfiles ? 'Loading…' : 'Refresh'}</button></div>{profiles.length === 0 && <p>No saved profiles yet.</p>}{profiles.map((profile) => <article key={profile.slug} className={form.slug === profile.slug ? styles.selected : ''}><button className={styles.profileButton} onClick={() => setForm(profile)}><span>{profile.status}</span><strong>{profile.partnerName}</strong><small>/p/{profile.slug}</small></button><div><a href={`/p/${profile.slug}`} target="_blank" rel="noreferrer">Preview</a><button onClick={() => remove(profile.slug)}>Remove</button></div></article>)}</aside></div></main>;
}
