import { NextResponse } from 'next/server';
import { getAllFiches, getFicheById, createFiche, updateFiche, toggleFiche, deleteFiche, resetFichePin, getDeletedFiches, restoreFiche, permanentlyDeleteFiche } from '@/lib/db';
import { generateToken, generatePin, checkAdminPassword } from '@/lib/utils';

function unauthorized() {
  return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
}

// ─── Rate limiting en mémoire (protection contre le brute-force du mot de passe admin)
const rateMap = new Map();

function checkRateLimit(ip) {
  const now = Date.now();
  const windowMs = 15 * 60 * 1000; // 15 minutes
  const max = 10; // max 10 tentatives par 15 min par IP

  const entry = rateMap.get(ip) || { count: 0, start: now };
  if (now - entry.start > windowMs) {
    rateMap.set(ip, { count: 1, start: now });
    return true;
  }
  entry.count++;
  rateMap.set(ip, entry);
  return entry.count <= max;
}

function getIP(request) {
  return request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
}

// GET /api/admin?action=list ou ?action=get&id=X
export async function GET(request) {
  const ip = getIP(request);
  if (!checkRateLimit(ip)) {
    return NextResponse.json({ error: 'Trop de tentatives, réessaie plus tard' }, { status: 429 });
  }

  const { searchParams } = new URL(request.url);
  const password = request.headers.get('x-admin-password');
  if (!checkAdminPassword(password)) return unauthorized();

  const action = searchParams.get('action');

  if (action === 'list') {
    const fiches = await getAllFiches();
    return NextResponse.json({ fiches });
  }

  if (action === 'get') {
    const id = searchParams.get('id');
    const fiche = await getFicheById(id);
    if (!fiche) return NextResponse.json({ error: 'Introuvable' }, { status: 404 });
    return NextResponse.json({ fiche });
  }
if (action === 'trash') {
    const deleted = await getDeletedFiches();
    return NextResponse.json({ deleted });
  }
  return NextResponse.json({ error: 'Action inconnue' }, { status: 400 });
}

// POST /api/admin — créer ou modifier une fiche
export async function POST(request) {
  const ip = getIP(request);
  if (!checkRateLimit(ip)) {
    return NextResponse.json({ error: 'Trop de tentatives, réessaie plus tard' }, { status: 429 });
  }

  const password = request.headers.get('x-admin-password');
  if (!checkAdminPassword(password)) return unauthorized();

  const body = await request.json();
  const { action, id, ...data } = body;

  if (action === 'create') {
    const token = generateToken();
    const pin = generatePin();
    const fiche = await createFiche({ ...data, token, pin });
    return NextResponse.json({ fiche, token, pin });
  }

  if (action === 'update') {
    const fiche = await updateFiche(id, data);
    return NextResponse.json({ fiche });
  }

  if (action === 'toggle') {
    await toggleFiche(id, data.actif);
    return NextResponse.json({ ok: true });
  }

  if (action === 'delete') {
    await deleteFiche(id);
    return NextResponse.json({ ok: true });
  }

  if (action === 'reset_pin') {
    const newPin = generatePin();
    await resetFichePin(id, newPin);
    return NextResponse.json({ newPin });
  }
if (action === 'restore') {
    await restoreFiche(id);
    return NextResponse.json({ ok: true });
  }

  if (action === 'permanent_delete') {
    await permanentlyDeleteFiche(id);
    return NextResponse.json({ ok: true });
  }
  return NextResponse.json({ error: 'Action inconnue' }, { status: 400 });
}