// Solo valida formato; no comprueba que el buzón exista.
export function emailInvitacionValido(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || '').trim());
}
