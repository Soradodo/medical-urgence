import { neon } from '@neondatabase/serverless';
import bcrypt from 'bcryptjs';

function getSQL() {
  return neon(process.env.DATABASE_URL);
}

// Créer les tables si elles n'existent pas encore
export async function initDB() {
  const sql = getSQL();
  await sql`
    CREATE TABLE IF NOT EXISTS fiches (
      id SERIAL PRIMARY KEY,
      token TEXT UNIQUE NOT NULL,
      pin TEXT NOT NULL,
      actif BOOLEAN DEFAULT true,
      prenom TEXT NOT NULL,
      nom TEXT NOT NULL,
      age TEXT,
      groupe_sanguin TEXT,
      poids TEXT,
      allergies TEXT,
      conditions TEXT,
      traitements TEXT,
      contact_nom TEXT,
      contact_tel TEXT,
      contact_tel_display TEXT,
      medecin TEXT,
      medecin_tel TEXT,
      notes TEXT,
      photo_url TEXT,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    )
  `;
}

// Récupérer une fiche par token
export async function getFicheByToken(token) {
  const sql = getSQL();
  await initDB();
  const rows = await sql`
    SELECT * FROM fiches WHERE token = ${token} AND actif = true
  `;
  return rows[0] || null;
}

// Récupérer toutes les fiches (admin)
export async function getAllFiches() {
  const sql = getSQL();
  await initDB();
  const rows = await sql`
    SELECT id, token, prenom, nom, age, actif, created_at, updated_at
    FROM fiches ORDER BY created_at DESC
  `;
  return rows;
}

// Récupérer une fiche complète par ID (admin)
export async function getFicheById(id) {
  const sql = getSQL();
  await initDB();
  const rows = await sql`SELECT * FROM fiches WHERE id = ${id}`;
  return rows[0] || null;
}

// Créer une fiche
export async function createFiche(data) {
  const sql = getSQL();
  await initDB();
  const hashedPin = bcrypt.hashSync(data.pin, 10);
  const rows = await sql`
    INSERT INTO fiches (
      token, pin, prenom, nom, age, groupe_sanguin, poids,
      allergies, conditions, traitements,
      contact_nom, contact_tel, contact_tel_display,
      medecin, medecin_tel, notes, photo_url
    ) VALUES (
      ${data.token}, ${hashedPin}, ${data.prenom}, ${data.nom},
      ${data.age || ''}, ${data.groupe_sanguin || ''}, ${data.poids || ''},
      ${data.allergies || ''}, ${data.conditions || ''}, ${data.traitements || ''},
      ${data.contact_nom || ''}, ${data.contact_tel || ''}, ${data.contact_tel_display || ''},
      ${data.medecin || ''}, ${data.medecin_tel || ''}, ${data.notes || ''},
      ${data.photo_url || null}
    ) RETURNING *
  `;
  return rows[0];
}

// Modifier une fiche
export async function updateFiche(id, data) {
  const sql = getSQL();
  await initDB();
  const rows = await sql`
    UPDATE fiches SET
      prenom = ${data.prenom},
      nom = ${data.nom},
      age = ${data.age || ''},
      groupe_sanguin = ${data.groupe_sanguin || ''},
      poids = ${data.poids || ''},
      allergies = ${data.allergies || ''},
      conditions = ${data.conditions || ''},
      traitements = ${data.traitements || ''},
      contact_nom = ${data.contact_nom || ''},
      contact_tel = ${data.contact_tel || ''},
      contact_tel_display = ${data.contact_tel_display || ''},
      medecin = ${data.medecin || ''},
      medecin_tel = ${data.medecin_tel || ''},
      notes = ${data.notes || ''},
      photo_url = ${data.photo_url || null},
      updated_at = NOW()
    WHERE id = ${id} RETURNING *
  `;
  return rows[0];
}

// Activer / désactiver une fiche
export async function toggleFiche(id, actif) {
  const sql = getSQL();
  await initDB();
  await sql`UPDATE fiches SET actif = ${actif} WHERE id = ${id}`;
}

// Supprimer une fiche
export async function deleteFiche(id) {
  const sql = getSQL();
  await initDB();
  await sql`DELETE FROM fiches WHERE id = ${id}`;
}

// Parser les données médicales depuis la DB vers l'objet utilisé par la page
export function parseFiche(row) {
  return {
    prenom: row.prenom,
    nom: row.nom,
    age: row.age,
    groupeSanguin: row.groupe_sanguin,
    poids: row.poids,
    photoUrl: row.photo_url || null,
    allergies: row.allergies ? row.allergies.split('|').map(a => a.trim()).filter(Boolean) : [],
    conditions: row.conditions ? row.conditions.split('|').map(c => c.trim()).filter(Boolean) : [],
    traitements: row.traitements ? row.traitements.split('|').map(t => {
      const [nom, dose] = t.split(':');
      return { nom: nom?.trim(), dose: dose?.trim() || '' };
    }).filter(t => t.nom) : [],
    contactNom: row.contact_nom,
    contactTel: row.contact_tel,
    contactTelDisplay: row.contact_tel_display || row.contact_tel,
    medecin: row.medecin,
    medecinTel: row.medecin_tel,
    notes: row.notes,
  };
}