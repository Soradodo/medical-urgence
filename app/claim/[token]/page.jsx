'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';

const S = {
  wrap: { minHeight: '100vh', background: '#F5F5F5', fontFamily: "'DM Sans', system-ui, sans-serif" },
  header: { background: '#C0392B', color: '#fff', padding: '20px 24px' },
  main: { maxWidth: 600, margin: '0 auto', padding: '24px 16px' },
  card: { background: '#fff', borderRadius: 14, padding: '24px', boxShadow: '0 1px 6px rgba(0,0,0,.08)', marginBottom: 16 },
  input: { width: '100%', border: '2px solid #DDD', borderRadius: 10, padding: '12px 14px', fontSize: 15, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' },
  label: { fontSize: 12, fontWeight: 700, color: '#555', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6, display: 'block' },
  btn: { background: '#C0392B', color: '#fff', border: 'none', borderRadius: 12, padding: '16px', fontSize: 17, fontWeight: 800, cursor: 'pointer', width: '100%', marginTop: 8 },
  hint: { fontSize: 12, color: '#999', marginTop: 4 },
  center: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: 24, textAlign: 'center' },
};

export default function ClaimPage() {
  const { token } = useParams();
  const [status, setStatus] = useState('loading'); // loading | unclaimed | invalid | error
  const [form, setForm] = useState({});
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    checkStatus();
  }, [token]);

  async function checkStatus() {
    try {
      const res = await fetch(`/api/claim?token=${token}`);
      const json = await res.json();
      if (json.status === 'already_claimed') {
        window.location.href = `/u/${token}`;
        return;
      }
      if (json.status === 'unclaimed') { setStatus('unclaimed'); return; }
      setStatus('invalid');
    } catch {
      setStatus('error');
    }
  }

  function set(key) { return e => setForm(p => ({ ...p, [key]: e.target.value })); }

  async function submit() {
    if (!form.prenom || !form.nom) { setError('Prénom et nom sont obligatoires.'); return; }
    if (pin.length !== 4) { setError('Choisis un PIN à 4 chiffres.'); return; }
    setLoading(true); setError('');
    try {
      const res = await fetch('/api/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, pin, ...form }),
      });
      const d = await res.json();
      if (res.ok) {
        window.location.href = `/u/${token}`;
      } else {
        setError(d.error || 'Une erreur est survenue.');
      }
    } catch {
      setError('Une erreur est survenue.');
    }
    setLoading(false);
  }

  if (status === 'loading') return <div style={S.center}>Chargement…</div>;
  if (status === 'invalid') return (
    <div style={S.center}>
      <div style={{ fontSize: 48 }}>⚠️</div>
      <h1 style={{ color: '#C0392B', fontWeight: 800, marginTop: 12 }}>Puce invalide</h1>
      <p style={{ color: '#555', marginTop: 8 }}>Cette puce n'est associée à aucune fiche.</p>
    </div>
  );
  if (status === 'error') return (
    <div style={S.center}>
      <div style={{ fontSize: 48 }}>⚠️</div>
      <h1 style={{ color: '#C0392B', fontWeight: 800, marginTop: 12 }}>Erreur</h1>
      <p style={{ color: '#555', marginTop: 8 }}>Réessaie plus tard.</p>
    </div>
  );

  return (
    <div style={S.wrap}>
      <header style={S.header}>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800 }}>🩺 Activer ma puce médicale</h1>
        <p style={{ margin: '6px 0 0', opacity: 0.85, fontSize: 14 }}>Remplis tes informations une seule fois</p>
      </header>
      <div style={S.main}>
        {error && <div style={{ background: '#FDECEA', color: '#96281B', borderRadius: 10, padding: '12px 16px', marginBottom: 16, fontSize: 14, fontWeight: 600 }}>{error}</div>}

        <div style={S.card}>
          <div style={{ fontWeight: 800, fontSize: 16, marginBottom: 16 }}>🔑 Choisis ton PIN</div>
          <label style={S.label}>Code à 4 chiffres</label>
          <input type="tel" inputMode="numeric" maxLength={4} value={pin}
            onChange={e => setPin(e.target.value.replace(/\D/g, ''))}
            placeholder="••••" style={{ ...S.input, textAlign: 'center', letterSpacing: '0.3em', fontSize: 22, fontWeight: 700 }} />
          <p style={S.hint}>Ce PIN protégera ta fiche. Note-le précieusement.</p>
        </div>

        <div style={S.card}>
          <div style={{ fontWeight: 800, fontSize: 16, marginBottom: 16 }}>👤 Identité</div>
          <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
            <div style={{ flex: 1 }}><label style={S.label}>Prénom *</label><input value={form.prenom || ''} onChange={set('prenom')} style={S.input} /></div>
            <div style={{ flex: 1 }}><label style={S.label}>Nom *</label><input value={form.nom || ''} onChange={set('nom')} style={S.input} /></div>
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <div style={{ flex: 1 }}><label style={S.label}>Âge</label><input value={form.age || ''} onChange={set('age')} style={S.input} /></div>
            <div style={{ flex: 1 }}><label style={S.label}>Groupe sanguin</label><input value={form.groupe_sanguin || ''} onChange={set('groupe_sanguin')} placeholder="A+" style={S.input} /></div>
            <div style={{ flex: 1 }}><label style={S.label}>Poids (kg)</label><input value={form.poids || ''} onChange={set('poids')} style={S.input} /></div>
          </div>
        </div>

        <div style={S.card}>
          <div style={{ fontWeight: 800, fontSize: 16, marginBottom: 16 }}>⚠️ Informations médicales</div>
          <div style={{ marginBottom: 12 }}>
            <label style={S.label}>Allergies</label>
            <input value={form.allergies || ''} onChange={set('allergies')} placeholder="Pénicilline|Arachides" style={S.input} />
            <p style={S.hint}>Séparez chaque allergie par |</p>
          </div>
          <div style={{ marginBottom: 12 }}>
            <label style={S.label}>Conditions médicales</label>
            <input value={form.conditions || ''} onChange={set('conditions')} placeholder="Diabète type 1|Épilepsie" style={S.input} />
          </div>
          <div>
            <label style={S.label}>Traitements</label>
            <input value={form.traitements || ''} onChange={set('traitements')} placeholder="Insuline:20UI matin" style={S.input} />
            <p style={S.hint}>Format : NomMédicament:Dosage, séparés par |</p>
          </div>
        </div>

        <div style={S.card}>
          <div style={{ fontWeight: 800, fontSize: 16, marginBottom: 16 }}>📞 Contact d'urgence</div>
          <div style={{ marginBottom: 12 }}>
            <label style={S.label}>Nom du contact</label>
            <input value={form.contact_nom || ''} onChange={set('contact_nom')} style={S.input} />
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <div style={{ flex: 1 }}>
              <label style={S.label}>Téléphone (format +1...)</label>
              <input value={form.contact_tel || ''} onChange={set('contact_tel')} placeholder="+14165551234" style={S.input} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={S.label}>Affiché comme</label>
              <input value={form.contact_tel_display || ''} onChange={set('contact_tel_display')} placeholder="+1 416 555-1234" style={S.input} />
            </div>
          </div>
        </div>

        <div style={S.card}>
          <div style={{ fontWeight: 800, fontSize: 16, marginBottom: 16 }}>🩺 Médecin & notes</div>
          <div style={{ marginBottom: 12 }}>
            <label style={S.label}>Médecin traitant</label>
            <input value={form.medecin || ''} onChange={set('medecin')} style={S.input} />
          </div>
          <div>
            <label style={S.label}>Note importante</label>
            <textarea value={form.notes || ''} onChange={set('notes')} rows={3} style={{ ...S.input, resize: 'vertical' }} />
          </div>
        </div>

        <button onClick={submit} disabled={loading} style={S.btn}>
          {loading ? 'Activation...' : '✅ Activer ma puce'}
        </button>
      </div>
    </div>
  );
}