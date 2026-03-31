import { redirect } from 'next/navigation';

export default function Home() {
  // Redirige la racine vers une page 404 discrète
  // Ne pas exposer qu'il s'agit d'un système médical
  redirect('/not-found');
}
