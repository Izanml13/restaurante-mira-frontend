import { useEffect, useRef, useState } from 'react';
import { AppState, Pressable, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import useUbicacion from '../hooks/useUbicacion.js';
import { ofertasCerca } from '../services/ofertasCercaApi.js';
import { debeConsultar, INTERVALO_MS } from '../models/avisosOfertasModel.js';
import { alVolverAPrimerPlano } from '../services/primerPlano.js';
import { ofertaParaLlegada } from '../models/accesoLlegada.js';
import { useTheme } from '../theme/ThemeContext';
import { useT } from '../i18n/index.jsx';
import es from '../i18n/es.js';
import ca from '../i18n/ca.js';
import en from '../i18n/en.js';
import { btnCta } from '../theme/ui';
const TRADS = { es, ca, en };

export default function AccesoLlegada({ restauranteId }) {
  const { activa, posicion } = useUbicacion();
  const [oferta, setOferta] = useState(null);
  const ultima = useRef(null);
  const router = useRouter();
  const { colores } = useTheme();
  const t = useT(TRADS);
  const posRef = useRef(posicion);
  const consultarRef = useRef(null);
  useEffect(() => { posRef.current = posicion; consultarRef.current?.(); }, [posicion]);
  useEffect(() => {
    setOferta(null);
    ultima.current = null;
    if (!activa) return undefined;
    let vivo = true;
    let enCurso = false;
    const consultar = async () => {
      const p = posRef.current;
      if (!vivo || AppState.currentState !== 'active' || !p || enCurso || !debeConsultar(ultima.current, p)) return;
      enCurso = true;
      ultima.current = { ...p, t: Date.now() };
      try {
        const datos = await ofertasCerca(p);
        if (vivo) setOferta(ofertaParaLlegada(datos, restauranteId));
      } catch { if (vivo) setOferta(null); }
      finally { enCurso = false; }
    };
    consultarRef.current = consultar;
    consultar();
    const reloj = setInterval(consultar, INTERVALO_MS);
    const baja = alVolverAPrimerPlano(AppState, consultar);
    return () => { vivo = false; consultarRef.current = null; clearInterval(reloj); baja(); };
  }, [activa, restauranteId]);
  if (!oferta || !activa || !posicion) return null;
  return (
    <View style={{ padding: 12, backgroundColor: colores.verdeSuave }}>
      <Text style={{ color: colores.tinta, marginBottom: 8 }}>{oferta.oferta.titulo}</Text>
      <Pressable accessibilityRole="button" onPress={() => router.push({ pathname: '/llegada', params: { id: String(restauranteId) } })}>
        <Text style={btnCta(colores)}>{t('apk.verQR')}</Text>
      </Pressable>
    </View>
  );
}
