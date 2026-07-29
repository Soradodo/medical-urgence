'use client';
import { useState, useEffect, useRef } from 'react';

const S = {
  wrap: { minHeight: '100vh', background: '#F5F5F5', fontFamily: "'DM Sans', system-ui, sans-serif" },
  header: { background: '#1a1a2e', color: '#fff', padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 100 },
  headerTitle: { fontSize: 18, fontWeight: 800, margin: 0 },
  main: { maxWidth: 900, margin: '0 auto', padding: '24px 16px' },
  loginWrap: { display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#F5F5F5', fontFamily: "'DM Sans', system-ui, sans-serif" },
  loginCard: { background: '#fff', borderRadius: 16, padding: '36px 28px', maxWidth: 340, width: '100%', textAlign: 'center', boxShadow: '0 4px 24px rgba(0,0,0,.1)' },
  input: { width: '100%', border: '2px solid #DDD', borderRadius: 10, padding: '12px 14px', fontSize: 15, outline: 'none', marginBottom: 0, fontFamily: 'inherit', boxSizing: 'border-box' },
  searchWrap: { position: 'relative', marginBottom: 16 },
  searchInput: { width: '100%', border: '2px solid #DDD', borderRadius: 10, padding: '11px 40px', fontSize: 15, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box', background: '#fff' },
  btn: (color) => ({ background: color || '#1a1a2e', color: '#fff', border: 'none', borderRadius: 10, padding: '12px 20px', fontSize: 15, fontWeight: 700, cursor: 'pointer', width: '100%' }),
  btnSm: (color) => ({ background: color || '#1a1a2e', color: '#fff', border: 'none', borderRadius: 8, padding: '7px 14px', fontSize: 13, fontWeight: 700, cursor: 'pointer' }),
  card: { background: '#fff', borderRadius: 14, padding: '20px', boxShadow: '0 1px 6px rgba(0,0,0,.08)', marginBottom: 12 },
  row: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 },
  badge: (actif) => ({ background: actif ? '#E8F5EE' : '#F5F5F5', color: actif ? '#1B7F45' : '#888', borderRadius: 6, padding: '3px 10px', fontSize: 12, fontWeight: 700 }),
  grid2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 },
  label: { fontSize: 12, fontWeight: 700, color: '#666', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 4, display: 'block' },
  success: { background: '#E8F5EE', color: '#1B7F45', borderRadius: 10, padding: '14px 16px', marginBottom: 16, fontSize: 14, fontWeight: 600 },
  error: { background: '#FDECEA', color: '#96281B', borderRadius: 10, padding: '14px 16px', marginBottom: 16, fontSize: 14, fontWeight: 600 },
  avatarLg: { width: 96, height: 96, borderRadius: '50%', objectFit: 'cover', border: '3px solid #EEE', display: 'block', margin: '0 auto 12px' },
  avatarSm: { width: 48, height: 48, borderRadius: '50%', objectFit: 'cover', border: '2px solid #EEE', flexShrink: 0 },
  avatarPlaceholder: { width: 48, height: 48, borderRadius: '50%', background: '#F0F0F0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 },
  avatarPlaceholderLg: { width: 96, height: 96, borderRadius: '50%', background: '#F0F0F0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36, margin: '0 auto 12px' },
};

const FIELDS = [
  { key: 'prenom', label: 'Prénom *', required: true },
  { key: 'nom', label: 'Nom *', required: true },
  { key: 'age', label: 'Âge' },
  { key: 'groupe_sanguin', label: 'Groupe sanguin' },
  { key: 'poids', label: 'Poids (kg)' },
  { key: 'allergies', label: 'Allergies (séparer par |)', placeholder: 'Pénicilline|Arachides' },
  { key: 'conditions', label: 'Conditions médicales (séparer par |)', placeholder: 'Diabète type 1|Épilepsie' },
  { key: 'traitements', label: 'Traitements (format Nom:Dose, séparer par |)', placeholder: 'Insuline:20UI matin|Keppra:500mg 2x/jour' },
  { key: 'contact_nom', label: "Nom du contact d'urgence" },
  { key: 'contact_tel', label: 'Téléphone contact (format +1...)' },
  { key: 'contact_tel_display', label: 'Téléphone affiché' },
  { key: 'medecin', label: 'Médecin traitant' },
  { key: 'medecin_tel', label: 'Téléphone médecin' },
  { key: 'notes', label: 'Note importante', multiline: true },
];

export default function AdminPage() {
  const [password, setPassword] = useState('');
  const [authed, setAuthed] = useState(false);
  const [fiches, setFiches] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState('');
  const [view, setView] = useState('list');
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({});
  const [msg, setMsg] = useState(null);
  const [newFiche, setNewFiche] = useState(null);
  const [loading, setLoading] = useState(false);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [photoUploading, setPhotoUploading] = useState(false);
  const fileRef = useRef();
  const [trash, setTrash] = useState([]);

  useEffect(() => {
    if (!search.trim()) { setFiltered(fiches); return; }
    const q = search.toLowerCase();
    setFiltered(fiches.filter(f =>
      f.prenom?.toLowerCase().includes(q) ||
      f.nom?.toLowerCase().includes(q) ||
      f.contact_tel?.toLowerCase().includes(q)
    ));
  }, [search, fiches]);

  async function login() {
    const res = await fetch('/api/admin?action=list', { headers: { 'x-admin-password': password } });
    if (res.ok) { setAuthed(true); const d = await res.json(); setFiches(d.fiches); setFiltered(d.fiches); }
    else setMsg({ type: 'error', text: 'Mot de passe incorrect' });
  }

  async function loadFiches() {
    const res = await fetch('/api/admin?action=list', { headers: { 'x-admin-password': password } });
    const d = await res.json();
    setFiches(d.fiches);
  }

  async function loadEdit(id) {
    const res = await fetch(`/api/admin?action=get&id=${id}`, { headers: { 'x-admin-password': password } });
    const d = await res.json();
    setForm(d.fiche);
    setPhotoPreview(d.fiche.photo_url || null);
    setEditId(id);
    setView('edit');
  }

  async function handlePhotoChange(e) {
    const file = e.target.files[0];
    if (!file) return;
    setPhotoPreview(URL.createObjectURL(file));
    setPhotoUploading(true);
    try {
      const fd = new FormData();
      fd.append('photo', file);
      const res = await fetch('/api/upload?admin=1', { method: 'POST', headers: { 'x-admin-password': password }, body: fd });
      const d = await res.json();
      if (d.url) setForm(p => ({ ...p, photo_url: d.url }));
      else setMsg({ type: 'error', text: "Erreur upload photo" });
    } catch { setMsg({ type: 'error', text: "Erreur upload photo" }); }
    setPhotoUploading(false);
  }

  async function submit() {
    setLoading(true); setMsg(null);
    const action = view === 'create' ? 'create' : 'update';
    const res = await fetch('/api/admin', {
      method: 'POST',
      headers: { 'x-admin-password': password, 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, id: editId, ...form }),
    });
    const d = await res.json();
    setLoading(false);
    if (res.ok) {
      if (action === 'create') { setNewFiche(d); setMsg({ type: 'success', text: 'Fiche créée !' }); }
      else setMsg({ type: 'success', text: 'Fiche mise à jour !' });
      loadFiches();
    } else setMsg({ type: 'error', text: 'Erreur lors de la sauvegarde' });
  }

  async function toggle(id, actif) {
    await fetch('/api/admin', { method: 'POST', headers: { 'x-admin-password': password, 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'toggle', id, actif }) });
    loadFiches();
  }
  async function copyLink(token) {
    const link = `${window.location.origin}/u/${token}`;
    navigator.clipboard.writeText(link);
    setMsg({ type: 'success', text: 'Lien copié !' });
  }

  async function resetPin(id, prenom, nom) {
    if (!confirm(`Générer un nouveau PIN pour ${prenom} ${nom} ? L'ancien PIN ne fonctionnera plus.`)) return;
    const res = await fetch('/api/admin', {
      method: 'POST',
      headers: { 'x-admin-password': password, 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'reset_pin', id }),
    });
    const d = await res.json();
    if (res.ok) {
      setMsg({ type: 'success', text: `Nouveau PIN pour ${prenom} ${nom} : ${d.newPin} — note-le maintenant, il ne sera plus affiché.` });
    } else {
      setMsg({ type: 'error', text: 'Erreur lors de la réinitialisation' });
    }
  }
