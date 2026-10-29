import { Ionicons } from '@expo/vector-icons'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { Image } from 'expo-image'
import * as Location from 'expo-location'
import { router } from 'expo-router'
import { useEffect, useRef, useState } from 'react'
import { Pressable, StyleSheet, View } from 'react-native'
import { Text } from '../../components/Texto'
import { publicacionesApi, type Limites } from '../../api/endpoints'
import { Mapa, type MapaRef, type PinMapa, type PuntoMapa } from '../../features/mapa/Mapa'
import { CENTRO_POR_DEFECTO, mediaUrl } from '../../lib/config'
import { colores, radio, sombra } from '../../lib/theme'
import { toast } from '../../lib/toast'

const ESPERA_DOBLE_TOQUE_MS = 300

/** Un toque llama a `simple` (con espera); dos toques seguidos sobre la misma patita llaman a `doble`. */
function crearDetectorToques(simple: (id: string) => void, doble: (id: string) => void) {
  let ultimo: { id: string; t: number } | null = null
  let espera: ReturnType<typeof setTimeout> | undefined
  return (id: string) => {
    const ahora = Date.now()
    clearTimeout(espera)
    if (ultimo?.id === id && ahora - ultimo.t < ESPERA_DOBLE_TOQUE_MS) {
      ultimo = null
      doble(id)
      return
    }
    ultimo = { id, t: ahora }
    espera = setTimeout(() => simple(id), ESPERA_DOBLE_TOQUE_MS)
  }
}

function envolver(lng: number): number {
  return ((((lng + 180) % 360) + 360) % 360) - 180
}

/** Región visible con un margen extra, para cargar también las patitas cercanas al borde. */
function conMargen(l: Limites): Limites {
  const dLat = (l.norte - l.sur) * 0.3
  const dLng = ((((l.este - l.oeste) % 360) + 360) % 360) * 0.3
  return {
    norte: Math.min(90, l.norte + dLat),
    sur: Math.max(-90, l.sur - dLat),
    este: dLng ? envolver(l.este + dLng) : l.este,
    oeste: dLng ? envolver(l.oeste - dLng) : l.oeste,
  }
}

export default function MapaScreen() {
  const mapa = useRef<MapaRef>(null)
  // Llega del mapa en cuanto carga.
  const [limites, setLimites] = useState<Limites | null>(null)
  const [seleccionado, setSeleccionado] = useState<string | null>(null)
  const [yo, setYo] = useState<PuntoMapa | null>(null)
  // Un toque abre la miniatura; dos toques seguidos abren la publicación.
  const [alTocarPatita] = useState(() =>
    crearDetectorToques(setSeleccionado, (id) => router.push(`/publicacion/${id}`)),
  )

  const marcadores = useQuery({
    queryKey: ['mapa', limites && Object.values(limites).map((v) => v.toFixed(2))],
    queryFn: () => publicacionesApi.mapa(limites!),
    enabled: !!limites,
    placeholderData: keepPreviousData,
    staleTime: 15_000,
  })

  // Si ya hay permiso de ubicación, se muestra el punto azul sin preguntar.
  useEffect(() => {
    void (async () => {
      const permiso = await Location.getForegroundPermissionsAsync()
      if (!permiso.granted) return
      const pos = await Location.getLastKnownPositionAsync()
      if (pos) setYo({ lat: pos.coords.latitude, lng: pos.coords.longitude })
    })().catch(() => undefined)
  }, [])

  const actual = marcadores.data?.find((m) => m.id === seleccionado)

  const pines: PinMapa[] = (marcadores.data ?? []).map((m) => ({
    id: m.id,
    lat: m.latitud,
    lng: m.longitud,
    tipo: 'patita',
    activo: m.id === seleccionado,
  }))
  if (yo) pines.push({ id: 'yo', tipo: 'yo', ...yo })

  const irAMiUbicacion = async () => {
    const permiso = await Location.requestForegroundPermissionsAsync()
    if (!permiso.granted) return toast.error('Necesitamos permiso de ubicación.')
    try {
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced })
      setYo({ lat: pos.coords.latitude, lng: pos.coords.longitude })
      mapa.current?.volarA(pos.coords.latitude, pos.coords.longitude, 14)
    } catch {
      toast.error('No pudimos obtener tu ubicación.')
    }
  }

  const total = marcadores.data?.length

  return (
    <View style={{ flex: 1 }}>
      <Mapa
        ref={mapa}
        style={StyleSheet.absoluteFill}
        centro={CENTRO_POR_DEFECTO}
        zoom={CENTRO_POR_DEFECTO.zoom}
        pines={pines}
        onRegion={(l) => setLimites(conMargen(l))}
        onPin={(id) => id !== 'yo' && alTocarPatita(id)}
        // Tocar fuera de la miniatura la cierra.
        onToque={() => setSeleccionado(null)}
      />

      <View pointerEvents="none" style={estilos.contador}>
        <Text style={estilos.contadorTexto}>
          {total === undefined ? 'Cargando…' : `${total} mascota${total === 1 ? '' : 's'} perdida${total === 1 ? '' : 's'} en la zona`}
        </Text>
      </View>

      <Pressable onPress={irAMiUbicacion} style={estilos.miUbicacion} accessibilityLabel="Ir a mi ubicación">
        <Ionicons name="locate" size={24} color={colores.texto} />
      </Pressable>

      {actual && (
        <Pressable onPress={() => router.push(`/publicacion/${actual.id}`)} style={estilos.miniatura} accessibilityLabel={`Ver publicación de ${actual.nombreMascota}`}>
          {actual.miniaturaUrl ? (
            <Image source={mediaUrl(actual.miniaturaUrl)} style={estilos.foto} contentFit="cover" />
          ) : (
            <View style={[estilos.foto, { alignItems: 'center', justifyContent: 'center' }]}>
              <Ionicons name="paw" size={28} color={colores.borde} />
            </View>
          )}
          <View style={{ flex: 1 }}>
            <Text style={estilos.nombre} numberOfLines={1}>{actual.nombreMascota}</Text>
            <Text style={estilos.ver}>Ver publicación ›</Text>
          </View>
          <Pressable onPress={() => setSeleccionado(null)} hitSlop={10} accessibilityLabel="Cerrar">
            <Ionicons name="close" size={22} color={colores.textoTenue} />
          </Pressable>
        </Pressable>
      )}
    </View>
  )
}

const estilos = StyleSheet.create({
  contador: { position: 'absolute', top: 12, alignSelf: 'center', backgroundColor: 'rgba(255,255,255,0.95)', borderRadius: radio.total, paddingHorizontal: 14, paddingVertical: 6, ...sombra },
  contadorTexto: { fontSize: 13, fontWeight: '700', color: colores.textoSuave },
  miUbicacion: { position: 'absolute', right: 16, bottom: 120, width: 48, height: 48, borderRadius: 24, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', ...sombra },
  miniatura: { position: 'absolute', left: 16, right: 16, bottom: 20, flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#fff', borderRadius: radio.lg, padding: 10, ...sombra, elevation: 6 },
  foto: { width: 72, height: 72, borderRadius: radio.md, backgroundColor: '#f5f5f4' },
  nombre: { fontSize: 17, fontWeight: '800', color: colores.texto },
  ver: { fontSize: 14, fontWeight: '700', color: colores.marcaOscuro, marginTop: 2 },
})
