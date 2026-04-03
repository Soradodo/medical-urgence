'use client';
import { useState, useEffect } from 'react';

const S = {
  wrap: { minHeight: '100vh', background: '#F5F5F5', fontFamily: "'DM Sans', system-ui, sans-serif" },
  header: { background: '#1a1a2e', color: '#fff', padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  headerTitle: { fontSize: 18, fontWeight: 800, margin: 0 },
  main: { maxWidth: 900, margin: '0 auto', padding: '24px 16px' },
  loginWrap: { display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#F5F5F5', fontFamily: "'DM Sans', system-ui, sans-serif" },
  loginCard: { background: '#fff', borderRadius: 16, padding: '36px 28px', maxWidth: 340, width: '100%', textAlign: 'center', boxShadow: '0 4px 24px rgba(0,0,0,.1)' },
  input: { width: '100%', border: '2px solid #DDD', borderRadius: 10, padding: '12px 14px', fontSize: 16, outline: 'none', marginBottom: 12, fontFamily: 'inherit' },
  btn: (color) => ({ background: color || '#1a1a2e', color: '#fff', border: 'none', borderRadius: 10, padding: '12px 20px', fontSize: 15, fontWeight: 700, cursor: 'pointer', width: '100%' }),
  btnSm: (color) => ({ background: color || '#1a1a2e', color: '#fff', border: 'none', borderRadius: 8, padding: '7px 14px', fontSize: 13, fontWeight: 700, cursor: 'pointer' }),
  card: { background: '#fff', borderRadius: 14, padding: '20px', boxShadow: '0 1px 6px rgba(0,0,0,.08)', marginBottom: 12 },
  row: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 },
  badge: (actif) => ({ background: actif ? '#E8F5EE' : '#F5F5F5', color: actif ? '#1B7F45' : '#888', borderRadius: 6, padding: '3px 10px', fontSize: 12, fontWeight: 700 }),
  tag: { background: '#FDECEA', color: '#96281B', borderRadius: 6, padding: '3px 10px', fontSize: 12, fontWeight: 700 },
  grid2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 },
  label: { fontSize: 12, fontWeight: 700, color: '#666', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 4, display: 'block' },
  success: { background: '#E8F5EE', color: '#1B7F45', borderRadius: 10, padding: '14px 16px', marginBottom: 16, fontSize: 14, fontWeight: 600 },
  error: { background: '#FDECEA', color: '#96281B', borderRadius: 10, padding: '14px 16px', marginBottom: 16, fontSize: 14, fontWeight: 600 },
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
  { key: 'contact_nom', label: 'Nom du contact d\'urgence' },
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
  const [view, setView] = useState('list'); // list | create | edit
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({});
  const [msg, setMsg] = useState(null);
  const [newFiche, setNewFiche] = useState(null);
  const [loading, setLoading] = useState(false);

  async function login() {
    const res = await fetch('/api/admin?action=list', { headers: { 'x-admin-password': password } });
    if (res.ok) { setAuthed(true); const d = await res.json(); setFiches(d.fiches); }
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
    setEditId(id);
    setView('edit');
  }

  async function submit() {
    setLoading(true);
    setMsg(null);
    const action = view === 'create' ? 'create' : 'update';
    const res = await fetch('/api/admin', {
      method: 'POST',
      headers: { 'x-admin-password': password, 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, id: editId, ...form }),
    });
    const d = await res.json();
    setLoading(false);
    if (res.ok) {
      if (action === 'create') {
        setNewFiche(d);
        setMsg({ type: 'success', text: 'Fiche créée avec succès !' });
      } else {
        setMsg({ type: 'success', text: 'Fiche mise à jour !' });
      }
      loadFiches();
    } else {
      setMsg({ type: 'error', text: 'Erreur lors de la sauvegarde' });
    }
  }

  async function toggle(id, actif) {
    await fetch('/api/admin', {
      method: 'POST',
      headers: { 'x-admin-password': password, 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'toggle', id, actif }),
    });
    loadFiches();
  }

  async function remove(id) {
    if (!confirm('Supprimer cette fiche définitivement ?')) return;
    await fetch('/api/admin', {
      method: 'POST',
      headers: { 'x-admin-password': password, 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'delete', id }),
    });
    loadFiches();
  }

  if (!authed) return (
    <div style={S.loginWrap}>
      <div style={S.loginCard}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>🔐</div>
        <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 8 }}>Admin</h1>
        <p style={{ color: '#666', fontSize: 14, marginBottom: 20 }}>Interface de gestion des fiches médicales</p>
        {msg && <div style={S.error}>{msg.text}</div>}
        <input type="password" placeholder="Mot de passe admin" value={password}
          onChange={e => setPassword(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && login()}
          style={S.input} autoFocus />
        <button onClick={login} style={S.btn()}>Connexion</button>
      </div>
    </div>
  );

  return (
    <div style={S.wrap}>
      <header style={S.header}>
        <h1 style={S.headerTitle}>🏥 Admin — Fiches médicales</h1>
        <div style={{ display: 'flex', gap: 8 }}>
          {view !== 'list' && <button onClick={() => { setView('list'); setMsg(null); setNewFiche(null); setForm({}); }} style={S.btnSm('#555')}>← Liste</button>}
          {view === 'list' && <button onClick={() => { setView('create'); setForm({}); setMsg(null); setNewFiche(null); }} style={S.btnSm('#1B7F45')}>+ Nouvelle fiche</button>}
        </div>
      </header>

      <main style={S.main}>
        {msg && <div style={msg.type === 'success' ? S.success : S.error}>{msg.text}</div>}

        {/* Résultat création */}
        {newFiche && (
          <div style={{ background: '#E8F5EE', borderRadius: 14, padding: 20, marginBottom: 16 }}>
            <div style={{ fontWeight: 800, fontSize: 16, color: '#1B7F45', marginBottom: 12 }}>✅ Fiche créée — informations à transmettre à la personne</div>
            <div style={{ background: '#fff', borderRadius: 10, padding: 16, fontFamily: 'monospace', fontSize: 14 }}>
              <div><strong>Lien :</strong> {newFiche.fiche ? `${window.location.origin}/u/${newFiche.token}` : '...'}</div>
              <div style={{ marginTop: 8 }}><strong>PIN :</strong> {newFiche.pin}</div>
            </div>
            <button onClick={() => { navigator.clipboard.writeText(`Lien : ${window.location.origin}/u/${newFiche.token}\nPIN : ${newFiche.pin}`); }} style={{ ...S.btnSm('#1B7F45'), marginTop: 12, width: 'auto' }}>📋 Copier lien + PIN</button>
          </div>
        )}

        {/* LISTE */}
        {view === 'list' && (
          <>
            <div style={{ fontSize: 13, color: '#888', marginBottom: 16 }}>{fiches.length} fiche(s) enregistrée(s)</div>
            {fiches.length === 0 && (
              <div style={{ ...S.card, textAlign: 'center', color: '#888', padding: 40 }}>
                Aucune fiche. Cliquez sur "+ Nouvelle fiche" pour commencer.
              </div>
            )}
            {fiches.map(f => (
              <div key={f.id} style={S.card}>
                <div style={S.row}>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: 17 }}>{f.prenom} {f.nom}</div>
                    <div style={{ fontSize: 12, color: '#888', marginTop: 3 }}>Créée le {new Date(f.created_at).toLocaleDateString('fr-FR')}</div>
                  </div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                    <span style={S.badge(f.actif)}>{f.actif ? 'Active' : 'Désactivée'}</span>
                    <button onClick={() => loadEdit(f.id)} style={S.btnSm('#333')}>✏️ Modifier</button>
                    <button onClick={() => toggle(f.id, !f.actif)} style={S.btnSm(f.actif ? '#888' : '#1B7F45')}>{f.actif ? 'Désactiver' : 'Réactiver'}</button>
                    <button onClick={() => remove(f.id)} style={S.btnSm('#C0392B')}>🗑️ Supprimer</button>
                  </div>
                </div>
              </div>
            ))}
          </>
        )}

        {/* FORMULAIRE CRÉATION / ÉDITION */}
        {(view === 'create' || view === 'edit') && (
          <div style={S.card}>
            <h2 style={{ fontSize: 18, fontWeight: 800, marginBottom: 20 }}>
              {view === 'create' ? '➕ Nouvelle fiche' : `✏️ Modifier — ${form.prenom || ''} ${form.nom || ''}`}
            </h2>
            <div style={S.grid2}>
              {FIELDS.map(f => (
                <div key={f.key} style={f.multiline ? { gridColumn: '1 / -1' } : {}}>
                  <label style={S.label}>{f.label}</label>
                  {f.multiline
                    ? <textarea value={form[f.key] || ''} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                        placeholder={f.placeholder || ''} rows={3}
                        style={{ ...S.input, resize: 'vertical', marginBottom: 0 }} />
                    : <input value={form[f.key] || ''} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                        placeholder={f.placeholder || ''} style={{ ...S.input, marginBottom: 0 }} />
                  }
                </div>
              ))}
            </div>
            <div style={{ marginTop: 20, display: 'flex', gap: 10 }}>
              <button onClick={submit} disabled={loading} style={{ ...S.btn('#1B7F45'), width: 'auto', padding: '12px 28px' }}>
                {loading ? 'Sauvegarde...' : view === 'create' ? '✅ Créer la fiche' : '✅ Sauvegarder'}
              </button>
              <button onClick={() => { setView('list'); setMsg(null); setNewFiche(null); }} style={{ ...S.btn('#888'), width: 'auto', padding: '12px 20px' }}>Annuler</button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
