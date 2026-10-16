/** Una fuente de vistos para foreground y background: no usar la copia del shim. */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { prepararAvisos, CLAVE_SESIONES, CLAVE_VISTOS, leerVistos } from '../models/avisosOfertasModel.js';

let cola = Promise.resolve();
export function seleccionarAvisos(resultados, limite = Infinity, sigueVigente = () => true) {
  const turno = cola.then(async () => {
    if (!sigueVigente()) return [];
    const ahora = Date.now();
    const crudo = await AsyncStorage.getItem(CLAVE_SESIONES);
    let anterior;
    try { anterior = JSON.parse(crudo || 'null'); } catch { anterior = null; }
    if (!anterior) {
      const legado = await AsyncStorage.getItem(CLAVE_VISTOS);
      const vistos = leerVistos({ getItem: () => legado }, ahora);
      anterior = prepararAvisos([], null, ahora).estado;
      anterior.claves = [...vistos];
    }
    if (!sigueVigente()) return [];
    const { nuevos, estado } = prepararAvisos(resultados, anterior, ahora, limite);
    await AsyncStorage.setItem(CLAVE_SESIONES, JSON.stringify(estado));
    if (!sigueVigente()) {
      // Cambió primer/segundo plano durante la escritura: nadie lo ha mostrado.
      // Restaurar dentro de la cola permite que el siguiente consumidor avise.
      await AsyncStorage.setItem(CLAVE_SESIONES, JSON.stringify(anterior));
      return [];
    }
    return nuevos;
  });
  cola = turno.catch(() => {});
  return turno;
}
