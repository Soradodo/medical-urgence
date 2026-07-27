export function checkAdminPassword(password) {
  const envPass = process.env.ADMIN_PASSWORD;
  console.log('DEBUG - env défini:', !!envPass);
  console.log('DEBUG - longueur env:', envPass?.length);
  console.log('DEBUG - longueur reçue:', password?.length);
  console.log('DEBUG - match:', password === envPass);
  return password === envPass;
}