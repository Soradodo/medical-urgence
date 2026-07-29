export const runtime = 'nodejs';

import { checkAdminPassword } from '@/lib/utils';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_SIZE = 3 * 1024 * 1024; // 3 Mo

// ─── Rate limiting pour les uploads anonymes (via /register)
const uploadMap = new Map();
function checkUploadLimit(ip) {
  const now = Date.now();
  const windowMs = 60 * 60 * 1000; // 1 heure
  const max = 10; // max 10 uploads par heure par IP anonyme
  const entry = uploadMap.get(ip) || { count: 0, start: now };
  if (now - entry.start > windowMs) { uploadMap.set(ip, { count: 1, start: now }); return true; }
  entry.count++;
  uploadMap.set(ip, entry);
  return entry.count <= max;
}

export async function POST(request) {
  const url = new URL(request.url);
  const isAdmin = url.searchParams.get('admin') === '1';
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';

  if (isAdmin) {
    const adminPassword = request.headers.get('x-admin-password');
    if (!checkAdminPassword(adminPassword)) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }
  } else {
    // Upload anonyme (flux /register) — protégé par rate limiting
    if (!checkUploadLimit(ip)) {
      return Response.json({ error: 'Trop de tentatives, réessaie plus tard' }, { status: 429 });
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

  if (!file) {
    return Response.json({ error: 'No file in formData' }, { status: 400 });
  }

  // ─── Validation du type de fichier
  if (!ALLOWED_TYPES.includes(file.type)) {
    return Response.json({ error: 'Type de fichier non autorisé. Utilise JPEG, PNG, WEBP ou GIF.' }, { status: 400 });
  }

  // ─── Validation de la taille
  if (file.size > MAX_SIZE) {
    return Response.json({ error: 'Fichier trop volumineux (3 Mo maximum).' }, { status: 400 });
  }

  const bytes = await file.arrayBuffer();

  // ─── Vérification des "magic bytes" (empêche un fichier renommé en .jpg mais qui n'en est pas un)
  const header = new Uint8Array(bytes.slice(0, 12));
  const isValidImage = checkMagicBytes(header, file.type);
  if (!isValidImage) {
    return Response.json({ error: 'Le contenu du fichier ne correspond pas à une image valide.' }, { status: 400 });
  }

  const buffer = Buffer.from(bytes);
  const base64 = buffer.toString('base64');
  const dataUrl = `data:${file.type};base64,${base64}`;

  return Response.json({ url: dataUrl });
}

function checkMagicBytes(header, mimeType) {
  const bytes = Array.from(header);
  if (mimeType === 'image/jpeg') return bytes[0] === 0xFF && bytes[1] === 0xD8;
  if (mimeType === 'image/png') return bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4E && bytes[3] === 0x47;
  if (mimeType === 'image/gif') return bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46;
  if (mimeType === 'image/webp') return bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50;
  return false;
}