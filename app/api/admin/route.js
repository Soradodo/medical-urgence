import { NextResponse } from 'next/server';
import { getAllFiches, getFicheById, createFiche, updateFiche, toggleFiche, deleteFiche } from '@/lib/db';
import { generateToken, generatePin, checkAdminPassword } from '@/lib/utils';

function unauthorized() {
  return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
}

// GET /api/admin?action=list ou ?action=get&id=X
export async function GET(request) {
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

  return NextResponse.json({ error: 'Action inconnue' }, { status: 400 });
}

// POST /api/admin — créer ou modifier une fiche
export async function POST(request) {
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

  return NextResponse.json({ error: 'Action inconnue' }, { status: 400 });
}
