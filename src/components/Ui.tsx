import { Ionicons } from '@expo/vector-icons'
import { Image } from 'expo-image'
import type { ComponentProps, ReactNode } from 'react'
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { mediaUrl } from '../lib/config'
import { iniciales } from '../lib/format'
import { colores, radio } from '../lib/theme'
import { useToastStore } from '../lib/toast'

type Icono = ComponentProps<typeof Ionicons>['name']

export function Cargando() {
  return (
    <View style={estilos.centro} accessibilityLabel="Cargando">
      <ActivityIndicator size="large" color={colores.marca} />
    </View>
  )
}

export function EmptyState({ icono, titulo, texto, accion }: { icono: Icono; titulo: string; texto?: string; accion?: ReactNode }) {
  return (
    <View style={[estilos.centro, { paddingHorizontal: 32 }]}>
      <View style={estilos.circulo}>
        <Ionicons name={icono} size={32} color={colores.marcaOscuro} />
      </View>
      <Text style={estilos.titulo}>{titulo}</Text>
      {texto && <Text style={estilos.texto}>{texto}</Text>}
      {accion && <View style={{ marginTop: 20, alignSelf: 'stretch' }}>{accion}</View>}
    </View>
  )
}

export function ErrorState({ onReintentar }: { onReintentar?: () => void }) {
  return (
    <View style={estilos.centro}>
      <Text style={estilos.texto}>No se pudo cargar la información.</Text>
      {onReintentar && (
        <Pressable onPress={onReintentar} hitSlop={8}>
          <Text style={estilos.enlace}>Reintentar</Text>
        </Pressable>
      )}
    </View>
  )
}

export function Avatar({ nombre, fotoUrl, tam = 44 }: { nombre: string; fotoUrl?: string | null; tam?: number }) {
  const src = mediaUrl(fotoUrl)
  if (src) return <Image source={src} style={{ width: tam, height: tam, borderRadius: tam / 2 }} />
  return (
    <View style={[estilos.avatar, { width: tam, height: tam, borderRadius: tam / 2 }]}>
      <Text style={{ fontSize: tam * 0.36, fontWeight: '800', color: colores.marcaOscuro }}>{iniciales(nombre)}</Text>
    </View>
  )
}

const coloresBadge = {
  stone: { bg: '#f5f5f4', fg: colores.textoSuave },
  green: { bg: colores.exitoClaro, fg: colores.exito },
  orange: { bg: colores.marcaClaro, fg: colores.marcaOscuro },
  red: { bg: colores.peligroClaro, fg: colores.peligro },
}

export function Badge({ children, color = 'stone' }: { children: ReactNode; color?: keyof typeof coloresBadge }) {
  const c = coloresBadge[color]
  return (
    <View style={[estilos.badge, { backgroundColor: c.bg }]}>
      <Text style={{ color: c.fg, fontSize: 12, fontWeight: '700' }}>{children}</Text>
    </View>
  )
}

export function Segmentado<T extends string>({ valor, opciones, onCambiar }: { valor: T; opciones: { id: T; texto: string }[]; onCambiar: (id: T) => void }) {
  return (
    <View style={estilos.segmentos} accessibilityRole="tablist">
      {opciones.map((o) => {
        const activo = o.id === valor
        return (
          <Pressable
            key={o.id}
            onPress={() => onCambiar(o.id)}
            accessibilityRole="tab"
            accessibilityState={{ selected: activo }}
            style={[estilos.segmento, activo && estilos.segmentoActivo]}
          >
            <Text style={[estilos.segmentoTexto, activo && { color: colores.marcaOscuro }]}>{o.texto}</Text>
          </Pressable>
        )
      })}
    </View>
  )
}

/** Avisos flotantes; se monta una vez en el layout raíz. */
export function Toaster() {
  const toasts = useToastStore((s) => s.toasts)
  const quitar = useToastStore((s) => s.quitar)
  const insets = useSafeAreaInsets()
  if (!toasts.length) return null
  return (
    <View pointerEvents="box-none" style={[estilos.toaster, { top: insets.top + 8 }]}>
      {toasts.map((t) => (
        <Pressable key={t.id} onPress={() => quitar(t.id)} style={[estilos.toast, { backgroundColor: t.tipo === 'ok' ? colores.texto : colores.peligro }]}>
          <Text style={estilos.toastTexto}>{t.texto}</Text>
        </Pressable>
      ))}
    </View>
  )
}

const estilos = StyleSheet.create({
  centro: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 48, gap: 6 },
  circulo: { width: 64, height: 64, borderRadius: 32, backgroundColor: colores.marcaClaro, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  titulo: { fontSize: 17, fontWeight: '800', color: colores.texto, textAlign: 'center' },
  texto: { fontSize: 14, color: colores.textoTenue, textAlign: 'center', lineHeight: 20 },
  enlace: { marginTop: 8, color: colores.marcaOscuro, fontWeight: '700', textDecorationLine: 'underline' },
  avatar: { backgroundColor: colores.marcaClaro, alignItems: 'center', justifyContent: 'center' },
  badge: { alignSelf: 'flex-start', borderRadius: radio.total, paddingHorizontal: 10, paddingVertical: 3 },
  segmentos: { flexDirection: 'row', backgroundColor: '#e7e5e4', borderRadius: radio.md, padding: 4, gap: 4 },
  segmento: { flex: 1, minHeight: 38, borderRadius: 9, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6 },
  segmentoActivo: { backgroundColor: colores.tarjeta },
  segmentoTexto: { fontSize: 14, fontWeight: '700', color: colores.textoSuave },
  toaster: { position: 'absolute', left: 16, right: 16, alignItems: 'center', gap: 8, zIndex: 1000 },
  toast: { borderRadius: radio.md, paddingHorizontal: 16, paddingVertical: 12, maxWidth: 420, alignSelf: 'stretch' },
  toastTexto: { color: '#fff', fontSize: 14, fontWeight: '600' },
})
