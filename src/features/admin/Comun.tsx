import { Ionicons } from '@expo/vector-icons'
import { Image } from 'expo-image'
import { Redirect } from 'expo-router'
import type { ReactNode } from 'react'
import { StyleSheet, View } from 'react-native'
import { TextInput } from '../../components/Texto'
import { mediaUrl } from '../../lib/config'
import { colores, radio } from '../../lib/theme'
import { useRol } from '../../store/auth'

/** Sólo deja pasar a administradores (o superadministradores si se pide). */
export function SoloAdmin({ children, superAdmin }: { children: ReactNode; superAdmin?: boolean }) {
  const { esAdmin, esSuperAdmin } = useRol()
  const permitido = superAdmin ? esSuperAdmin : esAdmin
  return permitido ? <>{children}</> : <Redirect href="/cuenta" />
}

export function Miniatura({ url }: { url: string | null }) {
  const src = mediaUrl(url)
  return (
    <View style={estilos.miniatura}>
      {src ? <Image source={src} style={StyleSheet.absoluteFill} contentFit="cover" /> : <Ionicons name="image-outline" size={22} color={colores.borde} />}
    </View>
  )
}

export function Buscador({ valor, onCambio, placeholder }: { valor: string; onCambio: (v: string) => void; placeholder: string }) {
  return (
    <View style={estilos.buscador}>
      <Ionicons name="search" size={18} color={colores.textoTenue} />
      <TextInput
        value={valor}
        onChangeText={onCambio}
        placeholder={placeholder}
        placeholderTextColor={colores.textoTenue}
        accessibilityLabel={placeholder}
        autoCapitalize="none"
        style={estilos.input}
      />
    </View>
  )
}

const estilos = StyleSheet.create({
  miniatura: { width: 64, height: 64, borderRadius: radio.md, overflow: 'hidden', backgroundColor: '#f5f5f4', alignItems: 'center', justifyContent: 'center' },
  buscador: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: colores.tarjeta, borderWidth: 1, borderColor: colores.borde, borderRadius: radio.md, paddingHorizontal: 12 },
  input: { flex: 1, minHeight: 46, fontSize: 16, color: colores.texto },
})
