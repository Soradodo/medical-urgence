import bcrypt from 'bcryptjs';
import { NextResponse } from 'next/server';
import { getFicheByToken, parseFiche, resetFichePin } from '@/lib/db';

// ─── Rate limiting en mémoire
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

// ─── Email d'alerte
async function sendAccessAlert({ ip, userAgent, nom, prenom }) {
  const apiKey = process.env.RESEND_API_KEY;
  const alertEmail = process.env.ALERT_EMAIL;
  if (!apiKey || !alertEmail) return;
  try {
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: 'urgence@resend.dev',
        to: alertEmail,
        subject: `🔔 Accès fiche médicale — ${prenom} ${nom}`,
        html: `<div style="font-family:sans-serif;max-width:500px;margin:auto;padding:24px">
          <h2 style="color:#C0392B">⚠️ Accès détecté</h2>
          <p>La fiche de <strong>${prenom} ${nom}</strong> a été consultée.</p>
          <table style="width:100%;border-collapse:collapse;margin-top:16px">
            <tr><td style="padding:8px;border:1px solid #eee;font-weight:bold">Date</td>
                <td style="padding:8px;border:1px solid #eee">${new Date().toLocaleString('fr-FR')}</td></tr>
            <tr><td style="padding:8px;border:1px solid #eee;font-weight:bold">IP</td>
                <td style="padding:8px;border:1px solid #eee">${ip}</td></tr>
            <tr><td style="padding:8px;border:1px solid #eee;font-weight:bold">Appareil</td>
                <td style="padding:8px;border:1px solid #eee">${userAgent?.slice(0, 80) || 'inconnu'}</td></tr>
          </table></div>`,
      }),
    });
  } catch (e) { console.error('Email alert failed:', e); }
}

// ─── HANDLER PRINCIPAL
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get('token');
  const pin = searchParams.get('pin');
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  const userAgent = request.headers.get('user-agent') || '';

  const secHeaders = {
    'Cache-Control': 'no-store, no-cache, must-revalidate',
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'no-referrer',
  };

  if (!checkRateLimit(ip)) {
    return NextResponse.json({ status: 'invalid' }, { status: 429, headers: secHeaders });
  }

  const fiche = await getFicheByToken(token);
  if (!fiche) {
    return NextResponse.json({ status: 'invalid' }, { status: 404, headers: secHeaders });
  }

  if (!pin) {
    return NextResponse.json({ status: 'pin_required' }, { status: 200, headers: secHeaders });
  }
  if (!bcrypt.compareSync(pin, fiche.pin)) {
    return NextResponse.json({ status: 'wrong_pin' }, { status: 401, headers: secHeaders });
  }

  sendAccessAlert({ ip, userAgent, nom: fiche.nom, prenom: fiche.prenom });

  return NextResponse.json(
    { status: 'ok', data: parseFiche(fiche) },
    { status: 200, headers: secHeaders }
  );
}
// ─── Changer son propre PIN (le patient doit connaître l'ancien)
export async function POST(request) {
  const body = await request.json();
  const { token, currentPin, newPin } = body;
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';

  const secHeaders = {
    'Cache-Control': 'no-store, no-cache, must-revalidate',
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
  };

  if (!checkRateLimit(ip)) {
    return NextResponse.json({ status: 'invalid' }, { status: 429, headers: secHeaders });
  }

  if (!/^\d{4}$/.test(newPin || '')) {
    return NextResponse.json({ status: 'invalid_format' }, { status: 400, headers: secHeaders });
  }

  const fiche = await getFicheByToken(token);
  if (!fiche) {
    return NextResponse.json({ status: 'invalid' }, { status: 404, headers: secHeaders });
  }

  if (!bcrypt.compareSync(currentPin, fiche.pin)) {
    return NextResponse.json({ status: 'wrong_pin' }, { status: 401, headers: secHeaders });
  }

  await resetFichePin(fiche.id, newPin);

  return NextResponse.json({ status: 'ok' }, { status: 200, headers: secHeaders });
}