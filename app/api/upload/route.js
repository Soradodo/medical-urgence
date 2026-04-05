export const config = {
  api: {
    bodyParser: false,
  },
};
import { NextResponse } from 'next/server';
import { checkAdminPassword } from '@/lib/utils';

export async function POST(request) {
  const url = new URL(request.url);
  const isAdmin = url.searchParams.get('admin') === '1';
  const password = request.headers.get('x-admin-password');

  if (isAdmin && !checkAdminPassword(password)) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get('photo');

  if (!file || typeof file === 'string') {
    return NextResponse.json({ error: 'Aucun fichier' }, { status: 400 });
  }

  if (!file.type.startsWith('image/')) {
    return NextResponse.json({ error: 'Le fichier doit être une image' }, { status: 400 });
  }

  if (file.size > 1 * 1024 * 1024) {
    return NextResponse.json({ error: 'Image trop lourde (max 1 MB)' }, { status: 400 });
  }

  const buffer = await file.arrayBuffer();
  const base64 = Buffer.from(buffer).toString('base64');
  const dataUrl = `data:${file.type};base64,${base64}`;

  return NextResponse.json({ url: dataUrl });
  export const runtime = 'nodejs';
}