import { neon } from '@neondatabase/serverless';
import fs from 'fs';

const sql = neon(process.env.DATABASE_URL);

async function backup() {
  const rows = await sql`SELECT * FROM fiches`;
  const date = new Date().toISOString().split('T')[0];
  const filename = `backups/backup-${date}.json`;

  if (!fs.existsSync('backups')) fs.mkdirSync('backups');
  fs.writeFileSync(filename, JSON.stringify(rows, null, 2));

  console.log(`Sauvegarde créée : ${filename} (${rows.length} fiche(s))`);
}

backup();
