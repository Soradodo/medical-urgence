import { put } from '@vercel/blob';
import { NextResponse } from 'next/server';
import { checkAdminPassword } from '@/lib/utils';

export async function POST(request) {
  const url = new URL(request.url);
  const isAdmin = url.searchParams.get('admin') === '1';
  const password = request.headers.get('x-admin-password');

  // Si upload admin, vérifier le mot de passe
  if (isAdmin && !checkAdminPassword(password)) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get('photo');

  if (!file || typeof file === 'string') {
    return NextResponse.json({ error: 'Aucun fichier' }, { status: 400 });
  }

  // Validation : image uniquement, max 5 MB
  if (!file.type.startsWith('image/')) {
    return NextResponse.json({ error: 'Le fichier doit être une image' }, { status: 400 });
  }
  if (file.size > 5 * 1024 * 1024) {
    return NextResponse.json({ error: 'Image trop lourde (max 5 MB)' }, { status: 400 });
  }

  const ext = file.name.split('.').pop();
  const filename = `photos/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

  const blob = await put(filename, file, {
    access: 'public',
    contentType: file.type,
  });

  return NextResponse.json({ url: blob.url });
}
