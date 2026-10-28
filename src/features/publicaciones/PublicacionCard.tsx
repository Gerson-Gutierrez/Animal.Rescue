import { Ionicons } from '@expo/vector-icons'
import { Image } from 'expo-image'
import { router } from 'expo-router'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { mediaUrl } from '../../lib/config'
import { formatFecha } from '../../lib/format'
import { colores, radio, sombra } from '../../lib/theme'
import type { PublicacionCard as Card } from '../../types/api'

/** Card del feed (dos columnas): foto, nombre, ubicación y fecha. */
export function PublicacionCard({ p }: { p: Card }) {
  const src = mediaUrl(p.imagenUrl)
  return (
    <Pressable
      onPress={() => router.push(`/publicacion/${p.id}`)}
      accessibilityRole="button"
      accessibilityLabel={`${p.nombreMascota}, ${p.ubicacionTexto}`}
      style={({ pressed }) => [estilos.card, pressed && { transform: [{ scale: 0.98 }] }]}
    >
      <View style={estilos.foto}>
        {src ? (
          <Image source={src} style={StyleSheet.absoluteFill} contentFit="cover" transition={150} />
        ) : (
          <Ionicons name="image-outline" size={32} color={colores.borde} />
        )}
        {p.estado === 'ENCONTRADA' && (
          <View style={estilos.encontrada}>
            <Text style={estilos.encontradaTexto}>Encontrada</Text>
          </View>
        )}
      </View>
      <View style={estilos.cuerpo}>
        <Text style={estilos.nombre} numberOfLines={1}>
          {p.nombreMascota}
        </Text>
        <View style={estilos.fila}>
          <Ionicons name="location-outline" size={13} color={colores.textoTenue} />
          <Text style={estilos.dato} numberOfLines={1}>
            {p.ubicacionTexto}
          </Text>
        </View>
        <View style={estilos.fila}>
          <Ionicons name="calendar-outline" size={13} color={colores.textoTenue} />
          <Text style={estilos.dato}>{formatFecha(p.fechaPerdida)}</Text>
        </View>
      </View>
    </Pressable>
  )
}

const estilos = StyleSheet.create({
  card: { flex: 1, backgroundColor: colores.tarjeta, borderRadius: radio.lg, overflow: 'hidden', ...sombra },
  foto: { aspectRatio: 1, backgroundColor: '#f5f5f4', alignItems: 'center', justifyContent: 'center' },
  encontrada: { position: 'absolute', top: 8, left: 8, backgroundColor: colores.exito, borderRadius: radio.total, paddingHorizontal: 10, paddingVertical: 3 },
  encontradaTexto: { color: '#fff', fontSize: 12, fontWeight: '800' },
  cuerpo: { padding: 10, gap: 3 },
  nombre: { fontSize: 15, fontWeight: '800', color: colores.texto },
  fila: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  dato: { fontSize: 12, color: colores.textoTenue, flex: 1 },
})
