/**
 * Llama a `fn` cada vez que la app vuelve a primer plano (de Ajustes, de otra
 * app o de la pantalla bloqueada). `AppState` es el de react-native (inyectado
 * para poder probarlo con node --test). Devuelve la función para darse de baja.
 */
export function alVolverAPrimerPlano(AppState, fn) {
  let anterior = AppState.currentState;
  const sub = AppState.addEventListener('change', (estado) => {
    if (estado === 'active' && anterior && anterior !== 'active') fn();
    anterior = estado;
  });
  return () => sub?.remove?.();
}
