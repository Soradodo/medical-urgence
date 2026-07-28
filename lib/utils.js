import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';

// Génère un token URL-safe de 32 caractères
export function generateToken() {
  return uuidv4().replace(/-/g, '') + uuidv4().replace(/-/g, '').slice(0, 0);
}

// Génère un PIN à 4 chiffres
export function generatePin() {
  return String(Math.floor(1000 + Math.random() * 9000));
}

// Vérifie le mot de passe admin (comparaison via hash bcrypt)
export function checkAdminPassword(password) {
  const hash = process.env.ADMIN_PASSWORD_HASH;
  if (!password || !hash) return false;
  return bcrypt.compareSync(password, hash);
}