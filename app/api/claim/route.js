import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { getFicheByTokenRaw, claimFiche } from '@/lib/db';

// ─── Rate limiting
const rateMap = new Map();
function checkRateLimit(ip) {
  const now = Date.now();
  const windowMs = 60 * 60 * 1000; // 1 heure
  const max = 10;
  const entry = rateMap.get(ip) || { count: 0, start: now };
  if (now - entry.start > windowMs) { rateMap.set(ip, { count: 1, start: now }); return true; }
  entry.count++;
  rateMap.set(ip, entry);
  return entry.count <= max;
}

// GET — vérifier le statut d'un token (vierge, déjà réclamé, ou invalide)
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get('token');

  const fiche = await getFicheByTokenRaw(token);
  if (!fiche) {
    return NextResponse.json({ status: 'invalid' }, { status: 404 });
  }
  if (fiche.reclamee) {
    return NextResponse.json({ status: 'already_claimed' }, { status: 200 });
  }
  return NextResponse.json({ status: 'unclaimed' }, { status: 200 });
}

// POST — réclamer une fiche vierge
export async function POST(request) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  if (!checkRateLimit(ip)) {
    return NextResponse.json({ error: 'Trop de tentatives' }, { status: 429 });
  }

  const body = await request.json();
  const { token, pin, ...data } = body;

  if (!data.prenom || !data.nom) {
    return NextResponse.json({ error: 'Prénom et nom requis' }, { status: 400 });
  }
  if (!/^\d{4}$/.test(pin || '')) {
    return NextResponse.json({ error: 'Le PIN doit contenir 4 chiffres' }, { status: 400 });
  }

  const fiche = await getFicheByTokenRaw(token);
  if (!fiche) {
    return NextResponse.json({ error: 'Puce invalide' }, { status: 404 });
  }
  if (fiche.reclamee) {
    return NextResponse.json({ error: 'Cette puce a déjà été enregistrée' }, { status: 409 });
  }

  const hashedPin = bcrypt.hashSync(pin, 10);
  const updated = await claimFiche(token, data, hashedPin);
  if (!updated) {
    return NextResponse.json({ error: 'Erreur lors de la réclamation' }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}