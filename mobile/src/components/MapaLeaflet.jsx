/**
 * Mapa de la app con Leaflet + OpenStreetMap dentro de un WebView (el mismo
 * mapa que la web). Sustituye a react-native-maps, que en Android usa Google
 * Maps y cierra la app si no hay clave de API.
 *
 * puntos: [{ id, lat, lng, color, radio?, seleccionado?, titulo, texto?, boton? }]
 * encuadre: { lat, lng, zoom } fijo, o null para encuadrar todos los puntos.
 * onPulsar(id): al tocar el botón del globo de un punto.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, Platform, StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';

const HTML = `<!doctype html><html><head>
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1">
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css">
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<style>
html,body,#m{margin:0;height:100%;background:#e8ece9}
.leaflet-popup-content{margin:10px 12px;font:13px/1.35 system-ui,sans-serif;color:#181c1a}
.t{font-weight:700;font-size:14px}.x{color:#414844;margin-top:2px}
.b{display:inline-block;margin-top:8px;padding:6px 12px;border-radius:999px;background:#16382C;color:#fff;font-weight:700;border:0}
</style></head><body><div id="m"></div><script>
var mapa=L.map('m',{zoomControl:true,attributionControl:true,tap:false}).setView([41.6,1.8],8);
L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'© OpenStreetMap'}).addTo(mapa);
var capa=L.layerGroup().addTo(mapa);
function esc(s){return String(s==null?'':s).replace(/[&<>"]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
window.pintar=function(d){
  capa.clearLayers();var pts=[];
  (d.puntos||[]).forEach(function(p){
    var c=L.circleMarker([p.lat,p.lng],{radius:p.radio||9,color:p.seleccionado?'#f59e0b':'#fff',weight:p.seleccionado?3:2,fillColor:p.color||'#16382C',fillOpacity:1});
    var h='<div class="t">'+esc(p.titulo)+'</div>'+(p.texto?'<div class="x">'+esc(p.texto)+'</div>':'')+(p.boton?'<button class="b" onclick="pulsar(\\''+esc(p.id)+'\\')">'+esc(p.boton)+'</button>':'');
    c.bindPopup(h);c.addTo(capa);pts.push([p.lat,p.lng]);
    if(p.seleccionado)c.openPopup();
  });
  if(d.encuadre){mapa.setView([d.encuadre.lat,d.encuadre.lng],d.encuadre.zoom||14);}
  else if(pts.length>1){mapa.fitBounds(pts,{padding:[40,40],maxZoom:16});}
  else if(pts.length===1){mapa.setView(pts[0],15);}
};
window.pulsar=function(id){window.ReactNativeWebView&&window.ReactNativeWebView.postMessage(JSON.stringify({id:id}));};
window.ReactNativeWebView&&window.ReactNativeWebView.postMessage(JSON.stringify({listo:true}));
</script></body></html>`;

export default function MapaLeaflet({ puntos = [], encuadre = null, onPulsar, style }) {
  const ref = useRef(null);
  const [listo, setListo] = useState(false);
  const datos = useMemo(() => JSON.stringify({ puntos, encuadre }), [puntos, encuadre]);

  useEffect(() => {
    if (listo) ref.current?.injectJavaScript(`window.pintar(${datos});true;`);
  }, [listo, datos]);

  if (Platform.OS === 'web') {
    // react-native-webview no funciona en web (solo vista previa): marcador de posición.
    return (
      <View style={[styles.web, style]}>
        <Text style={styles.webTxt}>Mapa ({puntos.length})</Text>
      </View>
    );
  }

  return (
    <WebView
      ref={ref}
      style={[styles.mapa, style]}
      originWhitelist={['*']}
      source={{ html: HTML, baseUrl: 'https://mira.app/' }}
      javaScriptEnabled
      domStorageEnabled
      setSupportMultipleWindows={false}
      nestedScrollEnabled
      scrollEnabled={false}
      onMessage={(e) => {
        try {
          const m = JSON.parse(e.nativeEvent.data);
          if (m.listo) setListo(true);
          else if (m.id != null) onPulsar?.(String(m.id));
        } catch { /* mensaje no válido */ }
      }}
    />
  );
}

const styles = StyleSheet.create({
  mapa: { flex: 1, backgroundColor: '#e8ece9' },
  web: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#cfd8d3' },
  webTxt: { color: '#414844' },
});
