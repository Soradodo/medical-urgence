import { v4 as uuidv4 } from 'uuid';

// Génère un token URL-safe de 32 caractères
export function generateToken() {
  return uuidv4().replace(/-/g, '') + uuidv4().replace(/-/g, '').slice(0, 0);
}

// Génère un PIN à 4 chiffres
export function generatePin() {
  return String(Math.floor(1000 + Math.random() * 9000));
}

// Vérifie le mot de passe admin
export function checkAdminPassword(password) {
  const envPass = process.env.ADMIN_PASSWORD;
  console.log('DEBUG - env défini:', !!envPass);
  console.log('DEBUG - longueur env:', envPass?.length);
  console.log('DEBUG - longueur reçue:', password?.length);
  console.log('DEBUG - match:', password === envPass);
  return password === envPass;
}