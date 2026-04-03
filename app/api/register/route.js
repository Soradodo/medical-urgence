import { NextResponse } from 'next/server';
import { createFiche } from '@/lib/db';
import { generateToken, generatePin } from '@/lib/utils';

// Rate limiting pour les inscriptions
const registerMap = new Map();
function checkRegisterLimit(ip) {
  const now = Date.now();
  const windowMs = 60 * 60 * 1000; // 1 heure
  const max = 5; // max 5 inscriptions par heure par IP
  const entry = registerMap.get(ip) || { count: 0, start: now };
  if (now - entry.start > windowMs) { registerMap.set(ip, { count: 1, start: now }); return true; }
  entry.count++;
  registerMap.set(ip, entry);
  return entry.count <= max;
}

export async function POST(request) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';

  if (!checkRegisterLimit(ip)) {
    return NextResponse.json({ error: 'Trop de tentatives' }, { status: 429 });
  }

  const body = await request.json();

  // Validation minimale
  if (!body.prenom || !body.nom) {
    return NextResponse.json({ error: 'Prénom et nom requis' }, { status: 400 });
  }

  const token = generateToken();
  const pin = generatePin();

  const fiche = await createFiche({ ...body, token, pin });

  // Envoyer email de confirmation à l'admin
  const apiKey = process.env.RESEND_API_KEY;
  const alertEmail = process.env.ALERT_EMAIL;
  if (apiKey && alertEmail) {
    try {
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: 'urgence@resend.dev',
          to: alertEmail,
          subject: `🆕 Nouvelle fiche créée — ${body.prenom} ${body.nom}`,
          html: `<div style="font-family:sans-serif;max-width:500px;margin:auto;padding:24px">
            <h2>Nouvelle fiche médicale créée</h2>
            <p><strong>${body.prenom} ${body.nom}</strong> vient de créer sa fiche.</p>
            <p><strong>Token :</strong> ${token}</p>
            <p><strong>PIN :</strong> ${pin}</p>
            <p><strong>Lien :</strong> ${process.env.NEXT_PUBLIC_BASE_URL}/u/${token}</p>
          </div>`,
        }),
      });
    } catch (e) { console.error('Email failed:', e); }
  }

  return NextResponse.json({
    ok: true,
    token,
    pin,
    lien: `${process.env.NEXT_PUBLIC_BASE_URL}/u/${token}`,
  });
}
