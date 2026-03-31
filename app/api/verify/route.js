import { NextResponse } from 'next/server';

// ─── Rate limiting (en mémoire, réinitialisé à chaque déploiement)
// Pour production robuste, remplacer par Vercel KV
const rateMap = new Map();

function checkRateLimit(ip) {
  const now = Date.now();
  const windowMs = 15 * 60 * 1000; // 15 minutes
  const max = 20; // max 20 requêtes par 15 min par IP

  const entry = rateMap.get(ip) || { count: 0, start: now };
  if (now - entry.start > windowMs) {
    rateMap.set(ip, { count: 1, start: now });
    return true;
  }
  entry.count++;
  rateMap.set(ip, entry);
  return entry.count <= max;
}

// ─── Envoi d'email via Resend (gratuit jusqu'à 3000 emails/mois)
async function sendAccessAlert({ ip, userAgent, token, timestamp }) {
  const apiKey = process.env.RESEND_API_KEY;
  const alertEmail = process.env.ALERT_EMAIL;
  if (!apiKey || !alertEmail) return; // Skip si non configuré

  try {
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: 'urgence@resend.dev',
        to: alertEmail,
        subject: '🔔 Accès à votre fiche médicale d\'urgence',
        html: `
          <div style="font-family:sans-serif;max-width:500px;margin:auto;padding:24px">
            <h2 style="color:#C0392B">⚠️ Accès détecté — Fiche médicale d'urgence</h2>
            <p>Votre fiche médicale d'urgence a été consultée.</p>
            <table style="width:100%;border-collapse:collapse;margin-top:16px">
              <tr><td style="padding:8px;border:1px solid #eee;font-weight:bold">Date</td>
                  <td style="padding:8px;border:1px solid #eee">${new Date(timestamp).toLocaleString('fr-FR')}</td></tr>
              <tr><td style="padding:8px;border:1px solid #eee;font-weight:bold">IP</td>
                  <td style="padding:8px;border:1px solid #eee">${ip}</td></tr>
              <tr><td style="padding:8px;border:1px solid #eee;font-weight:bold">Appareil</td>
                  <td style="padding:8px;border:1px solid #eee">${userAgent?.slice(0, 80) || 'inconnu'}</td></tr>
              <tr><td style="padding:8px;border:1px solid #eee;font-weight:bold">Token</td>
                  <td style="padding:8px;border:1px solid #eee">${token?.slice(0, 8)}...</td></tr>
            </table>
            <p style="margin-top:16px;color:#888;font-size:12px">
              Si vous n'étiez pas en situation d'urgence, quelqu'un a accédé à votre fiche médicale. 
              Pensez à régénérer votre lien depuis votre interface de gestion.
            </p>
          </div>
        `,
      }),
    });
  } catch (e) {
    console.error('Email alert failed:', e);
  }
}

// ─── Décodage des données médicales depuis les variables d'environnement
function getMedicalData(token) {
  const validToken = process.env.MEDICAL_TOKEN;
  const expiryStr = process.env.MEDICAL_EXPIRY; // Format: "2025-12-31" ou vide = jamais

  if (!validToken || token !== validToken) return null;

  // Vérifier l'expiration
  if (expiryStr) {
    const expiry = new Date(expiryStr);
    if (new Date() > expiry) return 'expired';
  }

  // Lire les données depuis les variables d'environnement
  return {
    prenom: process.env.MEDICAL_PRENOM || 'Prénom',
    nom: process.env.MEDICAL_NOM || 'Nom',
    age: process.env.MEDICAL_AGE || '',
    groupeSanguin: process.env.MEDICAL_GROUPE_SANGUIN || '',
    poids: process.env.MEDICAL_POIDS || '',
    allergies: process.env.MEDICAL_ALLERGIES
      ? process.env.MEDICAL_ALLERGIES.split('|').map(a => a.trim()).filter(Boolean)
      : [],
    conditions: process.env.MEDICAL_CONDITIONS
      ? process.env.MEDICAL_CONDITIONS.split('|').map(c => c.trim()).filter(Boolean)
      : [],
    traitements: process.env.MEDICAL_TRAITEMENTS
      ? process.env.MEDICAL_TRAITEMENTS.split('|').map(t => {
          const [nom, dose] = t.split(':');
          return { nom: nom.trim(), dose: dose?.trim() || '' };
        }).filter(t => t.nom)
      : [],
    contactNom: process.env.MEDICAL_CONTACT_NOM || 'Contact d\'urgence',
    contactTel: process.env.MEDICAL_CONTACT_TEL || '',
    contactTelDisplay: process.env.MEDICAL_CONTACT_TEL_DISPLAY || process.env.MEDICAL_CONTACT_TEL || '',
    medecin: process.env.MEDICAL_MEDECIN || '',
    medecinTel: process.env.MEDICAL_MEDECIN_TEL || '',
    notes: process.env.MEDICAL_NOTES || '',
  };
}

// ─── HANDLER PRINCIPAL
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get('token');
  const pin = searchParams.get('pin');

  // IP pour rate limiting
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  const userAgent = request.headers.get('user-agent') || '';

  // Headers de sécurité
  const secHeaders = {
    'Cache-Control': 'no-store, no-cache, must-revalidate',
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'no-referrer',
  };

  // Rate limiting
  if (!checkRateLimit(ip)) {
    return NextResponse.json({ status: 'invalid', message: 'Trop de requêtes' }, {
      status: 429, headers: secHeaders
    });
  }

  // Vérifier le token
  const medicalData = getMedicalData(token);

  if (medicalData === null) {
    return NextResponse.json({ status: 'invalid' }, { status: 404, headers: secHeaders });
  }
  if (medicalData === 'expired') {
    return NextResponse.json({ status: 'expired' }, { status: 410, headers: secHeaders });
  }

  // Vérifier si PIN requis
  const requiredPin = process.env.MEDICAL_PIN;
  if (requiredPin) {
    if (!pin) {
      return NextResponse.json({ status: 'pin_required' }, { status: 200, headers: secHeaders });
    }
    if (pin !== requiredPin) {
      return NextResponse.json({ status: 'wrong_pin' }, { status: 401, headers: secHeaders });
    }
  }

  // Accès accordé — envoyer alerte email en arrière-plan
  sendAccessAlert({ ip, userAgent, token, timestamp: Date.now() });

  return NextResponse.json(
    { status: 'ok', data: medicalData },
    { status: 200, headers: secHeaders }
  );
}
