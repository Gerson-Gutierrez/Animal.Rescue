import { Ionicons } from '@expo/vector-icons'
import { useQuery } from '@tanstack/react-query'
import * as Location from 'expo-location'
import { useEffect, useRef } from 'react'
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native'
import { Text } from '../../components/Texto'
import { publicacionesApi } from '../../api/endpoints'
import { TextField } from '../../components/Fields'
import { CENTRO_POR_DEFECTO } from '../../lib/config'
import { colores, radio } from '../../lib/theme'
import { toast } from '../../lib/toast'
import { useDebounce } from '../../lib/useDebounce'
import { Mapa, type MapaRef } from '../mapa/Mapa'

interface Props {
  texto: string
  onTexto: (t: string) => void
  punto: { lat: number; lng: number } | null
  onPunto: (lat: number, lng: number) => void
  /** Texto con el que ya se conocen las coordenadas (edición): no se vuelve a buscar. */
  textoConocido?: string
  error?: string
}

/** Cuadro de texto + mapa: al escribir la dirección el mapa se actualiza solo; el pin se puede ajustar a mano. */
export function SelectorUbicacion({ texto, onTexto, punto, onPunto, textoConocido, error }: Props) {
  const mapa = useRef<MapaRef>(null)
  const consulta = useDebounce(texto.trim(), 700)
  const busca = consulta.length >= 3 && consulta !== textoConocido

  const geo = useQuery({
    queryKey: ['geocodificacion', consulta],
    queryFn: () => publicacionesApi.geocodificar(consulta),
    enabled: busca,
    staleTime: 10 * 60_000,
    retry: false,
  })

  const primero = geo.data?.[0]
  useEffect(() => {
    if (busca && primero) onPunto(primero.latitud, primero.longitud)
    // Sólo cuando llega un resultado nuevo.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [primero?.latitud, primero?.longitud, busca])

  useEffect(() => {
    if (punto) mapa.current?.volarA(punto.lat, punto.lng, 16)
  }, [punto?.lat, punto?.lng]) // eslint-disable-line react-hooks/exhaustive-deps

  const usarMiUbicacion = async () => {
    const permiso = await Location.requestForegroundPermissionsAsync()
    if (!permiso.granted) return toast.error('Necesitamos permiso de ubicación.')
    try {
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced })
      onPunto(pos.coords.latitude, pos.coords.longitude)
    } catch {
      toast.error('No pudimos obtener tu ubicación.')
    }
  }

  return (
    <View style={{ gap: 8 }}>
      <TextField
        etiqueta="Ubicación donde se perdió"
        placeholder="Calle, número, barrio, ciudad"
        value={texto}
        onChangeText={onTexto}
        error={error}
        autoCorrect={false}
      />

      <View style={estilos.estado}>
        {busca && geo.isFetching && (
          <>
            <ActivityIndicator size="small" color={colores.textoTenue} />
            <Text style={estilos.estadoTexto}>Buscando en el mapa…</Text>
          </>
        )}
        {busca && !geo.isFetching && primero && (
          <>
            <Ionicons name="checkmark-circle" size={16} color={colores.exito} />
            <Text style={[estilos.estadoTexto, { color: colores.exito }]} numberOfLines={2}>
              {primero.direccion}
            </Text>
          </>
        )}
        {busca && !geo.isFetching && ((geo.isSuccess && !primero) || geo.isError) && (
          <>
            <Ionicons name="warning" size={16} color="#b45309" />
            <Text style={[estilos.estadoTexto, { color: '#b45309' }]}>
              {geo.isError ? 'El buscador no responde.' : 'No encontramos esa dirección.'} Toca el mapa para marcar el punto.
            </Text>
          </>
        )}
      </View>

      <View style={estilos.contenedorMapa}>
        <Mapa
          ref={mapa}
          style={StyleSheet.absoluteFill}
          centro={punto ?? CENTRO_POR_DEFECTO}
          zoom={punto ? 16 : CENTRO_POR_DEFECTO.zoom}
          pines={punto ? [{ id: 'punto', lat: punto.lat, lng: punto.lng, tipo: 'patita', arrastrable: true }] : []}
          onToque={(p) => onPunto(p.lat, p.lng)}
          onPinArrastrado={(_, p) => onPunto(p.lat, p.lng)}
        />
        <Pressable onPress={usarMiUbicacion} style={estilos.miUbicacion} accessibilityLabel="Usar mi ubicación">
          <Ionicons name="locate" size={22} color={colores.texto} />
        </Pressable>
      </View>
      <Text style={estilos.ayuda}>Toca el mapa o arrastra la patita para ajustar el punto.</Text>
    </View>
  )
}

const estilos = StyleSheet.create({
  estado: { flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: 20 },
  estadoTexto: { fontSize: 13, color: colores.textoTenue, flex: 1 },
  contenedorMapa: { height: 240, borderRadius: radio.lg, overflow: 'hidden' },
  miUbicacion: { position: 'absolute', top: 10, right: 10, width: 42, height: 42, borderRadius: 21, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', elevation: 3 },
  ayuda: { fontSize: 12, color: colores.textoTenue },
})
