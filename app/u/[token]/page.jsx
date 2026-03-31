'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';

export default function UrgencePage() {
  const { token } = useParams();
  const [state, setState] = useState('loading'); // loading | pin | granted | error | expired
  const [pin, setPin] = useState('');
  const [pinError, setPinError] = useState('');
  const [data, setData] = useState(null);
  const [pinAttempts, setPinAttempts] = useState(0);

  useEffect(() => {
    verifyToken();
  }, [token]);

  async function verifyToken() {
    try {
      const res = await fetch(`/api/verify?token=${token}`);
      const json = await res.json();
      if (json.status === 'expired') return setState('expired');
      if (json.status === 'invalid') return setState('error');
      if (json.status === 'pin_required') return setState('pin');
      if (json.status === 'ok') {
        setData(json.data);
        setState('granted');
      }
    } catch {
      setState('error');
    }
  }

  async function submitPin() {
    if (pin.length < 4) return;
    const newAttempts = pinAttempts + 1;
    setPinAttempts(newAttempts);
    if (newAttempts > 5) {
      setState('error');
      return;
    }
    try {
      const res = await fetch(`/api/verify?token=${token}&pin=${pin}`);
      const json = await res.json();
      if (json.status === 'ok') {
        setData(json.data);
        setState('granted');
      } else {
        setPinError(`Code incorrect. ${5 - newAttempts} essai(s) restant(s).`);
        setPin('');
      }
    } catch {
      setState('error');
    }
  }

  if (state === 'loading') return <Loader />;
  if (state === 'error') return <ErrorPage />;
  if (state === 'expired') return <ExpiredPage />;
  if (state === 'pin') return <PinPage pin={pin} setPin={setPin} onSubmit={submitPin} error={pinError} />;
  if (state === 'granted') return <MedicalPage data={data} />;
  return null;
}

// ── LOADER ──────────────────────────────────────────────
function Loader() {
  return (
    <div style={styles.center}>
      <div style={styles.spinner} />
      <p style={styles.loaderText}>Chargement…</p>
    </div>
  );
}

// ── PIN PAGE ─────────────────────────────────────────────
function PinPage({ pin, setPin, onSubmit, error }) {
  return (
    <div style={styles.pinWrap}>
      <div style={styles.pinCard}>
        <div style={styles.pinIcon}>🔒</div>
        <h1 style={styles.pinTitle}>Code d'accès requis</h1>
        <p style={styles.pinSub}>Entrez le code PIN à 4 chiffres</p>
        <input
          type="tel"
          inputMode="numeric"
          maxLength={4}
          value={pin}
          onChange={e => setPin(e.target.value.replace(/\D/g, ''))}
          onKeyDown={e => e.key === 'Enter' && onSubmit()}
          placeholder="••••"
          style={styles.pinInput}
          autoFocus
        />
        {error && <p style={styles.pinError}>{error}</p>}
        <button onClick={onSubmit} style={styles.pinBtn} disabled={pin.length < 4}>
          Confirmer
        </button>
        <p style={styles.pinHint}>
          En situation d'urgence réelle, contactez directement le 15 (SAMU) ou le 112.
        </p>
      </div>
    </div>
  );
}

// ── ERROR / EXPIRED PAGES ────────────────────────────────
function ErrorPage() {
  return (
    <div style={styles.center}>
      <div style={{ fontSize: 48 }}>⚠️</div>
      <h1 style={{ color: '#C0392B', fontWeight: 800, marginTop: 12 }}>Lien invalide</h1>
      <p style={{ color: '#555', marginTop: 8, textAlign: 'center', maxWidth: 280 }}>
        Ce lien d'urgence n'existe pas ou a été désactivé.
      </p>
    </div>
  );
}

function ExpiredPage() {
  return (
    <div style={styles.center}>
      <div style={{ fontSize: 48 }}>⏱️</div>
      <h1 style={{ color: '#C0392B', fontWeight: 800, marginTop: 12 }}>Lien expiré</h1>
      <p style={{ color: '#555', marginTop: 8, textAlign: 'center', maxWidth: 280 }}>
        Ce lien a expiré. Le propriétaire doit en générer un nouveau.
      </p>
    </div>
  );
}

