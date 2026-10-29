import { Ionicons } from '@expo/vector-icons'
import type { ReactNode } from 'react'
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native'
import { Text } from './Texto'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { anchoMaximo, centrado, colores, radio } from '../lib/theme'
import { Button } from './Button'

interface HojaProps {
  abierto: boolean
  titulo: string
  onCerrar: () => void
  children: ReactNode
}

/** Hoja que sube desde abajo; tocar fuera la cierra. */
export function Hoja({ abierto, titulo, onCerrar, children }: HojaProps) {
  const insets = useSafeAreaInsets()
  return (
    <Modal visible={abierto} transparent animationType="slide" onRequestClose={onCerrar} statusBarTranslucent>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={estilos.fondo}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onCerrar} accessibilityLabel="Cerrar" />
        <View style={[estilos.hoja, { paddingBottom: insets.bottom + 16 }]}>
          <View style={estilos.cabecera}>
            <Text style={estilos.titulo}>{titulo}</Text>
            <Pressable onPress={onCerrar} hitSlop={12} accessibilityLabel="Cerrar">
              <Ionicons name="close" size={24} color={colores.textoTenue} />
            </Pressable>
          </View>
          <ScrollView keyboardShouldPersistTaps="handled">{children}</ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  )
}

interface ConfirmProps {
  abierto: boolean
  titulo: string
  mensaje: string
  textoSi?: string
  textoNo?: string
  cargando?: boolean
  onSi: () => void
  onNo: () => void
}

export function ConfirmDialog({ abierto, titulo, mensaje, textoSi = 'Sí', textoNo = 'No', cargando, onSi, onNo }: ConfirmProps) {
  return (
    <Hoja abierto={abierto} titulo={titulo} onCerrar={onNo}>
      <Text style={estilos.mensaje}>{mensaje}</Text>
      <View style={estilos.botones}>
        <Button variante="secundario" onPress={onNo} deshabilitado={cargando} style={{ flex: 1 }}>
          {textoNo}
        </Button>
        <Button variante="peligro" onPress={onSi} cargando={cargando} style={{ flex: 1 }}>
          {textoSi}
        </Button>
      </View>
    </Hoja>
  )
}

const estilos = StyleSheet.create({
  fondo: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.45)' },
  hoja: { ...centrado(anchoMaximo.formulario), backgroundColor: colores.tarjeta, borderTopLeftRadius: radio.xl, borderTopRightRadius: radio.xl, padding: 20, maxHeight: '88%' },
  cabecera: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  titulo: { fontSize: 18, fontWeight: '800', color: colores.texto, flex: 1 },
  mensaje: { fontSize: 15, color: colores.textoSuave, marginBottom: 20, lineHeight: 21 },
  botones: { flexDirection: 'row', gap: 12 },
})