async function loadTrash() {
    const res = await fetch('/api/admin?action=trash', { headers: { 'x-admin-password': password } });
    const d = await res.json();
    setTrash(d.deleted || []);
    setView('trash');
  }

  async function restore(id) {
    await fetch('/api/admin', { method: 'POST', headers: { 'x-admin-password': password, 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'restore', id }) });
    loadTrash();
    loadFiches();
  }

  async function permanentDelete(id) {
    if (!confirm('Supprimer DÉFINITIVEMENT cette fiche ? Cette action est irréversible.')) return;
    await fetch('/api/admin', { method: 'POST', headers: { 'x-admin-password': password, 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'permanent_delete', id }) });
    loadTrash();
  }
  async function remove(id) {
    if (!confirm('Supprimer cette fiche définitivement ?')) return;
    await fetch('/api/admin', { method: 'POST', headers: { 'x-admin-password': password, 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'delete', id }) });
    loadFiches();
  }

  function resetForm() { setView('list'); setMsg(null); setNewFiche(null); setForm({}); setPhotoPreview(null); }

  if (!authed) return (
    <div style={S.loginWrap}>
      <div style={S.loginCard}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>🔐</div>
        <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 8 }}>Admin</h1>
        <p style={{ color: '#666', fontSize: 14, marginBottom: 20 }}>Interface de gestion des fiches médicales</p>
        {msg && <div style={S.error}>{msg.text}</div>}
        <input type="password" placeholder="Mot de passe admin" value={password}
          onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key === 'Enter' && login()}
          style={{ ...S.input, marginBottom: 12 }} autoFocus />
        <button onClick={login} style={S.btn()}>Connexion</button>
      </div>
    </div>
  );

  return (
    <div style={S.wrap}>
   <header style={S.header}>
        <h1 style={S.headerTitle}>🏥 Admin — Fiches médicales</h1>
        <div style={{ display: 'flex', gap: 8 }}>
          {view !== 'list' && <button onClick={resetForm} style={S.btnSm('#555')}>← Liste</button>}
          {view === 'list' && <button onClick={loadTrash} style={S.btnSm('#888')}>🗑️ Corbeille</button>}
          {view === 'list' && <button onClick={() => { setView('create'); setForm({}); setMsg(null); setNewFiche(null); setPhotoPreview(null); }} style={S.btnSm('#1B7F45')}>+ Nouvelle fiche</button>}
        </div>
      </header>

      <main style={S.main}>
        {msg && <div style={msg.type === 'success' ? S.success : S.error}>{msg.text}</div>}

        {newFiche && (
          <div style={{ background: '#E8F5EE', borderRadius: 14, padding: 20, marginBottom: 16 }}>
            <div style={{ fontWeight: 800, fontSize: 16, color: '#1B7F45', marginBottom: 12 }}>✅ Fiche créée — informations à transmettre</div>
            <div style={{ background: '#fff', borderRadius: 10, padding: 16, fontFamily: 'monospace', fontSize: 14 }}>
              <div><strong>Lien :</strong> {typeof window !== 'undefined' ? `${window.location.origin}/u/${newFiche.token}` : ''}</div>
              <div style={{ marginTop: 8 }}><strong>PIN :</strong> {newFiche.pin}</div>
            </div>
            <button onClick={() => navigator.clipboard.writeText(`Lien : ${window.location.origin}/u/${newFiche.token}\nPIN : ${newFiche.pin}`)}
              style={{ ...S.btnSm('#1B7F45'), marginTop: 12, width: 'auto' }}>📋 Copier lien + PIN</button>
          </div>
        )}

        {view === 'list' && (
          <>
            <div style={S.searchWrap}>
              <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', fontSize: 16, color: '#AAA', pointerEvents: 'none' }}>🔍</span>
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Rechercher par nom, prénom ou téléphone..."
                style={S.searchInput} />
              {search && (
                <button onClick={() => setSearch('')}
                  style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: '#AAA', padding: 0 }}>✕</button>
              )}
            </div>

            <div style={{ fontSize: 13, color: '#888', marginBottom: 12 }}>
              {search ? `${filtered.length} résultat(s) pour "${search}"` : `${fiches.length} fiche(s) enregistrée(s)`}
            </div>

            {filtered.length === 0 && (
              <div style={{ ...S.card, textAlign: 'center', color: '#888', padding: 40 }}>
                {search ? 'Aucun patient trouvé.' : 'Aucune fiche. Cliquez sur "+ Nouvelle fiche".'}
              </div>
            )}

            {filtered.map(f => (
              <div key={f.id} style={S.card}>
                <div style={S.row}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    {f.photo_url
                      ? <img src={f.photo_url} alt="" style={S.avatarSm} />
                      : <div style={S.avatarPlaceholder}>👤</div>
                    }
                    <div>
                      <div style={{ fontWeight: 800, fontSize: 17 }}>{f.prenom} {f.nom}</div>
                      <div style={{ fontSize: 12, color: '#888', marginTop: 2 }}>
                        {f.age ? `${f.age} ans · ` : ''}{new Date(f.created_at).toLocaleDateString('fr-FR')}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                    <span style={S.badge(f.actif)}>{f.actif ? 'Active' : 'Désactivée'}</span>
                    <button onClick={() => copyLink(f.token)} style={S.btnSm('#2874A6')}>🔗 Copier lien</button>
                    <button onClick={() => resetPin(f.id, f.prenom, f.nom)} style={S.btnSm('#B7791F')}>🔄 Nouveau PIN</button>
                    <button onClick={() => loadEdit(f.id)} style={S.btnSm('#333')}>✏️ Modifier</button>
                    <button onClick={() => toggle(f.id, !f.actif)} style={S.btnSm(f.actif ? '#888' : '#1B7F45')}>{f.actif ? 'Désactiver' : 'Réactiver'}</button>
                    <button onClick={() => remove(f.id)} style={S.btnSm('#C0392B')}>🗑️</button>
                  </div>
                </div>
              </div>
            ))}
          </>
        )}
{view === 'trash' && (
          <>
            <div style={{ fontSize: 13, color: '#888', marginBottom: 12 }}>
              {trash.length} fiche(s) dans la corbeille
            </div>
            {trash.length === 0 && (
              <div style={{ ...S.card, textAlign: 'center', color: '#888', padding: 40 }}>
                La corbeille est vide.
              </div>
            )}
            {trash.map(f => (
              <div key={f.id} style={S.card}>
                <div style={S.row}>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: 17 }}>{f.prenom} {f.nom}</div>
                    <div style={{ fontSize: 12, color: '#888', marginTop: 2 }}>
                      Supprimée le {new Date(f.supprime_le).toLocaleDateString('fr-FR')}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={() => restore(f.id)} style={S.btnSm('#1B7F45')}>↩️ Restaurer</button>
                    <button onClick={() => permanentDelete(f.id)} style={S.btnSm('#C0392B')}>🗑️ Supprimer définitivement</button>
                  </div>
                </div>
              </div>
            ))}
          </>
        )}
        {(view === 'create' || view === 'edit') && (
          <div style={S.card}>
            <h2 style={{ fontSize: 18, fontWeight: 800, marginBottom: 20 }}>
              {view === 'create' ? '➕ Nouvelle fiche' : `✏️ Modifier — ${form.prenom || ''} ${form.nom || ''}`}
            </h2>

            {/* Photo */}
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              {photoPreview
                ? <img src={photoPreview} alt="Photo" style={S.avatarLg} />
                : <div style={S.avatarPlaceholderLg}>👤</div>
              }
              <input type="file" accept="image/*" ref={fileRef} onChange={handlePhotoChange} style={{ display: 'none' }} />
              <button onClick={() => fileRef.current?.click()} disabled={photoUploading}
                style={{ ...S.btnSm('#555'), width: 'auto' }}>
                {photoUploading ? '⏳ Envoi...' : '📷 Changer la photo'}
              </button>
            </div>

            <div style={S.grid2}>
              {FIELDS.map(f => (
                <div key={f.key} style={f.multiline ? { gridColumn: '1 / -1' } : {}}>
                  <label style={S.label}>{f.label}</label>
                  {f.multiline
                    ? <textarea value={form[f.key] || ''} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                        placeholder={f.placeholder || ''} rows={3} style={{ ...S.input, resize: 'vertical' }} />
                    : <input value={form[f.key] || ''} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                        placeholder={f.placeholder || ''} style={S.input} />
                  }
                </div>
              ))}
            </div>

            <div style={{ marginTop: 20, display: 'flex', gap: 10 }}>
              <button onClick={submit} disabled={loading} style={{ ...S.btn('#1B7F45'), width: 'auto', padding: '12px 28px' }}>
                {loading ? 'Sauvegarde...' : view === 'create' ? '✅ Créer la fiche' : '✅ Sauvegarder'}
              </button>
              <button onClick={resetForm} style={{ ...S.btn('#888'), width: 'auto', padding: '12px 20px' }}>Annuler</button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