// ── MAIN MEDICAL PAGE ────────────────────────────────────
function MedicalPage({ data }) {
  const d = data;
  return (
    <div style={styles.page}>
      {/* HEADER */}
      <header style={styles.header}>
        <div style={styles.alertBadge}>
          <span style={styles.pulseDot} />
          ⚠️ INFORMATIONS MÉDICALES D'URGENCE
        </div>
        <div style={styles.name}>{d.prenom} {d.nom}</div>
        <div style={styles.headerMeta}>
          <span>👤 {d.age} ans</span>
          {d.groupeSanguin && <span>🩸 {d.groupeSanguin}</span>}
        </div>
      </header>

      {/* CALL BUTTON */}
      <div style={styles.callWrap}>
        <a href={`tel:${d.contactTel}`} style={styles.btnCall}>
          <span style={{ fontSize: 24 }}>📞</span>
          <span style={styles.btnCallText}>
            <span>Appeler le contact d'urgence</span>
            <span style={styles.btnCallSub}>{d.contactNom} — {d.contactTelDisplay}</span>
          </span>
        </a>
      </div>

      <main style={styles.main}>
        {/* ALLERGIES */}
        <div style={styles.card}>
          <div style={{ ...styles.cardTitle, background: '#FDECEA', color: '#96281B' }}>
            ⚠️ Allergies
          </div>
          <div style={styles.cardBody}>
            {d.allergies && d.allergies.length > 0 ? (
              <div style={styles.tagList}>
                {d.allergies.map((a, i) => (
                  <span key={i} style={styles.tagRed}>{a}</span>
                ))}
              </div>
            ) : (
              <span style={styles.tagNone}>✅ Aucune allergie connue</span>
            )}
          </div>
        </div>

        {/* CONDITIONS */}
        {d.conditions && d.conditions.length > 0 && (
          <div style={styles.card}>
            <div style={styles.cardTitle}>🫀 Conditions médicales</div>
            <div style={styles.cardBody}>
              <div style={styles.rowList}>
                {d.conditions.map((c, i) => (
                  <div key={i} style={styles.rowItem}>
                    <span style={{ ...styles.rowDot, background: '#C0392B' }} />
                    {c}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TRAITEMENTS */}
        {d.traitements && d.traitements.length > 0 && (
          <div style={styles.card}>
            <div style={styles.cardTitle}>💊 Traitements</div>
            <div style={styles.cardBody}>
              <div style={styles.rowList}>
                {d.traitements.map((t, i) => (
                  <div key={i} style={styles.rowItem}>
                    <span style={{ ...styles.rowDot, background: '#C0392B' }} />
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 15 }}>{t.nom}</div>
                      {t.dose && <div style={{ fontSize: 12, color: '#666', fontFamily: 'monospace', marginTop: 2 }}>{t.dose}</div>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* SECONDARY INFO */}
        <div style={styles.sectionLabel}>Informations complémentaires</div>
        <div style={styles.infoGrid}>
          {d.groupeSanguin && (
            <div style={styles.tile}>
              <div style={styles.tileLabel}>Groupe sanguin</div>
              <div style={{ ...styles.tileValue, color: '#96281B' }}>{d.groupeSanguin}</div>
            </div>
          )}
          {d.poids && (
            <div style={styles.tile}>
              <div style={styles.tileLabel}>Poids</div>
              <div style={styles.tileValue}>{d.poids} kg</div>
            </div>
          )}
          {d.medecin && (
            <div style={{ ...styles.tile, gridColumn: '1 / -1' }}>
              <div style={styles.tileLabel}>Médecin traitant</div>
              <div style={{ ...styles.tileValue, fontSize: 15, fontWeight: 600 }}>
                {d.medecin}
                {d.medecinTel && <span style={{ color: '#777', fontWeight: 400 }}> — {d.medecinTel}</span>}
              </div>
            </div>
          )}
          {d.notes && (
            <div style={{ ...styles.tile, gridColumn: '1 / -1' }}>
              <div style={styles.tileLabel}>Note importante</div>
              <div style={{ ...styles.tileValue, fontSize: 14, fontWeight: 500, lineHeight: 1.5 }}>{d.notes}</div>
            </div>
          )}
        </div>
      </main>

      <footer style={styles.footer}>
        Informations fournies volontairement par la personne concernée.<br />
        <a href="#" style={{ color: '#AAAAAA' }}>Gérer mes données · Confidentialité</a>
      </footer>
    </div>
  );
}

// ── STYLES ────────────────────────────────────────────────
const styles = {
  page: { background: '#F5F5F5', minHeight: '100vh', fontFamily: "'DM Sans', system-ui, sans-serif" },
  center: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: 24, fontFamily: "'DM Sans', system-ui, sans-serif" },
  spinner: { width: 36, height: 36, border: '3px solid #eee', borderTop: '3px solid #C0392B', borderRadius: '50%', animation: 'spin 0.8s linear infinite' },
  loaderText: { marginTop: 12, color: '#888', fontSize: 14 },

  header: { background: '#C0392B', color: '#fff', padding: '18px 20px 16px', position: 'sticky', top: 0, zIndex: 100, boxShadow: '0 3px 12px rgba(0,0,0,.3)' },
  alertBadge: { display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', opacity: 0.9, marginBottom: 10 },
  pulseDot: { display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: '#fff', animation: 'pulse 1.4s ease-in-out infinite', flexShrink: 0 },
  name: { fontSize: 28, fontWeight: 800, lineHeight: 1.1 },
  headerMeta: { display: 'flex', gap: 14, marginTop: 6, fontSize: 14, fontWeight: 600, opacity: 0.88 },

  callWrap: { padding: '16px 16px 0' },
  btnCall: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, width: '100%', background: '#1B7F45', color: '#fff', textDecoration: 'none', borderRadius: 14, padding: '17px 20px', fontSize: 18, fontWeight: 800, boxShadow: '0 4px 18px rgba(27,127,69,.4)' },
  btnCallText: { display: 'flex', flexDirection: 'column', lineHeight: 1.2 },
  btnCallSub: { fontSize: 13, fontWeight: 600, opacity: 0.8 },

  main: { padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 12 },
  card: { background: '#fff', borderRadius: 14, overflow: 'hidden', boxShadow: '0 1px 6px rgba(0,0,0,.08)' },
  cardTitle: { display: 'flex', alignItems: 'center', gap: 8, padding: '13px 16px 12px', fontSize: 11, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', borderBottom: '1px solid #ddd' },
  cardBody: { padding: '14px 16px' },
  tagList: { display: 'flex', flexWrap: 'wrap', gap: 8 },
  tagRed: { background: '#FDECEA', color: '#96281B', borderRadius: 8, padding: '7px 13px', fontSize: 15, fontWeight: 700 },
  tagNone: { fontSize: 15, fontWeight: 600, color: '#1B7F45', display: 'flex', alignItems: 'center', gap: 6 },
  rowList: { display: 'flex', flexDirection: 'column', gap: 0 },
  rowItem: { display: 'flex', alignItems: 'flex-start', gap: 10, padding: '9px 0', borderBottom: '1px solid #F0F0F0', fontSize: 15, fontWeight: 600, lineHeight: 1.35 },
  rowDot: { width: 7, height: 7, borderRadius: '50%', marginTop: 5, flexShrink: 0 },

  sectionLabel: { fontSize: 10, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: '#AAAAAA', padding: '4px 4px 0' },
  infoGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 },
  tile: { background: '#fff', borderRadius: 14, padding: '14px 16px', boxShadow: '0 1px 6px rgba(0,0,0,.07)' },
  tileLabel: { fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#666', marginBottom: 5 },
  tileValue: { fontSize: 22, fontWeight: 800, color: '#111', lineHeight: 1 },

  footer: { padding: '16px 20px 28px', textAlign: 'center', fontSize: 11, color: '#AAAAAA', lineHeight: 1.6 },

  pinWrap: { display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#F5F5F5', padding: 20, fontFamily: "'DM Sans', system-ui, sans-serif" },
  pinCard: { background: '#fff', borderRadius: 20, padding: '36px 28px', maxWidth: 340, width: '100%', textAlign: 'center', boxShadow: '0 4px 24px rgba(0,0,0,.1)' },
  pinIcon: { fontSize: 40, marginBottom: 12 },
  pinTitle: { fontSize: 22, fontWeight: 800, color: '#111', margin: 0 },
  pinSub: { fontSize: 14, color: '#666', marginTop: 8, marginBottom: 24 },
  pinInput: { width: '100%', border: '2px solid #DDD', borderRadius: 12, padding: '14px', fontSize: 28, textAlign: 'center', letterSpacing: '0.3em', fontWeight: 700, outline: 'none', marginBottom: 8 },
  pinError: { color: '#C0392B', fontSize: 13, fontWeight: 600, marginBottom: 12 },
  pinBtn: { width: '100%', background: '#C0392B', color: '#fff', border: 'none', borderRadius: 12, padding: '16px', fontSize: 17, fontWeight: 800, cursor: 'pointer', marginTop: 8 },
  pinHint: { fontSize: 11, color: '#AAAAAA', marginTop: 20, lineHeight: 1.6 },
};
