'use client';
import { useState, useRef } from 'react';

const S = {
  wrap: { minHeight: '100vh', background: '#F5F5F5', fontFamily: "'DM Sans', system-ui, sans-serif" },
  header: { background: '#C0392B', color: '#fff', padding: '20px 24px' },
  main: { maxWidth: 600, margin: '0 auto', padding: '24px 16px' },
  card: { background: '#fff', borderRadius: 14, padding: '24px', boxShadow: '0 1px 6px rgba(0,0,0,.08)', marginBottom: 16 },
  input: { width: '100%', border: '2px solid #DDD', borderRadius: 10, padding: '12px 14px', fontSize: 15, outline: 'none', marginBottom: 0, fontFamily: 'inherit', boxSizing: 'border-box' },
  label: { fontSize: 12, fontWeight: 700, color: '#555', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6, display: 'block' },
  btn: { background: '#C0392B', color: '#fff', border: 'none', borderRadius: 12, padding: '16px', fontSize: 17, fontWeight: 800, cursor: 'pointer', width: '100%', marginTop: 8 },
  success: { background: '#E8F5EE', borderRadius: 14, padding: 24, textAlign: 'center' },
  hint: { fontSize: 12, color: '#999', marginTop: 4 },
  avatarLg: { width: 96, height: 96, borderRadius: '50%', objectFit: 'cover', border: '3px solid #EEE', display: 'block', margin: '0 auto 12px' },
  avatarPlaceholderLg: { width: 96, height: 96, borderRadius: '50%', background: '#F0F0F0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36, margin: '0 auto 12px' },
};

export default function RegisterPage() {
  const [form, setForm] = useState({});
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [photoPreview, setPhotoPreview] = useState(null);
  const [photoUploading, setPhotoUploading] = useState(false);
  const fileRef = useRef();

  function set(key) { return e => setForm(p => ({ ...p, [key]: e.target.value })); }

  async function handlePhotoChange(e) {
    const file = e.target.files[0];
    if (!file) return;
    setPhotoPreview(URL.createObjectURL(file));
    setPhotoUploading(true);
    try {
      const fd = new FormData();
      fd.append('photo', file);
      const res = await fetch('/api/upload', { method: 'POST', body: fd });
      const d = await res.json();
      if (d.url) setForm(p => ({ ...p, photo_url: d.url }));
      else setError("Erreur lors de l'upload de la photo");
    } catch { setError("Erreur lors de l'upload de la photo"); }
    setPhotoUploading(false);
  }

  async function submit() {
    if (!form.prenom || !form.nom) { setError('Prénom et nom sont obligatoires.'); return; }
    setLoading(true); setError('');
    const res = await fetch('/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    const d = await res.json();
    setLoading(false);
    if (res.ok) setResult(d);
    else setError(d.error || 'Une erreur est survenue.');
  }

  if (result) return (
    <div style={S.wrap}>
      <header style={S.header}>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800 }}>✅ Votre fiche est créée</h1>
      </header>
      <div style={{ maxWidth: 600, margin: '0 auto', padding: '24px 16px' }}>
        <div style={S.success}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🎉</div>
          <div style={{ fontSize: 20, fontWeight: 800, color: '#1B7F45', marginBottom: 8 }}>Fiche créée avec succès</div>
          <p style={{ color: '#555', marginBottom: 20 }}>Conservez précieusement ces informations.</p>
          <div style={{ background: '#fff', borderRadius: 12, padding: 20, textAlign: 'left', marginBottom: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#888', marginBottom: 8 }}>VOTRE LIEN D'URGENCE</div>
            <div style={{ fontFamily: 'monospace', fontSize: 14, wordBreak: 'break-all', color: '#111', fontWeight: 600 }}>{result.lien}</div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#888', marginTop: 16, marginBottom: 4 }}>VOTRE CODE PIN</div>
            <div style={{ fontSize: 32, fontWeight: 800, letterSpacing: '0.3em', color: '#C0392B' }}>{result.pin}</div>
          </div>
          <button onClick={() => navigator.clipboard.writeText(`Lien d'urgence : ${result.lien}\nPIN : ${result.pin}`)}
            style={{ ...S.btn, background: '#1B7F45', marginTop: 0 }}>
            📋 Copier le lien et le PIN
          </button>
          <p style={{ fontSize: 12, color: '#888', marginTop: 16 }}>
            💡 Notez le PIN sur votre étiquette NFC. Sans lui, la fiche est inaccessible.
          </p>
        </div>
      </div>
    </div>
  );

  return (
    <div style={S.wrap}>
      <header style={S.header}>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800 }}>Créer ma fiche médicale</h1>
        <p style={{ margin: '6px 0 0', opacity: 0.85, fontSize: 14 }}>Version bêta — usage personnel uniquement</p>
      </header>
      <div style={S.main}>
        {error && <div style={{ background: '#FDECEA', color: '#96281B', borderRadius: 10, padding: '12px 16px', marginBottom: 16, fontSize: 14, fontWeight: 600 }}>{error}</div>}

        {/* Photo */}
        <div style={S.card}>
          <div style={{ fontWeight: 800, fontSize: 16, marginBottom: 16 }}>📷 Photo de profil</div>
          <div style={{ textAlign: 'center' }}>
            {photoPreview
              ? <img src={photoPreview} alt="Photo" style={S.avatarLg} />
              : <div style={S.avatarPlaceholderLg}>👤</div>
            }
            <input type="file" accept="image/*" ref={fileRef} onChange={handlePhotoChange} style={{ display: 'none' }} />
            <button onClick={() => fileRef.current?.click()} disabled={photoUploading}
              style={{ background: '#555', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 16px', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
              {photoUploading ? '⏳ Envoi...' : photoPreview ? '🔄 Changer' : '📷 Ajouter une photo'}
            </button>
            <p style={S.hint}>Optionnel — aide les secouristes à vous identifier</p>
          </div>
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
            <input value={form.allergies || ''} onChange={set('allergies')} placeholder="Pénicilline|Arachides|Aspirine" style={S.input} />
            <p style={S.hint}>Séparez chaque allergie par |</p>
          </div>
          <div style={{ marginBottom: 12 }}>
            <label style={S.label}>Conditions médicales</label>
            <input value={form.conditions || ''} onChange={set('conditions')} placeholder="Diabète type 1|Épilepsie" style={S.input} />
            <p style={S.hint}>Séparez par |</p>
          </div>
          <div>
            <label style={S.label}>Traitements</label>
            <input value={form.traitements || ''} onChange={set('traitements')} placeholder="Insuline Glargine:20UI matin|Keppra:500mg 2x/jour" style={S.input} />
            <p style={S.hint}>Format : NomMédicament:Dosage, séparez par |</p>
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
          <div style={{ marginBottom: 12 }}>
            <label style={S.label}>Téléphone médecin</label>
            <input value={form.medecin_tel || ''} onChange={set('medecin_tel')} style={S.input} />
          </div>
          <div>
            <label style={S.label}>Note importante pour les secouristes</label>
            <textarea value={form.notes || ''} onChange={set('notes')}
              placeholder="Ex : En cas de crise épileptique, ne pas retenir, appeler le 911" rows={3}
              style={{ ...S.input, resize: 'vertical' }} />
          </div>
        </div>

        <div style={{ background: '#FFF8E1', borderRadius: 12, padding: 16, marginBottom: 16, fontSize: 13, color: '#7B5800' }}>
          ⚠️ <strong>Version bêta</strong> — Usage personnel et cercle de confiance uniquement.
        </div>

        <button onClick={submit} disabled={loading || photoUploading} style={S.btn}>
          {loading ? 'Création en cours...' : '✅ Créer ma fiche médicale'}
        </button>
      </div>
    </div>
  );
}

const S = {
  wrap: { minHeight: '100vh', background: '#F5F5F5', fontFamily: "'DM Sans', system-ui, sans-serif" },
  header: { background: '#C0392B', color: '#fff', padding: '20px 24px' },
  main: { maxWidth: 600, margin: '0 auto', padding: '24px 16px' },
  card: { background: '#fff', borderRadius: 14, padding: '24px', boxShadow: '0 1px 6px rgba(0,0,0,.08)', marginBottom: 16 },
  input: { width: '100%', border: '2px solid #DDD', borderRadius: 10, padding: '12px 14px', fontSize: 15, outline: 'none', marginBottom: 0, fontFamily: 'inherit', boxSizing: 'border-box' },
  label: { fontSize: 12, fontWeight: 700, color: '#555', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6, display: 'block' },
  btn: { background: '#C0392B', color: '#fff', border: 'none', borderRadius: 12, padding: '16px', fontSize: 17, fontWeight: 800, cursor: 'pointer', width: '100%', marginTop: 8 },
  success: { background: '#E8F5EE', borderRadius: 14, padding: 24, textAlign: 'center' },
  hint: { fontSize: 12, color: '#999', marginTop: 4 },
};

export default function RegisterPage() {
  const [form, setForm] = useState({});
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  function set(key) { return e => setForm(p => ({ ...p, [key]: e.target.value })); }

  async function submit() {
    if (!form.prenom || !form.nom) { setError('Prénom et nom sont obligatoires.'); return; }
    setLoading(true); setError('');
    const res = await fetch('/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    const d = await res.json();
    setLoading(false);
    if (res.ok) setResult(d);
    else setError(d.error || 'Une erreur est survenue.');
  }

  if (result) return (
    <div style={S.wrap}>
      <header style={S.header}>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800 }}>✅ Votre fiche est créée</h1>
      </header>
      <div style={{ maxWidth: 600, margin: '0 auto', padding: '24px 16px' }}>
        <div style={S.success}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🎉</div>
          <div style={{ fontSize: 20, fontWeight: 800, color: '#1B7F45', marginBottom: 8 }}>Fiche créée avec succès</div>
          <p style={{ color: '#555', marginBottom: 20 }}>Conservez précieusement ces informations — vous en aurez besoin pour accéder à votre fiche.</p>
          <div style={{ background: '#fff', borderRadius: 12, padding: 20, textAlign: 'left', marginBottom: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#888', marginBottom: 8 }}>VOTRE LIEN D'URGENCE</div>
            <div style={{ fontFamily: 'monospace', fontSize: 14, wordBreak: 'break-all', color: '#111', fontWeight: 600 }}>{result.lien}</div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#888', marginTop: 16, marginBottom: 4 }}>VOTRE CODE PIN</div>
            <div style={{ fontSize: 32, fontWeight: 800, letterSpacing: '0.3em', color: '#C0392B' }}>{result.pin}</div>
          </div>
          <button onClick={() => { navigator.clipboard.writeText(`Lien d'urgence : ${result.lien}\nPIN : ${result.pin}`); }}
            style={{ ...S.btn, background: '#1B7F45', marginTop: 0 }}>
            📋 Copier le lien et le PIN
          </button>
          <p style={{ fontSize: 12, color: '#888', marginTop: 16 }}>
            💡 Notez le PIN sur votre étiquette NFC ou carnet. Sans lui, la fiche est inaccessible.
          </p>
        </div>
      </div>
    </div>
  );

  return (
    <div style={S.wrap}>
      <header style={S.header}>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800 }}>Créer ma fiche médicale</h1>
        <p style={{ margin: '6px 0 0', opacity: 0.85, fontSize: 14 }}>Version bêta — usage personnel uniquement</p>
      </header>
      <div style={S.main}>
        {error && <div style={{ background: '#FDECEA', color: '#96281B', borderRadius: 10, padding: '12px 16px', marginBottom: 16, fontSize: 14, fontWeight: 600 }}>{error}</div>}

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
            <input value={form.allergies || ''} onChange={set('allergies')} placeholder="Pénicilline|Arachides|Aspirine" style={S.input} />
            <p style={S.hint}>Séparez chaque allergie par | (barre verticale)</p>
          </div>
          <div style={{ marginBottom: 12 }}>
            <label style={S.label}>Conditions médicales</label>
            <input value={form.conditions || ''} onChange={set('conditions')} placeholder="Diabète type 1|Épilepsie" style={S.input} />
            <p style={S.hint}>Séparez par |</p>
          </div>
          <div>
            <label style={S.label}>Traitements</label>
            <input value={form.traitements || ''} onChange={set('traitements')} placeholder="Insuline Glargine:20UI matin|Keppra:500mg 2x/jour" style={S.input} />
            <p style={S.hint}>Format : NomMédicament:Dosage, séparez par |</p>
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
          <div style={{ marginBottom: 12 }}>
            <label style={S.label}>Téléphone médecin</label>
            <input value={form.medecin_tel || ''} onChange={set('medecin_tel')} style={S.input} />
          </div>
          <div>
            <label style={S.label}>Note importante pour les secouristes</label>
            <textarea value={form.notes || ''} onChange={set('notes')}
              placeholder="Ex : En cas de crise épileptique, ne pas retenir, appeler le 911" rows={3}
              style={{ ...S.input, resize: 'vertical' }} />
          </div>
        </div>

        <div style={{ background: '#FFF8E1', borderRadius: 12, padding: 16, marginBottom: 16, fontSize: 13, color: '#7B5800' }}>
          ⚠️ <strong>Version bêta</strong> — Ces données sont stockées sur des serveurs non certifiés pour les données médicales. Usage personnel et cercle de confiance uniquement.
        </div>

        <button onClick={submit} disabled={loading} style={S.btn}>
          {loading ? 'Création en cours...' : '✅ Créer ma fiche médicale'}
        </button>
      </div>
    </div>
  );
}
