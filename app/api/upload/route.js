export const runtime = 'nodejs';

import { checkAdminPassword } from '@/lib/utils';

export async function POST(request) {
  const url = new URL(request.url);
  const isAdmin = url.searchParams.get('admin') === '1';

  if (isAdmin) {
    const adminPassword = request.headers.get('x-admin-password');
    if (!checkAdminPassword(adminPassword)) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  let formData;
  try {
    formData = await request.formData();
  } catch (err) {
    console.error('formData() error:', err.message);
    return Response.json({ error: err.message }, { status: 400 });
  }

  const file = formData.get('photo');
  console.log('File received:', file ? `${file.name} (${file.size} bytes)` : 'NULL');

  if (!file) {
    return Response.json({ error: 'No file in formData' }, { status: 400 });
  }

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  const base64 = buffer.toString('base64');
  const mimeType = file.type || 'image/jpeg';
  const dataUrl = `data:${mimeType};base64,${base64}`;

  return Response.json({ url: dataUrl });
}