import { Ionicons } from '@expo/vector-icons'
import type { ComponentProps, ReactNode } from 'react'
import { ActivityIndicator, Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native'
import { Text } from './Texto'
import { colores, radio } from '../lib/theme'

type Variante = 'primario' | 'secundario' | 'peligro' | 'fantasma'

interface Props {
  children: ReactNode
  onPress?: () => void
  variante?: Variante
  cargando?: boolean
  deshabilitado?: boolean
  icono?: ComponentProps<typeof Ionicons>['name']
  compacto?: boolean
  style?: StyleProp<ViewStyle>
}

const fondo: Record<Variante, string> = {
  primario: colores.marca,
  secundario: colores.tarjeta,
  peligro: colores.peligro,
  fantasma: 'transparent',
}

const texto: Record<Variante, string> = {
  primario: '#fff',
  secundario: colores.texto,
  peligro: '#fff',
  fantasma: colores.marcaOscuro,
}

export function Button({ children, onPress, variante = 'primario', cargando, deshabilitado, icono, compacto, style }: Props) {
  const inactivo = deshabilitado || cargando
  return (
    <Pressable
      onPress={onPress}
      disabled={inactivo}
      accessibilityRole="button"
      accessibilityState={{ disabled: !!inactivo, busy: !!cargando }}
      style={({ pressed }) => [
        estilos.base,
        compacto && estilos.compacto,
        { backgroundColor: fondo[variante], opacity: inactivo ? 0.55 : pressed ? 0.85 : 1 },
        variante === 'secundario' && estilos.borde,
        style,
      ]}
    >
      <View style={estilos.contenido}>
        {cargando ? (
          <ActivityIndicator color={texto[variante]} size="small" />
        ) : (
          icono && <Ionicons name={icono} size={compacto ? 16 : 18} color={texto[variante]} />
        )}
        <Text style={[estilos.texto, compacto && estilos.textoCompacto, { color: texto[variante] }]}>{children}</Text>
      </View>
    </Pressable>
  )
}

const estilos = StyleSheet.create({
  base: { minHeight: 48, borderRadius: radio.md, paddingHorizontal: 16, justifyContent: 'center' },
  compacto: { minHeight: 38, paddingHorizontal: 12 },
  borde: { borderWidth: 1, borderColor: colores.borde },
  contenido: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  texto: { fontSize: 15, fontWeight: '700' },
  textoCompacto: { fontSize: 14 },
})
