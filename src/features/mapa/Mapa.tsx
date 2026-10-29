import { useEffect, useImperativeHandle, useRef, useState, type Ref } from 'react'
import { Linking, Platform, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native'
import { WebView } from 'react-native-webview'
import type { ShouldStartLoadRequest } from 'react-native-webview/lib/WebViewTypes'
import type { Limites } from '../../api/endpoints'
import { API_URL, MAPA_TESELAS } from '../../lib/config'
import { colores } from '../../lib/theme'
import { MarcoWeb, type MarcoWebRef } from './MarcoWeb'

/**
 * Mapa gratuito y sin clave: Leaflet + teselas de OpenStreetMap dentro de un WebView
 * (funciona en Expo Go, a diferencia de MapLibre o Google Maps, que piden build propio o clave).
 * La app y el mapa se hablan por mensajes: el HTML se arma una sola vez y los cambios se inyectan.
 */

export interface PuntoMapa {
  lat: number
  lng: number
}

export interface PinMapa extends PuntoMapa {
  id: string
  tipo: 'patita' | 'refugio' | 'yo'
  activo?: boolean
  arrastrable?: boolean
  /** Si tiene título, al tocar el pin se abre un globo con título y descripción. */
  titulo?: string
  descripcion?: string
}

export interface MapaRef {
  volarA: (lat: number, lng: number, zoom?: number) => void
}

interface Props {
  ref?: Ref<MapaRef>
  centro: PuntoMapa
  zoom: number
  pines?: PinMapa[]
  /** false: mapa fijo (sin arrastrar ni hacer zoom), para vistas previas. */
  interactivo?: boolean
  style?: StyleProp<ViewStyle>
  onToque?: (p: PuntoMapa) => void
  onPin?: (id: string) => void
  onPinLargo?: (id: string) => void
  onPinArrastrado?: (id: string, p: PuntoMapa) => void
  onRegion?: (limites: Limites) => void
}

type Evento =
  | { tipo: 'listo' }
  | { tipo: 'region'; limites: Limites }
  | { tipo: 'toque'; lat: number; lng: number }
  | { tipo: 'pin' | 'pinLargo'; id: string }
  | { tipo: 'arrastre'; id: string; lat: number; lng: number }

// Los tipos de react-native-webview usan `WebViewProps & undefined` por defecto, que TypeScript reduce a `never`.
const WebViewMapa = WebView<object>

export function Mapa({ ref, centro, zoom, pines = [], interactivo = true, style, ...eventos }: Props) {
  const web = useRef<WebView<object>>(null)
  const marco = useRef<MarcoWebRef>(null)
  const listo = useRef(false)
  const manejadores = useRef(eventos)
  const pinesJson = JSON.stringify(pines)
  const ultimosPines = useRef(pinesJson)
  // Un "volar" pedido antes de que cargue el mapa se aplica al cargar.
  const vueloPendiente = useRef<string | null>(null)
  const [html] = useState(() => crearHtml(centro, zoom, interactivo))

  useEffect(() => {
    manejadores.current = eventos
  })

  const ejecutar = (comando: string) =>
    (web.current ?? marco.current)?.injectJavaScript(`window.recibir(${comando});true;`)

  useEffect(() => {
    ultimosPines.current = pinesJson
    if (listo.current) ejecutar(`{"tipo":"pines","pines":${pinesJson}}`)
  }, [pinesJson])

  useImperativeHandle(ref, () => ({
    volarA: (lat, lng, z) => {
      const comando = JSON.stringify({ tipo: 'volar', lat, lng, zoom: z })
      if (listo.current) ejecutar(comando)
      else vueloPendiente.current = comando
    },
  }), [])

  // Sirve tanto para el WebView (WebViewMessageEvent) como para el iframe de la versión web.
  const alMensaje = (e: { nativeEvent: { data: string } }) => {
    const ev = JSON.parse(e.nativeEvent.data) as Evento
    const h = manejadores.current
    switch (ev.tipo) {
      case 'listo':
        listo.current = true
        ejecutar(`{"tipo":"pines","pines":${ultimosPines.current}}`)
        if (vueloPendiente.current) ejecutar(vueloPendiente.current)
        vueloPendiente.current = null
        break
      case 'region':
        h.onRegion?.(ev.limites)
        break
      case 'toque':
        h.onToque?.({ lat: ev.lat, lng: ev.lng })
        break
      case 'pin':
        h.onPin?.(ev.id)
        break
      case 'pinLargo':
        h.onPinLargo?.(ev.id)
        break
      case 'arrastre':
        h.onPinArrastrado?.(ev.id, { lat: ev.lat, lng: ev.lng })
        break
    }
  }

  // El enlace de la atribución (OpenStreetMap) se abre en el navegador, no dentro del mapa.
  const permitirNavegacion = (r: ShouldStartLoadRequest) => {
    if (r.url.startsWith(API_URL) || r.url.startsWith('about:') || r.url.startsWith('data:')) return true
    void Linking.openURL(r.url)
    return false
  }

  if (Platform.OS === 'web') {
    return (
      <View style={[estilos.contenedor, style]}>
        <MarcoWeb ref={marco} html={html} onMessage={alMensaje} />
      </View>
    )
  }

  return (
    <View style={[estilos.contenedor, style]}>
      <WebViewMapa
        ref={web}
        // La URL base da un Referer a las peticiones de teselas, que OpenStreetMap exige.
        source={{ html, baseUrl: API_URL }}
        originWhitelist={['*']}
        onMessage={alMensaje}
        onLoadStart={() => (listo.current = false)}
        onShouldStartLoadWithRequest={permitirNavegacion}
        onContentProcessDidTerminate={() => web.current?.reload()}
        scrollEnabled={false}
        bounces={false}
        overScrollMode="never"
        nestedScrollEnabled
        style={estilos.web}
      />
    </View>
  )
}

const ICONO_PATITA =
  '<svg viewBox="0 0 24 24"><ellipse cx="5.5" cy="10" rx="2.2" ry="2.8"/><ellipse cx="9.5" cy="5" rx="2.2" ry="2.8"/>' +
  '<ellipse cx="14.5" cy="5" rx="2.2" ry="2.8"/><ellipse cx="18.5" cy="10" rx="2.2" ry="2.8"/>' +
  '<path d="M12 10.5c-3 0-6.5 4.5-6.5 7.2 0 1.8 1.4 2.6 3 2.6 1.4 0 2.3-.7 3.5-.7s2.1.7 3.5.7c1.6 0 3-.8 3-2.6 0-2.7-3.5-7.2-6.5-7.2z"/></svg>'
const ICONO_REFUGIO = '<svg viewBox="0 0 24 24"><path d="M12 3 2.5 11h2.7v9.5h5.3v-6h3v6h5.3V11h2.7z"/></svg>'

function crearHtml(centro: PuntoMapa, zoom: number, interactivo: boolean): string {
  const opciones = interactivo
    ? { zoomControl: false }
    : { zoomControl: false, dragging: false, touchZoom: false, doubleClickZoom: false, scrollWheelZoom: false, boxZoom: false, keyboard: false, tapHold: false }

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no">
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=" crossorigin="">
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js" integrity="sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=" crossorigin=""></script>
<style>
  html, body, #mapa { margin: 0; height: 100%; background: #f2efe9; }
  body { -webkit-user-select: none; user-select: none; -webkit-touch-callout: none; -webkit-tap-highlight-color: transparent; }
  .pin { width: 40px; height: 40px; box-sizing: border-box; border-radius: 50%; border: 3px solid #fff; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 6px rgba(0,0,0,.3); transition: transform .15s; }
  .pin svg { width: 22px; height: 22px; fill: #fff; }
  .patita { background: ${colores.marca}; }
  .refugio { background: ${colores.refugio}; }
  .activo { transform: scale(1.18); }
  .yo { width: 18px; height: 18px; box-sizing: border-box; border-radius: 50%; background: #2563eb; border: 3px solid #fff; box-shadow: 0 0 0 6px rgba(37,99,235,.25); }
  .aviso { font: 14px sans-serif; color: ${colores.textoSuave}; padding: 24px 16px; text-align: center; }
  .leaflet-popup-content { font: 14px sans-serif; color: ${colores.texto}; }
</style>
</head>
<body>
<div id="mapa"></div>
<script>
(function () {
  function enviar(e) {
    var datos = JSON.stringify(e);
    if (window.ReactNativeWebView) window.ReactNativeWebView.postMessage(datos);
    else if (window.parent !== window) window.parent.postMessage(datos, '*'); // versión web (iframe)
  }
  if (!window.L) {
    document.body.innerHTML = '<p class="aviso">No se pudo cargar el mapa. Revisa tu conexión a internet.</p>';
    return;
  }

  var ICONOS = { patita: ${JSON.stringify(ICONO_PATITA)}, refugio: ${JSON.stringify(ICONO_REFUGIO)} };
  var mapa = L.map('mapa', ${JSON.stringify(opciones)}).setView([${centro.lat}, ${centro.lng}], ${zoom});
  L.tileLayer(${JSON.stringify(MAPA_TESELAS.url)}, { maxZoom: 19, attribution: ${JSON.stringify(MAPA_TESELAS.atribucion)} }).addTo(mapa);
  mapa.attributionControl.setPrefix(false);

  var pines = {};

  function icono(p) {
    if (p.tipo === 'yo') return L.divIcon({ className: '', html: '<div class="yo"></div>', iconSize: [18, 18] });
    return L.divIcon({
      className: '',
      html: '<div class="pin ' + p.tipo + (p.activo ? ' activo' : '') + '">' + ICONOS[p.tipo] + '</div>',
      iconSize: [40, 40],
    });
  }

  function globo(p) {
    var c = document.createElement('div');
    var t = document.createElement('b');
    t.textContent = p.titulo;
    c.appendChild(t);
    if (p.descripcion) {
      c.appendChild(document.createElement('br'));
      c.appendChild(document.createTextNode(p.descripcion));
    }
    return c;
  }

  // Mantener presionado ~0,55 s sin mover el dedo.
  function detectarPresionLarga(marcador, id) {
    var el = marcador.getElement(), espera = null, inicio = null;
    function cancelar() { clearTimeout(espera); inicio = null; }
    el.addEventListener('touchstart', function (e) {
      var t = e.touches[0];
      inicio = { x: t.clientX, y: t.clientY };
      marcador._largo = false;
      espera = setTimeout(function () { marcador._largo = true; enviar({ tipo: 'pinLargo', id: id }); }, 550);
    }, { passive: true });
    el.addEventListener('touchmove', function (e) {
      var t = e.touches[0];
      if (inicio && Math.abs(t.clientX - inicio.x) + Math.abs(t.clientY - inicio.y) > 10) cancelar();
    }, { passive: true });
    el.addEventListener('touchend', cancelar, { passive: true });
    el.addEventListener('touchcancel', cancelar, { passive: true });
    el.addEventListener('contextmenu', function (e) { e.preventDefault(); });
  }

  function crearPin(p) {
    var m = L.marker([p.lat, p.lng], {
      icon: icono(p),
      draggable: !!p.arrastrable,
      keyboard: false,
      zIndexOffset: p.activo ? 1000 : p.tipo === 'yo' ? -1000 : 0,
    }).addTo(mapa);
    m.on('click', function () {
      if (m._largo) { m._largo = false; return; }
      if (p.titulo) L.popup({ offset: [0, -14] }).setLatLng(m.getLatLng()).setContent(globo(p)).openOn(mapa);
      enviar({ tipo: 'pin', id: p.id });
    });
    m.on('dragend', function () {
      var ll = m.getLatLng().wrap();
      enviar({ tipo: 'arrastre', id: p.id, lat: ll.lat, lng: ll.lng });
    });
    if (!p.arrastrable && p.tipo !== 'yo') detectarPresionLarga(m, p.id);
    return m;
  }

  function ponerPines(lista) {
    var vigentes = {};
    lista.forEach(function (p) {
      var clave = JSON.stringify(p), actual = pines[p.id];
      vigentes[p.id] = true;
      if (actual && actual.clave === clave) return;
      if (actual) mapa.removeLayer(actual.marcador);
      pines[p.id] = { clave: clave, marcador: crearPin(p) };
    });
    Object.keys(pines).forEach(function (id) {
      if (!vigentes[id]) { mapa.removeLayer(pines[id].marcador); delete pines[id]; }
    });
  }

  function envolver(lng) { return ((((lng + 180) % 360) + 360) % 360) - 180; }

  function avisarRegion() {
    var b = mapa.getBounds();
    var todo = b.getEast() - b.getWest() >= 360;
    enviar({ tipo: 'region', limites: {
      norte: Math.min(90, b.getNorth()), sur: Math.max(-90, b.getSouth()),
      este: todo ? 180 : envolver(b.getEast()), oeste: todo ? -180 : envolver(b.getWest()),
    } });
  }

  mapa.on('click', function (e) {
    var ll = e.latlng.wrap();
    enviar({ tipo: 'toque', lat: ll.lat, lng: ll.lng });
  });
  mapa.on('moveend', avisarRegion);

  window.recibir = function (c) {
    if (c.tipo === 'pines') ponerPines(c.pines);
    else if (c.tipo === 'volar') mapa.flyTo([c.lat, c.lng], c.zoom || mapa.getZoom(), { duration: 0.6 });
  };

  enviar({ tipo: 'listo' });
  avisarRegion();
})();
</script>
</body>
</html>`
}

const estilos = StyleSheet.create({
  contenedor: { overflow: 'hidden', backgroundColor: '#f2efe9' },
  web: { flex: 1, backgroundColor: 'transparent' },
})
